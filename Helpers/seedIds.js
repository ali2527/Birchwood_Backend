/**
 * Deterministic IDs for seed scripts — same shape as generateRandom6DigitID (prefix + 6 A-Z0-9).
 */
function seedEntityId(prefix, sequence) {
  const num = Number(sequence);
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`seedEntityId sequence must be a positive integer, got ${sequence}`);
  }
  const suffix = String(num).padStart(6, "0");
  if (suffix.length > 6) {
    throw new Error(`Sequence ${num} exceeds 6 characters for prefix ${prefix}`);
  }
  return `${prefix}${suffix}`;
}

module.exports = { seedEntityId };
