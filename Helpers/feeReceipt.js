const Fees = require("../Models/Fees");

const SCHOOL_CODE = "BW";
const VOUCHER_TYPE = "FEE";
const SEQUENCE_LENGTH = 6;

function billingPeriod(month, year) {
  const mm = String(Number(month)).padStart(2, "0");
  const yyyy = String(Number(year));
  return { mm, yyyy, yyyymm: `${yyyy}${mm}` };
}

function receiptPrefix(month, year) {
  const { yyyymm } = billingPeriod(month, year);
  return `${SCHOOL_CODE}-${VOUCHER_TYPE}-${yyyymm}-`;
}

function extractSequence(receiptNo, month, year) {
  if (!receiptNo) return null;
  const value = String(receiptNo).trim().toUpperCase();
  const { mm, yyyy, yyyymm } = billingPeriod(month, year);

  const current = value.match(new RegExp(`^BW-FEE-${yyyymm}-(\\d+)$`));
  if (current) return parseInt(current[1], 10);

  const legacy = value.match(new RegExp(`^BW-${yyyy}-${mm}-(\\d+)$`));
  if (legacy) return parseInt(legacy[1], 10);

  return null;
}

async function generateFeeReceiptNo(month, year) {
  const billingMonth = Number(month);
  const billingYear = Number(year);

  if (!billingMonth || billingMonth < 1 || billingMonth > 12 || !billingYear) {
    throw new Error("Valid month and year are required to generate a receipt number");
  }

  const { mm, yyyy, yyyymm } = billingPeriod(billingMonth, billingYear);

  const candidates = await Fees.find({
    $or: [
      { receiptNo: new RegExp(`^BW-FEE-${yyyymm}-`) },
      { receiptNo: new RegExp(`^BW-${yyyy}-${mm}-`) },
    ],
  })
    .select("receiptNo")
    .lean();

  let sequence = 0;
  for (const item of candidates) {
    const parsed = extractSequence(item.receiptNo, billingMonth, billingYear);
    if (parsed && parsed > sequence) sequence = parsed;
  }

  return `${receiptPrefix(billingMonth, billingYear)}${String(sequence + 1).padStart(
    SEQUENCE_LENGTH,
    "0"
  )}`;
}

module.exports = {
  SCHOOL_CODE,
  VOUCHER_TYPE,
  receiptPrefix,
  generateFeeReceiptNo,
  extractSequence,
};
