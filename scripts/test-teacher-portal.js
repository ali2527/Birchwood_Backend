const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const EMAIL = "samantha.william@birchwood.local";
const PASSWORD = process.env.TEACHER_SEED_PASSWORD || "Teacher@12345";
const PENDING_EMAIL = "nadila.adja@birchwood.local";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function pngForm(fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  form.append("image", new Blob([PNG], { type: "image/png" }), "dot.png");
  return form;
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function request(method, urlPath, { token, json, query, form } = {}) {
  const url = new URL(urlPath, BASE);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (form) {
    body = form;
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
    const msg = `${res.status} ${res.body?.message || res.body?.raw || ""}`.trim();
    record(name, ok, msg);
    return { ...res, ok };
  } catch (error) {
    record(name, false, error.message);
    return { status: 0, body: {}, ok: false };
  }
}

async function run() {
  await test("health", "GET", "/api/health");

  await test("signin missing password", "POST", "/api/teacher/auth/signin", {
    json: { email: EMAIL },
    expectFail: true,
  });
  await test("signin unknown email", "POST", "/api/teacher/auth/signin", {
    json: { email: "nobody@birchwood.local", password: PASSWORD },
    expectFail: true,
  });
  await test("signin wrong password", "POST", "/api/teacher/auth/signin", {
    json: { email: EMAIL, password: "WrongPass@1" },
    expectFail: true,
  });
  await test("pending teacher blocked", "POST", "/api/teacher/auth/signin", {
    json: { email: PENDING_EMAIL, password: PASSWORD },
    expectFail: true,
  });

  const signin = await test("teacher signin", "POST", "/api/teacher/auth/signin", {
    json: { email: EMAIL, password: PASSWORD },
  });
  const token = signin.body?.data?.token || "";
  const teacher = signin.body?.data?.user || {};
  const classroomId = teacher.classroom?._id || teacher.classroom || "";

  if (!token) {
    record("teacher token", false, "signin did not return a token");
    return finish();
  }

  await test("profile requires auth", "GET", "/api/teacher/profile/getProfile", {
    expectFail: true,
    expectStatus: 403,
  });

  const profile = await test("getProfile", "GET", "/api/teacher/profile/getProfile", { token });
  const profileUser = profile.body?.data || {};
  if (profileUser.hashed_password) {
    record("profile hides password", false, "hashed_password was returned");
  } else {
    record("profile hides password", true, "no hashed_password");
  }
  const roomId = profileUser.classroom?._id || profileUser.classroom || classroomId;
  if (!roomId) {
    record("profile has classroom", false, "classroom missing on profile");
  } else {
    record("profile has classroom", true, String(roomId));
  }

  const originalBio = profileUser.bio || "";
  await test("updateProfile", "POST", "/api/teacher/profile/updateProfile", {
    token,
    json: { bio: "Portal test bio", city: profileUser.city || "Jakarta" },
  });
  await test("restore profile bio", "POST", "/api/teacher/profile/updateProfile", {
    token,
    json: { bio: originalBio },
  });
  await test("changePassword rejects wrong current", "POST", "/api/teacher/profile/changePassword", {
    token,
    json: {
      old_password: "NotThePassword@1",
      new_password: "Teacher@12345",
      confirmPassword: "Teacher@12345",
    },
    expectFail: true,
  });

  const month = await test("getAttendanceByMonth", "GET", "/api/teacher/attendance/getAttendanceByMonth", {
    token,
    query: { month: "8", year: "2026" },
  });
  const monthRecords = month.body?.data?.attendance || [];
  const monthStats = month.body?.data?.stats || {};
  record(
    "August attendance has records",
    Array.isArray(monthRecords) && monthRecords.length > 0,
    `${monthRecords.length} records`
  );
  record(
    "August stats present",
    typeof monthStats.PRESENT === "number",
    JSON.stringify(monthStats)
  );

  const stats = await test(
    "getMonthlyAttendanceStats",
    "GET",
    "/api/teacher/attendance/getMonthlyAttendanceStats",
    { token, query: { month: "8", year: "2026" } }
  );
  record(
    "monthly stats object",
    typeof stats.body?.data?.stats?.PRESENT === "number",
    JSON.stringify(stats.body?.data?.stats || {})
  );

  const list = await test("getAllMyAttendance", "GET", "/api/teacher/attendance/getAllMyAttendance", {
    token,
    query: { page: "1", limit: "10" },
  });
  const docs = list.body?.data?.docs || list.body?.data?.attendance || [];
  record("attendance list docs", Array.isArray(docs) && (list.body?.data?.totalDocs > 0 || docs.length > 0), `docs ${docs.length} total ${list.body?.data?.totalDocs}`);

  const filtered = await test("getAllMyAttendance date filter", "GET", "/api/teacher/attendance/getAllMyAttendance", {
    token,
    query: { from: "2026-08-01", to: "2026-08-31", page: "1", limit: "50" },
  });
  record(
    "attendance date filter returns August rows",
    (filtered.body?.data?.totalDocs || 0) > 0 || (filtered.body?.data?.docs || []).length > 0,
    `total ${filtered.body?.data?.totalDocs}`
  );

  const oneId = (docs[0] || monthRecords[0] || {})._id;
  if (oneId) {
    await test("getAttendanceById", "GET", `/api/teacher/attendance/getAttendanceById/${oneId}`, {
      token,
    });
  } else {
    record("getAttendanceById", false, "no attendance id available");
  }

  const now = new Date().toISOString();
  const checkIn = await request("POST", "/api/teacher/attendance/markCheckIn", {
    token,
    json: { checkIn: now },
  });
  record(
    "markCheckIn today or already marked",
    checkIn.body?.status === true || String(checkIn.body?.message || "").toLowerCase().includes("already"),
    `${checkIn.status} ${checkIn.body?.message || ""}`
  );

  const checkOut = await request("POST", "/api/teacher/attendance/markCheckOut", {
    token,
    json: { checkOut: now },
  });
  record(
    "markCheckOut today or already marked",
    checkOut.body?.status === true || String(checkOut.body?.message || "").toLowerCase().includes("already"),
    `${checkOut.status} ${checkOut.body?.message || ""}`
  );

  await test("markCheckIn rejects other day", "POST", "/api/teacher/attendance/markCheckIn", {
    token,
    json: { checkIn: "2026-01-01T08:00:00.000Z" },
    expectFail: true,
  });

  const timetable = await test(
    "class timetable",
    "GET",
    `/api/timetable/getAllClassTimetables/${roomId}`,
    { token }
  );
  const slots = timetable.body?.data?.slots || [];
  const byDay = timetable.body?.data?.byDay || {};
  record(
    "timetable has weekday slots",
    slots.length > 0 || (byDay.MON || []).length > 0,
    `slots ${slots.length} mon ${(byDay.MON || []).length}`
  );
  await test("timetable by day", "GET", "/api/timetable/getTimetableByDayAndClass", {
    token,
    query: { classroom: roomId, day: "MON" },
  });

  const classes = await test("getAllClassrooms", "GET", "/api/classroom/getAllClassrooms", { token });
  record(
    "classrooms list",
    (classes.body?.data?.docs || []).length > 0 || (classes.body?.data?.totalDocs || 0) > 0,
    `total ${classes.body?.data?.totalDocs}`
  );
  if (roomId) {
    await test("getClassroomById", "GET", `/api/classroom/getClassroomById/${roomId}`, { token });
  }

  await test("getAllHolidays", "GET", "/api/holiday/getAllHolidays", { token });
  await test("getAllHomework", "GET", "/api/homework/getAllHomework", { token });
  await test("getAllPosts", "GET", "/api/post/getAllPosts", { token });
  await test("getAllActivities", "GET", "/api/activity/getAllActivities", { token });
  await test("getAllcategories", "GET", "/api/category/getAllcategories");
  await test("getAllInventorys", "GET", "/api/inventory/getAllInventorys", { token });
  await test("getAllVouchers", "GET", "/api/fees/getAllVouchers", { token });

  const due = new Date(Date.now() + 3 * 86400000).toISOString();
  const homework = await test("addHomework", "POST", "/api/homework/addHomework", {
    token,
    json: {
      title: "Portal test homework",
      description: "Read chapter 1",
      classroom: roomId,
      teacher: profileUser._id,
      dueDate: due,
      assignee: "CLASS",
      type: "HOMEWORK",
    },
  });
  const homeworkId = homework.body?.data?.homework?._id;
  if (homeworkId) {
    await test("getHomeworkById", "GET", `/api/homework/getHomeworkById/${homeworkId}`, { token });
    await test("updateHomework", "POST", `/api/homework/updateHomework/${homeworkId}`, {
      token,
      json: { description: "Read chapters 1 and 2" },
    });
    await test("deleteHomework", "GET", `/api/homework/deleteHomework/${homeworkId}`, { token });
  }

  const activity = await test("addActivity", "POST", "/api/activity/addActivity", {
    token,
    form: pngForm({ title: `Portal activity ${Date.now()}`, description: "Morning work" }),
  });
  const activityId = activity.body?.data?.activity?._id || activity.body?.data?.newActivity?._id;

  let postId = "";
  if (activityId && roomId) {
    const post = await test("addPost", "POST", "/api/post/addPost", {
      token,
      json: {
        content: "Class update from portal test",
        type: "CLASS",
        activity: activityId,
        classroom: roomId,
      },
    });
    postId = post.body?.data?.newPost?._id;
  } else {
    record("addPost skipped", false, "missing activity or classroom");
  }

  if (postId) {
    await test("getPostById", "GET", `/api/post/getPostById/${postId}`, { token });
    await test("getAllClassPosts", "GET", `/api/post/getAllClassPosts/${roomId}`, { token });
    await test("likePost", "POST", `/api/post/likePost/${postId}`, { token });
    await test("lovePost", "POST", `/api/post/lovePost/${postId}`, { token });
    await test("commentPost", "POST", `/api/post/commentPost/${postId}`, {
      token,
      json: { content: "Noted" },
    });
    await test("getAllPostComments", "GET", `/api/post/getAllPostComments/${postId}`, { token });
    await test("deletePost", "GET", `/api/post/deletePost/${postId}`, { token });
  }

  if (activityId) {
    await test("deleteActivity", "GET", `/api/activity/deleteActivity/${activityId}`, { token });
  }

  await test("teacher cannot add classroom", "POST", "/api/classroom/addClassroom", {
    token,
    json: { classroomName: "Should Fail", classroomGrade: "VII", classroomBatch: 2026 },
    expectFail: true,
  });
  await test("teacher cannot add timetable", "POST", "/api/timetable/addTimetable", {
    token,
    json: { classroom: roomId, day: "MON", startTime: "15:00", endTime: "16:00", subject: "X" },
    expectFail: true,
  });

  await test("invalid recover code", "POST", "/api/teacher/auth/verifyRecoverCode", {
    json: { email: EMAIL, code: "0000" },
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
