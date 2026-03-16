// const CenterOpen = require("../model/centerOpenSchedule");

// async function seedOpenSchedule() {
//   try{
//   const existingMonday = await CenterOpen.findOne({ weekday: "Monday" });

//   if (!existingMonday) {
//     await CenterOpen.insertMany([
//       // This is modeled directly off of this site https://itk.ilstu.edu/it168/html/Debugging%20Schedule.html 
//       // for tutoring hours; Mon/Wed open 1pm-7pm  |  Tue/Thur/Fri open 11am-6pm
//       // build of baseline 
//       { weekday: "Monday", isClosed: false, openTime: "13:00", closeTime: "19:00" },
//       { weekday: "Tuesday", isClosed: false, openTime: "11:00", closeTime: "18:00" },
//       { weekday: "Wednesday", isClosed: false, openTime: "13:00", closeTime: "19:00" },
//       { weekday: "Thursday", isClosed: false, openTime: "11:00", closeTime: "18:00" },
//       { weekday: "Friday", isClosed: false, openTime: "11:00", closeTime: "18:00" },
//       { weekday: "Saturday", isClosed: true },
//       { weekday: "Sunday", isClosed: true }
//     ]);

//     console.log("Default center hours inserted.");
//   } else {
//     console.log("Center hours already exist.");
//   }
// } // end of try
//  catch(err){
//       console.error("Error seeding center hours:", err.message);
// }
// } // end of seedOpenSchedule func

// module.exports = seedOpenSchedule;