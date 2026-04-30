// ADMIN - Manage Tutors page 

const pageDataElement = document.getElementById("page-data");
const pageData = pageDataElement ? JSON.parse(pageDataElement.textContent) : {};

const closedWeekdays = pageData.closedWeekdays || [];
const shouldOpenAssignTutorModal = pageData.shouldOpenAssignTutorModal || false;
const shouldOpenClearTutorModal = pageData.shouldOpenClearTutorModal || false;
const shouldOpenAddCourseModal = pageData.shouldOpenAddCourseModal || false;

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

// EDIT Tutor modal elements
const editTutorModal = document.getElementById("editTutorModal");
const openEditTutorModal = document.getElementById("openEditTutorModal");
const closeEditTutorModal = document.getElementById("closeEditTutorModal");

// open Edit Tutor modal
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
    document.querySelector('#editTutorModal input[name="userId"]').value = row.dataset.id;
    document.querySelector('#editTutorModal input[name="isActive"]').value = row.dataset.isactive;

    // checks the boxes for the courses the tutor is currently assigned to
    document.querySelectorAll('#editTutorModal input[name="tutorCourses"]').forEach(checkbox => {
      checkbox.checked = tutorCourses.includes(checkbox.value);
    });

  editTutorModal.style.display = "block";
});

// close Edit Tutor modal when X is clicked
closeEditTutorModal.addEventListener("click", function () {
  editTutorModal.style.display = "none";
});

// close Edit Tutor modal if user clicks outside modal content
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
      return closedWeekdays.includes(date.getDay());
    }
  ],
  // setting placeholder for select date box (would not work inside ejs file))
  onReady: function(selectedDates, dateStr, instance){
    instance.altInput.placeholder = "-- Select Date -- "
  }
});

// flatpickr for clearing shifts ("remove tutor shifts")
flatpickr("#clearShiftDate", {
  dateFormat: "Y-m-d",
  minDate: "today",
  altInput: true,
  altFormat: "F j, Y",
  disable: [
    function(date) {
      return closedWeekdays.includes(date.getDay());
    }
  ],
  onReady: function(selectedDates, dateStr, instance) {
    instance.altInput.placeholder = "-- Select Date --";
  }
});


// ADD COURSE modal elements
const addCourseModal = document.getElementById("addCourseModal");
const openAddCourseModal = document.getElementById("openAddCourseModal");
const closeAddCourseModal = document.getElementById("closeAddCourseModal");

// open modal
openAddCourseModal.addEventListener("click", () => {
  addCourseModal.style.display = "block";
});

// close when click on X
closeAddCourseModal.addEventListener("click", () => {
  addCourseModal.style.display = "none";
});

// close when click outside
window.addEventListener("click", (event) => {
  if (event.target === addCourseModal) {
    addCourseModal.style.display = "none";
  }
});


// // log
// // reopen modal after rendering
// window.addEventListener("DOMContentLoaded", () => {
//   // based on controller/checking is the modal should be open or closed (true v. fals)
//   if(window.openAssignTutorModal){
//     document.getElementById("assignTutorModal").style.display = "block";
//   }
// })

// // open CLEAR tutor modal after rendering 
// window.addEventListener("DOMContentLoaded", () => {
//   if (window.openClearTutorModal) {
//     document.getElementById("clearTutorModal").style.display = "block";
//   }
// });

//log 
// reopen modal AFTER rendering 
window.addEventListener("DOMContentLoaded", () => {
  if (shouldOpenAssignTutorModal === true) {
    assignTutorModal.style.display = "block";
  }

  if (shouldOpenClearTutorModal === true) {
    clearTutorModal.style.display = "block";
  }

  if (shouldOpenAddCourseModal === true) {
    addCourseModal.style.display = "block";
  }
});




// EMAIL REGEX
// email must be an ilstu.edu address
const emailRegex = /^[^\s@]+@ilstu\.edu$/;

// Validates email is @ilstu.edu email AND validates there's atleast one course chosen for tutor
function validateForm(emailId, modalId, courseErrorId) {
    const email = document.getElementById(emailId).value;
    const errorSpan = document.getElementById(emailId + "Error"); 
    let valid = true;

    if (!emailRegex.test(email)) {
        errorSpan.innerText = "Please enter a valid @ilstu.edu email address.";
        valid = false;
    } else {
        errorSpan.innerText = "";
    }

    if (modalId) {
        const passwordInput = document.querySelector(`#${modalId} input[name="password"]`);
        const passwordError = document.querySelector(`#${modalId} #passwordError`);

        if (passwordInput) {
            const password = passwordInput.value;

            if (modalId === "addTutorModal" && password.length === 0) {
                passwordError.innerText = "Password is required.";
                valid = false;
            } else if (password !== "" && password.length < 8) {
                passwordError.innerText = "Password must be at least 8 characters long.";
                valid = false;
            } else {
                passwordError.innerText = "";
            }
        }
    }


    // check courses if a modalId was passed in
    if (modalId) {
        const checkedCourses = document.querySelectorAll(`#${modalId} input[name="tutorCourses"]:checked`);
        if (checkedCourses.length === 0) {
            document.getElementById(courseErrorId).innerText = "Please select at least one course.";
            valid = false;
        } else {
            document.getElementById(courseErrorId).innerText = "";
        }
      }

    return valid;
}

