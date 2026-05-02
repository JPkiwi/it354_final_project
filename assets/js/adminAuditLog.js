document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("auditSearch");
  const dropdowns = document.querySelectorAll(".actionFilter");
  const rows = document.querySelectorAll("#auditTableBody tr");


function updateDropdownStyle(dropdown) {
  if (dropdown.value === "") {
    dropdown.classList.add("is-header-selected");
  } else {
    dropdown.classList.remove("is-header-selected");
  }
}

  // update row stripes so visible rows stay consistent (whether searching or filtering, keep striped rows)
  function updateRowStripes() {
    // display only visible rows 
    const visibleRows = Array.from(rows).filter(row => row.style.display !== "none");

    visibleRows.forEach((row, index) => {
      row.classList.remove("even", "odd");

      if (index % 2 === 0) {
        row.classList.add("even");
      } else {
        row.classList.add("odd");
      }
    });
  }

  // filtering admin actions & Search function (in same func so no override of striped rows )
  // handle both search & dropdown filtering
  function filterRows() {
    const q = search.value.toLowerCase();

    const selectedFilters = Array.from(dropdowns)
    .filter(dropdown => dropdown.value !== "")
    .map(dropdown => {
        const selectedOption = dropdown.options[dropdown.selectedIndex];

        return {
        action: dropdown.value,
        role: selectedOption.dataset.roleFilter || ""
        };
    });
    rows.forEach(row => {
        // row text and action type
      const rowText = row.textContent.toLowerCase();
      const rowAction = row.dataset.action;

      // check if the row matches search
      const matchesSearch = rowText.includes(q);
      const matchesAction =
        selectedFilters.length === 0 ||
        selectedFilters.some(filter => {
            return (
            rowAction === filter.action &&
            (filter.role === "" || row.dataset.role === filter.role)
            );
        });
        // show only search match & filtered rows 
      row.style.display = matchesSearch && matchesAction ? "" : "none";
    });

    updateRowStripes();
  }

  // filterRows when typing in search
  search.addEventListener("input", filterRows);

  // filterRows when changing dropdowns
  dropdowns.forEach(dropdown => {
  updateDropdownStyle(dropdown);

  dropdown.addEventListener("change", () => {
    updateDropdownStyle(dropdown);
    filterRows();
  });
});

  // format stripes
  filterRows();
});