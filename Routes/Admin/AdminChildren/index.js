const express = require("express")
const {addChild,getAllChildren,getChildById,getChildrenByClassroom,updateChild,toggleStatus,deleteChild} = require("../../../Controllers/Admin/adminChildrenController")
const router = express.Router()
const { addChildValidator } = require("../../../Validator/childValidator")
const {uploadFile} = require("../../../Middlewares/upload")
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")


router.post("/addChild",uploadFile,authenticatedRoute,addChildValidator, addChild);
router.get("/getAllChildren",authenticatedRoute, getAllChildren);
router.get("/getChildById/:id",authenticatedRoute, getChildById);
router.get("/getChildrenByClassroom/:id",authenticatedRoute, getChildrenByClassroom);
router.post("/updateChild",uploadFile,authenticatedRoute, updateChild);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteChild/:id", authenticatedRoute, deleteChild);

module.exports = router