/** Birchwood logo colors — same palette used in admin picker and DB enum */
const CLASSROOM_COLORS = ["PURPLE", "PINK", "BLUE", "GREEN", "ORANGE", "CORAL", "YELLOW", "ROSE"];

const DEFAULT_CLASSROOM_COLOR = "BLUE";

function isValidClassroomColor(value) {
  return CLASSROOM_COLORS.includes(value);
}

module.exports = {
  CLASSROOM_COLORS,
  DEFAULT_CLASSROOM_COLOR,
  isValidClassroomColor,
};
