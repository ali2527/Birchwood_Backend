const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
const ADMIN_APP = process.env.ADMIN_APP_URL || "http://localhost:3000";

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function request(method, urlPath, { token, json, query, absolute } = {}) {
  const url = absolute ? new URL(urlPath) : new URL(urlPath, BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  const headers = { Accept: "application/json, text/html;q=0.9" };
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
  return { status: res.status, body: parsed, text };
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

async function run() {
  try {
    const app = await request("GET", ADMIN_APP, { absolute: true });
    record(
      "admin web app is running",
      app.status === 200 && (app.text.includes("root") || app.text.includes("Birchwood") || app.text.includes("html")),
      `${app.status}`
    );
  } catch (error) {
    record("admin web app is running", false, error.message);
  }

  await test("health", "GET", "/api/health");
  await test("admin signin missing password", "POST", "/api/admin/auth/signin", {
    json: { email: ADMIN_EMAIL },
    expectFail: true,
  });
  await test("admin signin wrong password", "POST", "/api/admin/auth/signin", {
    json: { email: ADMIN_EMAIL, password: "WrongPass@1" },
    expectFail: true,
  });

  const signin = await test("admin signin", "POST", "/api/admin/auth/signin", {
    json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = signin.body?.data?.token || "";
  if (!token) {
    record("admin token", false, "signin did not return a token");
    return finish();
  }

  await test("dashboard requires auth", "GET", "/api/admin/dashboard/overview", {
    expectFail: true,
    expectStatus: 403,
  });
  const dashboard = await test("dashboard overview", "GET", "/api/admin/dashboard/overview", { token });
  record(
    "dashboard has stats",
    typeof dashboard.body?.data?.stats === "object",
    JSON.stringify(dashboard.body?.data?.stats || {})
  );

  const teachers = await test("getAllTeachers", "GET", "/api/admin/teacher/getAllTeachers", {
    token,
    query: { page: "1", limit: "10", sort: "newest" },
  });
  const docs = teachers.body?.data?.docs || [];
  record("teachers list has docs", docs.length > 0, `docs ${docs.length} total ${teachers.body?.data?.totalDocs}`);
  const samantha = docs.find((item) => item.email === "samantha.william@birchwood.local") || docs[0];
  const teacherId = samantha?._id;
  const classroomId = samantha?.classroom?._id || samantha?.classroom;

  const rooms = await test("searchClassrooms", "GET", "/api/admin/teacher/searchClassrooms", { token });
  const classrooms = rooms.body?.data?.classrooms || [];
  record("searchClassrooms returns real rooms", classrooms.length > 0, `${classrooms.length} classrooms`);
  record(
    "searchClassrooms ids are mongo ids",
    classrooms.every((room) => String(room._id || "").length === 24),
    classrooms.map((room) => room.classroomName).join(", ")
  );

  await test("searchClassrooms by keyword", "GET", "/api/admin/teacher/searchClassrooms", {
    token,
    query: { keyword: "VII" },
  });

  if (!teacherId) {
    record("teacher details", false, "no teacher id from list");
    return finish();
  }

  const details = await test("getTeacherById", "GET", `/api/admin/teacher/getTeacherById/${teacherId}`, { token });
  const teacher = details.body?.data?.teacher || {};
  record("teacher details populated classroom", Boolean(teacher.classroom?.classroomName || teacher.classroom), String(teacher.classroom?.classroomName || teacher.classroom || ""));

  const attendance = await test(
    "getTeacherAttendanceByMonth",
    "GET",
    `/api/admin/teacher/getTeacherAttendanceByMonth/${teacherId}`,
    { token, query: { month: "8", year: "2026" } }
  );
  const monthRows = attendance.body?.data?.attendance || [];
  record("August attendance on details", monthRows.length > 0, `${monthRows.length} records`);

  const room = teacher.classroom?._id || classroomId || classrooms[0]?._id;
  const timetable = await test(
    "teacher class timetable",
    "GET",
    `/api/timetable/getAllClassTimetables/${room}`,
    { token }
  );
  const slots = timetable.body?.data?.slots || [];
  record("timetable slots for teacher class", slots.length > 0, `${slots.length} slots`);

  const created = await test("markAttendance", "POST", `/api/admin/teacher/markAttendance/${teacherId}`, {
    token,
    json: {
      status: "PRESENT",
      checkIn: "2026-12-20T08:45:00.000Z",
      checkOut: "2026-12-20T16:00:00.000Z",
    },
  });
  const attendanceId = created.body?.data?.attendance?._id;
  if (attendanceId) {
    await test("updateAttendance", "POST", `/api/admin/teacher/updateAttendance/${attendanceId}`, {
      token,
      json: { status: "LEAVE", leaveReason: "Admin test leave" },
    });
    await test("deleteAttendance", "POST", `/api/admin/teacher/deleteAttendance/${attendanceId}`, {
      token,
    });
  } else {
    record("markAttendance returned id", false, JSON.stringify(created.body?.data || {}));
  }

  await test("getAllClassrooms", "GET", "/api/classroom/getAllClassrooms", {
    token,
    query: { page: "1", limit: "10" },
  });
  await test("searchTeachers", "GET", "/api/classroom/searchTeachers", { token });
  if (room) {
    await test("getClassroomById", "GET", `/api/classroom/getClassroomById/${room}`, { token });
  }

  await test("getAllChildren", "GET", "/api/admin/children/getAllChildren", {
    token,
    query: { page: "1", limit: "10" },
  });
  await test("searchParents", "GET", "/api/admin/children/searchParents", { token });

  await test("getAllHolidays", "GET", "/api/holiday/getAllHolidays", { token });
  await test("getAllHomework", "GET", "/api/homework/getAllHomework", { token });
  await test("getAllActivities", "GET", "/api/activity/getAllActivities", { token });
  await test("getAllcategories", "GET", "/api/category/getAllcategories");
  await test("getAllInventorys", "GET", "/api/inventory/getAllInventorys", { token });
  await test("getAllVouchers", "GET", "/api/fees/getAllVouchers", { token });
  await test("getAllPosts", "GET", "/api/post/getAllPosts", { token });

  const parents = await test("getAllParent", "GET", "/api/admin/parent/getAllParent", {
    token,
    query: { page: "1", limit: "10", sort: "newest" },
  });
  const parentDocs = parents.body?.data?.docs || [];
  record(
    "parents list shape",
    Array.isArray(parentDocs),
    `docs ${parentDocs.length} total ${parents.body?.data?.totalDocs}`
  );

  await test("getAllParent oldest", "GET", "/api/admin/parent/getAllParent", {
    token,
    query: { page: "1", limit: "10", sort: "oldest" },
  });
  await test("getAllParent status ACTIVE", "GET", "/api/admin/parent/getAllParent", {
    token,
    query: { page: "1", limit: "10", status: "ACTIVE" },
  });

  const students = await test("searchStudents", "GET", "/api/admin/parent/searchStudents", { token });
  record(
    "searchStudents returns array",
    Array.isArray(students.body?.data?.students),
    `${(students.body?.data?.students || []).length} students`
  );

  const teacherSignin = await request("POST", "/api/teacher/auth/signin", {
    json: { email: "samantha.william@birchwood.local", password: "Teacher@12345" },
  });
  const teacherToken = teacherSignin.body?.data?.token || "";
  await test("teacher cannot open admin teacher list", "GET", "/api/admin/teacher/getAllTeachers", {
    token: teacherToken,
    expectFail: true,
  });

  finish();
}

function finish() {
  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("Failed:");
    failed.forEach((item) => console.log(` - ${item.name}: ${item.detail}`));
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
