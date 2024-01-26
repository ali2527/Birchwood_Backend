const express = require("express")
const { addLesson,createLessonSignature,getAllLessons,getAllPendingLessons,getAllUpcomingLessons,getAllLiveLessons,getAllCompletedLessons,getAllRejectedLessons,getAllMissedLessons,getLessonById,updateLesson,deleteLesson} = require("../../Controllers/Lesson");
const router = express.Router()
const { authenticatedRoute,adminRoute } = require("../../Middlewares/auth")
const {addLessonValidator} = require("../../Validator/lessonValidator")

router.post("/addLesson",authenticatedRoute,addLessonValidator, addLesson);
router.get("/getAllLessons", authenticatedRoute,getAllLessons);
router.get("/getAllPendingLessons", authenticatedRoute,getAllPendingLessons);
router.get("/getAllUpcomingLessons", authenticatedRoute,getAllUpcomingLessons);
router.get("/getAllLiveLessons", authenticatedRoute,getAllLiveLessons);
router.get("/getAllCompletedLessons", authenticatedRoute,getAllCompletedLessons);
router.get("/getAllRejectedLessons", authenticatedRoute,getAllRejectedLessons);
router.get("/getAllMissedLessons", authenticatedRoute,getAllMissedLessons);
router.get("/getLessonById/:id", authenticatedRoute,getLessonById);
router.post("/updateLesson/:id", authenticatedRoute,updateLesson);
router.post("/deleteLesson/:id", authenticatedRoute,deleteLesson);
router.post("/createLessonSignature", authenticatedRoute,createLessonSignature);


module.exports = router