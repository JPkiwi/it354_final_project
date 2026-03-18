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
