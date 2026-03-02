// variables (html element id)
//search input box 
const search = document.getElementById("search");
//table rows
const rows = document.getElementById("rows");
// Add appointment button
const addBtn = document.getElementById("addBtn");
// Form 
const addForm = document.getElementById("addForm");
// Cancel button
const cancelBtn = document.getElementById("cancelBtn");
// Cancellation history button
const historyBtn = document.getElementById("historyBtn");
// Cancellation history window
const historyModal = document.getElementById("historyModal");
// X button on window
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
// Cancellation history rows
const historyRows = document.getElementById("historyRows");





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


// When add button is clicked
addBtn.addEventListener("click", () => {
  // form hidden, show -> otherwise, default non-display
  addForm.style.display = (addForm.style.display === "none") ? "block" : "none";
});


// when form is submitted
addForm.addEventListener("submit", (e) => {

  // change when we link server!! Just for currently, remove & alter 
  e.preventDefault();

  // grabbing user input
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value; 
  const student = document.getElementById("student").value;
  const tutor = document.getElementById("tutor").value;
  const course = document.getElementById("course").value;

  // create new table row
  const tr = document.createElement("tr");
  // filling row w data
  tr.innerHTML = `
    <td><input type="checkbox" class="rowCheck"></td>
    <td>${date}</td>
    <td>${time}</td>
    <td>${student}</td>
    <td>${tutor}</td>
    <td>${course}</td>
  `;
  // new row in table body
  rows.appendChild(tr);

  // sorting appointments by student name
  sortAppointments();

  // clearing input fields
  addForm.reset();
  // hide form
  addForm.style.display = "none";
});






// cancellation history (local) --> will be linked to database. Currently just local (or starting w empty array)
let cancellationHistory = JSON.parse(localStorage.getItem("cancellationHistory") || "[]");

// Saving to browser storage (remove/alter later) -> local storage storing the Strings (stringify)
function saveHistory() {
  localStorage.setItem("cancellationHistory", JSON.stringify(cancellationHistory));
}

// displaying cancellation history 
function renderHistory() {
  historyRows.innerHTML = "";
  cancellationHistory.forEach(item => {
    // creatign table row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.canceledAt}</td>
      <td>${item.date}</td>
      <td>${item.time}</td>
      <td>${item.student}</td>
      <td>${item.tutor}</td>
      <td>${item.course}</td>
    `;
    // insert table cells inside row & adding new row in table
    historyRows.appendChild(tr);
  
  });
}



// taking in table row -> logging it into cancellationHistory array
function logCancellationFromRow(tr) {
  // all elements in row
  const cells = tr.querySelectorAll("td");
  // timestamp
  const canceledAt = new Date().toLocaleString();

  // unshift, add to beginning 
  cancellationHistory.unshift({
    canceledAt,
    date: cells[1].textContent,
    time: cells[2].textContent,
    student: cells[3].textContent,
    tutor: cells[4].textContent,
    course: cells[5].textContent
  });
// calling prev function
  saveHistory();
}









// when history button is clicked, 
// renderHistory() -> rebuild history table/updates if new cancellations
historyBtn.addEventListener("click", () => {
  renderHistory();
  // make modal visible
  historyModal.style.display = "block";
});

// when X is clicked, display none/modal invisible
closeHistoryBtn.addEventListener("click", () => {
  historyModal.style.display = "none";
});

// When anywhere outside modal is clicked, modal disapears 
// e, store info 
historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) historyModal.style.display = "none";
});




// cancel button function
cancelBtn.addEventListener("click", () => {
  // find what user selects
  const checkedRows = Array.from(rows.querySelectorAll("tr"))
  // filter for checked (selected) rows
    .filter(tr => tr.querySelector(".rowCheck")?.checked);

    // if no rows are selected, sending user a mesage 
  if (checkedRows.length === 0) {
    alert("Please select at least one appointment to cancel.");
    return;
  }

  // browser popup, asking if user wants to cancel/double-check
  const ok = confirm(`Cancel ${checkedRows.length} appointment(s)? They will be saved in Cancellation History.`);
  if (!ok) return;

  // process selected rows, add to cancellationHistory (only saved in local storage) 
  checkedRows.forEach(tr => {
    logCancellationFromRow(tr);
    // remove row from table
    tr.remove();
  });
});



sortAppointments();

