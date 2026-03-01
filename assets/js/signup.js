// Regex for Email and Password

// Email must be an @ilstu.edu address.
const emailRegex = /^[^\s@]+@ilstu\.edu$/;

// Password must have:
/* 8 characters
*  Atleast 1 uppercase letter
*  Atleast 1 lowercase letter
*  Atleast 1 number
*  Atleast one special character (@$!%*?&)
*/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Validates Email, Password, and Password = Confirm Password form
function validateForm() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPass").value;
    let valid = true;

    if (!emailRegex.test(email)) {
        document.getElementById("emailError").innerText = "Please enter a valid @ilstu.edu email address.";
        valid = false;
    } 
    else {
        document.getElementById("emailError").innerText = "";
    }

    if (!passwordRegex.test(password)) {
        document.getElementById("passwordError").innerText = "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
        valid = false;
    } 
    else {
        document.getElementById("passwordError").innerText = "";
    }

    if (password != confirmPassword){
        document.getElementById("confirmPasswordError").innerText = "Passwords must match.";
    }
    else {
        document.getElementById("confirmPasswordError").innerText ="";
    }
    

    return valid;
}
