function parseStringList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(String).map((item) => item.trim()).filter(Boolean);
      }
    } catch {
      // legacy single string value
    }
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

module.exports = { parseStringList };
