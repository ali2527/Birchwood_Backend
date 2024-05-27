const express = require('express')
const router = express.Router() 


//parent routes
router.use('/auth', require('./Parent/Auth'))
router.use('/profile',require("./Parent/Profile"))


//Teacher routes
router.use('/teacher/auth', require('./Teacher/TeacherAuth'))
router.use('/teacher/profile',require("./Teacher/TeacherProfile"))
router.use('/teacher/attendance',require("./Teacher/TeacherAttendance"))

//activity routes
router.use('/activity', require('./Activity'))


//chat routes
router.use('/classroom', require('./Classroom'))


//Children routes
router.use('/children',require("./Children/ChildrenProfile"))
router.use('/children/attendance',require("./Children/ChildrenAttendance"))

//post routes
router.use('/post', require('./Post'))


//inventory route
router.use('/inventory',require('./Inventory'))

//fee route
router.use('/fees',require('./Fees'))

//fee route
router.use('/timetable',require('./Timetable'))

//category routes
router.use('/category', require('./Category'))

//holiday routes
router.use('/holiday', require('./Holidays'))

//holiday routes
router.use('/homework', require('./Homework'))



// //chat routes
router.use('/chat', require('./Chat'))


// //message routes
router.use('/message', require('./Message'))

// // //message routes
// router.use('/notification', require('./Notification'))

//admin routes
// router.use('/admin/auth', require('./Admin/AdminAuth'))
router.use('/admin/teacher', require('./Admin/AdminTeacher'))
router.use('/admin/children', require('./Admin/AdminChildren'))

// router.use('/admin/lesson', require('./Admin/AdminLesson'))



module.exports = router;