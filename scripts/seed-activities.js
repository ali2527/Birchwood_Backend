require("../config/loadEnv");
const {
  ACTIVITY_IMAGES,
  backendImageName,
  copySvg,
} = require("./sync-activity-images");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Activity = require("../Models/Activity");

const UPLOAD_DIR = path.join(__dirname, "..", "Uploads");

const LEGACY_TITLES = [
  "Outdoor Play",
  "Arts & Crafts",
  "Sports & Exercise",
  "Water Play",
  "Sports Day",
  "Art Exhibition",
  "Science Fair",
  "Music Recital",
  "Book Week",
  "Museum Field Trip",
  "Swimming Carnival",
  "Coding Club Showcase",
  "Earth Day Cleanup",
  "Parent-Teacher Week",
  "Drama Club Rehearsal",
  "Garden Club Planting",
];

async function seedActivities() {
  if (!process.env.DB) {
    throw new Error("DB is not set in .env");
  }

  await mongoose.connect(process.env.DB);

  const titles = [...ACTIVITY_IMAGES.map((item) => item.title), ...LEGACY_TITLES];
  const removed = await Activity.deleteMany({ title: { $in: titles } });
  if (removed.deletedCount) {
    console.log(`Removed ${removed.deletedCount} previously seeded activities.`);
  }

  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

  for (const item of ACTIVITY_IMAGES) {
    const imageName = backendImageName(item.title);
    try {
      await copySvg(item.file, imageName);
      console.log(`Illustration saved: ${imageName}`);
    } catch (error) {
      console.log(`Illustration skipped for ${item.title}: ${error.message}`);
    }

    await Activity.create({
      title: item.title,
      description: item.description,
      image: imageName,
      status: "ACTIVE",
    });
    console.log(`Created ${item.title} (ACTIVE)`);
  }

  console.log(`Seeded ${ACTIVITY_IMAGES.length} post categories from frontend SVGs.`);
  await mongoose.disconnect();
}

seedActivities().catch((error) => {
  console.error("Failed to seed activities:", error.message);
  process.exit(1);
});
