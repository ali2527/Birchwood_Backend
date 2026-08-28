require("../config/loadEnv");
const mongoose = require("mongoose");
const Admin = require("../Models/Admin");
const Parent = require("../Models/Parent");

const ADMIN_EMAIL = (process.env.ADMIN_SEED_EMAIL || "admin@birchwood.local")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";

async function seedAdmin() {
  if (!process.env.DB) {
    throw new Error("DB is not set in .env");
  }

  await mongoose.connect(process.env.DB);

  const fakeParentAdmin = await Parent.findOne({ email: ADMIN_EMAIL, isAdmin: true });
  if (fakeParentAdmin) {
    await Parent.deleteOne({ _id: fakeParentAdmin._id });
    console.log(`Removed parent-table admin ${ADMIN_EMAIL}`);
  }

  let admin = await Admin.findOne({ email: ADMIN_EMAIL });
  if (admin) {
    admin.password = ADMIN_PASSWORD;
    admin.firstName = admin.firstName || "Birchwood";
    admin.lastName = admin.lastName || "Admin";
    admin.isAdmin = true;
    admin.status = "ACTIVE";
    await admin.save();
    console.log(`Updated existing admin: ${ADMIN_EMAIL}`);
  } else {
    admin = new Admin({
      firstName: "Birchwood",
      lastName: "Admin",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      isAdmin: true,
      status: "ACTIVE",
    });
    await admin.save();
    console.log(`Created admin: ${ADMIN_EMAIL}`);
  }

  console.log("Password:", ADMIN_PASSWORD);
  await mongoose.disconnect();
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed admin:", err.message);
    process.exit(1);
  });
