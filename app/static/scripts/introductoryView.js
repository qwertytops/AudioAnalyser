function showLogInForm() {
    document.getElementById('logInForm').style.display = 'block';   
}

function submitLogIn() {
    // Get user input values
    const username = document.getElementById('logInEmail').value.trim();
    const password = document.getElementById('logInPassword').value;
    
    // Validate input
    if (!username || !password) {
        displayLoginMessage('Please enter both email and password', 'error');
        return;
    }
    
    // Show loading state
    displayLoginMessage('Authenticating...', 'info');
    
    // Make an AJAX request to the server to scan the database
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Login successful
            displayLoginMessage('Login successful! Redirecting...', 'success');
            
            // Store user data if provided
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            // Redirect after successful login (or perform other actions)
            setTimeout(() => {
                window.location.href = '/index';
            }, 1500);
        } else {
            // Login failed
            displayLoginMessage(data.message || 'Invalid email or password', 'error');
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
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if showLogin parameter exists
    if (urlParams.get('showLogin') === 'true') {
        showLogInForm();
    }
});
