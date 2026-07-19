 const express = require("express");
const {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  getAllChildVouchers,
  updateVoucher,
  toggleStatus,
  deleteVoucher,
} = require("../../Controllers/Fees");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const {createVoucherValidator} = require("../../Validator/feesValidator")


router.post("/createVoucher", authenticatedRoute,createVoucherValidator, createVoucher);
router.get("/getAllVouchers",authenticatedRoute, getAllVouchers);
router.get("/getVoucherById/:id", authenticatedRoute, getVoucherById);
router.get("/getAllChildVouchers/:id", authenticatedRoute, getAllChildVouchers);
router.post("/updateVoucher/:id", authenticatedRoute, updateVoucher);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteVoucher/:id", authenticatedRoute, deleteVoucher);


module.exports = router;
