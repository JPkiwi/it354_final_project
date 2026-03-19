// SEARCH 
// Search entire row text
const search = document.getElementById("search");

search.addEventListener("input", () => {
  const q = search.value.toLowerCase();

  document.querySelectorAll("#studentRows tr").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q)
      ? ""
      : "none";
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
    const selectedRadio = document.querySelector('input[name="selectedStudent"]:checked');
    if (!selectedRadio) {
        alert("Please select a student first.");
        return;
    }
    const row = selectedRadio.closest('tr');

    
    // selects the attribute fields and populates them with the current data
    document.querySelector('#editStudentModal input[name="fname"]').value = row.dataset.fname;
    document.querySelector('#editStudentModal input[name="lname"]').value = row.dataset.lname;
    document.querySelector('#editStudentModal input[name="email"]').value = row.dataset.email;
    document.querySelector('#editStudentModal input[name="userId"]').value = row.dataset.id;
    document.querySelector('#editStudentModal input[name="isActive"]').value = row.dataset.isactive;

  editStudentModal.style.display = "block";
});

// close Edit Student modal when X is clicked
closeEditStudentModal.addEventListener("click", function () {
  editStudentModal.style.display = "none";
});

// close Edit Student modal if user clicks outside modal content
window.addEventListener("click", function (event) {
  if (event.target === editTutorModal) {
    editTutorModal.style.display = "none";
  }
});