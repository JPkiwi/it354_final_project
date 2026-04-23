// function to re-format time from military time to 12-hour format

function formatTo12Hour(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "No time";

  const [hourStr, minute] = timeStr.split(":");
  let hour = parseInt(hourStr, 10);

  if (isNaN(hour)) return "No time";

  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${ampm}`;
}

module.exports = { formatTo12Hour };