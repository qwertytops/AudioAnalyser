function showLogInForm() {
    document.getElementById('logInForm').style.display = 'block';   
}

function submitLogIn() {
    // NEED TO IMPLEMENT THIS
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