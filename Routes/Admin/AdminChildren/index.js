const express = require("express")
const {addChild,getAllChildren,getChildById,searchParents,getChildrenByClassroom,updateChild,toggleStatus,deleteChild} = require("../../../Controllers/Admin/adminChildrenController")
const router = express.Router()
const { addChildValidator } = require("../../../Validator/childValidator")
const {uploadFile} = require("../../../Middlewares/upload")
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")


router.post("/addChild",uploadFile,authenticatedRoute,addChildValidator, addChild);
router.get("/getAllChildren",authenticatedRoute, getAllChildren);
router.get("/getChildById/:id",authenticatedRoute, getChildById);
router.get("/getChildrenByClassroom/:id",authenticatedRoute, getChildrenByClassroom);
router.post("/updateChild/:id",uploadFile,authenticatedRoute, updateChild);
router.get("/toggleStatus/:id",authenticatedRoute,toggleStatus);
router.get("/deleteChild/:id", authenticatedRoute, deleteChild);
router.get("/searchParents",authenticatedRoute,searchParents)

module.exports = router