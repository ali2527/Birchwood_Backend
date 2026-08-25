const Parent = require("../Models/Parent");

async function syncChildParentAssignment(childId, nextParentId, previousParentId) {
  const childKey = String(childId);
  const prev = previousParentId ? String(previousParentId) : null;
  const next = nextParentId ? String(nextParentId) : null;

  if (prev && prev !== next) {
    await Parent.findByIdAndUpdate(prev, { $pull: { childrens: childId } });
  }

  if (next) {
    await Parent.findByIdAndUpdate(next, { $addToSet: { childrens: childId } });
  }
}

module.exports = { syncChildParentAssignment };
