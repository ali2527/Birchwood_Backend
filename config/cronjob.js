var cron = require('node-cron');
const Teacher = require("../Models/Teacher");
const Children = require("../Models/Children");
const Holiday = require("../Models/Holiday");
const Attendance = require("../Models/TeacherAttendance");
const ChildAttendance = require("../Models/Attendance");

const moment = require("moment");

cron.schedule('* * * * *', () => {
  console.log(`Current Server Time: ${new Date().toLocaleString()}`);
});

cron.schedule('0 0 * * 2-6', async () => {
  try {
    const today = moment().startOf('day');

    // Find the last working day (excluding weekends)
    let previousDay = moment().subtract(1, 'day').startOf('day');
    if (previousDay.day() === 0) previousDay.subtract(2, 'days'); // If Sunday, go to Friday
    else if (previousDay.day() === 6) previousDay.subtract(1, 'day'); // If Saturday, go to Friday

    console.log("Processing attendance for:", previousDay.format("YYYY-MM-DD"));

    const isHoliday = await Holiday.findOne({ date: { $gte: previousDay } });

    if (isHoliday) {
      console.log(`Previous day is a holiday. Skipping attendance update.`);
      return;
    }

    const teachers = await Teacher.find({ status: "ACTIVE" });

    for (const teacher of teachers) {
      const existingAttendance = await Attendance.findOne({
        teacher: teacher._id,
        checkIn: { $gte: previousDay }
      });

      if (!existingAttendance) {
        await Attendance.create({
          teacher: teacher._id,
          checkIn: previousDay,
          status: 'ABSENT'
        });
        console.log(`Attendance marked ABSENT for: ${teacher.email}`);
      }
    }

    // **Backfill missing attendances for the past week**
    for (let i = 1; i <= 7; i++) {
      let checkDate = moment().subtract(i, 'days').startOf('day');
      if (checkDate.day() === 0 || checkDate.day() === 6) continue; // Skip weekends

      const isPastHoliday = await Holiday.findOne({ date: { $gte: checkDate } });
      if (isPastHoliday) continue;

      for (const teacher of teachers) {
        const missedAttendance = await Attendance.findOne({
          teacher: teacher._id,
          checkIn: { $gte: checkDate }
        });

        if (!missedAttendance) {
          await Attendance.create({
            teacher: teacher._id,
            checkIn: checkDate,
            status: 'ABSENT'
          });
          console.log(`Backfilled missing attendance for: ${teacher.email} on ${checkDate.format("YYYY-MM-DD")}`);
        }
      }
    }

  } catch (error) {
    console.error('Error updating attendance:', error);
  }
});



cron.schedule('0 0 * * 2-6', async () => {
  try {
    const today = moment().startOf('day');

    // Find the last working day (excluding weekends)
    let previousDay = moment().subtract(1, 'day').startOf('day');
    if (previousDay.day() === 0) previousDay.subtract(2, 'days'); // If Sunday, go to Friday
    else if (previousDay.day() === 6) previousDay.subtract(1, 'day'); // If Saturday, go to Friday

    console.log("Processing attendance for:", previousDay.format("YYYY-MM-DD"));

    const isHoliday = await Holiday.findOne({ date: { $gte: previousDay } });

    if (isHoliday) {
      console.log(`Previous day is a holiday. Skipping attendance update.`);
      return;
    }

    const childrens = await Children.find({ status: "ACTIVE" });

    for (const children of childrens) {
      const existingAttendance = await ChildAttendance.findOne({
        children: children._id,
        checkIn: { $gte: previousDay }
      });

      if (!existingAttendance) {
        await ChildAttendance.create({
          children: children._id,
          checkIn: previousDay,
          status: 'ABSENT'
        });
        console.log(`Attendance marked ABSENT for: ${children.name}`);
      }
    }

    // **Backfill missing attendances for the past 7 days**
    for (let i = 1; i <= 7; i++) {
      let checkDate = moment().subtract(i, 'days').startOf('day');
      if (checkDate.day() === 0 || checkDate.day() === 6) continue; // Skip weekends

      const isPastHoliday = await Holiday.findOne({ date: { $gte: checkDate } });
      if (isPastHoliday) continue;

      for (const children of childrens) {
        const missedAttendance = await ChildAttendance.findOne({
          children: children._id,
          checkIn: { $gte: checkDate }
        });

        if (!missedAttendance) {
          await ChildAttendance.create({
            children: children._id,
            checkIn: checkDate,
            status: 'ABSENT'
          });
          console.log(`Backfilled missing attendance for: ${children.name} on ${checkDate.format("YYYY-MM-DD")}`);
        }
      }
    }

  } catch (error) {
    console.error('Error updating attendance:', error);
  }
});



//make all teachers checkIn and CheckOut false at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running a daily task to update teachers checkin and checkout statuses');
  try {
    // Update all teachers to set checkin and checkout as false
    const updateResult = await Teacher.updateMany({}, { $set: { checkIn: false, checkOut: false } });
    
  } catch (error) {
    console.error('Error updating teachers checkin and checkout statuses:', error);
  }
});


//make all children checkIn and CheckOut false at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running a daily task to update teachers checkin and checkout statuses');
  try {
    // Update all teachers to set checkin and checkout as false
    const updateResult = await Children.updateMany({}, { $set: { checkIn: false } });
    
  } catch (error) {
    console.error('Error updating children checkin statuses:', error);
  }
});