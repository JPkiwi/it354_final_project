const { google } = require('googleapis');
const { oauth2Client } = require('../config/googleAuth');
const User = require('../model/userModel');

// Combines "2024-04-09" and "13:00" into a full datetime string
function buildDateTime(date, time) {
    const dateStr = new Date(date).toISOString().split("T")[0]; // "YYYY-MM-DD"
    return `${dateStr}T${time}:00`; // "YYYY-MM-DDTHH:MM:00"
}

// Creates a Google Calendar event on the admin's calendar
exports.createCalendarEvent = async (tokens, appointment) => {
    oauth2Client.setCredentials(tokens);

    // Listens for auto-refreshed tokens and save them back to DB
    oauth2Client.on('tokens', async (newTokens) => {
        try {
            const admin = await User.findOne({ role: "admin" });
            admin.googleTokens = { ...admin.googleTokens, ...newTokens }; // here the "..." is called a spread operator.
            await admin.save();                                           // it essentially overwrites what it needs to, but keeps what it doesn't need to overwrite
            // console.log("Admin tokens refreshed and saved.");
        } catch (err) {
            console.error("Failed to save refreshed tokens.");
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `Tutoring ${appointment.course} with ${appointment.tutorFName}`,
        description: `Student ${appointment.studentFName} appointment for ${appointment.course}`,
        start: {
            dateTime: buildDateTime(appointment.appointmentDate, appointment.startTime),
            timeZone: 'America/Chicago',
        },
        end: {
            dateTime: buildDateTime(appointment.appointmentDate, appointment.endTime),
            timeZone: 'America/Chicago',
        },
    };

    // inserts into our calendar
    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
    });

    // return the event ID so we can store it for deletion later
    return response.data.id;
};

// Deletes a Google Calendar event by its event ID
exports.deleteCalendarEvent = async (tokens, calendarEventId) => {
    oauth2Client.setCredentials(tokens);

    // Listens for auto-refreshed tokens and save them back to DB
    oauth2Client.on('tokens', async (newTokens) => {
        try {
            const admin = await User.findOne({ role: "admin" });
            admin.googleTokens = { ...admin.googleTokens, ...newTokens };
            await admin.save();
            // console.log("Admin tokens refreshed and saved.");
        } catch (err) {
            console.error("Failed to save refreshed tokens.");
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
        calendarId: 'primary',
        eventId: calendarEventId,
    });
};