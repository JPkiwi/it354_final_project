const editHoursButton = document.getElementById("editHoursButton");
const editHoursForm = document.getElementById("changeHoursForm");
const submitHoursButton = document.getElementById("submitHoursButton");

// When editHours button is clicked
editHoursButton.addEventListener("click", () => {
  // form hidden, show -> otherwise, default non-display
  editHoursForm.style.display = (editHoursForm.style.display === "none") ? "block" : "none";
});

// When submitHours button is clicked
submitHoursButton.addEventListener("click", () => {
  // form hidden, show -> otherwise, default non-display
  editHoursForm.style.display = (editHoursForm.style.display === "none") ? "block" : "none";
});
