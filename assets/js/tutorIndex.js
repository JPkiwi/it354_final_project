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