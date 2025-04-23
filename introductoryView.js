function showLogInForm() {
    document.getElementById('logInForm').style.display = 'block';  
    document.getElementById('signUpForm').style.display = 'none';  
}
function showSignUpForm() {
    document.getElementById('signUpForm').style.display = 'block';   
    document.getElementById('logInForm').style.display = 'none';
} 


function submitSignUp() {
    const username = document.getElementById("signUpUsername").value;
    const password = document.getElementById("signUpPassword").value;
    const email = document.getElementById("signUpEmail").value;

    if (username === "" || password === "" || email === "") {
        alert("Please fill in all fields.");
        return;
    }

    const userData = {
        username: username,
        password: password,
        email: email
    };

    //localStorage.setItem(username, JSON.stringify(userData)); <- this is what we need to do to save the data in the DB
    alert("Sign up successful! jk it doesnt work yet 💀");
}

function submitLogIn() {
    const email = document.getElementById("logInEmail").value;
    const password = document.getElementById("logInPassword").value;

    if (email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
    }

    const userData = JSON.parse(localStorage.getItem(email)); // <- this is what we need to do to get the data from the DB
    if (userData && userData.password === password) {
        alert("Login successful!");
        // Redirect them to the main page or something here
    } else {
        alert("Invalid username or password. the DB doesnt exist yet");
    }
}

function toggleTheme() {
    const htmlElement = document.documentElement;
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    
    if (currentTheme === 'light') {
        htmlElement.setAttribute('data-bs-theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        htmlElement.setAttribute('data-bs-theme', 'light');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
    
    // Save preference in localStorage (persists between page reloads)
    localStorage.setItem('theme', htmlElement.getAttribute('data-bs-theme'));
}

