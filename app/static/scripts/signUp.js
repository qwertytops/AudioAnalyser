// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to validate password requirements
function isValidPassword(password) {
    // Minimum 8 characters, contains at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}

// Function to display validation errors
function showValidationError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorId = `${inputId}Error`;
    
    // Remove any existing error message
    const existingError = document.getElementById(errorId);
    if (existingError) {
        existingError.remove();
    }
    
    // Create and add new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'invalid-feedback d-block';
    errorElement.id = errorId;
    errorElement.textContent = message;
    
    // Add error styling to input
    input.classList.add('is-invalid');
    
    // Insert error message after input's parent (input-group)
    input.parentElement.after(errorElement);
}

// Function to clear validation errors
function clearValidationError(inputId) {
    const input = document.getElementById(inputId);
    const errorId = `${inputId}Error`;
    
    // Remove error message if it exists
    const existingError = document.getElementById(errorId);
    if (existingError) {
        existingError.remove();
    }
    
    // Remove error styling
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
}

// Function to handle the form validation and submission
function validateSignUpForm() {
    let isValid = true;
    
    // Get form values
    const email = document.getElementById('signUpEmail').value;
    const username = document.getElementById('signUpUsername').value;
    const password = document.getElementById('signUpPassword').value;
    
    // Clear previous errors
    clearValidationError('signUpEmail');
    clearValidationError('signUpUsername');
    clearValidationError('signUpPassword');
    
    // Validate email
    if (!email) {
        showValidationError('signUpEmail', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showValidationError('signUpEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate username
    if (!username) {
        showValidationError('signUpUsername', 'Username is required');
        isValid = false;
    } else if (username.length < 3) {
        showValidationError('signUpUsername', 'Username must be at least 3 characters');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        showValidationError('signUpPassword', 'Password is required');
        isValid = false;
    } else if (!isValidPassword(password)) {
        showValidationError('signUpPassword', 'Password must be at least 8 characters with letters and numbers');
        isValid = false;
    }
    
    return isValid;
}

    // Real-time validation for email field
    document.getElementById('signUpEmail').addEventListener('blur', function() {
        const email = this.value;
        if (email && !isValidEmail(email)) {
            showValidationError('signUpEmail', 'Please enter a valid email address');
        } else if (email) {
            clearValidationError('signUpEmail');
        }
    });
    
    // Real-time validation for password field
    document.getElementById('signUpPassword').addEventListener('input', function() {
        const password = this.value;
        if (password && password.length >= 8) {
            if (!isValidPassword(password)) {
                showValidationError('signUpPassword', 'Password must include both letters and numbers');
            } else {
                clearValidationError('signUpPassword');
            }
        }
    });

document.addEventListener('DOMContentLoaded', function() {
    // Store the referring page in a hidden input if it doesn't exist
    if (!document.getElementById('referrerPage')) {
        const referrerInput = document.createElement('input');
        referrerInput.type = 'hidden';
        referrerInput.id = 'referrerPage';
        referrerInput.name = 'referrer'; // Give it a name so it's included in form submission
        referrerInput.value = document.referrer || "/";
        document.querySelector('form').appendChild(referrerInput);
    }

    // Add event listener for the "Create Account" button
    document.getElementById('createAccountBtn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default form submission
        
        // Get form values
        const email = document.getElementById('signUpEmail').value;
        const username = document.getElementById('signUpUsername').value;
        const password = document.getElementById('signUpPassword').value;
        
        // Validate form (basic validation)
        if (!email || !username || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        // Update confirmation modal with user details
        document.getElementById('confirmEmail').textContent = email;
        document.getElementById('confirmUsername').textContent = username;
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('confirmSignUpModal'));
        modal.show();
    });
    
    // Add event listener for the confirm button in the modal
    document.getElementById('confirmSignUp').addEventListener('click', function() {
        // Submit the form to the server
        document.querySelector('form').submit();
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('signUpPassword');
    const reqLength = document.getElementById('req-length');
    const reqLetter = document.getElementById('req-letter');
    const reqNumber = document.getElementById('req-number');
    
    // Update password requirement indicators as user types
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Check length requirement
        if (password.length >= 8) {
            reqLength.querySelector('i').className = 'fas fa-check-circle text-success';
        } else {
            reqLength.querySelector('i').className = 'fas fa-times-circle text-danger';
        }
        
        // Check letter requirement
        if (/[A-Za-z]/.test(password)) {
            reqLetter.querySelector('i').className = 'fas fa-check-circle text-success';
        } else {
            reqLetter.querySelector('i').className = 'fas fa-times-circle text-danger';
        }
        
        // Check number requirement
        if (/\d/.test(password)) {
            reqNumber.querySelector('i').className = 'fas fa-check-circle text-success';
        } else {
            reqNumber.querySelector('i').className = 'fas fa-times-circle text-danger';
        }
    });
});

// Add password toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const toggleSignUpPasswordBtn = document.getElementById('toggleSignUpPasswordBtn');
    const signUpPasswordField = document.getElementById('signUpPassword');
    
    if (toggleSignUpPasswordBtn && signUpPasswordField) {
        toggleSignUpPasswordBtn.addEventListener('click', function() {
            // Toggle password visibility
            const type = signUpPasswordField.getAttribute('type') === 'password' ? 'text' : 'password';
            signUpPasswordField.setAttribute('type', type);
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
});