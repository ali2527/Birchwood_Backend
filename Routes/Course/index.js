const express = require("express")
const { addCourse ,getAllCourses,getAllCourseByCategory,getAllCoachCourses ,getCourseById , updateCourse ,deleteCourse,getMyCourses} = require("../../Controllers/Course");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {uploadMultiple, uploadFile} = require("../../Middlewares/upload")
const {addCourseValidator} = require("../../Validator/courseValidator")

router.post("/addCourse",authenticatedRoute,uploadFile,addCourseValidator, addCourse);
router.get("/getAllCourses",getAllCourses);
router.get("/getAllCoachCourses/:id",getAllCoachCourses);   
router.get("/getMyCourses",authenticatedRoute,getMyCourses);
router.get("/getAllCourseByCategory/:category",authenticatedRoute,getAllCourseByCategory);
router.get("/getCourseById/:id",getCourseById);
router.post("/updateCourse/:id",authenticatedRoute,uploadFile,updateCourse);
router.get("/deleteCourse/:id",authenticatedRoute,deleteCourse);

module.exports = router