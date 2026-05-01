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

function exceptionCancellationTemplate({ studentName, tutorName, date, time, course }) {
  return `
    <p>Hi ${studentName},</p>
    <p>Your tutoring appointment with ${tutorName} has been cancelled due to the IT Learning Center being unexpectedly closed.</p>
    <p>We apologize for the inconvenience. Please log back into the appointment system to book a new appointment.</p>

    <p>Appointment details:</p>
    <p>
        <b>Course:</b> ${course}<br/>
        <b>Date:</b> ${date}<br/>
        <b>Time:</b> ${time}
    </p>

  `;
}


function accountDeactivationTemplate({ name, date }) {
  return `
    <p>Hi ${name},</p>
    <p>Your account has been deactivated due to <b>suspicious login activity.</b></p>
    <p>Please contact an administrator to reactivate your account and change your password.</p>

    <p><b>Suspicious Activity Details:</b></p>
    <p>
        Too many login attempts.<br/>
        <b>Date & Time:</b> ${date}<br/>
    </p>

  `;
}


module.exports = { confirmationTemplate, studentCancellationTemplate, adminCancellationTemplate, exceptionCancellationTemplate,accountDeactivationTemplate };
