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
    const currentTheme = htmlElement.getAttribute('data-bs-theme') || 'light';
    
    // Toggle the theme
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply the theme
    htmlElement.setAttribute('data-bs-theme', newTheme);
    
    // Update the icon
    updateThemeIcon(newTheme);
    
    // Save preference in localStorage (persists between page reloads)
    localStorage.setItem('theme', newTheme);
}

// Helper function to update theme icons
function updateThemeIcon(theme) {
    // Try to find icon in different locations (main page or navbar)
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');
    themeToggleButtons.forEach(button => {
        const moonIcon = button.querySelector('.fa-moon');
        const sunIcon = button.querySelector('.fa-sun');
        
        if (moonIcon && sunIcon) {
            if (theme === 'dark') {
                moonIcon.style.opacity = '0';
                sunIcon.style.opacity = '1';
            } else {
                moonIcon.style.opacity = '1';
                sunIcon.style.opacity = '0';
            }
        } else if (button.querySelector('i')) {
            // For simpler icon toggle
            const icon = button.querySelector('i');
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    });
}
