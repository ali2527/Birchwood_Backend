const express = require("express")
const { addClassroom ,getAllClassrooms,getClassroomById,updateClassroom ,deleteClassroom} = require("../../Controllers/Classroom");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {uploadMultiple, uploadFile} = require("../../Middlewares/upload")
const {addClassroomValidator} = require("../../Validator/classValidator")

router.post("/addClassroom",authenticatedRoute,addClassroomValidator, addClassroom);
router.get("/getAllClassrooms",authenticatedRoute,getAllClassrooms);
router.get("/getClassroomById/:id",authenticatedRoute,getClassroomById);   
router.post("/updateClassroom/:id",authenticatedRoute,updateClassroom);
router.get("/deleteClassroom/:id",authenticatedRoute,deleteClassroom);

module.exports = router