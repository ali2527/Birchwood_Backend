const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "Uploads");

const IMAGES = [
  ["Reading", "https://stories.freepiklabs.com/storage/56884/Reading-Book_Mesa-de-trabajo-1.svg"],
  ["Sleeping", "https://stories.freepiklabs.com/storage/54831/Sleeping-Baby_Mesa-de-trabajo-1.svg"],
  ["Playing", "https://stories.freepiklabs.com/storage/14796/Kids-playing-with-dolls_Mesa-de-trabajo-1.svg"],
  ["Eating", "https://stories.freepiklabs.com/storage/2292/9-Eating-Together_Mesa-de-trabajo-1.svg"],
  ["Snack Time", "https://stories.freepiklabs.com/storage/61922/Eat-Breakfast_Mesa-de-trabajo-1.svg"],
  ["Outdoor Play", "https://stories.freepiklabs.com/storage/43302/Recess_Mesa-de-trabajo-1.svg"],
  ["Arts & Crafts", "https://stories.freepiklabs.com/storage/8111/Making-Art_Mesa-de-trabajo-1.svg"],
  ["Music", "https://stories.freepiklabs.com/storage/2174/Music_Mesa-de-trabajo-1.svg"],
  ["Learning", "https://stories.freepiklabs.com/storage/33617/Learning_Mesa-de-trabajo-1.svg"],
  ["Bath Time", "https://stories.freepiklabs.com/storage/15671/At-the-Bathroom_Mesa-de-trabajo-1.svg"],
  ["Sports & Exercise", "https://stories.freepiklabs.com/storage/54698/Running_Mesa-de-trabajo-1.svg"],
  ["Water Play", "https://stories.freepiklabs.com/storage/12018/Children-playing-in-the-pool_Mesa-de-trabajo-1.svg"],
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadImage(url, filename) {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const dest = path.join(UPLOAD_DIR, filename);
  const res = await fetch(url, {
    headers: { "User-Agent": "BirchwoodSeedScript/1.0 (activity illustration seeder)" },
  });
  if (!res.ok) throw new Error(`Could not download ${url} (${res.status})`);
  await fs.promises.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

(async () => {
  for (const [title, url] of IMAGES) {
    const filename = `seed-activity-${slugify(title)}.svg`;
    const dest = await downloadImage(url, filename);
    console.log(`Saved ${title} -> ${dest}`);
  }
})();
