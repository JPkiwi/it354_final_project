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

// EDIT Tutor Hours modal elements
const editTutorModal = document.getElementById("editTutorModal");
const openEditTutorModal = document.getElementById("openEditTutorModal");
const closeEditTutorModal = document.getElementById("closeEditTutorModal");

// open Edit Tutor Hours modal
openEditTutorModal.addEventListener("click", function () {
    const selectedRadio = document.querySelector('input[name="selectedTutor"]:checked');
    if (!selectedRadio) {
        alert("Please select a tutor first.");
        return;
    }
    const row = selectedRadio.closest('tr');

    // parses the tutor's active courses they're teaching
    const tutorCourses = JSON.parse(row.dataset.courses);
    
    // selects the attribute fields and populates them with the current data
    document.querySelector('#editTutorModal input[name="fname"]').value = row.dataset.fname;
    document.querySelector('#editTutorModal input[name="lname"]').value = row.dataset.lname;
    document.querySelector('#editTutorModal input[name="email"]').value = row.dataset.email;
    document.querySelector('#editTutorModal input[name="tutorId"]').value = row.dataset.id;
    document.querySelector('#editTutorModal input[name="isActive"]').value = row.dataset.isActive;

    // checks the boxes for the courses the tutor is currently assigned to
    document.querySelectorAll('#editTutorModal input[name="tutorCourses"]').forEach(checkbox => {
      checkbox.checked = tutorCourses.includes(checkbox.value);
    });

  editTutorModal.style.display = "block";
});

// close Edit Tutor Hours modal when X is clicked
closeEditTutorModal.addEventListener("click", function () {
  editTutorModal.style.display = "none";
});

// close Edit Tutor Hours modal if user clicks outside modal content
window.addEventListener("click", function (event) {
  if (event.target === editTutorModal) {
    editTutorModal.style.display = "none";
  }
});


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



