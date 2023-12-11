const express = require("express")
const { getAdmin,toggleStatus,getAllTutorAndCoaches,getCounts,getTutorAndCoachChart,getLearnersChart ,getAllStudents,getAllCoaches,getEarningChart,deleteStudent,deleteTutor,getAllTutors,getStudentById,getLessonChart,getCoachById,updateStudent,updateCoach,getChartData } = require("../../../Controllers/Admin/adminUserController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")

router.get("/",authenticatedRoute,getAdmin);
router.get("/getAllStudents",authenticatedRoute,getAllStudents);
router.get("/getCounts",authenticatedRoute,getCounts);

router.get("/getLessonChart",authenticatedRoute,getLessonChart);

router.get("/getLearnersChart",authenticatedRoute,getLearnersChart);
router.get("/getTutorAndCoachChart",authenticatedRoute,getTutorAndCoachChart);


router.get("/getEarningChart",authenticatedRoute,getEarningChart);
router.get("/getChartData",authenticatedRoute,getChartData);


router.get("/getAllCoaches",getAllCoaches);
router.get("/getAllTutors",getAllTutors);
router.get("/getAllTutorAndCoaches",authenticatedRoute,getAllTutorAndCoaches)
router.get("/getStudentById/:id",authenticatedRoute,getStudentById);
router.get("/getCoachById/:id",getCoachById);
router.get("/toggleStatus/:id",toggleStatus);
router.post("/updateStudent/:id",authenticatedRoute,uploadFile,updateStudent);
router.post("/updateCoach/:id",authenticatedRoute,uploadFile,updateCoach);
router.get("/deleteStudent/:id",authenticatedRoute,deleteStudent);
router.get("/deleteTutor/:id",authenticatedRoute,deleteTutor);



module.exports = router