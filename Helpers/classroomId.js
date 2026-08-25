const ROMAN_GRADES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeClassroomId(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function gradeToPrefix(classroomGrade) {
  if (!classroomGrade) return null;

  const raw = String(classroomGrade).trim();
  const lower = raw.toLowerCase();

  if (lower === "nursery" || lower === "nur") return "NUR";
  if (lower === "kg" || lower === "kindergarten") return "KG";

  let grade = raw.replace(/^grade\s+/i, "").trim().toUpperCase();
  if (ROMAN_GRADES.includes(grade)) return grade;

  const romanMatch = raw.match(/\b(I{1,3}|IV|VI{0,3}|IX|X|XI|XII)\b/i);
  if (romanMatch) return romanMatch[1].toUpperCase();

  const compact = grade.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return compact || null;
}

function sectionFromName(classroomName) {
  if (!classroomName) return null;
  const match = String(classroomName).trim().match(/\s([A-Z])\s*$/i);
  return match ? match[1].toUpperCase() : null;
}

async function nextAvailableSection(Classroom, prefix, excludeId) {
  const pattern = new RegExp(`^${escapeRegex(prefix)}-([A-Z])$`, "i");
  const query = { classroomId: pattern };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Classroom.find(query).select("classroomId").lean();
  const used = new Set(
    existing.map((room) => String(room.classroomId).split("-").pop().toUpperCase())
  );

  for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (!used.has(letter)) return letter;
  }

  throw new Error(`No section letters available for grade prefix ${prefix}`);
}

async function resolveClassroomId(Classroom, { classroomGrade, classroomName, classroomId, excludeId }) {
  if (classroomId) {
    const normalized = normalizeClassroomId(classroomId);
    if (!/^[A-Z0-9]+-[A-Z]$/.test(normalized)) {
      throw new Error("Class ID must look like NUR-A or VII-B");
    }

    const duplicateQuery = { classroomId: normalized };
    if (excludeId) duplicateQuery._id = { $ne: excludeId };

    const duplicate = await Classroom.findOne(duplicateQuery).select("_id");
    if (duplicate) {
      throw new Error("A class with this ID already exists");
    }

    return normalized;
  }

  const prefix = gradeToPrefix(classroomGrade);
  if (!prefix) {
    throw new Error("Could not derive a class ID from the grade. Use values like Nursery, KG, I, VII.");
  }

  let section = sectionFromName(classroomName);
  let candidate = section ? `${prefix}-${section}` : null;

  if (candidate) {
    const duplicateQuery = { classroomId: candidate };
    if (excludeId) duplicateQuery._id = { $ne: excludeId };
    const duplicate = await Classroom.findOne(duplicateQuery).select("_id");
    if (duplicate) {
      section = await nextAvailableSection(Classroom, prefix, excludeId);
      candidate = `${prefix}-${section}`;
    }
  } else {
    section = await nextAvailableSection(Classroom, prefix, excludeId);
    candidate = `${prefix}-${section}`;
  }

  return candidate;
}

module.exports = {
  gradeToPrefix,
  sectionFromName,
  normalizeClassroomId,
  resolveClassroomId,
};
