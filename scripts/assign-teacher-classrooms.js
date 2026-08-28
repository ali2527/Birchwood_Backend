require("../config/loadEnv");
const mongoose = require("mongoose");
const Teacher = require("../Models/Teacher");
const Classroom = require("../Models/Classroom");
const { TEACHER_CLASSROOM_ASSIGNMENTS } = require("../constants/teacherClassroomAssignments");
const { syncTeacherClassroomAssignments } = require("../Helpers/classroomTeacherAssignment");

async function assignTeacherClassrooms() {
  if (!process.env.DB) {
    throw new Error("DB is not set in .env");
  }

  await mongoose.connect(process.env.DB);

  await Teacher.updateMany({}, { $unset: { classroom: 1 } });
  await Classroom.updateMany({}, { $unset: { teacher: 1 } });
  console.log("Cleared existing teacher ↔ classroom links.");

  const linked = await syncTeacherClassroomAssignments(TEACHER_CLASSROOM_ASSIGNMENTS);
  console.log(`Linked ${linked} homeroom teachers (one section each).`);

  const unassigned = await Teacher.countDocuments({ classroom: { $exists: false } });
  console.log(`${unassigned} teachers remain without a section (expected for inactive staff).`);

  await mongoose.disconnect();
}

assignTeacherClassrooms()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to assign teacher classrooms:", err.message);
    process.exit(1);
  });
