function confirmationTemplate({ studentName, tutorName, date, time, course }) {
  return `
    <p>Hi ${studentName},</p>
    <p>Your tutoring appointment with ${tutorName} has been scheduled.</p>

    <p>Appointment details:</p>
    <p>
        <b>Course:</b> ${course}<br/>
        <b>Date:</b> ${date}<br/>
        <b>Time:</b> ${time}
    </p>
  `;
}

function studentCancellationTemplate({ studentName, tutorName, date, time, course }) {
  return `
    <p>Hi ${studentName},</p>
    <p>Your tutoring appointment with ${tutorName} has been cancelled.</p>

    <p>Appointment details:</p>
    <p>
        <b>Course:</b> ${course}<br/>
        <b>Date:</b> ${date}<br/>
        <b>Time:</b> ${time}
    </p>

  `;
}

function adminCancellationTemplate({ studentName, tutorName, date, time, course }) {
  return `
    <p>Hi ${studentName},</p>
    <p>An administrator has cancelled your tutoring appointment with ${tutorName}.</p>

    <p>Appointment details:</p>
    <p>
        <b>Course:</b> ${course}<br/>
        <b>Date:</b> ${date}<br/>
        <b>Time:</b> ${time}
    </p>

  `;
}

module.exports = { confirmationTemplate, studentCancellationTemplate, adminCancellationTemplate };
