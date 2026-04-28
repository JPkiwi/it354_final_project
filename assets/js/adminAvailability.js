const editHoursButton = document.getElementById("editHoursButton");
const editHoursForm = document.getElementById("changeHoursForm");
const submitHoursButton = document.getElementById("submitHoursButton");
const centerOpenTimeInput = document.getElementById("centerOpenTime");
const centerCloseTimeInput = document.getElementById("centerCloseTime");
const closeWeekdayDropdown = document.getElementById("closeWeekdayDropdown");

// When editHours button is clicked 
// *updated to keep other forms closed when "Edit Center Hours" is clicked
if (editHoursButton && editHoursForm) {
  editHoursButton.addEventListener("click", () => {
    const isOpen = editHoursForm.style.display === "block";

    closeAllAvailabilityForms();

    if (!isOpen) {
      editHoursForm.style.display = "block";
    }
  });
}

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

// keeping all forms closed (to start/when opening AdminAvailability page)
function closeAllAvailabilityForms() {
  if (editHoursForm) editHoursForm.style.display = "none";
  if (blackoutDateForm) blackoutDateForm.style.display = "none";
  if (exceptionForm) exceptionForm.style.display = "none";
  if (removeExceptionsForm) removeExceptionsForm.style.display = "none";
}



// for "Blackout Date" functionality ------------

const editBlackoutButton = document.getElementById("editBlackoutButton");
const blackoutDateForm = document.getElementById("blackoutDateForm");

// displaying/hiding the blackout date feature based on if button is clicked
// updated to keep one form open (blackout date) at a time
if (editBlackoutButton && blackoutDateForm) {
  editBlackoutButton.addEventListener("click", () => {
    const isOpen = blackoutDateForm.style.display === "block";

    closeAllAvailabilityForms();

    if (!isOpen) {
      blackoutDateForm.style.display = "block";
    }
  });
}


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
    instance.altInput.classList.add("datePickerInput");
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
    instance.altInput.classList.add("datePickerInput");

  }
});


// opening (displaying) the "Add Exception" form based on click action 
const editExceptionButton = document.getElementById("editExceptionButton");
const exceptionForm = document.getElementById("exceptionForm");

// if exception is open, only keep that 1 form open 
if (editExceptionButton && exceptionForm) {
  editExceptionButton.addEventListener("click", () => {
    const isOpen = exceptionForm.style.display === "block";

    closeAllAvailabilityForms();

    if (!isOpen) {
      exceptionForm.style.display = "block";
    }
  });
}

// forcing :00 for times (exceptions need to be hr on the dot for appointment/assignTutorHours validation to work)
const exceptionStartTime = document.getElementById("exceptionStartTime");
const exceptionEndTime = document.getElementById("exceptionEndTime");

// forcing start time to end in :00
if (exceptionStartTime) {
  exceptionStartTime.addEventListener("change", () => {
    if (exceptionStartTime.value) {
      const startSplit = exceptionStartTime.value.split(":");
      exceptionStartTime.value = `${startSplit[0]}:00`;
    }
  });
}
// forcing end time to end in :00
if (exceptionEndTime) {
  exceptionEndTime.addEventListener("change", () => {
    if (exceptionEndTime.value) {
      const endSplit = exceptionEndTime.value.split(":");
      exceptionEndTime.value = `${endSplit[0]}:00`;
    }
  });
}

// flatpickr for "add exception" 
flatpickr("#exceptionDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  onReady: function (selectedDates, dateStr, instance) {
    instance.altInput.placeholder = "-- Select Date --";
    instance.altInput.classList.add("datePickerInput");

  }
});




const removeExceptionsButton = document.getElementById("removeExceptionsButton");
const removeExceptionsForm = document.getElementById("removeExceptionsForm");

// open/close form
if (removeExceptionsButton && removeExceptionsForm) {
  removeExceptionsButton.addEventListener("click", () => {
    const isOpen = removeExceptionsForm.style.display === "block";

    closeAllAvailabilityForms();

    if (!isOpen) {
      removeExceptionsForm.style.display = "block";
    }
  });
}

// hide on submit
if (removeExceptionsForm) {
  removeExceptionsForm.addEventListener("submit", () => {
    removeExceptionsForm.style.display = "none";
  });
}


// attach flatpickr cal to removeExceptionDate input
flatpickr("#removeExceptionDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  onReady: function(selectedDates, dateStr, instance){
    instance.altInput.placeholder = "-- Select Date -- ";
    instance.altInput.classList.add("datePickerInput");

  }
});
