const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
const UPLOAD_DIR = path.join(__dirname, "..", "Uploads");

const TEST_ROLL = "S900001";

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

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
    record(name, ok, `${res.status} ${res.body?.message || ""}`.trim());
    return { ...res, ok };
  } catch (error) {
    record(name, false, error.message);
    return { status: 0, body: {}, ok: false };
  }
}

function buildForm(fields, imagePath) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  if (imagePath) {
    const buffer = fs.readFileSync(imagePath);
    form.append("image", new Blob([buffer], { type: "image/jpeg" }), path.basename(imagePath));
  }
  return form;
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
  if (!token) return finish();

  const list = await test("list students", "GET", "/api/admin/children/getAllChildren", {
    token,
    query: { page: 1, limit: 30 },
  });
  const seededCount = list.body?.data?.docs?.length || 0;
  record("seeded students visible", seededCount >= 20, `${seededCount} students`);

  const sample = list.body?.data?.docs?.[0];
  record("student image stored locally", Boolean(sample?.image && !String(sample.image).startsWith("http")), sample?.image || "none");

  await test("add student missing photo rejected", "POST", "/api/admin/children/addChild", {
    token,
    expectFail: true,
    formData: buildForm({
      rollNumber: "S900002",
      firstName: "Test",
      lastName: "Student",
      term: "2026",
      birthday: "2018-05-01",
      age: 8,
    }),
  });

  await test("add student missing roll number rejected", "POST", "/api/admin/children/addChild", {
    token,
    expectFail: true,
    formData: buildForm(
      {
        firstName: "Test",
        lastName: "Student",
        term: "2026",
        birthday: "2018-05-01",
        age: 8,
      },
      path.join(UPLOAD_DIR, sample?.image || "seed-student-aiden-brooks.jpg")
    ),
  });

  const imageFile = path.join(UPLOAD_DIR, sample?.image || "seed-student-aiden-brooks.jpg");
  const create = await test("add student via API", "POST", "/api/admin/children/addChild", {
    token,
    formData: buildForm(
      {
        rollNumber: TEST_ROLL,
        firstName: "Api",
        lastName: "Tester",
        term: "2026",
        birthday: "2017-04-12",
        age: 9,
        summary: JSON.stringify(["Created by API test"]),
      },
      imageFile
    ),
  });
  const createdId = create.body?.data?.child?._id;
  record("created student id returned", Boolean(createdId), createdId || "missing");

  if (createdId) {
    const detail = await test("get student by id", "GET", `/api/admin/children/getChildById/${createdId}`, { token });
    record("detail has local image filename", Boolean(detail.body?.data?.child?.image), detail.body?.data?.child?.image || "");

    const classrooms = await test("list classes for assignment", "GET", "/api/classroom/getAllClassrooms", {
      token,
      query: { page: 1, limit: 5 },
    });
    const room = classrooms.body?.data?.docs?.[0];
    if (room?._id) {
      await test("assign class from DB", "POST", `/api/admin/children/updateChild/${createdId}`, {
        token,
        formData: buildForm({
          rollNumber: TEST_ROLL,
          firstName: "Api",
          lastName: "Tester",
          term: "2026",
          birthday: "2017-04-12",
          age: 9,
          classroom: room._id,
          summary: JSON.stringify(["Assigned to class"]),
        }),
      });
      const afterClass = await request("GET", `/api/admin/children/getChildById/${createdId}`, { token });
      record(
        "class assignment persisted",
        afterClass.body?.data?.child?.classroom?.classroomName === room.classroomName,
        afterClass.body?.data?.child?.classroom?.classroomName || "none"
      );

      await test("clear class assignment", "POST", `/api/admin/children/updateChild/${createdId}`, {
        token,
        formData: buildForm({
          rollNumber: TEST_ROLL,
          firstName: "Api",
          lastName: "Tester",
          term: "2026",
          birthday: "2017-04-12",
          age: 9,
          classroom: "",
          summary: JSON.stringify(["Class cleared"]),
        }),
      });
    }

    await test("invalid class id rejected", "POST", `/api/admin/children/updateChild/${createdId}`, {
      token,
      expectFail: true,
      formData: buildForm({
        rollNumber: TEST_ROLL,
        firstName: "Api",
        lastName: "Tester",
        term: "2026",
        birthday: "2017-04-12",
        age: 9,
        classroom: "000000000000000000000000",
      }),
    });

    await test("delete test student", "GET", `/api/admin/children/deleteChild/${createdId}`, { token });
  }

  finish();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
