//Models
const Parent = require("../../Models/Parent");
const Children = require("../../Models/Children");
const Teacher = require("../../Models/Teacher");
const Payment = require("../../Models/Payment");
const Rate = require("../../Models/Rates");
const Schedule = require("../../Models/Schedule")
const Review = require("../../Models/Review")
const mongoose = require("mongoose");

//Helpers
const { generateToken } = require("../../Helpers/index");
const { ApiResponse } = require("../../Helpers/index");
const { validateToken } = require("../../Helpers/index");
const { generateString } = require("../../Helpers/index");
const { errorHandler } = require("../../Helpers/errorHandler");
const { sendNotificationToAdmin } = require("../../Helpers/notification");
const  sanitizeUser = require("../../Helpers/sanitizeUser");
const fs = require("fs");


//get user
exports.getAdmin = async (req, res) => {
  try {
    let parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.json(ApiResponse({}, "No admin found", false));
    }

    return res
      .status(200)
      .json(ApiResponse(sanitizeUser(parent), "Found Admin Details", true));
  } catch (error) {
    return res.status(500).json(ApiResponse({}, error.message,false));
  }
};

exports.updateAdmin = async (req, res) => {
  try {

      if (req.body.image) {
        let currentAdmin = await Parent.findById(req.params.id);
        
        if (currentAdmin.image) {
          const filePath = `./Uploads/${currentAdmin.image}`;
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File '${filePath}' deleted.`);
          } else {
            console.log(`File '${filePath}' does not exist.`);
          }
        }
      }


    let admin = await Admin.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!admin) {
      return res.json(ApiResponse({}, "No admin found", false));
    }
    return res.json(ApiResponse(admin, "Admin updated successfully"));
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleParentStatus = async (req, res) => {
  try {
    
    let parent = await Parent.findById(req.params.id);


      parent.status = parent.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await parent.save();     

      return res.json(ApiResponse(parent, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleChildStatus = async (req, res) => {
  try {
    
    let child = await Children.findById(req.params.id);


      child.status = child.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await child.save();     

      return res.json(ApiResponse(child, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};

exports.toggleTeacherStatus = async (req, res) => {
  try {
    
    let teacher = await Teacher.findById(req.params.id);


      teacher.status = teacher.status == "ACTIVE" ? "INACTIVE" : "ACTIVE"
      await teacher.save();     

      return res.json(ApiResponse(teacher, "Account Status Changed"));
  
  } catch (error) {
    return res.json(ApiResponse({}, error.message, false));
  }
};


// //get Counts
// exports.getCounts = async (req, res) => {
//   try {
//     const studentCount = await User.countDocuments({ isAdmin: false });
//     const tutorCount = await Coach.countDocuments({ });
//     const lessonCount = await Lesson.countDocuments();
//     const totalEarnings = await Payment.aggregate([
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$amount' },
//         },
//       },
//     ])

//     console.log(totalEarnings)
  
//     await res
//       .status(201)
//       .json(ApiResponse({ studentCount,
//         tutorCount,
//         lessonCount,
//         totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0}, "Dashboard Counts", true));
//   } catch (err) {
//     res.status(500).json(ApiResponse({}, err.toString(), false));
//   }
// };


// exports.getChartData = async (req, res) => {
//   try {
//     // Calculate the start date for the past 12 months
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

//     // Aggregate payments for the past 12 months
//     const monthlyPayments = await Payment.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: twelveMonthsAgo, $lte: new Date() }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%Y-%m", date: "$createdAt" }
//           },
//           total: { $sum: "$amount" }
//         }
//       }
//     ]);

//     // Create arrays for labels and data
//     const labels = [];
//     const data = [];

//     // Populate arrays with data from the aggregation result
//     monthlyPayments.forEach(item => {
//       labels.push(item._id);
//       data.push(item.total);
//     });

//     // Send the response
//     res.json(ApiResponse({
//       labels,
//       datasets: [{
//         label: "Total Earnings",
//         data,
//         fill: true,
//         backgroundColor: 'rgba(124, 192, 89, 0.4)',
//         borderColor: '#7cc059',
//         pointRadius: 0,
//       }]
//     }, "", true));
//   } catch (err) {
//     res.status(500).json({ error: err.toString() });
//   }
// };

// exports.getEarningChart = async (req, res) => {
//   try {
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

//     const donationsByMonth = await Payment.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: twelveMonthsAgo },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: '%Y-%m',
//               date: '$createdAt',
//             },
//           },
//           amount: { $sum: '$amount'},
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { _id: 1 },
//       },
//     ]);

//     // Create a map with months as keys and donations as values
//     const donationsMap = new Map();
//     donationsByMonth.forEach((entry) => {
//       donationsMap.set(entry._id, { amount: entry.amount, count: entry.count });
//     });

//     // Generate an array with 0 for months without donations
//     const today = new Date();
//     const thisYear = today.getFullYear();
//     const thisMonth = today.getMonth() + 2; // Months are zero-based

//     const monthsArray = [];
//     for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
//       const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
//       const monthKey = targetMonth.toISOString().slice(0, 7);
//       const donationEntry = donationsMap.get(monthKey) || { amount: 0, count: 0 };
//       monthsArray.push({
//         month: monthKey,
//         amount: donationEntry.amount,
//         count: donationEntry.count,
//       });
//     }

//  return res.json(ApiResponse(monthsArray.reverse(),"",true));
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };

// exports.getLessonChart = async (req, res) => {
//   try {
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

//     const donationsByMonth = await Lesson.aggregate([
//       {
//         $match: {
//           lessonDate: { $gte: twelveMonthsAgo },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: '%Y-%m',
//               date: '$lessonDate',
//             },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { _id: 1 },
//       },
//     ]);

//     // Create a map with months as keys and donations as values
//     const donationsMap = new Map();
//     donationsByMonth.forEach((entry) => {
//       donationsMap.set(entry._id, { amount: entry.amount, count: entry.count });
//     });

//     // Generate an array with 0 for months without donations
//     const today = new Date();
//     const thisYear = today.getFullYear();
//     const thisMonth = today.getMonth() + 2; // Months are zero-based

//     const monthsArray = [];
//     for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
//       const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
//       const monthKey = targetMonth.toISOString().slice(0, 7);
//       const donationEntry = donationsMap.get(monthKey) || { amount: 0, count: 0 };
//       monthsArray.push({
//         month: monthKey,
//         count: donationEntry.count,
//       });
//     }

//  return res.json(ApiResponse(monthsArray.reverse(),"",true));
//   } catch (error) {
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };


// exports.getLearnersChart = async (req, res) => {
//   try {
//     const twelveMonthsAgo = new Date();
//     twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);
  
//     const usersByMonth = await User.aggregate([
//       {
//         $match: {
//           isAdmin: false,
//         },
//       },
//       {
//         $match: {
//           createdAt: { $gte: twelveMonthsAgo },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: {
//               format: '%Y-%m',
//               date: '$createdAt',
//             },
//           },
//           count: { $sum: 1 },
//         },
//       },
//       {
//         $sort: { _id: 1 },
//       },
//     ]);
  
//     // Create a map with months as keys and user counts as values
//     const usersMap = new Map();
//     usersByMonth.forEach((entry) => {
//       usersMap.set(entry._id, entry.count);
//     });
  
//     // Generate an array with 0 for months without user registrations
//     const today = new Date();
//     const thisYear = today.getFullYear();
//     const thisMonth = today.getMonth() + 1; // Months are zero-based
  
//     const monthsArray = [];
//     for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
//       const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
//       const monthKey = targetMonth.toISOString().slice(0, 7);
//       const userCount = usersMap.get(monthKey) || 0;
//       monthsArray.push({
//         month: monthKey,
//         count: userCount,
//       });
//     }
  
//     monthsArray.reverse(); // Reverse the array
  
//     return res.json(ApiResponse(monthsArray, '', true));
//   } catch (error) {
//     console.error('Error:', error);
//     return res.json(ApiResponse({}, error.message, false));
//   }
// };

// exports.getTutorAndCoachChart = async (req, res) => {
// try {
//   const twelveMonthsAgo = new Date();
//   twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

//   const coachesByMonth = await Coach.aggregate([
//     {
//       $match: {
//         createdAt: { $gte: twelveMonthsAgo },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           $dateToString: {
//             format: '%Y-%m',
//             date: '$createdAt',
//           },
//         },
//         tutorCount: {
//           $sum: {
//             $cond: {
//               if: { $or: [
//                 { $eq: ['$applicationType', 'TUTORING'] },
//                 { $eq: ['$applicationType', 'BOTH'] },
//               ], },
//               then: 1,
//               else: 0,
//             },
//           },
//         },
//         coachCount: {
//           $sum: {
//             $cond: {
//               if: { $or: [
//                 { $eq: ['$applicationType', 'COACH'] },
//                 { $eq: ['$applicationType', 'BOTH'] },
//               ] },
//               then: 1,
//               else: 0,
//             },
//           },
//         },
//         bothCount: {
//           $sum: {
//             $cond: {
//               if: { $eq: ['$applicationType', 'BOTH'] },
//               then: 1,
//               else: 0,
//             },
//           },
//         },
//       },
//     },
//     {
//       $sort: { _id: 1 },
//     },
//   ]);

//   // Create a map with months as keys and coach counts as values
//   const coachesMap = new Map();
//   coachesByMonth.forEach((entry) => {
//     coachesMap.set(entry._id, {
//       tutorCount: entry.tutorCount,
//       coachCount: entry.coachCount,
//       bothCount: entry.bothCount,
//     });
//   });

//   // Generate an array with counts for tutors, coaches, and both for months without coach registrations
//   const today = new Date();
//   const thisYear = today.getFullYear();
//   const thisMonth = today.getMonth() + 1; // Months are zero-based

//   const monthsArray = [];
//   for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
//     const targetMonth = new Date(thisYear, thisMonth - monthOffset - 1, 1);
//     const monthKey = targetMonth.toISOString().slice(0, 7);
//     const coachCounts = coachesMap.get(monthKey) || {
//       tutorCount: 0,
//       coachCount: 0,
//       bothCount: 0,
//     };
//     monthsArray.push({
//       month: monthKey,
//       tutorCount: coachCounts.tutorCount,
//       coachCount: coachCounts.coachCount,
//       bothCount: coachCounts.bothCount,
//     });
//   }

//   monthsArray.reverse(); // Reverse the array

//   return res.json(ApiResponse(monthsArray, '', true));
// } catch (error) {
//   console.error('Error:', error);
//   return res.json(ApiResponse({}, error.message, false));
// }
// };



