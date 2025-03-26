//when enter username then if it already exists, input field boundry will be red when sign up btn is clicked.
//same thing as above with email
//password should be one upper,lower,symbol and digit , and at least 8 character password
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
const nameInput = document.querySelector('input[name="name"]');
const emailInput = document.querySelector('input[name="email"]');
const passwordInput = document.querySelector('input[name="password"]');

function inClick() {
    if (sib == 0) {
        sib = 1;
        sub = 0;
        title.innerHTML = "Sign In";
        underline.style.width = '5vh';
        signUpBtn.classList.add("disable");
        signInBtn.classList.remove("disable");
        username.style.maxHeight = '0';
        bottomText.innerHTML = "Forgot Password"
    }
    else {
        async 
    }
}

function upClick() {
    if(sub==0) {
        sub=1;
        sib=0;
        title.innerHTML = "Sign Up";
        underline.style.width='13vh';
        signInBtn.classList.add("disable");
        signUpBtn.classList.remove("disable");
        username.style.maxHeight = '60px';
    }
    else {

    }
}




