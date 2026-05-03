// display schedule info when the day button is clicked
// const dayBtn = document.getElementById("viewAppointments");
// const daySchedule = document.getElementById("daySchedule");
// const scheduleDisplay = window.getComputedStyle(daySchedule);
// dayBtn.addEventListener("click", function() {   
//     if (scheduleDisplay.display === "none") {
//         daySchedule.style.display = "block";
//     } else {
//         daySchedule.style.display = "none";
//     }
// });

// display appointment booking form when the time button is clicked
// const scheduleBtn = document.getElementById("time");
// const scheduleSection = document.getElementById("scheduleInfo"); 
// const bookAppointmentSection = document.createElement('div');
// scheduleBtn.addEventListener("click", function() {
//     bookAppointmentSection.innerHTML = `
//         <p>Appointment Confirmation</p>
//         <form id="bookAppointmentForm">
//             <label for="appointmentDate">Date: 12</label><br>
//             <label for="appointmentTime">Time: 11:00</label><br>
//             <button id="bookAppointmentBtn" type="submit">Book Appointment</button>
//         </form>
//     `;
//     scheduleSection.appendChild(bookAppointmentSection);
// });


// js for when student cancels an appointment under "Upcoming Appointments"
const confirmCancelModal = document.getElementById("confirmCancelModal");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");
const studentCancelForm = document.getElementById("studentCancelForm");

function openStudentCancelModal(appointmentId) {
  studentCancelForm.action = `/studentAppointment/cancel/${appointmentId}`;
  confirmCancelModal.style.display = "block";
}

closeConfirmBtn.addEventListener("click", function () {
  confirmCancelModal.style.display = "none";
});



// clears password fields
const clearPasswordButton = document.getElementById("clear-password-button");

clearPasswordButton.addEventListener("click", ()=> {
  const passwordInput = document.querySelector('input[name="password"]');
  const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');

  if (passwordInput) { 
      passwordInput.value = "";
  }
  if (confirmPasswordInput) { 
      confirmPasswordInput.value = "";
  }
});