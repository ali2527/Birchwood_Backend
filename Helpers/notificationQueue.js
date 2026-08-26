const jobs = [];
let processing = false;

async function drainQueue() {
  if (processing) return;
  processing = true;

  while (jobs.length) {
    const job = jobs.shift();
    try {
      await job();
    } catch (error) {
      console.error("Notification queue job failed:", error.message);
    }
  }

  processing = false;
}

function enqueueNotificationJob(job) {
  jobs.push(job);
  setImmediate(drainQueue);
}

module.exports = {
  enqueueNotificationJob,
};
