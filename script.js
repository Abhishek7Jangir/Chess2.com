//when enter username then if it already exists, input field boundry will be red when sign up btn is clicked.
//same thing as above with email
//password should be one upper,lower,symbol and digit , and at least 8 character password STORED IN AFTER HASHING
//when all good and enter signup a otp on email id only one field of enter otp and verify button, when click enter let it to sign in page.
//when first come click sign in username field go upside and only email and password field should be there and when enter correctly then to home page of website
//make sure when on sign in then sign up button is disabled
// when on sign in and clicked sign up then come to sign up page not do sign up process same with sign up page
//whe click on password suggestions then show three password suggestions
//when click forgot password, then enter email and verify and once verified by otp then option for create new passowrd, one option is skip

let title = document.querySelector('.title');
let underline = document.querySelector('.underline');
let signInBtn = document.querySelector('.signinbtn');
let signUpBtn = document.querySelector('.signupbtn');
let sib = 0;
let sub = 1;
let username = document.querySelector('.namefield');
let bottomText = document.querySelector('.text');
let clickHere = document.getElementById('clickHere');
let email = document.querySelector('.email-field');
let password = document.querySelector('.password-field');
const nameDiv = document.querySelector('.input-field');
const emailDiv = document.querySelector('.email-field');
const passwordDiv = document.querySelector('.password-field');
const nameInput = document.querySelector('input[name="name"]');
const emailInput = document.querySelector('input[name="email"]');
const passwordInput = document.querySelector('input[name="password"]');

// Add a global variable to store the email value
let forgotPasswordEmail = '';

async function checkUnique(field, value) {
    const response = await fetch(`http://localhost:3000/check-${field}?value=${value}`);
    const result = await response.json();
    return result.unique;
}//

async function validateSignUp() {
    const usernameValue = nameInput.value;
    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;

    let isValid = true;

    const isUsernameUnique = await checkUnique('name', usernameValue);
    console.log('isUsernameUnique', isUsernameUnique);
    console.log('usernameValue', usernameValue);
    if (!isUsernameUnique || usernameValue === '') {
        nameDiv.style.border = '2px solid red';
        isValid = false; // Mark validation as failed
    } else {
        nameDiv.style.border = '2px solid green';
    }

    const isEmailUnique = await checkUnique('email', emailValue);
    console.log('isEmailUnique', isEmailUnique);
    console.log('emailValue', emailValue);
    if (!isEmailUnique || emailValue === '') {
        emailDiv.style.border = '2px solid red';
        isValid = false; // Mark validation as failed
    } else {
        emailDiv.style.border = '2px solid green';
    }

    if (!await isValidPassword(passwordValue)) {
        passwordDiv.style.border = '2px solid red';
        isValid = false; // Mark validation as failed
    } else {
        passwordDiv.style.border = '2px solid green';
    }

    // Only proceed if all validations pass
    if (isValid) {
        await sendOtp(emailValue); // Send OTP to email
        showOtpField(); // Show OTP input field

    }
    console.log('end of isvalidate function!');
}//

async function isValidPassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPattern.test(password);
}//


async function sendOtp(email) {
    console.log('sending otp');
    const response = await fetch(`http://localhost:3000/send-otp?email=${email}`);
    console.log('otp sent!')
    const result = await response.json();
    startTimer(); // Start the countdown timer
    alert(result.message); // Show success message
}//

function showOtpField() {
    const formBox = document.querySelector('.form-box');
    formBox.innerHTML = `
        <h1 class="title">Enter OTP</h1>
        <div class="underline"></div>
        <div class="input-field otp-field">
            <i class="fa-solid fa-key"></i>
            <input type="text" name="otp" placeholder="Enter OTP" required>
        </div>
        <h6>OTP expires in: <span style="color: red;" id="timer">05:00</span></h6>
        <div class="single-btn-field">
            <button type="button" class="verifybtn" onclick="verifyOtpField()" style="align-items: center">Verify</button>
        </div>
    `;
}//

async function verifyOtpField() {
    console.log('entered in verifyOtpField function!');
    console.log('calling verifyOtp function!');
    const emailValue = emailInput.value;
    console.log('emailValue: ', emailValue);
    const otpVerification = await verifyOtp();
    console.log('otpVerification: ', otpVerification);
    if (otpVerification) {
        if (sub == 1) {
            await insertDatabase();
        }
        else {
            showNewPasswordField();
        }
    }
}

let timer;
const countdownTime = 5 * 60; // 5 minutes in seconds

function startTimer() {
    let timeLeft = countdownTime;

    timer = setInterval(() => {
        const timerElement = document.getElementById('timer'); // Get the timer element
        if (!timerElement) {
            clearInterval(timer); // Stop the timer if the element is not found
            return;
        }

        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        // Format time as mm:ss
        timerElement.innerText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            timerElement.innerText = 'Expired';
            alert('OTP has expired. Please request a new OTP.');
        }

        timeLeft--;
    }, 1000);
}//

async function verifyOtp() {
    console.log('entered in verifyOtp function!');
    const otpInput = document.querySelector('input[name="otp"]');
    const otpValue = otpInput.value;

    // Use the stored email value
    const emailValue = forgotPasswordEmail;
    console.log('emailValue: ', emailValue);

    console.log('verifying otp');
    const response = await fetch(`http://localhost:3000/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailValue, otp: otpValue })
    });
    console.log('otp verification done!');
    const result = await response.json();
    console.log("otp verification result", result);
    return result;
}


async function insertDatabase() {
    // Store the sign-up data into the database
    const usernameValue = nameInput.value;
    console.log('usernameValue: ', usernameValue);
    const passwordValue = passwordInput.value; // Ensure this retrieves the correct value
    const emailValue = emailInput.value;
    console.log('passwordValue: ', passwordValue);

    console.log('sending signup data to server!')

    const response = await fetch(`http://localhost:3000/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: usernameValue, email: emailValue, password: passwordValue })
    });

    console.log('signup data sent!')

    const result = await response.text();
    console.log('result from signup route: ', result);
    alert(result); // Show success message

    // Navigate to sign-in page or home page
    window.location.href = '/'; // Adjust the URL as needed
}//


function togglePasswordVisibility(event) {
    const passwordField = event.target.closest('.input-field').querySelector('input[type="password"], input[type="text"]');
    const passwordFieldType = passwordField.getAttribute('type');
    const eyeIcon = event.target;

    if (passwordFieldType === 'password') {
        passwordField.setAttribute('type', 'text');
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.setAttribute('type', 'password');
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}//


function inClick() {
    if (sib == 0) {
        sib = 1;
        sub = 0;
        title.innerHTML = "Sign In";
        underline.style.width = '5vh';
        signUpBtn.classList.add("disable");
        signInBtn.classList.remove("disable");
        username.style.maxHeight = '0';
        bottomText.innerHTML = "Forgot Password  ";
        nameDiv.style.border = 'none';
    } else {
        validateSignIn();
    }
}

async function validateSignIn() {
    const emailValue = emailInput.value;
    const passwordValue = passwordInput.value;
    console.log('entered in validateSignIn function!');
    console.log('emailValue: ', emailValue);
    console.log('passwordValue: ', passwordValue);

    const response = await fetch(`http://localhost:3000/signin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailValue, password: passwordValue })
    });
    console.log('signin data sent!')

    const result = await response.json();
    console.log('response from server: ', result.message);

    if (result.message === 'Login Successful') {
        // Navigate to home page or dashboard
        window.location.href = 'home.html'; // Adjust the URL as needed
    }
    else if (result.message === 'Incorrect password') {
        passwordDiv.style.border = '2px solid red';
        passwordInput.value = ''; // Clear the password field
        passwordInput.focus(); // Set focus back to the password field
        alert('Incorrect password. Please try again.');
    }
    else if (result.message === 'User not registered') {
        emailDiv.style.border = '2px solid red';
        alert('User not registered. Please sign up first.');
        window.location.href = '/';
    }
}


function upClick() {
    if (sub == 0) {
        sub = 1;
        sib = 0;
        title.innerHTML = "Sign Up";
        underline.style.width = '13vh';
        signInBtn.classList.add("disable");
        signUpBtn.classList.remove("disable");
        username.style.maxHeight = '60px';
        bottomText.innerHTML = "Password Suggestions  ";
    } else {
        validateSignUp();
        console.log('end of upClick() function!')
    }
}//

function suggestionForgot() {
    if (sub == 1) {

    }
    else {
        showForgotPasswordField();
    }
}

function showForgotPasswordField() {
    const formBox = document.querySelector('.form-box');
    formBox.innerHTML = `
        <h1 class="title">Forgot Password</h1>
        <div class="underline"></div>
        <div class="input-field email-field">
            <i class="fa-solid fa-at"></i>
            <input type="email" name="email" placeholder="Enter your email" required>
        </div>
        <div class="single-btn-field">
            <button type="button" class="verifybtn" onclick="sendForgotPasswordOtp()">Verify</button>
        </div>
    `;
}

async function sendForgotPasswordOtp() {
    // Dynamically retrieve the email input field
    const emailField = document.querySelector('input[name="email"]');
    const emailValue = emailField ? emailField.value : ''; // Safely retrieve the value
    console.log('email value for forgot password: ', emailValue);

    if (!emailValue) {
        alert('Please enter a valid email address.');
        return;
    }

    // Store the email value in the global variable
    forgotPasswordEmail = emailValue;

    const emailDiv = document.querySelector('.email-field');
    await sendOtp(emailValue); // Send OTP to email
    console.log('coming from sendOtpFunction!');
    console.log('now calling function to show otp field!');
    showOtpField(); // Show OTP input field
}

async function showNewPasswordField() {
    const formBox = document.querySelector('.form-box');
    formBox.innerHTML = `
        <h1 class="title">Create New Password</h1>
        <div class="underline"></div>
        <form>
            <div class="input-field password-field">
                <i class="fa-solid fa-key"></i>
                <input type="password" name="new-password" placeholder="New Password"
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}"
                    title="Password must be 8 or more characters long with at least one uppercase, one lowercase, one number, and one special character."
                    required>
                <span class="toggle-password"><i class="fa fa-eye"></i></span>
            </div>
            <div class="input-field password-field">
                <i class="fa-solid fa-key"></i>
                <input type="password" name="confirm-new-password" placeholder="Confirm Password"
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}"
                    title="Password must be 8 or more characters long with at least one uppercase, one lowercase, one number, and one special character."
                    required>
                <span class="toggle-password"><i class="fa fa-eye"></i></span>
            </div>
            <p><span class="text">Password Suggestions </span><a id='clickHere'
                    onclick="suggestionForgot()">Click Here</a></p>
            <div class="single-btn-field">
                <button type="button" class="updataPassButton" onclick="updatePassword()">Submit</button>
            </div>
        </form>`;

    // Reattach the event listener for the toggle-password elements
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', togglePasswordVisibility);
    });
}
async function updatePassword() {
    console.log('entered in updatePassword function!');
    const newPasswordValue = document.querySelector('input[name="new-password"]').value;
    console.log('newPasswordValue: ', newPasswordValue);

    const confirmPasswordValue = document.querySelector('input[name="confirm-new-password"]').value;

    console.log('confirm password value: ', confirmPasswordValue);
    const emailValue = forgotPasswordEmail;
    console.log('emailValue: ', emailValue);

    if (newPasswordValue === confirmPasswordValue) {
        const validPass = await isValidPassword(newPasswordValue);
        console.log('validPass in updatePassword: ', validPass);
        if (!validPass) {
            alert('Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
            return;
        }

        console.log('sending new password to server!');
        const response = await fetch(`http://localhost:3000/update-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: emailValue, password: newPasswordValue })
        });
        const result = await response.text();
        console.log('result from update-password route: ', result);
        alert(result); // Show success message
        window.location.href = '/'; // Redirect to sign-in page
    }
    else {
        alert('Passwords do not match. Please try again.');
    }
}


// Add event listener for the eye icon
document.querySelector('.toggle-password').addEventListener('click', togglePasswordVisibility);




