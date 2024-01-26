const express = require("express")
const { getAdmin,updateAdmin,toggleParentStatus,toggleChildStatus,toggleTeacherStatus } = require("../../../Controllers/Admin/adminUserController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")

router.get("/",authenticatedRoute,getAdmin);
router.post("/updateAdmin/:id",authenticatedRoute,uploadFile,updateAdmin);
router.get("/toggleParentStatus/:id",authenticatedRoute,toggleParentStatus);
router.get("/toggleChildStatus/:id",authenticatedRoute,toggleChildStatus);
router.get("/toggleTeacherStatus/:id",authenticatedRoute,toggleTeacherStatus);

module.exports = router