const CenterOpen = require("../model/centerOpenSchedule");
const CenterClosedSchedule = require("../model/centerClosedSchedule");
const CenterException = require("../model/centerException");
const Course = require("../model/courseModel");
const { DEFAULT_WEEK_HOURS, DEFAULT_COURSES } = require("../config/defaultData");
const { formatTo12Hour } = require("../services/timeService");


// GET: Get the landing page of the web application, displays dynamic weekdays
exports.getLandingPage = async (req, res) => {
  try {
    let weekdays = await updateCenterExceptions();
    let exceptionDisplay = await getExceptionDisplay(weekdays);
    let courses = await Course.find();
    const today = new Date();
    const { monday, sunday } = getWeekRange(today);

    // if there are no weekdays in MongoDB, then insert all the default week hours
    if (weekdays.length === 0) {
      await CenterOpen.insertMany(DEFAULT_WEEK_HOURS);
      weekdays = await updateCenterExceptions();
      exceptionDisplay = await getExceptionDisplay(weekdays);
    }

    // if there are no courses in MongoDB, then insert all the default courses
    // this assumes no tutors have been added yet and therefore no courses have been assigned. 
    if (courses.length === 0){
      courses = await Course.insertMany(DEFAULT_COURSES); 
    }

    res.render("index", {
      error: null,
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays,
      exceptionDisplay,
      monday: monday.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric"
      }),
      formatTo12Hour
    });
  } catch (err) {
    res.render("index", {
      error: "Could not load center hours accurately.",
      title: "ISU Learning Center",
      cssStylesheet: "index.css",
      jsFile: "index.js",
      user: req.session.user,
      weekdays: DEFAULT_WEEK_HOURS,
      exceptionDisplay: [],
      monday: "",
      formatTo12Hour
    });
  }
};

// get the week range (Monday-Sunday) for a given date, standardized to midnight to avoid timezone issues
function getWeekRange(date) {
  const currDate = new Date(date);

  const day = (currDate.getDay() + 6) % 7;

  const monday = new Date(currDate);
  monday.setDate(currDate.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

// standardize the time to midnight to avoid timezone issues
function standardizeTime(date) {
  const updatedDate = new Date(date);
  updatedDate.setHours(0, 0, 0, 0);
  return updatedDate;
}

// check if a date falls within a blackout range
function isWeeklyBlock(date, start, end) {
  const currDate = standardizeTime(date);
  const startDate = standardizeTime(start);
  const endDate = standardizeTime(end);

  return currDate >= startDate && currDate <= endDate;
}

// convert time string "HH:MM" to total minutes for easier comparison for closed ranges
function convertToMins(time) {
  const [hour, min] = time.split(":").map(Number);
  return hour * 60 + min;
}

function buildTimeBlocks(day, dayExceptions) {
  if (day.isClosed) return [];

  const blocks = [];

  let currentStart = day.openTime; 
  const closeTime = day.closeTime;

  // sort exceptions by start time
  const sortedExceptions = dayExceptions.sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  for (const expect of sortedExceptions) {
    // add open block before exception
    if (currentStart < expect.startTime) {
      blocks.push({
        start: currentStart,
        end: expect.startTime
      });
    }

    // got to next block after the exception end time
    currentStart = expect.endTime;
  }

  // add final block after last exception
  if (currentStart < closeTime) {
    blocks.push({
      start: currentStart,
      end: closeTime
    });
  }

  console.log(`Built time blocks for ${day.weekday} with exceptions:`, blocks);
  return blocks;
}

async function updateCenterExceptions() {
  const today = new Date();
  const { monday, sunday } = getWeekRange(today);

  // blackout ranges that for the current week
  const blackoutDates = await CenterClosedSchedule.find({
    startDate: { $lte: sunday },
    endDate: { $gte: monday }
  }).lean();

  // time exceptions for the current week
  const exceptions = await CenterException.find({
    exceptionDate: { $gte: monday, $lte: sunday }
  }).lean();

  // get regular center hours for the week
  const weekdays = await CenterOpen.find().lean(); // assume Mon–Sun order

  // if there is an exception for a given day, override the regular hours with the exception hours and reason
  const exceptionWeek = weekdays.map((day, index) => {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);

    const blackout = blackoutDates.find(blackoutDate =>
      isWeeklyBlock(currentDate, blackoutDate.startDate, blackoutDate.endDate)
    );

    const dayExceptions = exceptions.filter(e =>
      standardizeTime(e.exceptionDate).getTime() === standardizeTime(currentDate).getTime()
    );

    const latestException = dayExceptions.sort(
      (except1, except2) => new Date(except2.createdAt) - new Date(except1.createdAt)
    )[0];

    const hasException = latestException !== undefined;
    const hasBlackout = blackout !== undefined;

    // if both exist, compare timestamps
    if (hasException && hasBlackout) {
      if (new Date(latestException.createdAt) > new Date(blackout.createdAt)) {
        const timeBlocks = buildTimeBlocks(day, dayExceptions);

        return {
          weekday: day.weekday,
          date: currentDate,
          openTime: day.openTime,
          closeTime: day.closeTime,
          isClosed: timeBlocks.length === 0,
          reason: latestException.reason,
          timeBlocks
        };
      }

      return {
        weekday: day.weekday,
        date: currentDate,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: true,
        reason: blackout.reason,
        timeBlocks: []
      };
    }

    // only exception
    if (hasException) {
      const timeBlocks = buildTimeBlocks(day, dayExceptions);

      return {
        weekday: day.weekday,
        date: currentDate,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: timeBlocks.length === 0,
        reason: latestException.reason,
        timeBlocks
      };
    }

    // only blackout
    if (hasBlackout) {
      return {
        weekday: day.weekday,
        date: currentDate,
        openTime: day.openTime,
        closeTime: day.closeTime,
        isClosed: true,
        reason: blackout.reason,
        timeBlocks: []
      };
    }

    // normal day
    const timeBlocks = buildTimeBlocks(day, []);
    console.log(`Time blocks for ${day.weekday}:`, timeBlocks);
    return {
      weekday: day.weekday,
      date: currentDate,
      openTime: day.openTime,
      closeTime: day.closeTime,
      isClosed: day.isClosed || timeBlocks.length === 0,
      reason: "",
      timeBlocks
    };
    
  }); // end of map through weekdays

  console.log("Updated center hours with exceptions/blackouts:", exceptionWeek);
  return exceptionWeek;
}


// supply a reason why the center is closed for a given day that week
async function getExceptionDisplay(exceptionWeek) {
  const formattedDisplay = [];

  for (const day of exceptionWeek) {
    console.log(`timeBlocks=${JSON.stringify(day.timeBlocks)}`);
    if (day.reason) {
      const dateStr = new Date(day.date).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric"
      });

      // fully closed = blackout date
      if (day.isClosed) {
        formattedDisplay.push(
          `Closed all day on ${day.weekday} (${dateStr}) because of ${day.reason}`
        );
      } 
      
      // time blocks = exception. Rebuild the closed time ranges. Timeblocks represent the time ranges the center is open
      else if (day.timeBlocks.length > 0) {
        let closedRanges = [];

        // the exception coincides with the opening time of the center
        if (convertToMins(day.openTime) < convertToMins(day.timeBlocks[0].start)) {
          closedRanges.push({
            start: day.openTime,
            end: day.timeBlocks[0].start
          });
        }

        // the exception is in the middle of the day
        let prevEnd = null;
        for (const timeBlock of day.timeBlocks) {
          if (prevEnd && prevEnd < timeBlock.start) { // checks the end time of the previous time block is earlier than the start time of the current block
            closedRanges.push({
              start: prevEnd,
              end: timeBlock.start
            });
          }
          prevEnd = timeBlock.end;
        }

        // the exception coincides with the closing time of the center
        if (prevEnd && convertToMins(prevEnd) < convertToMins(day.closeTime)) {
          closedRanges.push({
            start: prevEnd,
            end: day.closeTime
          });
        }

        for (const range of closedRanges) {
          formattedDisplay.push(
            `Closed ${formatTo12Hour(range.start)} - ${formatTo12Hour(range.end)} on ${day.weekday} (${dateStr}) because of ${day.reason}`
          );
        }
      }
    }
  }

  return formattedDisplay;
}
