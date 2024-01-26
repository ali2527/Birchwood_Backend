const express = require("express")
const {getAllUpcomingLessons,getLessonsByMonth,getAllCompletedLessons,getAllPendingLessons,getAllLiveLessons,getAllRejectedLessons,getAllMissedLessons,getLessonById,deleteLesson } = require("../../../Controllers/Admin/adminLessonController")
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../../Middlewares/auth")
const {uploadFile} = require("../../../Middlewares/upload")


router.get("/getLessonsByMonth",authenticatedRoute,getLessonsByMonth)
router.get("/getAllUpcomingLessons",authenticatedRoute,getAllUpcomingLessons);
router.get("/getAllCompletedLessons",authenticatedRoute,getAllCompletedLessons);
router.get("/getAllPendingLessons",authenticatedRoute,getAllPendingLessons);
router.get("/getAllLiveLessons",authenticatedRoute,getAllLiveLessons);
router.get("/getAllRejectedLessons",authenticatedRoute,getAllRejectedLessons);
router.get("/getAllMissedLessons",authenticatedRoute,getAllMissedLessons);
router.get("/getLessonById/:id",authenticatedRoute,getLessonById);
router.get("/deleteLesson/:id",authenticatedRoute,deleteLesson);



module.exports = router