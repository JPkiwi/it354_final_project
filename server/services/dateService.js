// function to re-format date for better readability

function formatDate(date) {
  const d = new Date(date);
  //(+1 bc months 0-based)
  const mm = d.getMonth() + 1;   
  const dd = d.getDate();       
  const yy = String(d.getFullYear()).slice(-2); // last 2 digits
  return `${mm}/${dd}/${yy}`;
}

module.exports = { formatDate };