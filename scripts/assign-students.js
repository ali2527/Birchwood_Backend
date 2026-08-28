/**
 * Assign seeded students to parents (1–2 each) and classes (max 2 per class) via admin API.
 */
require("../config/loadEnv");

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";

const { parseStringList } = require("../Helpers/childHealth");

const MAX_CHILDREN_PER_PARENT = 2;
const MAX_STUDENTS_PER_CLASS = 2;

async function request(method, urlPath, { token, json, query, formData } = {}) {
  const url = new URL(urlPath, BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (formData) {
    body = formData;
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text.slice(0, 400) };
  }
  if (res.status >= 400 || parsed?.status === false) {
    throw new Error(`${method} ${urlPath} → ${res.status} ${parsed?.message || text.slice(0, 200)}`);
  }
  return parsed;
}

function buildForm(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  return form;
}

function formatBirthday(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().split("T")[0];
}

function parentSlots(parentCount, studentCount) {
  const slots = [];
  for (let i = 0; i < parentCount; i += 1) {
    slots.push(i < 8 ? MAX_CHILDREN_PER_PARENT : 1);
  }
  const total = slots.reduce((sum, n) => sum + n, 0);
  if (total < studentCount) {
    throw new Error(`Not enough parent capacity (${total}) for ${studentCount} students`);
  }
  return slots;
}

function planParentIndices(parentCount, studentCount) {
  const slots = parentSlots(parentCount, studentCount);
  const plan = [];
  let parentIdx = 0;
  for (let s = 0; s < studentCount; s += 1) {
    while (parentIdx < parentCount && slots[parentIdx] === 0) parentIdx += 1;
    if (parentIdx >= parentCount) break;
    plan.push(parentIdx);
    slots[parentIdx] -= 1;
    if (slots[parentIdx] === 0) parentIdx += 1;
  }
  return plan;
}

function planClassIndices(classCount, studentCount, maxPerClass) {
  const loads = new Array(classCount).fill(0);
  const plan = [];
  let classIdx = 0;
  for (let s = 0; s < studentCount; s += 1) {
    while (loads[classIdx] >= maxPerClass) {
      classIdx = (classIdx + 1) % classCount;
    }
    plan.push(classIdx);
    loads[classIdx] += 1;
    classIdx = (classIdx + 1) % classCount;
  }
  return { plan, loads };
}

async function signIn() {
  const res = await request("POST", "/api/admin/auth/signin", {
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = res?.data?.token;
  if (!token) throw new Error("Admin sign-in did not return a token");
  return token;
}

async function fetchAll(token, path, key) {
  const res = await request("GET", path, { token, query: { page: 1, limit: 100, sort: "oldest" } });
  const docs = res?.data?.docs || [];
  if (!docs.length) throw new Error(`No ${key} found — run seed scripts first`);
  return docs;
}

function serializeHealthField(value) {
  return JSON.stringify(parseStringList(value));
}

function studentFormFields(student, extras = {}) {
  return {
    rollNumber: student.rollNumber,
    firstName: student.firstName,
    lastName: student.lastName || "",
    term: student.term,
    birthday: formatBirthday(student.birthday),
    age: student.age,
    allergies: serializeHealthField(student.allergies),
    fears: serializeHealthField(student.fears),
    conditions: serializeHealthField(student.conditions),
    summary: serializeHealthField(student.summary),
    status: student.status || "ACTIVE",
    ...extras,
  };
}

async function assignStudents() {
  const token = await signIn();
  console.log("Signed in as admin");

  const students = await fetchAll(token, "/api/admin/children/getAllChildren", "students");
  const parents = await fetchAll(token, "/api/admin/parent/getAllParent", "parents");
  const classrooms = await fetchAll(token, "/api/classroom/getAllClassrooms", "classrooms");

  const seeded = students.filter((s) => /^S\d{6}$/.test(s.rollNumber));
  if (!seeded.length) {
    throw new Error("No seeded students (S000001…) found — run npm run seed:children first");
  }

  seeded.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
  parents.sort((a, b) => (a.parentId || "").localeCompare(b.parentId || ""));
  classrooms.sort((a, b) => (a.classroomId || "").localeCompare(b.classroomId || ""));

  const parentPlan = planParentIndices(parents.length, seeded.length);
  const { plan: classPlan, loads: classLoads } = planClassIndices(
    classrooms.length,
    seeded.length,
    MAX_STUDENTS_PER_CLASS
  );

  console.log(`Assigning ${seeded.length} students → ${parents.length} parents, ${classrooms.length} classes`);
  console.log(`Limits: max ${MAX_CHILDREN_PER_PARENT}/parent, max ${MAX_STUDENTS_PER_CLASS}/class`);

  for (let i = 0; i < seeded.length; i += 1) {
    const student = seeded[i];
    const parent = parents[parentPlan[i]];
    const classroom = classrooms[classPlan[i]];

    await request("POST", `/api/admin/children/updateChild/${student._id}`, {
      token,
      formData: buildForm(
        studentFormFields(student, {
          parent: parent._id,
          classroom: classroom._id,
        })
      ),
    });

    console.log(
      `${student.rollNumber} ${student.firstName} ${student.lastName} → parent ${parent.parentId} · class ${classroom.classroomId}`
    );
  }

  const parentCounts = {};
  parentPlan.forEach((idx) => {
    parentCounts[idx] = (parentCounts[idx] || 0) + 1;
  });
  const overloadedParents = Object.entries(parentCounts).filter(([, count]) => count > MAX_CHILDREN_PER_PARENT);
  const overloadedClasses = classLoads.filter((count) => count > MAX_STUDENTS_PER_CLASS);

  if (overloadedParents.length || overloadedClasses.length) {
    throw new Error("Assignment exceeded configured limits");
  }

  console.log("\nAssignment summary:");
  Object.entries(parentCounts).forEach(([idx, count]) => {
    const p = parents[Number(idx)];
    console.log(`  ${p.parentId} (${p.fatherFirstName} ${p.fatherLastName}): ${count} student(s)`);
  });
  classLoads.forEach((count, idx) => {
    if (count > 0) {
      console.log(`  ${classrooms[idx].classroomId}: ${count} student(s)`);
    }
  });
  console.log("\nDone.");
}

assignStudents().catch((error) => {
  console.error("Failed to assign students:", error.message);
  process.exit(1);
});
