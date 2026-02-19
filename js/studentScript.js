// display schedule info when the day button is clicked
const dayBtn = document.getElementById("dayBtn");
const daySchedule = document.getElementById("daySchedule");
const scheduleDisplay = window.getComputedStyle(daySchedule);
dayBtn.addEventListener("click", function() {   
    if (scheduleDisplay.display === "none") {
        daySchedule.style.display = "block";
    } else {
        daySchedule.style.display = "none";
    }
});

// display appointment booking form when the time button is clicked
const scheduleBtn = document.getElementById("time");
const scheduleSection = document.getElementById("scheduleInfo"); 
const bookAppointmentSection = document.createElement('div');
scheduleBtn.addEventListener("click", function() {
    bookAppointmentSection.innerHTML = `
        <p>Appointment Confirmation</p>
        <form id="bookAppointmentForm">
            <label for="appointmentDate">Date: 12</label><br>
            <label for="appointmentTime">Time: 11:00</label><br>
            <button id="bookAppointmentBtn" type="submit">Book Appointment</button>
        </form>
    `;
    scheduleSection.appendChild(bookAppointmentSection);
});
