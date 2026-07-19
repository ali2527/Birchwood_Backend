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
const {addCategoryValidator} = require("../../Validator/categoryValidator")


router.post("/addCategory", authenticatedRoute,addCategoryValidator, addCategory);
router.get("/getAllcategories", getAllcategories);
router.get("/getCategoryById/:id", authenticatedRoute, getCategoryById);
router.post("/updateCategory/:id", authenticatedRoute, updateCategory);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteCategory/:id", authenticatedRoute, deleteCategory);


module.exports = router;
