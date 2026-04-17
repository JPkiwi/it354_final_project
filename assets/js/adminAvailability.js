const editHoursButton = document.getElementById("editHoursButton");
const editHoursForm = document.getElementById("changeHoursForm");
const submitHoursButton = document.getElementById("submitHoursButton");
const centerOpenTimeInput = document.getElementById("centerOpenTime");
const centerCloseTimeInput = document.getElementById("centerCloseTime");
const closeWeekdayDropdown = document.getElementById("closeWeekdayDropdown");

// When editHours button is clicked
editHoursButton.addEventListener("click", () => {
  // form hidden, show -> otherwise, default non-display
  editHoursForm.style.display = (editHoursForm.style.display === "none") ? "block" : "none";
});

// Hide form when submit occurs
editHoursForm.addEventListener("submit", () => {
  editHoursForm.style.display = "none";
});

// Input minutes change to 00 when admin enters open time
centerOpenTimeInput.addEventListener("change", () => {
  if (centerOpenTimeInput.value) {
    const openTimeSplit = centerOpenTimeInput.value.split(":");
    centerOpenTimeInput.value = `${openTimeSplit[0]}:00`;
  }
});

// Input minutes change to 00 when admin enters close time
centerCloseTimeInput.addEventListener("change", () => {
  if (centerCloseTimeInput.value) {
    const closeTimeSplit = centerCloseTimeInput.value.split(":");
    centerCloseTimeInput.value = `${closeTimeSplit[0]}:00`;
  }
});

// Open and close time cannot be entered if closeWeekdayDropdown is set to "Yes"
closeWeekdayDropdown.addEventListener("change", () => {
  if (closeWeekdayDropdown.value === "Yes") {
    centerOpenTimeInput.disabled = true;
    centerCloseTimeInput.disabled = true;
  } else {
    centerOpenTimeInput.disabled = false;
    centerCloseTimeInput.disabled = false;
  }
});



// for "Blackout Date" functionality ------------

const editBlackoutButton = document.getElementById("editBlackoutButton");
const blackoutDateForm = document.getElementById("blackoutDateForm");

// displaying/hiding the blackout date feature based on if button is clicked
if (editBlackoutButton && blackoutDateForm) {
  editBlackoutButton.addEventListener("click", () => {
    if (blackoutDateForm.style.display === "none") {
      blackoutDateForm.style.display = "block";
    } else {
      blackoutDateForm.style.display = "none";
    }
  });
}


// // flatpickr for calendar/choosing a date for blackout date 
// flatpickr("#blackoutStartDate", {
//   dateFormat: "Y-m-d",
//   minDate: "today",
//   altInput: true,
//   altFormat: "F j, Y"
// });

// flatpickr("#blackoutEndDate", {
//   dateFormat: "Y-m-d",
//   minDate: "today",
//   altInput: true,
//   altFormat: "F j, Y"
// });



// attach flatpickr cal to the input
flatpickr("#blackoutStartDate", {
  // date format to be sent to backend
  dateFormat: "Y-m-d",
  // admin can't choose past days for assigning hours
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  // disable closed weekdays 
  // (disable date if weekday is in closed list)
  // setting placeholder for select date box (would not work inside ejs file))
  onReady: function(selectedDates, dateStr, instance){
    instance.altInput.placeholder = "-- Select Start Date -- "
  }
});

// attach flatpickr cal to the input
flatpickr("#blackoutEndDate", {
  // date format to be sent to backend
  dateFormat: "Y-m-d",
  // admin can't choose past days for assigning hours
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  // disable closed weekdays 
  // (disable date if weekday is in closed list)
  
  // setting placeholder for select date box (would not work inside ejs file))
  onReady: function(selectedDates, dateStr, instance){
    instance.altInput.placeholder = "-- Select End Date -- "
  }
});


