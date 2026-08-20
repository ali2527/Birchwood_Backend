const Children = require("../../Models/Children");
const Teacher = require("../../Models/Teacher");
const Classroom = require("../../Models/Classroom");
const Activity = require("../../Models/Activity");
const Parent = require("../../Models/Parent");
const Attendance = require("../../Models/Attendance");
const Holiday = require("../../Models/Holiday");
const Homework = require("../../Models/Homework");
const Post = require("../../Models/Post");
const { ApiResponse } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

const startOfWeekMonday = (date) => {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
};

const mongoDowToMonIndex = (dow) => (dow === 1 ? 6 : dow - 2);

const sum = (values) => values.reduce((total, value) => total + Number(value || 0), 0);

async function monthlyCounts(model, year, dateField = "createdAt", extraMatch = {}) {
  const start = new Date(year, 0, 1);
  const end = endOfDay(new Date(year, 11, 31));
  const rows = await model.aggregate([
    {
      $match: {
        ...extraMatch,
        [dateField]: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: { $month: `$${dateField}` }, total: { $sum: 1 } } },
  ]);

  const counts = Array(12).fill(0);
  rows.forEach((row) => {
    counts[row._id - 1] = row.total;
  });
  return { counts, hasData: rows.length > 0 };
}

async function weeklyCounts(weekStart, model, dateField, extraMatch = {}) {
  const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
  const rows = await model.aggregate([
    {
      $match: {
        ...extraMatch,
        [dateField]: { $gte: weekStart, $lte: weekEnd },
      },
    },
    {
      $group: {
        _id: { $dayOfWeek: `$${dateField}` },
        total: { $sum: 1 },
      },
    },
  ]);

  const totals = Array(7).fill(0);
  rows.forEach((row) => {
    totals[mongoDowToMonIndex(row._id)] = row.total;
  });
  return { totals, hasData: rows.length > 0 };
}

exports.getOverview = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = endOfDay(new Date(year, month, 0));
    const thisWeekStart = startOfWeekMonday(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [
      students,
      teachers,
      classes,
      activities,
      parents,
      thisYearPosts,
      lastYearPosts,
      thisYearEnrollment,
      lastYearEnrollment,
      thisWeekPresent,
      lastWeekPresent,
      thisWeekHomework,
      lastWeekHomework,
      holidays,
      homework,
    ] = await Promise.all([
      Children.countDocuments({ status: { $ne: "INACTIVE" } }),
      Teacher.countDocuments({ status: "ACTIVE" }),
      Classroom.countDocuments({ status: "ACTIVE" }),
      Activity.countDocuments({ status: "ACTIVE" }),
      Parent.countDocuments({ status: { $ne: "INACTIVE" } }),
      monthlyCounts(Post, year, "createdAt", { status: { $ne: "INACTIVE" } }),
      monthlyCounts(Post, year - 1, "createdAt", { status: { $ne: "INACTIVE" } }),
      monthlyCounts(Children, year, "createdAt", { status: { $ne: "INACTIVE" } }),
      monthlyCounts(Children, year - 1, "createdAt", { status: { $ne: "INACTIVE" } }),
      weeklyCounts(thisWeekStart, Attendance, "checkIn", { status: "PRESENT" }),
      weeklyCounts(lastWeekStart, Attendance, "checkIn", { status: "PRESENT" }),
      weeklyCounts(thisWeekStart, Homework, "assignDate", { status: { $ne: "INACTIVE" } }),
      weeklyCounts(lastWeekStart, Homework, "assignDate", { status: { $ne: "INACTIVE" } }),
      Holiday.find({ date: { $gte: monthStart, $lte: monthEnd } }).lean(),
      Homework.find({
        dueDate: { $gte: monthStart, $lte: monthEnd },
        status: { $ne: "INACTIVE" },
      }).lean(),
    ]);

    const usePosts = thisYearPosts.hasData || lastYearPosts.hasData;
    const activityThis = usePosts ? thisYearPosts.counts : thisYearEnrollment.counts;
    const activityLast = usePosts ? lastYearPosts.counts : lastYearEnrollment.counts;

    const useWeeklyAttendance = thisWeekPresent.hasData || lastWeekPresent.hasData;
    const weeklyThis = useWeeklyAttendance ? thisWeekPresent.totals : thisWeekHomework.totals;
    const weeklyLast = useWeeklyAttendance ? lastWeekPresent.totals : lastWeekHomework.totals;

    const calendarMarks = [];
    holidays.forEach((item) => {
      calendarMarks.push({
        day: new Date(item.date).getDate(),
        type: "holiday",
        label: item.name,
        color: "#5b4aa8",
      });
    });
    homework.forEach((item) => {
      const type = item.type === "HOMEWORK" ? "homework" : "notice";
      calendarMarks.push({
        day: new Date(item.dueDate).getDate(),
        type,
        label: item.title,
        color: type === "homework" ? "#f5c242" : "#fc7a3a",
      });
    });

    return res.json(
      ApiResponse(
        {
          stats: {
            students,
            teachers,
            classes,
            activities,
            parents,
          },
          activity: {
            mode: usePosts ? "posts" : "enrollment",
            labels: MONTH_LABELS,
            thisYear: activityThis,
            lastYear: activityLast,
            thisYearTotal: sum(activityThis),
            lastYearTotal: sum(activityLast),
          },
          weekly: {
            mode: useWeeklyAttendance ? "attendance" : "homework",
            labels: WEEK_LABELS,
            thisWeek: weeklyThis,
            lastWeek: weeklyLast,
            thisWeekTotal: sum(weeklyThis),
            lastWeekTotal: sum(weeklyLast),
          },
          calendar: {
            year,
            month,
            marks: calendarMarks,
          },
        },
        "Dashboard loaded",
        true
      )
    );
  } catch (error) {
    return res.json(
      ApiResponse({}, errorHandler(error) ? errorHandler(error) : error.message, false)
    );
  }
};
