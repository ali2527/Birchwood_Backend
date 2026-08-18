const express = require("express");
const {
  addCategory,
  getAllcategories,
  getCategoryById,
  updateCategory,
  toggleStatus,
  deleteCategory,
} = require("../../Controllers/Category");
const router = express.Router();
const { authenticatedRoute, adminRoute } = require("../../Middlewares/auth");
const { addCategoryValidator } = require("../../Validator/categoryValidator");

router.post("/addCategory", adminRoute, addCategoryValidator, addCategory);
router.get("/getAllcategories", getAllcategories);
router.get("/getCategoryById/:id", authenticatedRoute, getCategoryById);
router.post("/updateCategory/:id", adminRoute, updateCategory);
router.get("/toggleStatus/:id", adminRoute, toggleStatus);
router.get("/deleteCategory/:id", adminRoute, deleteCategory);

module.exports = router;
