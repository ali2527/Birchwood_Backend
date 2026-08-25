/**
 * API tests for student ↔ parent ↔ class assignments.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { parseStringList } = require("../Helpers/childHealth");

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";

const MAX_CHILDREN_PER_PARENT = 2;
const MAX_STUDENTS_PER_CLASS = 2;

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

function serializeHealth(value) {
  return JSON.stringify(parseStringList(value));
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
    query: { page: 1, limit: 100 },
  });
  const students = (list.body?.data?.docs || []).filter((s) => /^S\d{6}$/.test(s.rollNumber));
  record("seeded students loaded", students.length >= 20, `${students.length} students`);

  const assigned = students.filter((s) => s.parent && s.classroom);
  record("all seeded students assigned", assigned.length === students.length, `${assigned.length}/${students.length} assigned`);

  const parentCounts = {};
  students.forEach((s) => {
    const key = s.parent?._id || s.parent;
    if (key) parentCounts[key] = (parentCounts[key] || 0) + 1;
  });
  const parentOverload = Object.values(parentCounts).some((c) => c > MAX_CHILDREN_PER_PARENT);
  record(
    `parent limit (≤${MAX_CHILDREN_PER_PARENT})`,
    !parentOverload,
    Object.values(parentCounts).join(", ") || "none"
  );

  const classCounts = {};
  students.forEach((s) => {
    const key = s.classroom?._id || s.classroom;
    if (key) classCounts[key] = (classCounts[key] || 0) + 1;
  });
  const classOverload = Object.values(classCounts).some((c) => c > MAX_STUDENTS_PER_CLASS);
  record(
    `class limit (≤${MAX_STUDENTS_PER_CLASS})`,
    !classOverload,
    `${Object.keys(classCounts).length} classes used`
  );

  const parentsRes = await test("list parents", "GET", "/api/admin/parent/getAllParent", {
    token,
    query: { page: 1, limit: 100 },
  });
  const parents = parentsRes.body?.data?.docs || [];
  const parentsWithChildren = parents.filter((p) => (p.childrens || []).length > 0);
  record("parents show linked children", parentsWithChildren.length >= 8, `${parentsWithChildren.length} parents with children`);

  if (parentsWithChildren[0]?._id) {
    const detail = await test("get parent by id", "GET", `/api/admin/parent/getParentById/${parentsWithChildren[0]._id}`, {
      token,
    });
    const childList = detail.body?.data?.parent?.childrens || [];
    record("parent detail includes children", childList.length >= 1, `${childList.length} child(ren)`);
  }

  const classroomsRes = await test("list classrooms", "GET", "/api/classroom/getAllClassrooms", {
    token,
    query: { page: 1, limit: 100 },
  });
  const classrooms = classroomsRes.body?.data?.docs || [];
  const roomWithStudents = classrooms.find((r) => classCounts[r._id] > 0);

  if (roomWithStudents?._id) {
    const byClass = await test("students by classroom", "GET", `/api/admin/children/getChildrenByClassroom/${roomWithStudents._id}`, {
      token,
      query: { page: 1, limit: 20 },
    });
    const count = byClass.body?.data?.docs?.length || 0;
    record(
      "classroom student list matches count",
      count === classCounts[roomWithStudents._id],
      `${roomWithStudents.classroomId}: ${count} students`
    );
  }

  const sample = assigned[0];
  if (sample?._id) {
    const detail = await test("get student by id", "GET", `/api/admin/children/getChildById/${sample._id}`, { token });
    const child = detail.body?.data?.child;
    record("student detail has parent", Boolean(child?.parent?._id), child?.parent?.fatherFirstName || "none");
    record("student detail has class", Boolean(child?.classroom?._id), child?.classroom?.classroomId || "none");

    const altParent = parents.find((p) => p._id !== (child.parent?._id || child.parent));
    const altClass = classrooms.find((r) => r._id !== (child.classroom?._id || child.classroom));

    if (altParent && altClass) {
      await test("reassign parent and class via API", "POST", `/api/admin/children/updateChild/${sample._id}`, {
        token,
        formData: buildForm({
          rollNumber: child.rollNumber,
          firstName: child.firstName,
          lastName: child.lastName || "",
          term: child.term,
          birthday: formatBirthday(child.birthday),
          age: child.age,
          parent: altParent._id,
          classroom: altClass._id,
          summary: serializeHealth(child.summary),
          allergies: serializeHealth(child.allergies),
          fears: serializeHealth(child.fears),
          conditions: serializeHealth(child.conditions),
        }),
      });

      const after = await request("GET", `/api/admin/children/getChildById/${sample._id}`, { token });
      record(
        "reassignment persisted",
        after.body?.data?.child?.parent?._id === altParent._id &&
          after.body?.data?.child?.classroom?._id === altClass._id,
        `${altParent.parentId} · ${altClass.classroomId}`
      );

      await test("restore original assignment", "POST", `/api/admin/children/updateChild/${sample._id}`, {
        token,
        formData: buildForm({
          rollNumber: child.rollNumber,
          firstName: child.firstName,
          lastName: child.lastName || "",
          term: child.term,
          birthday: formatBirthday(child.birthday),
          age: child.age,
          parent: child.parent._id,
          classroom: child.classroom._id,
          summary: serializeHealth(child.summary),
          allergies: serializeHealth(child.allergies),
          fears: serializeHealth(child.fears),
          conditions: serializeHealth(child.conditions),
        }),
      });
    }

    await test("invalid parent id rejected", "POST", `/api/admin/children/updateChild/${sample._id}`, {
      token,
      expectFail: true,
      formData: buildForm({
        rollNumber: child.rollNumber,
        firstName: child.firstName,
        lastName: child.lastName || "",
        term: child.term,
        birthday: formatBirthday(child.birthday),
        age: child.age,
        parent: "000000000000000000000000",
        classroom: child.classroom._id,
      }),
    });
  }

  finish();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
