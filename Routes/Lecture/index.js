const express = require("express")
const { addLecture,getAllLectures ,getLectureById,getAllLecturesByCourse, updateLecture ,deleteLecture} = require("../../Controllers/Lecture");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {uploadMultiple} = require("../../Middlewares/upload")
const {addLectureValidator} = require("../../Validator/lectureValidator")

router.post("/addLecture",authenticatedRoute,uploadMultiple,addLectureValidator, addLecture);
router.get("/getAllLectures",authenticatedRoute,getAllLectures);
router.get("/getAllLecturesByCourse/:course",authenticatedRoute,getAllLecturesByCourse);
router.get("/getLectureById/:id",authenticatedRoute,getLectureById);
router.post("/updateLecture/:id",authenticatedRoute,uploadMultiple,updateLecture);
router.post("/deleteLecture/:id",authenticatedRoute,deleteLecture);

module.exports = router