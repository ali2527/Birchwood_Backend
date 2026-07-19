//Models
const Teacher = require("../../Models/Teacher");
const Attendance = require("../../Models/TeacherAttendance");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const sanitizeUser = require("../../Helpers/sanitizeUser");
const moment = require("moment")
//libraries
const dayjs = require("dayjs");

//signin
exports.signin = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase(); // Convert email to lowercase

  try {
    Teacher.findOne({ email }).populate("classroom")
      .then(async (user) => {
          
          console.log(user)
        if (!user) {
          return res.json(
            ApiResponse({}, "Teacher with this email not found", false)
          );
        }
        if (!user.authenticate(password)) {
          return res.json(ApiResponse({}, "Invalid password!", false));
        }
        if (user.status == "PENDING") {
          return res.json(
            ApiResponse({}, "Account Still Pending Approval from Admin!", false)
          );
        }
        

        const token = generateToken(user);

        // Fetch Monthly Attendance Stats
        let { month, year } = req.query;
        const currentDate = moment();

        if (!month) {
          month = (currentDate.month() + 1).toString();
        }
        if (!year) {
          year = currentDate.year().toString();
        }

        month = month.length === 1 ? `0${month}` : month;

        const startOfMonth = moment(`${year}-${month}-01`).startOf("month").toDate();
        const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();

        // Get today's attendance
        let todaysAttendance = await Attendance.findOne({
          teacher: user._id,
          checkIn: {
            $gte: dayjs().startOf("day").toDate(),
            $lte: dayjs().endOf("day").toDate()
          }
        });

        console.log(todaysAttendance);

        // Aggregate to count status types
        const attendanceStats = await Attendance.aggregate([
          {
            $match: {
              teacher: user._id,
              checkIn: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]);

        let stats = {
          PRESENT: 0,
          ABSENT: 0,
          LEAVE: 0,
          HOLIDAY: 0
        };

        attendanceStats.forEach(stat => {
          stats[stat._id] = stat.count;
        });

        const holidayCount = await Attendance.countDocuments({
          teacher: user._id,
          checkIn: { $gte: startOfMonth, $lte: endOfMonth },
          status: "HOLIDAY"
        });

        stats["HOLIDAY"] = holidayCount;

        return res.json(
          ApiResponse(
            {
              user: sanitizeUser(user),
              token,
              todaysAttendance,
              attendanceStats: stats,
            },
            "Teacher Logged In Successfully",
            true
          )
        );
      })
      .catch((err) => {
        return res.json(ApiResponse({}, err.message, false));
      });
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message, false));
  }
};



