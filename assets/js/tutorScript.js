/*All the element options related to selecting, clicking, and changing visibility of appointment features*/
const shiftDate = document.getElementById("shift-date");
const buttonOptions = document.getElementById("tutor-button-options");
const addCommentButton = document.getElementById("comment-button");
const addTimeButton = document.getElementById("time-button");
const commentSubmitButton = document.getElementById("comment-submit-button");
const commentText = document.getElementById("comments-textarea");
const startTimeText = document.getElementById("session-start-time");
const endTimeText = document.getElementById("session-end-time");
const timeSubmitButton = document.getElementById("time-submit-button");
const startTimeLabel = document.getElementById("start-time-label");
const endTimeLabel = document.getElementById("end-time-label");
const showButton = document.getElementById("show-button");
const showSubmitButton = document.getElementById("show-submit-button");
const showLabel = document.getElementById("show-label");
const selectShow = document.getElementById("select-show");
const appointmentRadios = document.querySelectorAll('input[name="selectedAppointment"]');


/*Add event listener for each radio button, when change a radio button it makes button options visible*/
appointmentRadios.forEach(appointmentRadio => {
  appointmentRadio.addEventListener("change", () => {
    buttonOptions.style.visibility = "visible";

    // every time a different radio button is selected, hide the button features again
    commentText.style.visibility = "hidden";
    commentSubmitButton.style.visibility = "hidden";
    startTimeText.style.visibility = "hidden";
    endTimeText.style.visibility = "hidden";
    startTimeLabel.style.visibility = "hidden";
    endTimeLabel.style.visibility = "hidden";
    timeSubmitButton.style.visibility = "hidden";
    showLabel.style.visibility = "hidden";
    selectShow.style.visibility = "hidden";
    showSubmitButton.style.visibility = "hidden";
  });
});

/*When select Edit / View Comment button on the screen, the comment textarea with previously entered data for appointment (if any) 
  and submit button appear*/
addCommentButton.addEventListener("click", ()=> {
    commentSubmitButton.style.visibility = "visible";
    commentText.style.visibility = "visible";

    // get checked radio button and set the value of the comment-textarea to the selected appointment comment
    const selectedAppointment = document.querySelector('input[name="selectedAppointment"]:checked');

    if (selectedAppointment) {
        commentText.value = JSON.parse(selectedAppointment.dataset.comment) || "";
    } else {
        commentText.value = "";
    }
});


/*When select Add Start / End Time button on the screen, the time and submit buttons and labels all appear*/
addTimeButton.addEventListener("click", ()=> {
    timeSubmitButton.style.visibility = "visible";
    startTimeText.style.visibility = "visible";
    endTimeText.style.visibility = "visible";
    startTimeLabel.style.visibility = "visible";
    endTimeLabel.style.visibility = "visible";

    // get checked radio button and set the value of the startTimeText and endTimeText to the selected appointment times
    const selectedAppointment = document.querySelector('input[name="selectedAppointment"]:checked');

    if (selectedAppointment) {
        startTimeText.value = selectedAppointment.dataset.actualStart || "";
        endTimeText.value = selectedAppointment.dataset.actualEnd  || "";
    } else {
        startTimeText.value = "";
        endTimeText.value = "";
    }
});


/*When select Show / No Show button on the screen, the show label and dropdown and submit buttons all appear*/
showButton.addEventListener("click", ()=> {
    showLabel.style.visibility = "visible";
    selectShow.style.visibility = "visible";
    showSubmitButton.style.visibility = "visible";
});


/*When click comment submit button, the comment features and button options will be hidden*/
commentSubmitButton.addEventListener("click", ()=> {
    commentText.style.visibility = "hidden";
    commentSubmitButton.style.visibility = "hidden";
    buttonOptions.style.visibility = "hidden";
});


/*When click time submit button, the time features and button options will be hidden*/
timeSubmitButton.addEventListener("click", ()=> {
    startTimeText.style.visibility = "hidden";
    endTimeText.style.visibility = "hidden";
    startTimeLabel.style.visibility = "hidden";
    endTimeLabel.style.visibility = "hidden";
    timeSubmitButton.style.visibility = "hidden";
    buttonOptions.style.visibility = "hidden";
});


/*When click show submit button, the show features and button options will be hidden*/
showSubmitButton.addEventListener("click", ()=> {
    showLabel.style.visibility = "hidden";
    selectShow.style.visibility = "hidden";
    showSubmitButton.style.visibility = "hidden";
    buttonOptions.style.visibility = "hidden";
});
