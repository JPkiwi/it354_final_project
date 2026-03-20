// ADMIN - Manage Tutors page 

const search = document.getElementById("search");

search.addEventListener("input", () => {
  const q = search.value.toLowerCase();

  document.querySelectorAll("#tutorRows tr").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q)
      ? ""
      : "none";
  });
});





// retrieving the addTutorModal box & open/close buttons
const addTutorModal = document.getElementById("addTutorModal");
const openAddTutorModal = document.getElementById("openAddTutorModal");
const closeAddTutorModal = document.getElementById("closeAddTutorModal");
// opening (display) the modal when clicking on "Add Tutor"
openAddTutorModal.addEventListener("click", () => {
  addTutorModal.style.display = "block";
});
// closing ("none" for display) the modal when clicking the x 
closeAddTutorModal.addEventListener("click", () => {
  addTutorModal.style.display = "none";
});
// when click on addTutorModal (NOT the content box), display gets set 
// to none (when clicking anywhere outside of content box)
window.addEventListener("click", (event) => {
  if (event.target === addTutorModal) {
    addTutorModal.style.display = "none";
  }
});

const viewScheduleForm = document.getElementById("viewScheduleForm");
const selectedTutorInput = document.getElementById("selectedTutorInput");

if (viewScheduleForm) {
  viewScheduleForm.addEventListener("submit", (event) => {
    const selectedRadio = document.querySelector('input[name="selectedTutor"]:checked');
    if (!selectedRadio) {
      event.preventDefault();
      alert("Please select a tutor first.");
      return;
    }

    if (selectedTutorInput) {
      selectedTutorInput.value = selectedRadio.value;
    }
  });
}


// Assign Tutor Hours modal elements
const assignTutorModal = document.getElementById("assignTutorModal");
const openAssignTutorModal = document.getElementById("openAssignTutorModal");
const closeAssignTutorModal = document.getElementById("closeAssignTutorModal");

// open Assign Tutor Hours modal
openAssignTutorModal.addEventListener("click", function () {
  assignTutorModal.style.display = "block";
});

// close Assign Tutor Hours modal when X is clicked
closeAssignTutorModal.addEventListener("click", function () {
  assignTutorModal.style.display = "none";
});

// close Assign Tutor Hours modal if user clicks outside modal content
window.addEventListener("click", function (event) {
  if (event.target === assignTutorModal) {
    assignTutorModal.style.display = "none";
  }
});




// CLEAR Tutor Hours modal elements
const clearTutorModal = document.getElementById("clearTutorModal");
const openClearTutorModal = document.getElementById("openClearTutorModal");
const closeClearTutorModal = document.getElementById("closeClearTutorModal");

// open Assign Tutor Hours modal
openClearTutorModal.addEventListener("click", function () {
  clearTutorModal.style.display = "block";
});

// close Assign Tutor Hours modal when X is clicked
closeClearTutorModal.addEventListener("click", function () {
 clearTutorModal.style.display = "none";
});

// close Assign Tutor Hours modal if user clicks outside modal content
window.addEventListener("click", function (event) {
  if (event.target === clearTutorModal) {
    clearTutorModal.style.display = "none";
  }
});

// log 

// attach flatpickr cal to the input
flatpickr("#shiftDate", {
  // date format to be sent to backend
  dateFormat: "Y-m-d",
  // admin can't choose past days for assigning hours
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  // disable closed weekdays 
  // (disable date if weekday is in closed list)
  disable: [
    function(date) {
      return window.closedWeekdays.includes(date.getDay());
    }
  ],
  // setting placeholder for select date box (would not work inside ejs file))
  onReady: function(selectedDates, dateStr, instance){
    instance.altInput.placeholder = "-- Select Date -- "
  }
});


// log
// reopen modal after rendering
window.addEventListener("DOMContentLoaded", () => {
  // based on controller/checking is the modal should be open or closed (true v. fals)
  if(window.openAssignTutorModal){
    document.getElementById("assignTutorModal").style.display = "block";
  }
})


