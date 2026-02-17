
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


calendarDiv.addEventListener("click", ()=> {
    if (getComputedStyle(buttonOptions).visibility === "hidden")
        buttonOptions.classList.toggle("tutor-button-options");
});

addCommentButton.addEventListener("click", ()=> {
    commentSubmitButton.style.visibility = "visible";
    commentText.style.visibility = "visible";
});

addTimeButton.addEventListener("click", ()=> {
    timeSubmitButton.style.visibility = "visible";
    startTimeText.style.visibility = "visible";
    endTimeText.style.visibility = "visible";
    startTimeLabel.style.visibility = "visible";
    endTimeLabel.style.visibility = "visible";
});

showButton.addEventListener("click", ()=> {
    showLabel.style.visibility = "visible";
    selectShow.style.visibility = "visible";
    showSubmitButton.style.visibility = "visible";
});

commentSubmitButton.addEventListener("click", ()=> {
    commentText.style.visibility = "hidden";
    commentSubmitButton.style.visibility = "hidden";
    buttonOptions.classList.toggle("tutor-button-options");
});

timeSubmitButton.addEventListener("click", ()=> {
    startTimeText.style.visibility = "hidden";
    endTimeText.style.visibility = "hidden";
    startTimeLabel.style.visibility = "hidden";
    endTimeLabel.style.visibility = "hidden";
    timeSubmitButton.style.visibility = "hidden";
    buttonOptions.classList.toggle("tutor-button-options");
});

showSubmitButton.addEventListener("click", ()=> {
    showLabel.style.visibility = "hidden";
    selectShow.style.visibility = "hidden";
    showSubmitButton.style.visibility = "hidden";
    buttonOptions.classList.toggle("tutor-button-options");
});
