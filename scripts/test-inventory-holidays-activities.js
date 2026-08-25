/**
 * Admin API tests for Inventory, Holidays, and Activities.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");

const BASE = `http://localhost:${process.env.PORT || 3031}`;
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
const UPLOAD_DIR = path.join(__dirname, "..", "Uploads");
const stamp = Date.now();

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

function pngForm(fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  form.append("gallery", new Blob([PNG], { type: "image/png" }), `test-${stamp}.png`);
  return form;
}

function activityForm(fields = {}) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, String(value));
  });
  form.append("image", new Blob([PNG], { type: "image/png" }), `activity-${stamp}.png`);
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

  // Category needed for inventory
  const category = await test("add category", "POST", "/api/category/addCategory", {
    token,
    json: { title: `Test Cat ${stamp}`, description: "For inventory tests" },
  });
  const categoryId = category.body?.data?.category?._id;
  record("category id returned", Boolean(categoryId), categoryId || "missing");
  if (!categoryId) return finish();

  const invTitle = `Test Item ${stamp}`;
  const createInv = await test("add inventory", "POST", "/api/inventory/addInventory", {
    token,
    formData: pngForm({
      title: invTitle,
      description: "API test inventory item",
      quantity: "10",
      category: categoryId,
      manufacturer: "Birchwood",
      unitPrice: "25",
      notes: "Test notes",
    }),
  });
  const inventoryId = createInv.body?.data?.inventory?._id;
  record("inventory id returned", Boolean(inventoryId), inventoryId || "missing");

  await test("list inventory", "GET", "/api/inventory/getAllInventorys", {
    token,
    query: { page: 1, limit: 20, keyword: invTitle },
  });
  await test("list inventory by category", "GET", "/api/inventory/getAllInventorys", {
    token,
    query: { page: 1, limit: 20, category: categoryId },
  });

  if (inventoryId) {
    await test("get inventory by id", "GET", `/api/inventory/getInventoryById/${inventoryId}`, { token });
    await test("get inventory by category", "GET", `/api/inventory/getInventoryByCategory/${categoryId}`, {
      token,
    });
    await test("update inventory", "POST", `/api/inventory/updateInventory/${inventoryId}`, {
      token,
      formData: pngForm({
        title: invTitle,
        description: "Updated description",
        quantity: "12",
        category: categoryId,
        unitPrice: "30",
      }),
    });
    await test("toggle inventory status", "GET", `/api/inventory/toggleStatus/${inventoryId}`, { token });
  }

  const holidayName = `Test Holiday ${stamp}`;
  const createHoliday = await test("add holiday", "POST", "/api/holiday/addHoliday", {
    token,
    json: { name: holidayName, date: "2026-12-25" },
  });
  const holidayId = createHoliday.body?.data?.newHoliday?._id;
  record("holiday id returned", Boolean(holidayId), holidayId || "missing");

  const holidays = await test("list holidays", "GET", "/api/holiday/getAllHolidays", { token });
  const holidayCount = holidays.body?.data?.holidays?.length || 0;
  record("holidays list not empty", holidayCount > 0, `${holidayCount} holidays`);

  if (holidayId) {
    await test("update holiday", "POST", `/api/holiday/updateHoliday/${holidayId}`, {
      token,
      json: { name: `${holidayName} Updated`, date: "2026-12-26" },
    });
  }

  const activityTitle = `Test Activity ${stamp}`;
  const createActivity = await test("add activity", "POST", "/api/activity/addActivity", {
    token,
    formData: activityForm({ title: activityTitle, description: "Sports day prep" }),
  });
  const activityId = createActivity.body?.data?.activity?._id;
  record("activity id returned", Boolean(activityId), activityId || "missing");

  await test("list activities", "GET", "/api/activity/getAllActivities", {
    token,
    query: { page: 1, limit: 20, keyword: activityTitle },
  });

  await test("add activity missing image rejected", "POST", "/api/activity/addActivity", {
    token,
    expectFail: true,
    formData: (() => {
      const form = new FormData();
      form.append("title", `No Image ${stamp}`);
      form.append("description", "Should fail");
      return form;
    })(),
  });

  if (activityId) {
    await test("get activity by id", "GET", `/api/activity/getActivityById/${activityId}`, { token });
    await test("update activity", "POST", `/api/activity/updateActivity/${activityId}`, {
      token,
      formData: activityForm({ title: activityTitle, description: "Updated activity", status: "ACTIVE" }),
    });
    await test("toggle activity inactive", "POST", `/api/activity/updateActivity/${activityId}`, {
      token,
      formData: activityForm({ title: activityTitle, description: "Inactive", status: "INACTIVE" }),
    });
  }

  if (activityId) {
    await test("delete activity", "GET", `/api/activity/deleteActivity/${activityId}`, { token });
  }
  if (holidayId) {
    await test("delete holiday", "POST", `/api/holiday/deleteHoliday/${holidayId}`, { token });
  }
  if (inventoryId) {
    await test("delete inventory", "GET", `/api/inventory/deleteInventory/${inventoryId}`, { token });
  }
  await test("delete category", "GET", `/api/category/deleteCategory/${categoryId}`, { token });

  finish();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
