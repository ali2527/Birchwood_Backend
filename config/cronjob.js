var cron = require('node-cron');
const Teacher = require("../Models/Teacher");
const Children = require("../Models/Children");
const Holiday = require("../Models/Holiday");
const Attendance = require("../Models/TeacherAttendance");
const ChildAttendance = require("../Models/Attendance");

const moment = require("moment");

cron.schedule('0 0 * * 1-5', async () => {
  try {
    // Get the date for the previous day
    const previousDay = moment().subtract(1, 'day').startOf('day');

    // Check if the previous day is a weekend (Saturday or Sunday)
    const dayOfWeek = previousDay.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Previous day was a weekend (Saturday or Sunday). Skipping attendance update.');
      return;
    }

    const isHoliday = await Holiday.findOne({ date: {
          $gte: previousDay, 
        } });

    console.log(isHoliday)
    if (isHoliday) {
      console.log(`Previous day is a holiday. Skipping attendance update.`);
      return;
    }

    // Get all teachers
    const teachers = await Teacher.find({status:"ACTIVE"});
    // Iterate through each teacher
    for (const teacher of teachers) {
      // Check if attendance already exists for the previous weekday
      const existingAttendance = await Attendance.findOne({
        teacher: teacher._id,
        checkIn: {
          $gte: previousDay, 
      }
      });

      if (!existingAttendance) {  
        await Attendance.create({
          teacher: teacher._id,
          checkIn: previousDay,
          status: 'ABSENT'
        });
      }
    }
    
  } catch (error) {
    console.error('Error updating attendance for previous weekday:', error);
  }
});


cron.schedule('0 0 * * 1-5', async () => {
  try {
    // Get the date for the previous day
    const previousDay = moment().subtract(1, 'day').startOf('day');

    // Check if the previous day is a weekend (Saturday or Sunday)
    const dayOfWeek = previousDay.day();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      console.log('Previous day was a weekend (Saturday or Sunday). Skipping attendance update.');
      return;
    }

    const isHoliday = await Holiday.findOne({ date: {
          $gte: previousDay, 
        } });

    console.log(isHoliday)
    if (isHoliday) {
      console.log(`Previous day is a holiday. Skipping attendance update.`);
      return;
    }

    // Get all teachers
    const childrens = await Children.find({status:"ACTIVE"});
    // Iterate through each teacher
    for (const children of childrens) {
      // Check if attendance already exists for the previous weekday
      const existingAttendance = await ChildAttendance.findOne({
        children:children._id,
        checkIn: {
          $gte: previousDay, 
      }
      });

      if (!existingAttendance) {  
        await ChildAttendance.create({
          children: children._id,
          checkIn: previousDay,
          status: 'ABSENT'
        });
      }
    }
    
  } catch (error) {
    console.error('Error updating attendance for previous weekday:', error);
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