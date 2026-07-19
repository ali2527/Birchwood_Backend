const express = require("express")
const router = express.Router()
const { addChildValidator } = require("../../../Validator/childValidator")
const {uploadFile} = require("../../../Middlewares/upload")
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const { addParent,searchStudents, getAllParent, getParentById,resetParentPassword, updateParent, deleteParent,toggleStatus} = require("../../../Controllers/Admin/adminParentController");
const { addParentValidator,resetPasswordValidator } = require("../../../Validator/parentValidator");


router.post("/addParent",uploadFile, authenticatedRoute, addParentValidator, addParent);
router.get("/searchStudents", authenticatedRoute, searchStudents);
router.get("/getAllParent", authenticatedRoute, getAllParent);
router.get("/getParentById/:id", authenticatedRoute, getParentById);
router.post("/updateParent/:id",uploadFile, authenticatedRoute, updateParent);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteParent/:id", authenticatedRoute, deleteParent);
router.post("/resetParentPassword/:id",adminRoute,resetPasswordValidator,resetParentPassword)

module.exports = router