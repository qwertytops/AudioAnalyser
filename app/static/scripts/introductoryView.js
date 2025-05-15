function showLogInForm() {
    document.getElementById('logInForm').style.display = 'block';
}

// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters for showing login form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLogin') === 'true') {
        showLogInForm();
    }
    
    // Update UI based on session state
    updateNavbarForLoggedInUser();
    updateMainPageForLoggedInUser(); // Add this new function call
});

// Function to update navigation UI for logged-in user
function updateNavbarForLoggedInUser() {
    // This will be handled server-side with Jinja templates
    // No JavaScript needed for this part when using server-side sessions
}

function submitLogIn() {
    // Get user input values
    const loginId = document.getElementById('logInEmail').value.trim();
    const password = document.getElementById('logInPassword').value;
    
    
    // Validate input
    if (!loginId || !password) {
        displayLoginMessage('Please enter both email/username and password', 'error');
        return;
    }
    
    // Show loading state
    displayLoginMessage('Authenticating...', 'info');
    
    // Make an AJAX request to the server to scan the database
    fetch('/login', {
        method: 'POST',
        headers: addCsrfHeader({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            username: loginId, // Backend expects 'username' key but this can be email too
            password: password
        }),
        credentials: 'same-origin' // Include cookies for session handling
    })
    .then(response => {
        // Log the response status for debugging
        console.log('Login response status:', response.status);
        
        // Parse the JSON response
        return response.json().then(data => {
            // Return both the response object and the parsed data
            return { status: response.status, data: data };
        });
    })
    .then(result => {
        console.log('Login response data:', result.data);
        
        if (result.status === 200 && result.data.success) {
            // Login successful
            displayLoginMessage('Login successful! Redirecting...', 'success');
            
            // Store user data if provided
            if (result.data.user) {
                localStorage.setItem('userData', JSON.stringify(result.data.user));
            }
            
            // Update UI for logged-in user
            updateUIForLoggedInUser(result.data.user);
            
            // Redirect after successful login
            setTimeout(() => {
                window.location.href = '/upload'; // Redirect to the upload page or any other page
            }, 1500);
        } else {
            // Login failed
            window.location.href = '/?showLogin=true'; 
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        displayLoginMessage('An error occurred during login. Please try again.', 'error');
    });
}

// Helper function to display login messages
function displayLoginMessage(message, type) {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById('loginMessage');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'loginMessage';
        messageElement.className = 'alert mt-3';
        const formElement = document.getElementById('logInForm');
        formElement.appendChild(messageElement);
    }
    
    // Set message content and style
    messageElement.textContent = message;
    messageElement.className = 'alert mt-3'; // Reset classes
    
    // Add appropriate Bootstrap alert class based on message type
    if (type === 'error') {
        messageElement.classList.add('alert-danger');
    } else if (type === 'success') {
        messageElement.classList.add('alert-success');
    } else if (type === 'info') {
        messageElement.classList.add('alert-info');
    }
    
    // Make sure it's visible
    messageElement.style.display = 'block';
}

// Function to update UI for logged-in user
function updateUIForLoggedInUser(userData) {
    // Update navigation UI
    const loginLink = document.getElementById('loginLink');
    const signUpLink = document.getElementById('signUpLink');
    
    if (loginLink) loginLink.style.display = 'none';
    if (signUpLink) signUpLink.style.display = 'none';
    
    // Add username display in nav
    const rightNavSection = document.getElementById('right');
    if (rightNavSection) {
        // Clear existing content
        rightNavSection.innerHTML = '';
        
        // Add welcome message and logout link
        const welcomeSpan = document.createElement('span');
        welcomeSpan.className = 'me-3';
        welcomeSpan.textContent = `Welcome, ${userData.username}`;
        
        const logoutLink = document.createElement('a');
        logoutLink.href = '/logout';
        logoutLink.className = 'btn btn-outline-danger btn-sm';
        logoutLink.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i>Logout';
        
        rightNavSection.appendChild(welcomeSpan);
        rightNavSection.appendChild(logoutLink);
    }
    
    // Update main page auth buttons
    updateMainPageForLoggedInUser();
}

// New function to update main page UI for logged-in users
function updateMainPageForLoggedInUser() {
    const userData = localStorage.getItem('userData');
    const isLoggedIn = userData || (document.querySelector('#right span.me-3') !== null);
    
    // Find main page auth buttons container
    const authButtonsContainer = document.querySelector('.auth-buttons');
    if (authButtonsContainer) {
        if (isLoggedIn) {
            // Hide the login/signup buttons on main page
            authButtonsContainer.style.display = 'none';
            
            // Optionally show a message or different content for logged-in users
            const welcomeMessage = document.createElement('div');
            welcomeMessage.className = 'text-center mb-4';
            welcomeMessage.innerHTML = '<p class="lead">You\'re logged in! Explore our features below or head to the <a href="/upload">Upload page</a> to analyze your audio files.</p>';
            
            // Insert the welcome message before the features section
            const featuresSection = document.querySelector('.features-section');
            if (featuresSection && !document.querySelector('.logged-in-message')) {
                welcomeMessage.classList.add('logged-in-message');
                authButtonsContainer.parentNode.insertBefore(welcomeMessage, featuresSection);
            }
        } else {
            // Ensure buttons are visible if user is not logged in
            authButtonsContainer.style.display = 'flex';
            
            // Remove any welcome message if it exists
            const welcomeMessage = document.querySelector('.logged-in-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }
        }
    }
}

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            // User is logged in, update UI
            updateUIForLoggedInUser(JSON.parse(userData));
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('userData'); // Clear invalid data
        }
    }
    
    // Check URL parameters for showing login form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLogin') === 'true') {
        showLogInForm();
    }
});

// Helper function to display login messages
function displayLoginMessage(message, type) {
    // Create message element if it doesn't exist
    let messageElement = document.getElementById('loginMessage');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'loginMessage';
        messageElement.className = 'alert mt-3';
        const formElement = document.getElementById('logInForm');
        formElement.appendChild(messageElement);
    }
    
    // Set message content and style
    messageElement.textContent = message;
    messageElement.className = 'alert mt-3'; // Reset classes
    
    // Add appropriate Bootstrap alert class based on message type
    if (type === 'error') {
        messageElement.classList.add('alert-danger');
    } else if (type === 'success') {
        messageElement.classList.add('alert-success');
    } else if (type === 'info') {
        messageElement.classList.add('alert-info');
    }
    
    // Make sure it's visible
    messageElement.style.display = 'block';
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

// Check URL parameters on page load to see if login form should be shown
document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters - ONLY open login form if explicitly requested
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('showLogin') === 'true') {
        showLogInForm();
    } else {
        // Make sure login form is hidden by default
        const loginForm = document.getElementById('logInForm');
        if (loginForm) {
            loginForm.style.display = 'none';
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for logout link if it exists
    const logoutLink = document.querySelector('a[href="/logout"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear localStorage
            localStorage.removeItem('userData');
            
            // Redirect to logout route
            window.location.href = '/logout';
        });
    }
});