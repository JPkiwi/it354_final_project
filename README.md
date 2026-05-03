**IT Learning Center Scheduler**  
**Overview:**  
The IT Learning Center Scheduler is a web application to allow ISU students  
in IT courses to book tutoring appointments with tutors in the IT Learning  
Center.  

**Setup Steps:**  
**_(Client is rendered by the server using EJS.)_**  
1. Install VSCode (or a different IDE) and Node.js.
2. Clone the GitHub repository using the command line:  
   git clone https://github.com/JPkiwi/it354_final_project.git  
   cd it354_final_project
3. Install dependencies by running the following command:  
   npm install
4. If npm displays any vulnerabilities, you can optionally run: npm audit fix
5. Create a .env file in the root directory and add the following inside:  
   GOOGLE_CLIENT_ID=your_google_client_id  
   GOOGLE_CLIENT_SECRET=your_google_client_secret  
   GOOGLE_REDIRECT_URI=http://your_google_redirect_uri  
   SESSION_SECRET=your_session_secret  
   GMAIL_ADMIN=your_gmail_admin_email  
   GMAIL_APP_PASSWORD=your_gmail_app_password  
   EMAIL_ADMIN_PASSWORD=your_admin_email_password  
   PORT=3000  
   MONGO_URI=your_mongo_uri
6. Ensure .env is listed inside .gitignore.  


**How to Run Locally:**
1. Start the server using the following command in the command line:  
   npm start
2. Open a browser and enter the following:  
   http://localhost:3000
3. To stop running the server, enter Ctrl + c in the command line.  


**Team Members and Roles:**
- Jenna Pullega: Team Lead and Main developer of tutor functionality  
    Created project repo, maintained project board on GitHub (under the Projects tab), assigned issues,
    coordinated merges, ensured checkpoint readiness, posted weekly meeting
    notes, and confirmed peer evaluation completion among team members
- Amanda Lesley: Database setup and Main developer of Student functionality
- Alexus Calhoun: Main developer for Security, Google Calendar API, and Design
- Molly Staniszewski: Design and Main developer for admin  

**AI Use:**
- 

