const express = require('express')
const router = express.Router() 


//student routes
router.use('/auth', require('./Parent/Auth'))
router.use('/profile',require("./Parent/Profile"))


//Teacher routes
router.use('/teacher/auth', require('./Teacher/TeacherAuth'))
router.use('/teacher/profile',require("./Teacher/TeacherProfile"))

// //inventory routes
// router.use('/inventory', require('./Inventory'))


// //chat routes
// router.use('/chat', require('./Chat'))


// //query routes
// router.use('/query', require('./Query'))


// //services route
// router.use('/service', require('./Service'))

// //comission routes
// router.use('/comission', require('./Comission'))

// //schedule routes
// router.use('/schedule', require('./Schedule'))

// //rates routes
// router.use('/rates', require('./Rates'))

// //lesson routes
// router.use('/lesson', require('./Lesson'))

// //lecture routes
// router.use('/lecture', require('./Lecture'))

// //course routes
// router.use('/course', require('./Course'))

// //payment routes
// router.use('/payment', require('./Payment'))


// // //category routes
// router.use('/category', require('./Category'))

// // //quiz routes
// router.use('/quiz', require('./Quiz'))


// // //message routes
// router.use('/message', require('./Message'))

// // //message routes
// router.use('/notification', require('./Notification'))

//admin routes
// router.use('/admin/auth', require('./Admin/AdminAuth'))
// router.use('/admin/user', require('./Admin/AdminUser'))
router.use('/admin/teacher', require('./Admin/AdminTeacher'))

// router.use('/admin/lesson', require('./Admin/AdminLesson'))



module.exports = router;