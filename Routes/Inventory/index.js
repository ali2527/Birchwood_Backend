const express = require("express");
const {
  addInventory,
  getAllInventorys,
  getInventoryById,
  getInventoryByCategory,
  updateInventory,
  toggleStatus,
  deleteInventory,
} = require("../../Controllers/Inventory");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { uploadProduct } = require("../../Middlewares/upload");
const { addInventoryValidator } = require("../../Validator/inventoryValidator");

router.post("/addInventory", adminRoute, uploadProduct, addInventoryValidator, addInventory);
router.get("/getAllInventorys", authenticatedRoute, getAllInventorys);
router.get("/getInventoryById/:id", authenticatedRoute, getInventoryById);
router.get("/getInventoryByCategory/:id", authenticatedRoute, getInventoryByCategory);
router.post("/updateInventory/:id", adminRoute, uploadProduct, updateInventory);
router.get("/toggleStatus/:id", adminRoute, toggleStatus);
router.get("/deleteInventory/:id", adminRoute, deleteInventory);

module.exports = router;
