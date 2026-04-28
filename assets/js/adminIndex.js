// variables (html element id)
//search input box 
const search = document.getElementById("search");
//table rows
const rows = document.getElementById("rows");

// Cancel button
const cancelBtn = document.getElementById("cancelBtn");
const confirmCancelModal = document.getElementById("confirmCancelModal");
const confirmInput = document.getElementById("confirmAppointmentId");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");


// Sortation of students names when they are added to appt
// Sorts from A to Z (Will be more organized)
function sortAppointments(){
  // get all rows from table
  const allRows = Array.from(rows.querySelectorAll("tr"));

// sorting all rows (comparing 2 at time)
allRows.sort((a, b) => {
  // store all table data in cells
    const cellsA = a.querySelectorAll("td");
    const cellsB = b.querySelectorAll("td");

    // [3] for student name
    const nameA = cellsA[3].textContent.toLowerCase();
    const nameB = cellsB[3].textContent.toLowerCase();
    // sortation
    return nameA.localeCompare(nameB);
  });

// adding all rows back in table (now sorted)
    allRows.forEach(row => rows.appendChild(row));

}


// Search (filtering for entire row) -> event listener/every time someone searches
search.addEventListener("input", () => {
  // case insensitive
  const q = search.value.toLowerCase();
  // searching all table rows
  document.querySelectorAll("#rows tr").forEach(row => {
    // match, then default display --> otherwise none 
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});


// cancel button function
cancelBtn.addEventListener("click", () => {
  // get selected radio button
  const selected = document.querySelector('input[name="selectedAppointment"]:checked');

  if (!selected) {
    alert("Please select an appointment to cancel.");
    return;
  }

  // set hidden input value
  confirmInput.value = selected.value;

  // show modal
  confirmCancelModal.style.display = "block";
});

// close modal
closeConfirmBtn.addEventListener("click", () => {
  confirmCancelModal.style.display = "none";
});

// optional: click outside modal closes it
confirmCancelModal.addEventListener("click", (e) => {
  if (e.target === confirmCancelModal) {
    confirmCancelModal.style.display = "none";
  }
});


// notification button modal function

 const notifBtn = document.getElementById("notifs");
  const modal = document.getElementById("notificationsModal");
  const closeBtn = document.getElementById("closeNotificationsBtn");
// display modal when "Notifications" button is clicked
if (notifBtn && modal && closeBtn){
  notifBtn.onclick = function () {
    modal.style.display = "flex";
  };
// close modal when close button is clicked
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // if anywhere outside of modal is clicked, modal closes
  window.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
}); 
} // end of if (notifBtn && modal && closeBtn)

if (rows) {
  sortAppointments();
}

