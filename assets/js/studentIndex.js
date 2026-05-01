// SEARCH
// Search entire row text
const search = document.getElementById("search");

search.addEventListener("input", () => {
  const q = search.value.toLowerCase();

  document.querySelectorAll("#studentRows tr").forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

const openBtn = document.getElementById("openAddStudentModal");
const modal = document.getElementById("addStudentModal");
const closeBtn = document.getElementById("closeAddStudentModal");

// ADD STUDENT
// Open the modal when the "Add User" button is clicked
// sidenote, will change to "Add Student" for separate page views
openBtn.addEventListener("click", () => {
  modal.style.display = "block";
});

// Close the modal when the X button is clicked
closeBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// Also^^^ close modal if user clicks outside of the modal box
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

// EDIT STUDENT
// Edit Student modal elements
const editStudentModal = document.getElementById("editStudentModal");
const openEditStudentModal = document.getElementById("openEditStudentModal");
const closeEditStudentModal = document.getElementById("closeEditStudentModal");

// open Edit Student modal
openEditStudentModal.addEventListener("click", function () {
  const selectedRadio = document.querySelector(
    'input[name="selectedStudent"]:checked',
  );
  if (!selectedRadio) {
    alert("Please select a student first.");
    return;
  }
  const row = selectedRadio.closest("tr");

  // selects the attribute fields and populates them with the current data
  document.querySelector('#editStudentModal input[name="fname"]').value =
    row.dataset.fname;
  document.querySelector('#editStudentModal input[name="lname"]').value =
    row.dataset.lname;
  document.querySelector('#editStudentModal input[name="email"]').value =
    row.dataset.email;
  document.querySelector('#editStudentModal input[name="userId"]').value =
    row.dataset.id;
  document.querySelector('#editStudentModal input[name="isActive"]').value =
    row.dataset.isactive;

  editStudentModal.style.display = "block";
});

// close Edit Student modal when X is clicked
closeEditStudentModal.addEventListener("click", function () {
  editStudentModal.style.display = "none";
});

// close Edit Student modal if user clicks outside modal content
window.addEventListener("click", function (event) {
  if (event.target === editStudentModal) {
    editStudentModal.style.display = "none";
  }
});


// sorting students by last name (a-z or z-a)
const lNameSort = document.getElementById("lNameSort");
const studentRows = document.getElementById("studentRows");

lNameSort.addEventListener("change", function () {
  const rows = Array.from(studentRows.querySelectorAll("tr"));

  rows.sort((a, b) => {
    const lastNameA = a.dataset.lname.toLowerCase();
    const lastNameB = b.dataset.lname.toLowerCase();

    if (this.value === "az") {
      return lastNameA.localeCompare(lastNameB);
    }
    if (this.value === "za") {
      return lastNameB.localeCompare(lastNameA);
    }

    return 0;
  });

  rows.forEach(row => studentRows.appendChild(row));
});


// sort by students status (active vs. inactive)
const statusSort = document.getElementById("statusSort");

statusSort.addEventListener("change", function () {
  const rows = Array.from(studentRows.querySelectorAll("tr"));

  rows.forEach(row => {
    const isActive = row.dataset.isactive === "true";

    if (this.value === "activeOnly") {
      row.style.display = isActive ? "" : "none";
    } 
    else if (this.value === "inactiveOnly") {
      row.style.display = !isActive ? "" : "none";
    } 
    else {
      // show all
      row.style.display = "";
    }
  });
});

// EMAIL REGEX
// email must be an ilstu.edu address
const emailRegex = /^[^\s@]+@ilstu\.edu$/;

// Validates email is @ilstu.edu email
function validateForm(emailId) {
  const email = document.getElementById(emailId).value;
  const errorSpan = document.getElementById(emailId + "Error");
  let valid = true;

  if (!emailRegex.test(email)) {
    errorSpan.innerText = "Please enter a valid @ilstu.edu email address.";
    valid = false;
  } else {
    errorSpan.innerText = "";
  }

  const modal = document.getElementById(emailId === "addEmail" ? "addStudentModal" : "editStudentModal");

  const passwordInput = modal.querySelector('input[name="password"]');
  const passwordError = modal.querySelector("#passwordError");

  if (passwordInput) {
    const password = passwordInput.value;

    if (emailId === "addEmail" && password.length === 0) {
      passwordError.innerText = "Password is required.";
      valid = false;
    } else if (password !== "" && password.length < 8) {
      passwordError.innerText = "Password must be at least 8 characters long.";
      valid = false;
    } else {
      passwordError.innerText = "";
    }
  }

  return valid;
}
