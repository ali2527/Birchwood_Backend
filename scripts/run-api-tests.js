process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Parent = require("../Models/Parent");
const Teacher = require("../Models/Teacher");

const BASE = "https://localhost:8201";
const stamp = Date.now();
const PASSWORD = "ApiTest@12345A";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const results = [];
let parentToken = "";
let adminToken = "";
let teacherToken = "";
let ids = {};

const parentEmail = `parent.api.${stamp}@example.com`;
const adminEmail = `admin.api.${stamp}@example.com`;
const teacherEmail = `teacher.api.${stamp}@example.com`;

function record(name, method, url, ok, detail) {
  results.push({ name, method, url, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${method} ${url}  ${name}  ${detail}`);
}

function isSuccess(body, status) {
  if (status >= 500) return false;
  if (body && body.status === false) return false;
  return status < 400;
}

async function request(method, urlPath, { token, json, form, query } = {}) {
  const url = new URL(urlPath, BASE);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  const headers = {};
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
    parsed = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body: parsed, text };
}

async function test(name, method, urlPath, opts = {}) {
  try {
    const { status, body } = await request(method, urlPath, opts);
    const expectFail = opts.expectFail;
    const ok = expectFail
      ? status === opts.expectStatus || body.status === false
      : isSuccess(body, status);
    const msg = body.message || body.raw || `HTTP ${status}`;
    record(name, method, urlPath, ok, `${status} ${msg}`);
    return { status, body, ok };
  } catch (err) {
    record(name, method, urlPath, false, err.message);
    return { status: 0, body: {}, ok: false };
  }
}

function pngForm(fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  });
  form.append("image", new Blob([PNG], { type: "image/png" }), "dot.png");
  return form;
}

async function seedAdmin() {
  await mongoose.connect(process.env.DB);
  const existing = await Parent.findOne({ email: adminEmail });
  if (existing) {
    existing.isAdmin = true;
    existing.status = "ACTIVE";
    await existing.save();
  } else {
    const admin = new Parent({
      fatherFirstName: "Admin",
      fatherLastName: "User",
      motherFirstName: "Admin",
      motherLastName: "User",
      email: adminEmail,
      phone: "03001234567",
      password: PASSWORD,
      isAdmin: true,
      status: "ACTIVE",
    });
    await admin.save();
  }
}

async function activateTeacher(email) {
  const teacher = await Teacher.findOne({ email });
  if (teacher) {
    teacher.status = "ACTIVE";
    await teacher.save();
    return teacher;
  }
  return null;
}

async function run() {
  await seedAdmin();

  await test("health", "GET", "/");

  await test("signup missing fields", "POST", "/api/auth/signup", {
    json: { email: "bad" },
    expectFail: true,
    expectStatus: 400,
  });

  const signup = await test("parent signup", "POST", "/api/auth/signup", {
    json: {
      email: parentEmail,
      fatherFirstName: "Ahmed",
      fatherLastName: "Khan",
      motherFirstName: "Ayesha",
      motherLastName: "Khan",
      phone: "03001112233",
      password: PASSWORD,
      address: "Test Street",
      city: "Lahore",
      state: "Punjab",
    },
  });

  const parentSignin = await test("parent signin", "POST", "/api/auth/signin", {
    json: { email: parentEmail, password: PASSWORD },
  });
  parentToken = parentSignin.body?.data?.token || "";

  const adminSignin = await test("admin signin", "POST", "/api/auth/signin", {
    json: { email: adminEmail, password: PASSWORD },
  });
  adminToken = adminSignin.body?.data?.token || "";

  await test("signin wrong password", "POST", "/api/auth/signin", {
    json: { email: parentEmail, password: "WrongPass@1" },
    expectFail: true,
  });

  await test("reset code request", "POST", "/api/auth/emailVerificationCode", {
    json: { email: parentEmail },
  });
  await test("verify recover code invalid", "POST", "/api/auth/verifyRecoverCode", {
    json: { email: parentEmail, code: "0000" },
    expectFail: true,
    expectStatus: 400,
  });
  await test("reset password invalid code", "POST", "/api/auth/resetPassword", {
    json: {
      email: parentEmail,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      code: "0000",
    },
    expectFail: true,
    expectStatus: 400,
  });

  await test("profile without token", "GET", "/api/profile/getProfile", {
    expectFail: true,
    expectStatus: 403,
  });
  await test("parent getProfile", "GET", "/api/profile/getProfile", {
    token: parentToken,
  });
  await test("parent updateProfile", "POST", "/api/profile/updateProfile", {
    token: parentToken,
    form: pngForm({ phone: "03009998877", city: "Karachi" }),
  });

  await test("parent cannot create classroom", "POST", "/api/classroom/addClassroom", {
    token: parentToken,
    json: {
      classroomName: `Blocked ${stamp}`,
      classroomGrade: "1",
      classroomBatch: "2026",
    },
    expectFail: true,
    expectStatus: 401,
  });

  const classroom = await test("admin addClassroom", "POST", "/api/classroom/addClassroom", {
    token: adminToken,
    json: {
      classroomName: `API Test Class ${stamp}`,
      classroomGrade: "Nursery",
      classroomBatch: "2026",
      description: "Created by API test",
    },
  });
  ids.classroom = classroom.body?.data?.classroom?._id;

  await test("getAllClassrooms", "GET", "/api/classroom/getAllClassrooms", {
    token: parentToken,
  });
  await test("getClassroomById", "GET", `/api/classroom/getClassroomById/${ids.classroom}`, {
    token: parentToken,
  });
  await test("updateClassroom", "POST", `/api/classroom/updateClassroom/${ids.classroom}`, {
    token: adminToken,
    json: { description: "Updated classroom" },
  });

  const teacherForm = pngForm({
    email: teacherEmail,
    teacherId: `T${stamp}`.slice(0, 14),
    firstName: "Sara",
    lastName: "Ali",
    phone: "03005556677",
    address: "Teacher Street",
    city: "Lahore",
    state: "Punjab",
    password: PASSWORD,
    classroom: ids.classroom,
    bio: "Test teacher",
  });
  await test("admin addTeacher", "POST", "/api/admin/teacher/addTeacher", {
    token: adminToken,
    form: teacherForm,
  });
  await activateTeacher(teacherEmail);

  const teacherSignin = await test("teacher signin", "POST", "/api/teacher/auth/signin", {
    json: { email: teacherEmail, password: PASSWORD },
  });
  teacherToken = teacherSignin.body?.data?.token || "";

  await test("teacher getProfile", "GET", "/api/teacher/profile/getProfile", {
    token: teacherToken,
  });
  await test("teacher updateProfile", "POST", "/api/teacher/profile/updateProfile", {
    token: teacherToken,
    form: pngForm({ bio: "Updated bio", city: "Islamabad" }),
  });

  await test("getAllTeachers", "GET", "/api/admin/teacher/getAllTeachers", {
    token: adminToken,
  });
  const teacherDoc = await Teacher.findOne({ email: teacherEmail });
  ids.teacher = teacherDoc?._id?.toString();
  await test("getTeacherById", "GET", `/api/admin/teacher/getTeacherById/${ids.teacher}`, {
    token: adminToken,
  });
  await test("updateTeacher", "POST", `/api/admin/teacher/updateTeacher/${ids.teacher}`, {
    token: adminToken,
    form: pngForm({ city: "Lahore", bio: "Admin updated" }),
  });

  const child = await test("admin addChild", "POST", "/api/admin/children/addChild", {
    token: adminToken,
    form: pngForm({
      rollNumber: `R${stamp}`,
      firstName: "Hassan",
      lastName: "Khan",
      term: "Spring",
      birthday: "2020-01-15",
      age: "6",
      classroom: ids.classroom,
    }),
  });
  ids.child = child.body?.data?.child?._id;
  ids.childRollNumber = `R${stamp}`;
  ids.childBirthday = "2020-01-15";

  await test("getAllChildren", "GET", "/api/admin/children/getAllChildren", {
    token: teacherToken,
  });
  await test("getChildById", "GET", `/api/admin/children/getChildById/${ids.child}`, {
    token: teacherToken,
  });
  await test(
    "getChildrenByClassroom",
    "GET",
    `/api/admin/children/getChildrenByClassroom/${ids.classroom}`,
    { token: teacherToken }
  );
  await test("updateChild", "POST", `/api/admin/children/updateChild/${ids.child}`, {
    token: adminToken,
    form: pngForm({ firstName: "Hassan" }),
  });
  await test("toggleChildStatus", "GET", `/api/admin/children/toggleStatus/${ids.child}`, {
    token: adminToken,
  });
  await test("toggleChildStatus back", "GET", `/api/admin/children/toggleStatus/${ids.child}`, {
    token: adminToken,
  });

  await test("assignChild missing details", "POST", "/api/children/assignChild", {
    token: parentToken,
    json: { child: ids.child },
    expectFail: true,
    expectStatus: 400,
  });
  await test("assignChild wrong birthday", "POST", "/api/children/assignChild", {
    token: parentToken,
    json: { rollNumber: ids.childRollNumber, birthday: "2019-01-15" },
    expectFail: true,
    expectStatus: 400,
  });
  await test("assignChild", "POST", "/api/children/assignChild", {
    token: parentToken,
    json: { rollNumber: ids.childRollNumber, birthday: ids.childBirthday },
  });

  const activity = await test("addActivity", "POST", "/api/activity/addActivity", {
    token: teacherToken,
    form: pngForm({ title: `Drawing ${stamp}`, description: "Art" }),
  });
  ids.activity = activity.body?.data?.activity?._id;
  await test("getAllActivities", "GET", "/api/activity/getAllActivities", {
    token: teacherToken,
  });
  await test("getActivityById", "GET", `/api/activity/getActivityById/${ids.activity}`, {
    token: teacherToken,
  });
  await test("updateActivity", "POST", `/api/activity/updateActivity/${ids.activity}`, {
    token: teacherToken,
    form: pngForm({ title: `Drawing ${stamp}`, description: "Updated" }),
  });

  const postForm = pngForm({
    content: "Class update from API test",
    type: "CLASS",
    activity: ids.activity,
    classroom: ids.classroom,
  });
  const post = await test("addPost", "POST", "/api/post/addPost", {
    token: teacherToken,
    form: postForm,
  });
  ids.post = post.body?.data?.newPost?._id;
  await test("getAllPosts", "GET", "/api/post/getAllPosts", { token: teacherToken });
  await test("getAllClassPosts", "GET", `/api/post/getAllClassPosts/${ids.classroom}`, {
    token: teacherToken,
  });
  await test("getAllChildPosts", "GET", `/api/post/getAllChildPosts/${ids.child}`, {
    token: parentToken,
  });
  await test("getPostById", "GET", `/api/post/getPostById/${ids.post}`, {
    token: teacherToken,
  });
  await test("likePost", "GET", `/api/post/likePost/${ids.post}`, { token: parentToken });
  await test("lovePost", "GET", `/api/post/lovePost/${ids.post}`, { token: parentToken });
  await test("commentPost", "POST", `/api/post/commentPost/${ids.post}`, {
    token: parentToken,
    json: { content: "Nice work" },
  });
  await test("getAllPostComments", "GET", `/api/post/getAllPostComments/${ids.post}`, {
    token: parentToken,
  });
  await test("updatePost", "POST", `/api/post/updatePost/${ids.post}`, {
    token: teacherToken,
    form: pngForm({
      content: "Updated post",
      type: "CLASS",
      activity: ids.activity,
      classroom: ids.classroom,
    }),
  });

  await test("getAllcategories public", "GET", "/api/category/getAllcategories");
  const category = await test("addCategory", "POST", "/api/category/addCategory", {
    token: adminToken,
    json: { title: `Stationery ${stamp}`, description: "Office supplies" },
  });
  ids.category = category.body?.data?.category?._id || category.body?.data?._id;
  if (!ids.category && category.body?.data) {
    const maybe = category.body.data.Category || category.body.data.newCategory;
    ids.category = maybe?._id;
  }
  await test("getCategoryById", "GET", `/api/category/getCategoryById/${ids.category}`, {
    token: adminToken,
  });
  await test("updateCategory", "POST", `/api/category/updateCategory/${ids.category}`, {
    token: adminToken,
    json: { description: "Updated category" },
  });
  await test("toggleCategoryStatus", "GET", `/api/category/toggleStatus/${ids.category}`, {
    token: adminToken,
  });
  await test("toggleCategoryStatus back", "GET", `/api/category/toggleStatus/${ids.category}`, {
    token: adminToken,
  });

  const invForm = pngForm({
    title: `Pencils ${stamp}`,
    description: "HB pencils box",
    quantity: "20",
    category: ids.category,
    manufacturer: "TestCo",
    unitPrice: "10",
  });
  await test("addInventory", "POST", "/api/inventory/addInventory", {
    token: adminToken,
    form: invForm,
  });
  const invList = await test("getAllInventorys", "GET", "/api/inventory/getAllInventorys", {
    token: adminToken,
  });
  const invDocs = invList.body?.data?.docs || invList.body?.data?.inventorys || [];
  ids.inventory = invDocs[0]?._id;
  await test("getInventoryById", "GET", `/api/inventory/getInventoryById/${ids.inventory}`, {
    token: adminToken,
  });
  await test(
    "getInventoryByCategory",
    "GET",
    `/api/inventory/getInventoryByCategory/${ids.category}`,
    { token: adminToken }
  );
  await test("updateInventory", "POST", `/api/inventory/updateInventory/${ids.inventory}`, {
    token: adminToken,
    form: pngForm({
      title: `Pencils ${stamp}`,
      description: "Updated",
      quantity: "15",
      category: ids.category,
    }),
  });
  await test("toggleInventoryStatus", "GET", `/api/inventory/toggleStatus/${ids.inventory}`, {
    token: adminToken,
  });

  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const fee = await test("createVoucher", "POST", "/api/fees/createVoucher", {
    token: adminToken,
    json: {
      children: ids.child,
      amount: 5000,
      month: 8,
      year: 2026,
      dueDate: due,
    },
  });
  ids.fee = fee.body?.data?.fee?._id;
  await test("getAllVouchers", "GET", "/api/fees/getAllVouchers", { token: adminToken });
  await test("getVoucherById", "GET", `/api/fees/getVoucherById/${ids.fee}`, {
    token: adminToken,
  });
  await test("getAllChildVouchers", "GET", `/api/fees/getAllChildVouchers/${ids.child}`, {
    token: parentToken,
  });
  await test("updateVoucher", "POST", `/api/fees/updateVoucher/${ids.fee}`, {
    token: adminToken,
    json: { amount: 4500 },
  });
  await test("toggleFeeStatus", "GET", `/api/fees/toggleStatus/${ids.fee}`, {
    token: adminToken,
  });

  const timetable = await test("addTimetable", "POST", "/api/timetable/addTimetable", {
    token: adminToken,
    json: {
      classroom: ids.classroom,
      day: "MON",
      startTime: "09:00",
      endTime: "10:00",
      subject: "Math",
      description: "Morning math",
    },
  });
  ids.timetable = timetable.body?.data?.newTimetable?._id;
  await test(
    "getAllClassTimetables",
    "GET",
    `/api/timetable/getAllClassTimetables/${ids.classroom}`,
    { token: teacherToken }
  );
  await test("getTimetableByDayAndClass", "GET", "/api/timetable/getTimetableByDayAndClass", {
    token: teacherToken,
    query: { classroom: ids.classroom, day: "MON" },
  });
  await test("updateTimetable", "POST", `/api/timetable/updateTimetable/${ids.timetable}`, {
    token: adminToken,
    json: { subject: "English" },
  });

  const holiday = await test("addHoliday", "POST", "/api/holiday/addHoliday", {
    token: adminToken,
    json: { name: `Test Holiday ${stamp}`, date: "2026-12-25" },
  });
  ids.holiday = holiday.body?.data?.newHoliday?._id;
  await test("getAllHolidays", "GET", "/api/holiday/getAllHolidays", { token: parentToken });
  await test("updateHoliday", "POST", `/api/holiday/updateHoliday/${ids.holiday}`, {
    token: adminToken,
    json: { name: `Updated Holiday ${stamp}` },
  });

  const hwDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const homework = await test("addHomework", "POST", "/api/homework/addHomework", {
    token: teacherToken,
    json: {
      title: `Reading ${stamp}`,
      description: "Read chapter 1",
      classroom: ids.classroom,
      teacher: ids.teacher,
      dueDate: hwDue,
      assignee: "CLASS",
      type: "HOMEWORK",
    },
  });
  ids.homework = homework.body?.data?.homework?._id;
  await test("getAllHomework", "GET", "/api/homework/getAllHomework", { token: teacherToken });
  await test("getAllChildHomework", "GET", `/api/homework/getAllChildHomework/${ids.child}`, {
    token: parentToken,
  });
  await test("getHomeworkById", "GET", `/api/homework/getHomeworkById/${ids.homework}`, {
    token: teacherToken,
  });
  await test("updateHomework", "POST", `/api/homework/updateHomework/${ids.homework}`, {
    token: teacherToken,
    json: { description: "Read chapters 1 and 2" },
  });

  const now = new Date().toISOString();
  const tCheckIn = await test("teacher markCheckIn", "POST", "/api/teacher/attendance/markCheckIn", {
    token: teacherToken,
    json: { checkIn: now },
  });
  ids.teacherAttendance = tCheckIn.body?.data?.newAttendance?._id;
  await test("teacher markCheckOut", "POST", "/api/teacher/attendance/markCheckOut", {
    token: teacherToken,
    json: { checkOut: now },
  });
  await test("teacher getAllMyAttendance", "GET", "/api/teacher/attendance/getAllMyAttendance", {
    token: teacherToken,
  });
  await test("teacher getAttendanceByMonth", "GET", "/api/teacher/attendance/getAttendanceByMonth", {
    token: teacherToken,
    query: { month: "8", year: "2026" },
  });
  await test(
    "teacher getMonthlyAttendanceStats",
    "GET",
    "/api/teacher/attendance/getMonthlyAttendanceStats",
    { token: teacherToken, query: { month: "8", year: "2026" } }
  );
  if (ids.teacherAttendance) {
    await test(
      "teacher getAttendanceById",
      "GET",
      `/api/teacher/attendance/getAttendanceById/${ids.teacherAttendance}`,
      { token: teacherToken }
    );
  }
  await test("teacher markLeave", "POST", "/api/teacher/attendance/markLeave", {
    token: teacherToken,
    json: {
      leaveFrom: new Date(Date.now() + 86400000).toISOString(),
      leaveTo: new Date(Date.now() + 2 * 86400000).toISOString(),
      leaveType: "CASUAL",
      leaveReason: "Family event",
    },
  });

  const cCheckIn = await test("child markCheckIn", "POST", "/api/children/attendance/markCheckIn", {
    token: teacherToken,
    json: { checkIn: now, children: ids.child },
  });
  ids.childAttendance = cCheckIn.body?.data?.newAttendance?._id;
  await test("child markLeave", "POST", "/api/children/attendance/markLeave", {
    token: teacherToken,
    json: { checkIn: now, children: ids.child, leaveReason: "Sick" },
  });
  await test(
    "getAllChildAttendance",
    "GET",
    `/api/children/attendance/getAllChildAttendance/${ids.child}`,
    { token: parentToken }
  );
  await test(
    "getAttendanceByMonth child",
    "GET",
    `/api/children/attendance/getAttendanceByMonth/${ids.child}`,
    { token: teacherToken, query: { month: "8", year: "2026" } }
  );
  await test(
    "getMonthlyAttendanceStats child",
    "GET",
    `/api/children/attendance/getMonthlyAttendanceStats/${ids.child}`,
    { token: teacherToken }
  );
  if (ids.childAttendance) {
    await test(
      "child getAttendanceById",
      "GET",
      `/api/children/attendance/getAttendanceById/${ids.childAttendance}`,
      { token: teacherToken }
    );
  }

  await test("teacher auth reset code", "POST", "/api/teacher/auth/emailVerificationCode", {
    json: { email: teacherEmail },
  });
  await test("teacher verify recover invalid", "POST", "/api/teacher/auth/verifyRecoverCode", {
    json: { email: teacherEmail, code: "1111" },
    expectFail: true,
    expectStatus: 400,
  });
  await test("teacher reset password invalid", "POST", "/api/teacher/auth/resetPassword", {
    json: {
      email: teacherEmail,
      password: PASSWORD,
      confirmPassword: PASSWORD,
      code: "1111",
    },
    expectFail: true,
    expectStatus: 400,
  });

  await test("parent changePassword", "POST", "/api/profile/changePassword", {
    token: parentToken,
    json: {
      old_password: PASSWORD,
      new_password: "ApiTest@12345B",
      confirmPassword: "ApiTest@12345B",
    },
  });
  await test("parent signin after password change", "POST", "/api/auth/signin", {
    json: { email: parentEmail, password: "ApiTest@12345B" },
  });
  await test("teacher changePassword", "POST", "/api/teacher/profile/changePassword", {
    token: teacherToken,
    json: {
      old_password: PASSWORD,
      new_password: "ApiTest@12345B",
      confirmPassword: "ApiTest@12345B",
    },
  });

  await test("deleteHomework", "GET", `/api/homework/deleteHomework/${ids.homework}`, {
    token: teacherToken,
  });
  await test("deletePost", "GET", `/api/post/deletePost/${ids.post}`, { token: teacherToken });
  await test("deleteActivity", "GET", `/api/activity/deleteActivity/${ids.activity}`, {
    token: teacherToken,
  });
  await test("deleteHoliday", "POST", `/api/holiday/deleteHoliday/${ids.holiday}`, {
    token: adminToken,
  });
  await test("deleteTimetable", "GET", `/api/timetable/deleteTimetable/${ids.timetable}`, {
    token: adminToken,
  });
  await test("deleteVoucher", "GET", `/api/fees/deleteVoucher/${ids.fee}`, { token: adminToken });
  await test("deleteInventory", "GET", `/api/inventory/deleteInventory/${ids.inventory}`, {
    token: adminToken,
  });
  await test("deleteCategory", "GET", `/api/category/deleteCategory/${ids.category}`, {
    token: adminToken,
  });
  await test("deleteChild", "GET", `/api/admin/children/deleteChild/${ids.child}`, {
    token: adminToken,
  });
  await test("deleteTeacher", "GET", `/api/admin/teacher/deleteTeacher/${ids.teacher}`, {
    token: adminToken,
  });
  await test("deleteClassroom", "GET", `/api/classroom/deleteClassroom/${ids.classroom}`, {
    token: adminToken,
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log("\n========== SUMMARY ==========");
  console.log(`Total: ${results.length}  Passed: ${passed}  Failed: ${failed.length}`);
  if (failed.length) {
    console.log("\nFailed tests:");
    failed.forEach((f) => console.log(` - ${f.method} ${f.url} | ${f.name} | ${f.detail}`));
  }
  fs.writeFileSync(
    path.join(__dirname, "api-test-results.json"),
    JSON.stringify({ passed, failed: failed.length, results, ids }, null, 2)
  );

  await mongoose.disconnect();
  process.exit(failed.length ? 1 : 0);
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
