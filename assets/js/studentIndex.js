
    // Search entire row text
    const search = document.getElementById("search");

    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();

      document.querySelectorAll("#tutorRows tr").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q)
          ? ""
          : "none";
      });
    });






const toggleActiveBtn = document.getElementById("toggleActiveBtn");

toggleActiveBtn.addEventListener("click", () => {

  const checkedRows = Array.from(document.querySelectorAll("#tutorRows tr"))
    .filter(tr => tr.querySelector(".rowCheck")?.checked);

  // If nothing selected
  if (checkedRows.length === 0) {
    alert("Please select at least one student to toggle active status.");
    return;
  }

  // Confirmation popup
  const ok = confirm(
    `Are you sure you want to toggle the active status for ${checkedRows.length} student(s)?`
  );

  if (!ok) return; // if they click Cancel, stop here

  // Toggle Yes <-> No
  checkedRows.forEach(tr => {
    const cells = tr.querySelectorAll("td");
    const activeCell = cells[4];

    const current = activeCell.textContent.trim().toLowerCase();

    activeCell.textContent = (current === "yes") ? "No" : "Yes";

    // optional: uncheck after toggling
    tr.querySelector(".rowCheck").checked = false;
  });
});
