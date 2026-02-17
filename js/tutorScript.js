/*All the element options related to selecting, clicking, and changing visibility of appointment features*/
const calendarDiv = document.getElementById("tutor-calendar-container");
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

/*
When selecting the calendar div, the tutor button options for entering data appear.
These button options do not disappear until you select one of the button options and click submit.
This functionality can change later, but I was just getting the basic idea down.
The calendar div is a placeholder for the Google Calendar, will eventually show the button options when selecting a 
specifc appointment on a specific date.
*/
calendarDiv.addEventListener("click", ()=> {
    if (getComputedStyle(buttonOptions).visibility === "hidden")
        buttonOptions.classList.toggle("tutor-button-options");
});


/*When select Edit / View Comment button on the screen, the comment textarea and submit button appear*/
addCommentButton.addEventListener("click", ()=> {
    commentSubmitButton.style.visibility = "visible";
    commentText.style.visibility = "visible";
});


/*When select Add Start / End Time button on the screen, the time and submit buttons and labels all appear*/
addTimeButton.addEventListener("click", ()=> {
    timeSubmitButton.style.visibility = "visible";
    startTimeText.style.visibility = "visible";
    endTimeText.style.visibility = "visible";
    startTimeLabel.style.visibility = "visible";
    endTimeLabel.style.visibility = "visible";
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
    buttonOptions.classList.toggle("tutor-button-options");
});


/*When click time submit button, the time features and button options will be hidden*/
timeSubmitButton.addEventListener("click", ()=> {
    startTimeText.style.visibility = "hidden";
    endTimeText.style.visibility = "hidden";
    startTimeLabel.style.visibility = "hidden";
    endTimeLabel.style.visibility = "hidden";
    timeSubmitButton.style.visibility = "hidden";
    buttonOptions.classList.toggle("tutor-button-options");
});


/*When click show submit button, the show features and button options will be hidden*/
showSubmitButton.addEventListener("click", ()=> {
    showLabel.style.visibility = "hidden";
    selectShow.style.visibility = "hidden";
    showSubmitButton.style.visibility = "hidden";
    buttonOptions.classList.toggle("tutor-button-options");
});
