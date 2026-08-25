const Classroom = require("../Models/Classroom");
const Teacher = require("../Models/Teacher");

/**
 * Keeps classroom.teacher and teacher.classroom in sync (one homeroom each).
 */
async function assignTeacherToClassroom(classroomId, teacherId, previousTeacherId = null) {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    const error = new Error("Classroom not found");
    error.code = "CLASSROOM_NOT_FOUND";
    throw error;
  }

  const priorTeacherId = previousTeacherId ?? classroom.teacher;

  if (!teacherId) {
    if (priorTeacherId) {
      await Teacher.updateOne(
        { _id: priorTeacherId, classroom: classroomId },
        { $unset: { classroom: 1 } }
      );
    }
    classroom.teacher = undefined;
    await classroom.save();
    return classroom;
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    const error = new Error("No teacher found");
    error.code = "TEACHER_NOT_FOUND";
    throw error;
  }

  if (
    teacher.classroom &&
    String(teacher.classroom) !== String(classroomId)
  ) {
    await Classroom.updateOne(
      { _id: teacher.classroom, teacher: teacherId },
      { $unset: { teacher: 1 } }
    );
  }

  if (priorTeacherId && String(priorTeacherId) !== String(teacherId)) {
    await Teacher.updateOne(
      { _id: priorTeacherId, classroom: classroomId },
      { $unset: { classroom: 1 } }
    );
  }

  classroom.teacher = teacherId;
  await classroom.save();
  await Teacher.findByIdAndUpdate(teacherId, { classroom: classroomId });

  return classroom;
}

async function syncTeacherClassroomAssignments(assignments = []) {
  let linked = 0;
  for (const item of assignments) {
    const classroom = await Classroom.findOne({ classroomId: item.classroomId }).select("_id");
    const teacher = await Teacher.findOne({ email: item.teacherEmail.toLowerCase() }).select("_id");
    if (!classroom || !teacher) {
      console.warn(`Skip link ${item.classroomId} -> ${item.teacherEmail} (missing record)`);
      continue;
    }
    await assignTeacherToClassroom(classroom._id, teacher._id);
    linked += 1;
    console.log(`Assigned ${item.teacherEmail} -> ${item.classroomId}`);
  }
  return linked;
}

module.exports = {
  assignTeacherToClassroom,
  syncTeacherClassroomAssignments,
};
