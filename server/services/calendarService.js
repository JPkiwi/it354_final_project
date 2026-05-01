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

// Creates a blackout event on our "Blackout Days" admin google calendar
exports.createBlackoutCalendarEvent = async (tokens, blackoutDate) => {
    oauth2Client.setCredentials(tokens);

    // Listens for auto-refreshed tokens and save them back to DB
    oauth2Client.on('tokens', async (newTokens) => {
        try {
            const admin = await User.findOne({ role: "admin" });
            admin.googleTokens = { ...admin.googleTokens, ...newTokens }; 
            await admin.save();                                           
        } catch (err) {
            console.error("Failed to save refreshed tokens.");
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `BLACKOUT starting ${blackoutDate.startDate} until ${blackoutDate.endDate}`,
        description: `Blackout on ${blackoutDate.startDate} to ${blackoutDate.endDate} for ${blackoutDate.reason}`,
        start: {
            date: new Date(blackoutDate.startDate).toISOString().split("T")[0], // "YYYY-MM-DD",
        },
        end: {
            date: new Date(blackoutDate.endDate).toISOString().split("T")[0], // "YYYY-MM-DD",
        },
    };

    // inserts into our Blackout Days
    const response = await calendar.events.insert({
        calendarId: '87bf4cf19fff65dfeb231ab88f47d24867a89d47245cc83c778657a81a12814b@group.calendar.google.com',
        resource: event,
    });

    // return the event ID so we can store it for deletion later
    return response.data.id;
};



// seperate create calendar event for Exceptions
exports.createExceptionCalendarEvent = async (tokens, exceptionDate) => {
    oauth2Client.setCredentials(tokens);

    // Listens for auto-refreshed tokens and save them back to DB
    oauth2Client.on('tokens', async (newTokens) => {
        try {
            const admin = await User.findOne({ role: "admin" });
            admin.googleTokens = { ...admin.googleTokens, ...newTokens }; 
            await admin.save();                                           
        } catch (err) {
            console.error("Failed to save refreshed tokens.");
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `EXCEPTION on ${exceptionDate.exceptionDate}`,
        description: `Exception on ${exceptionDate.exceptionDate} from ${exceptionDate.startTime} to ${exceptionDate.endTime} for ${exceptionDate.reason}`,
        start: {
            dateTime: buildDateTime(exceptionDate.exceptionDate, exceptionDate.startTime),
            timeZone: 'America/Chicago',
        },
        end: {
            dateTime: buildDateTime(exceptionDate.exceptionDate, exceptionDate.endTime),
            timeZone: 'America/Chicago',
        },
    };

    // inserts into our Blackout Days calendar
    const response = await calendar.events.insert({
        calendarId: '87bf4cf19fff65dfeb231ab88f47d24867a89d47245cc83c778657a81a12814b@group.calendar.google.com',
        resource: event,
    });

    // return the event ID so we can store it for deletion later
    return response.data.id;
};



// Deletes Blackout date/Exception on Blackout Calendar                                         NEED TO TEST/IMPLEMENT
exports.deleteBlackoutCalendarEvent = async (tokens, calendarEventId) => {
    oauth2Client.setCredentials(tokens);

    // Listens for auto-refreshed tokens and save them back to DB
    oauth2Client.on('tokens', async (newTokens) => {
        try {
            const admin = await User.findOne({ role: "admin" });
            admin.googleTokens = { ...admin.googleTokens, ...newTokens };
            await admin.save();
        } catch (err) {
            console.error("Failed to save refreshed tokens.");
        }
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
        calendarId: '87bf4cf19fff65dfeb231ab88f47d24867a89d47245cc83c778657a81a12814b@group.calendar.google.com',
        eventId: calendarEventId,
    });
};