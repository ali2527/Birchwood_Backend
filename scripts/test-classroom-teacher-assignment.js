const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
const { TEACHER_CLASSROOM_ASSIGNMENTS } = require("../constants/teacherClassroomAssignments");

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function request(method, urlPath, { token, json, query } = {}) {
  const url = new URL(urlPath, BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
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
  return { status: res.status, body: parsed };
}

function okBody(res) {
  return res.status < 400 && res.body?.status !== false;
}

async function test(name, method, urlPath, opts = {}) {
  try {
    const res = await request(method, urlPath, opts);
    const expectFail = opts.expectFail;
    const ok = expectFail
      ? res.status === (opts.expectStatus || 400) || res.body?.status === false
      : okBody(res);
    const msg = `${res.status} ${res.body?.message || ""}`.trim();
    record(name, ok, msg);
    return { ...res, ok };
  } catch (error) {
    record(name, false, error.message);
    return { status: 0, body: {}, ok: false };
  }
}

function finish() {
  const passed = results.filter((item) => item.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed}/${results.length} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

async function run() {
  await test("health", "GET", "/api/health");

  const signin = await test("admin signin", "POST", "/api/admin/auth/signin", {
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = signin.body?.data?.token || "";
  if (!token) {
    record("admin token", false, "signin did not return a token");
    return finish();
  }

  const list = await test("list classrooms", "GET", "/api/classroom/getAllClassrooms", {
    token,
    query: { page: 1, limit: 20 },
  });
  const docs = list.body?.data?.docs || [];
  record("seeded sections exist", docs.length >= 12, `${docs.length} sections`);

  const withTeacher = docs.filter((item) => item.teacher?._id || item.teacher);
  record("each section has homeroom teacher", withTeacher.length >= 12, `${withTeacher.length}/12 assigned`);

  const nur = docs.find((item) => item.classroomId === "NUR-A");
  const kg = docs.find((item) => item.classroomId === "KG-A");
  if (!nur?._id || !kg?._id) {
    record("fixture sections", false, "NUR-A or KG-A missing");
    return finish();
  }

  const detail = await test("get classroom by id", "GET", `/api/classroom/getClassroomById/${nur._id}`, {
    token,
  });
  record(
    "classroom detail includes teacher",
    Boolean(detail.body?.data?.classroom?.teacher),
    detail.body?.data?.classroom?.teacher?.email || "no teacher"
  );

  const teachers = await test("search teachers", "GET", "/api/classroom/searchTeachers", { token });
  const allTeachers = await test("list all teachers", "GET", "/api/admin/teacher/getAllTeachers", {
    token,
    query: { page: 1, limit: 20 },
  });
  const teacherDocs = allTeachers.body?.data?.docs || teachers.body?.data?.teachers || [];
  const karen = teacherDocs.find((item) => item.email === "karen.hope@birchwood.local");
  const tony = teacherDocs.find((item) => item.email === "tony.soap@birchwood.local");
  const unassigned = teacherDocs.filter((item) => !item.classroom?._id && !item.classroom);
  record("all teachers have a section", unassigned.length === 0, unassigned.length ? unassigned.map((t) => t.email).join(", ") : "12/12 assigned");

  await test("assign invalid teacher fails", "POST", `/api/classroom/updateClassroom/${kg._id}`, {
    token,
    json: { teacher: "000000000000000000000000" },
    expectFail: true,
  });

  if (karen?._id) {
    const assignKaren = await test("assign teacher to section", "POST", `/api/classroom/updateClassroom/${kg._id}`, {
      token,
      json: { teacher: karen._id },
    });
    record(
      "KG-A now assigned to Karen",
      assignKaren.body?.data?.teacher === karen._id ||
        String(assignKaren.body?.data?.teacher) === String(karen._id),
      assignKaren.body?.message || ""
    );

    const tonyAfter = await request("GET", "/api/classroom/getClassroomById/" + kg._id, { token });
    const karenTeacher = await request("GET", `/api/admin/teacher/getTeacherById/${karen._id}`, { token });
    record(
      "teacher.classroom synced",
      String(karenTeacher.body?.data?.teacher?.classroom?._id || karenTeacher.body?.data?.teacher?.classroom) ===
        String(kg._id),
      karenTeacher.body?.data?.teacher?.classroom?.classroomId || "no classroom on teacher"
    );

    if (tony?._id) {
      const moveTony = await test("move teacher to another section", "POST", `/api/classroom/updateClassroom/${nur._id}`, {
        token,
        json: { teacher: tony._id },
      });
      record(
        "NUR-A reassigned to Tony",
        String(moveTony.body?.data?.teacher) === String(tony._id),
        moveTony.body?.message || ""
      );

      const oldTonyClass = await request("GET", "/api/classroom/getClassroomById/" + kg._id, { token });
      record(
        "previous teacher unlinked from old section",
        String(oldTonyClass.body?.data?.classroom?.teacher?._id || oldTonyClass.body?.data?.classroom?.teacher) !==
          String(tony._id),
        oldTonyClass.body?.data?.classroom?.teacher?.email || "empty"
      );
    }

    await test("clear section teacher", "POST", `/api/classroom/updateClassroom/${kg._id}`, {
      token,
      json: { teacher: null },
    });
    const cleared = await request("GET", "/api/classroom/getClassroomById/" + kg._id, { token });
    record(
      "section teacher cleared",
      !cleared.body?.data?.classroom?.teacher,
      cleared.body?.data?.classroom?.teacher?.email || "cleared"
    );

    await test("restore seed assignment for KG-A", "POST", `/api/classroom/updateClassroom/${kg._id}`, {
      token,
      json: { teacher: tony?._id },
    });
  }

  for (const item of TEACHER_CLASSROOM_ASSIGNMENTS) {
    const section = docs.find((row) => row.classroomId === item.classroomId);
    if (!section?._id) continue;
    const teacher = teacherDocs.find((row) => row.email === item.teacherEmail);
    if (!teacher?._id) continue;
    await request("POST", `/api/classroom/updateClassroom/${section._id}`, {
      token,
      json: { teacher: teacher._id },
    });
  }
  record("restored seed homeroom map", true, `${TEACHER_CLASSROOM_ASSIGNMENTS.length} links`);

  return finish();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
