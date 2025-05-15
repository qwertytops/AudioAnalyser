document.addEventListener('DOMContentLoaded', function() {
    // Menu switching functionality
    const menuItems = document.querySelectorAll('.account-menu-item');
    const sections = document.querySelectorAll('.account-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            // Show the target section
            const targetSection = document.getElementById(this.dataset.target);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Logout functionality
    const logoutBtn = document.querySelector('.account-sidebar .btn-outline-danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/logout';
        });
    }
    
    // Delete history functionality
    const deleteHistoryBtn = document.querySelector('#deleteHistoryModal .btn-danger');
    if (deleteHistoryBtn) {
        deleteHistoryBtn.addEventListener('click', function() {
            // Show loading state
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            this.disabled = true;
            
            fetch('/deleteHistory', {
                method: 'POST',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => response.json())
            .then(data => {
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteHistoryModal'));
                modal.hide();
                
                if (data.success) {
                    // Show success message
                    showAlert('success', 'Analysis history deleted successfully.');
                    
                    // Clear the history list and show empty state
                    const historyList = document.querySelector('.analysis-history-list');
                    const emptyState = document.querySelector('.analysis-history-empty');
                    
                    if (historyList && emptyState) {
                        historyList.innerHTML = '';
                        emptyState.classList.remove('d-none');
                    }
                } else {
                    showAlert('danger', data.message || 'Failed to delete analysis history.');
                }
                
                // Reset button state
                this.innerHTML = 'Delete History';
                this.disabled = false;
            })
            .catch(error => {
                console.error('Error deleting history:', error);
                showAlert('danger', 'An error occurred while deleting history.');
                
                // Reset button state
                this.innerHTML = 'Delete History';
                this.disabled = false;
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteHistoryModal'));
                modal.hide();
            });
        });
    }
    
    // Delete account functionality
    const deleteAccountBtn = document.querySelector('#deleteAccountModal .btn-danger');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            const passwordField = document.getElementById('confirmPassword');
            const password = passwordField.value.trim();
            
            // Validate password
            if (!password) {
                // Show error
                passwordField.classList.add('is-invalid');
                
                // Add error message if it doesn't exist
                if (!document.getElementById('passwordError')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'passwordError';
                    errorDiv.className = 'invalid-feedback';
                    errorDiv.textContent = 'Please enter your password to confirm.';
                    passwordField.after(errorDiv);
                }
                return;
            }
            
            // Remove any existing error
            passwordField.classList.remove('is-invalid');
            const errorDiv = document.getElementById('passwordError');
            if (errorDiv) errorDiv.remove();
            
            // Show loading state
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
            this.disabled = true;
            
            fetch('/deleteAccount', {
                method: 'POST',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({ password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close the modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
                    modal.hide();
                    
                    // Show success message and redirect to home page after a delay
                    showAlert('success', 'Your account has been deleted successfully. Redirecting to homepage...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    // Show error
                    passwordField.classList.add('is-invalid');
                    
                    // Add error message
                    if (!document.getElementById('passwordError')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.id = 'passwordError';
                        errorDiv.className = 'invalid-feedback';
                        errorDiv.textContent = data.message || 'Failed to delete account.';
                        passwordField.after(errorDiv);
                    } else {
                        document.getElementById('passwordError').textContent = data.message || 'Failed to delete account.';
                    }
                    
                    // Reset button state
                    this.innerHTML = 'Delete Account';
                    this.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error deleting account:', error);
                
                // Show error
                showAlert('danger', 'An error occurred while deleting your account.');
                
                // Reset button state
                this.innerHTML = 'Delete Account';
                this.disabled = false;
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
                modal.hide();
            });
        });
    }
    
    // Helper function to show alerts
    function showAlert(type, message) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insert alert at the top of the main content
        const mainContent = document.querySelector('.col-md-8');
        if (mainContent) {
            mainContent.prepend(alertDiv);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Profile editing functionality
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    
    // Form fields
    const usernameInput = document.getElementById('profileUsername');
    const emailInput = document.getElementById('profileEmail');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    
    // Password requirement indicators
    const reqLength = document.getElementById('req-length');
    const reqLetter = document.getElementById('req-letter');
    const reqNumber = document.getElementById('req-number');
    
    // Store original values to revert changes on cancel
    let originalUsername = '';
    let originalEmail = '';
    
    // Toggle edit mode
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            // Store original values
            originalUsername = usernameInput.value;
            originalEmail = emailInput.value;
            
            // Enable form fields for editing
            profileForm.classList.add('edit-mode');
            usernameInput.disabled = false;
            emailInput.disabled = false;
            
            // Focus on the first field
            usernameInput.focus();
            
            // Show the password fields
            document.querySelector('.currentPassword-container').style.display = 'block';
            
            // Hide edit button, show save/cancel buttons
            editProfileBtn.style.display = 'none';
            document.querySelector('.action-buttons').style.display = 'flex';
        });
    }
    
    // Cancel editing
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            // Restore original values
            usernameInput.value = originalUsername;
            emailInput.value = originalEmail;
            
            // Clear password fields
            if (currentPasswordInput) currentPasswordInput.value = '';
            if (newPasswordInput) newPasswordInput.value = '';
            
            // Reset password requirements
            if (reqLength) reqLength.querySelector('i').className = 'fas fa-times-circle text-danger';
            if (reqLetter) reqLetter.querySelector('i').className = 'fas fa-times-circle text-danger';
            if (reqNumber) reqNumber.querySelector('i').className = 'fas fa-times-circle text-danger';
            
            // Remove any error messages
            document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            
            // Disable form fields
            profileForm.classList.remove('edit-mode');
            usernameInput.disabled = true;
            emailInput.disabled = true;
            
            // Hide the password fields
            document.querySelector('.currentPassword-container').style.display = 'none';
            document.querySelector('.newPassword-container').style.display = 'none';
            
            // Show edit button, hide save/cancel buttons
            editProfileBtn.style.display = 'block';
            document.querySelector('.action-buttons').style.display = 'none';
        });
    }
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordField = currentPasswordInput;
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
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
    
    // Toggle new password visibility
    const toggleNewPasswordBtn = document.getElementById('toggleNewPasswordBtn');
    if (toggleNewPasswordBtn) {
        toggleNewPasswordBtn.addEventListener('click', function() {
            const passwordField = newPasswordInput;
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
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
    
    // Show/hide new password field and requirements
    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('input', function() {
            const newPasswordContainer = document.querySelector('.newPassword-container');
            if (this.value.trim() !== '') {
                newPasswordContainer.style.display = 'block';
            } else {
                newPasswordContainer.style.display = 'none';
                if (newPasswordInput) newPasswordInput.value = '';
            }
        });
    }
    
    // Password requirements validation
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Length requirement
            if (password.length >= 8) {
                reqLength.querySelector('i').className = 'fas fa-check-circle text-success';
            } else {
                reqLength.querySelector('i').className = 'fas fa-times-circle text-danger';
            }
            
            // Letter requirement
            if (/[A-Za-z]/.test(password)) {
                reqLetter.querySelector('i').className = 'fas fa-check-circle text-success';
            } else {
                reqLetter.querySelector('i').className = 'fas fa-times-circle text-danger';
            }
            
            // Number requirement
            if (/\d/.test(password)) {
                reqNumber.querySelector('i').className = 'fas fa-check-circle text-success';
            } else {
                reqNumber.querySelector('i').className = 'fas fa-times-circle text-danger';
            }
        });
    }
    
    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    // Validate password requirements
    function isValidPassword(password) {
        // Minimum 8 characters, contains at least one letter and one number
        return password.length >= 8 && 
               /[A-Za-z]/.test(password) && 
               /\d/.test(password);
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
        
        // Insert error message after input
        input.parentElement.after(errorElement);
    }
    
    // Function to clear validation errors
    function clearValidationError(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const errorId = `${inputId}Error`;
        
        // Remove error message if it exists
        const existingError = document.getElementById(errorId);
        if (existingError) {
            existingError.remove();
        }
        
        // Remove error styling
        input.classList.remove('is-invalid');
    }
    
    // Save profile changes
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function() {
            // Clear previous validation errors
            clearValidationError('profileUsername');
            clearValidationError('profileEmail');
            clearValidationError('currentPassword');
            clearValidationError('newPassword');
            
            // Get form values
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            
            // Basic validation
            let isValid = true;
            
            // Username validation
            if (!username) {
                showValidationError('profileUsername', 'Username is required');
                isValid = false;
            } else if (username.length < 3) {
                showValidationError('profileUsername', 'Username must be at least 3 characters long');
                isValid = false;
            }
            
            // Email validation
            if (!email) {
                showValidationError('profileEmail', 'Email is required');
                isValid = false;
            } else if (!isValidEmail(email)) {
                showValidationError('profileEmail', 'Please enter a valid email address');
                isValid = false;
            }
            
            // Current password is required for any change
            if (!currentPassword) {
                showValidationError('currentPassword', 'Please enter your current password to confirm changes');
                isValid = false;
            }
            
            // New password validation (only if provided)
            if (newPassword && !isValidPassword(newPassword)) {
                showValidationError('newPassword', 'Password must be at least 8 characters and contain both letters and numbers');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Show loading state
            saveProfileBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
            saveProfileBtn.disabled = true;
            
            // Prepare data for submission
            const profileData = {
                username: username,
                email: email,
                currentPassword: currentPassword,
                newPassword: newPassword || null
            };
            
            // Send update request
            fetch('/updateProfile', {
                method: 'POST',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify(profileData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    showAlert('success', data.message);
                    
                    // Update displayed username in the sidebar and nav if changed
                    if (username !== originalUsername) {
                        const usernameDisplays = document.querySelectorAll('.user-info h4#username, .navbar .me-3');
                        usernameDisplays.forEach(el => {
                            if (el) el.textContent = username;
                        });
                    }
                    
                    // Reset form state
                    profileForm.classList.remove('edit-mode');
                    usernameInput.disabled = true;
                    emailInput.disabled = true;
                    
                    // Hide password fields and clear them
                    document.querySelector('.currentPassword-container').style.display = 'none';
                    document.querySelector('.newPassword-container').style.display = 'none';
                    currentPasswordInput.value = '';
                    if (newPasswordInput) newPasswordInput.value = '';
                    
                    // Show edit button, hide save/cancel buttons
                    editProfileBtn.style.display = 'block';
                    document.querySelector('.action-buttons').style.display = 'none';
                } else {
                    // Show error message on the specific field
                    if (data.field) {
                        const fieldMap = {
                            'username': 'profileUsername',
                            'email': 'profileEmail',
                            'currentPassword': 'currentPassword',
                            'newPassword': 'newPassword'
                        };
                        
                        const fieldId = fieldMap[data.field] || data.field;
                        showValidationError(fieldId, data.message);
                    } else {
                        // General error
                        showAlert('danger', data.message || 'Failed to update profile');
                    }
                }
                
                // Reset button state
                saveProfileBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes';
                saveProfileBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                showAlert('danger', 'An error occurred while updating your profile');
                
                // Reset button state
                saveProfileBtn.innerHTML = '<i class="fas fa-save me-1"></i>Save Changes';
                saveProfileBtn.disabled = false;
            });
        });
    }
    
    // Helper function to show alerts
    function showAlert(type, message) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insert alert at the top of the main content
        const mainContent = document.querySelector('.col-md-8');
        if (mainContent) {
            mainContent.prepend(alertDiv);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }, 5000);
        }
    }
});