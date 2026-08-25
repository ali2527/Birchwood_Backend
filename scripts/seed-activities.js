require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Activity = require("../Models/Activity");

const UPLOAD_DIR = path.join(__dirname, "..", "Uploads");

// Isometric Amico SVG illustrations from Storyset (https://storyset.com) — same visual style.
// License: https://storyset.com/terms (attribution to Storyset recommended).
const ACTIVITIES = [
  {
    title: "Reading",
    description: "Posts about story time, quiet reading, or children exploring books.",
    imageUrl: "https://stories.freepiklabs.com/storage/56884/Reading-Book_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Sleeping",
    description: "Posts about nap time, rest, or settling down for sleep.",
    imageUrl: "https://stories.freepiklabs.com/storage/54831/Sleeping-Baby_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Playing",
    description: "Posts about free play, toys, games, and imaginative activities.",
    imageUrl: "https://stories.freepiklabs.com/storage/14796/Kids-playing-with-dolls_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Eating",
    description: "Posts about lunch, dinner, or mealtime with classmates.",
    imageUrl: "https://stories.freepiklabs.com/storage/2292/9-Eating-Together_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Snack Time",
    description: "Posts about morning snacks, fruit breaks, or light bites.",
    imageUrl: "https://stories.freepiklabs.com/storage/61922/Eat-Breakfast_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Outdoor Play",
    description: "Posts about recess, playground time, and playing outside.",
    imageUrl: "https://stories.freepiklabs.com/storage/43302/Recess_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Arts & Crafts",
    description: "Posts about painting, drawing, and creative classroom projects.",
    imageUrl: "https://stories.freepiklabs.com/storage/8111/Making-Art_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Music",
    description: "Posts about singing, instruments, rhythm, and music sessions.",
    imageUrl: "https://stories.freepiklabs.com/storage/2174/Music_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Learning",
    description: "Posts about lessons, worksheets, and classroom learning moments.",
    imageUrl: "https://stories.freepiklabs.com/storage/33617/Learning_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Bath Time",
    description: "Posts about washing up, hygiene routines, or bathroom activities.",
    imageUrl: "https://stories.freepiklabs.com/storage/15671/At-the-Bathroom_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Sports & Exercise",
    description: "Posts about running, sports drills, and active movement.",
    imageUrl: "https://stories.freepiklabs.com/storage/54698/Running_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
  {
    title: "Water Play",
    description: "Posts about swimming, splash play, or pool activities.",
    imageUrl: "https://stories.freepiklabs.com/storage/12018/Children-playing-in-the-pool_Mesa-de-trabajo-1.svg",
    status: "ACTIVE",
  },
];

const LEGACY_TITLES = [
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

async function downloadImage(url, filename) {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const dest = path.join(UPLOAD_DIR, filename);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "BirchwoodSeedScript/1.0 (activity illustration seeder)",
    },
  });
  if (!res.ok) {
    throw new Error(`Could not download ${url} (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(dest, buffer);
  return filename;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedActivities() {
  if (!process.env.DB) {
    throw new Error("DB is not set in .env");
  }

  await mongoose.connect(process.env.DB);

  const titles = [...ACTIVITIES.map((item) => item.title), ...LEGACY_TITLES];
  const removed = await Activity.deleteMany({ title: { $in: titles } });
  if (removed.deletedCount) {
    console.log(`Removed ${removed.deletedCount} previously seeded activities.`);
  }

  for (const item of ACTIVITIES) {
    const imageName = `seed-activity-${slugify(item.title)}.svg`;
    try {
      await downloadImage(item.imageUrl, imageName);
      console.log(`Illustration saved: ${imageName}`);
    } catch (error) {
      console.log(`Illustration skipped for ${item.title}: ${error.message}`);
    }

    await Activity.create({
      title: item.title,
      description: item.description,
      image: imageName,
      status: item.status,
    });
    console.log(`Created ${item.title} (${item.status})`);
  }

  console.log(`Seeded ${ACTIVITIES.length} post categories with illustrations in Uploads/.`);
  await mongoose.disconnect();
}

seedActivities().catch((error) => {
  console.error("Failed to seed activities:", error.message);
  process.exit(1);
});
