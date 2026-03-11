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