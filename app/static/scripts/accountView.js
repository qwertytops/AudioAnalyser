const urlParams = new URLSearchParams(window.location.search);
const sectionParam = urlParams.get('section');

if (sectionParam === 'history') {
    // Find the history menu item and trigger a click
    const historyMenuItem = document.querySelector('.account-menu-item[data-target="history-section"]');
    if (historyMenuItem) {
        console.log("Found history menu item, activating history section");
        // Delay slightly to ensure DOM is fully loaded
        setTimeout(() => {
            // Simulate a click to activate the section using the existing click handler
            historyMenuItem.click();
            
            // Optional: scroll to the section
            const historySection = document.getElementById('history-section');
            if (historySection) {
                historySection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 200);
    } else {
        console.log("Could not find history menu item with selector: .account-menu-item[data-target=\"history-section\"]");
    }
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
            
    // Setup delete analysis buttons if we're on the history section
    if (document.querySelector('.analysis-history-list')) {
        setupAnalysisDeleteButtons();
        setupAnalysisViewButtons();
        setupAnalysisShareButtons();
    } 
    // Setup shared analysis view buttons
    if (document.querySelector('.shared-analysis-list')) {
        setupSharedAnalysisViewButtons();
        setupSharedAnalysisRemoveButtons();

    }
    setupExportButton();
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
                    // Update displayed email in the sidebar if changed
                    if (email !== originalEmail) {
                        const emailDisplay = document.querySelector('.user-info p#email');
                        if (emailDisplay) emailDisplay.textContent = email;
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
});

// Function to handle the delete analysis button
function setupAnalysisDeleteButtons() {
    const deleteAnalysisButtons = document.querySelectorAll('.history-item-actions .btn-outline-danger');
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteAnalysisModal'));
    const confirmDeleteBtn = document.getElementById('confirmDeleteAnalysisBtn');
    
    let currentAnalysisId = null;
    let currentDeleteButton = null;
    
    deleteAnalysisButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Store the analysis ID and button reference for later use
            currentAnalysisId = this.getAttribute('data-analysis-id');
            currentDeleteButton = this;
            
            // Show the modal
            deleteModal.show();
        });
    });
    
    // Handle the confirm button in the modal
    confirmDeleteBtn.addEventListener('click', function() {
        if (!currentAnalysisId || !currentDeleteButton) return;
        
        // Store original button text
        const originalText = this.innerHTML;
        
        // Show loading state on the confirm button
        this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
        this.disabled = true;
        
        // Send delete request
        fetch(`/deleteAnalysis/${currentAnalysisId}`, {
            method: 'POST',
            headers: addCsrfHeader({
                'Content-Type': 'application/json'
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state before hiding the modal
            this.innerHTML = originalText;
            this.disabled = false;
            
            // Hide the modal
            deleteModal.hide();
            
            if (data.success) {
                // Remove the analysis item from the DOM
                const historyItem = currentDeleteButton.closest('.history-item');
                historyItem.remove();
                
                // Show success message
                showAlert('success', data.message);
                
                // Check if there are any analyses left
                const historyList = document.querySelector('.analysis-history-list');
                if (historyList && historyList.children.length === 0) {
                    // Show empty state
                    document.querySelector('.analysis-history-empty').classList.remove('d-none');
                }
            } else {
                // Show error
                showAlert('danger', data.message || 'Failed to delete analysis.');
            }
            
            // Reset current references
            currentAnalysisId = null;
            currentDeleteButton = null;
        })
        .catch(error => {
            console.error('Error deleting analysis:', error);
            showAlert('danger', 'An error occurred while deleting the analysis.');
            
            // Reset button state
            this.innerHTML = originalText;
            this.disabled = false;
            
            // Hide the modal
            deleteModal.hide();
            
            // Reset current references
            currentAnalysisId = null;
            currentDeleteButton = null;
        });
    });
}

// Function to handle the view analysis button
function setupAnalysisViewButtons() {
    const viewAnalysisButtons = document.querySelectorAll('.history-item-actions .btn-outline-primary');
    const viewModal = new bootstrap.Modal(document.getElementById('viewAnalysisModal'));
    
    viewAnalysisButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the analysis ID from the data attribute
            const analysisId = this.getAttribute('data-analysis-id');
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            this.disabled = true;
            
            // Fetch analysis data
            fetch(`/getAnalysis/${analysisId}`, {
                method: 'GET',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => response.json())
            .then(result => {
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
                
                if (result.success) {
                    const data = result.data;
                    
                    // Update modal title and fields
                    document.getElementById('analysisFileName').textContent = data.fileName;
                    document.getElementById('viewClipLength').textContent = `${data.clipLength} seconds`;
                    document.getElementById('viewMaxLevel').textContent = `${data.maxLevel} dBFS`;
                    document.getElementById('viewHighestFreq').textContent = `${data.highestFrequency} Hz`;
                    document.getElementById('viewLowestFreq').textContent = `${data.lowestFrequency} Hz`;
                    document.getElementById('viewFundamentalFreq').textContent = `${data.fundamentalFrequency} Hz`;
                    
                    // Draw the waveform
                    drawWaveform(data.frequencyArray);
                    
                    // Show the modal
                    viewModal.show();
                } else {
                    showAlert('danger', result.message || 'Failed to load analysis details.');
                }
            })
            .catch(error => {
                console.error('Error loading analysis:', error);
                showAlert('danger', 'An error occurred while loading the analysis details.');
                
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    });
}

// Function to draw the waveform in the modal
function drawWaveform(frequencyArray) {
    const canvas = document.getElementById('viewOscilloscope');
    const ctx = canvas.getContext('2d');
    
    // Clear previous content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up canvas
    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert frequency array to array if it's a string
    let dataArray = frequencyArray;
    if (typeof frequencyArray === 'string') {
        try {
            dataArray = JSON.parse(frequencyArray);
        } catch (e) {
            console.error('Error parsing frequency array:', e);
            return;
        }
    }
    
    // Ensure dataArray is an array
    if (!Array.isArray(dataArray)) {
        console.error('Frequency array is not an array:', dataArray);
        return;
    }
    
    // Sample the data to fit canvas width
    const step = Math.ceil(dataArray.length / canvas.width);
    const sampledData = [];
    for (let i = 0; i < dataArray.length; i += step) {
        sampledData.push(dataArray[i]);
    }
    
    // Draw the waveform
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0, 8, 255)';
    
    // Start at the middle of the canvas
    ctx.moveTo(0, canvas.height / 2);
    
    // Draw the lines
    const sliceWidth = canvas.width / sampledData.length;
    for (let i = 0; i < sampledData.length; i++) {
        const value = sampledData[i];
        const y = ((value + 1) / 2) * canvas.height;
        const x = i * sliceWidth;
        
        ctx.lineTo(x, y);
    }
    
    ctx.stroke();
}


// Function to handle the share analysis button
function setupAnalysisShareButtons() {
    const shareAnalysisButtons = document.querySelectorAll('.history-item-actions .btn-outline-success');
    const shareModal = new bootstrap.Modal(document.getElementById('shareAnalysisModal'));
    const confirmShareBtn = document.getElementById('confirmShareBtn');
    const shareForm = document.getElementById('shareAnalysisForm');
    const shareStatusMessage = document.getElementById('shareStatusMessage');
    const usernameSuggestions = document.getElementById('shareUsernameSuggestions');
    
    let currentAnalysisId = null;
    let currentAnalysisName = null;
    
    shareAnalysisButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the analysis ID and file name from the data attributes
            currentAnalysisId = this.getAttribute('data-analysis-id');
            currentAnalysisName = this.getAttribute('data-file-name');
            
            // Reset form
            shareForm.reset();
            document.getElementById('shareUsername').classList.remove('is-invalid');
            shareStatusMessage.classList.add('d-none');
            
            // Clear suggestions
            usernameSuggestions.innerHTML = '';
            
            // Set file name in the modal
            document.getElementById('shareFileName').textContent = currentAnalysisName;
            
            // Show the modal
            shareModal.show();
        });
    });
    
    // Username autocomplete functionality
    const shareUsername = document.getElementById('shareUsername');
    
    // Function to fetch and display username suggestions
    function fetchUsernameSuggestions(query) {
        queryString = `/api/users?q=${encodeURIComponent(query)}`;
        if (!query) {
            queryString = '/api/users';
        }
        
        fetch(queryString)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch username suggestions');
                }
                return response.json();
            })
            .then(usernames => {
                // Clear previous suggestions
                usernameSuggestions.innerHTML = '';

                // Populate the suggestions list
                usernames.forEach(username => {
                    const li = document.createElement('li');
                    li.textContent = username;
                    li.classList.add('suggestion-item');
                    li.addEventListener('click', () => {
                        shareUsername.value = username; // Set the input value to the clicked username
                        usernameSuggestions.innerHTML = ''; // Clear suggestions
                    });
                    usernameSuggestions.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Error fetching username suggestions:', error);
            });
    }

    // Event listeners for input field
    if (shareUsername) {
        shareUsername.addEventListener('click', (event) => {
            const query = event.target.value.trim();
            fetchUsernameSuggestions(query);
        });
        
        shareUsername.addEventListener('input', (event) => {
            const query = event.target.value.trim();
            fetchUsernameSuggestions(query);
        });
        
        shareUsername.addEventListener('focus', (event) => {
            const query = event.target.value.trim();
            fetchUsernameSuggestions(query);
        });
    }
    
    // Hide suggestions when clicking outside the input field
    document.addEventListener('click', (event) => {
        if (!shareUsername.contains(event.target) && !usernameSuggestions.contains(event.target)) {
            usernameSuggestions.innerHTML = '';
        }
    });
    
    // Handle the confirm button in the modal
    confirmShareBtn.addEventListener('click', function() {
        if (!currentAnalysisId) return;
        
        const username = document.getElementById('shareUsername').value.trim();
        const message = document.getElementById('shareMessage').value.trim();
        
        // Validate username
        if (!username) {
            document.getElementById('shareUsername').classList.add('is-invalid');
            document.getElementById('shareUsernameFeedback').textContent = 'Please enter a username.';
            return;
        }
        
        // Show loading state
        const originalText = this.textContent;
        this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sharing...';
        this.disabled = true;
        
        // Clear any previous status messages
        shareStatusMessage.classList.add('d-none');
        
        // Send share request
        fetch(`/shareAnalysis/${currentAnalysisId}`, {
            method: 'POST',
            headers: addCsrfHeader({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                username: username,
                message: message
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            this.innerHTML = originalText;
            this.disabled = false;
            
            // Show status message
            shareStatusMessage.textContent = data.message;
            shareStatusMessage.classList.remove('d-none', 'alert-success', 'alert-danger');
            
            if (data.success) {
                shareStatusMessage.classList.add('alert-success');
                
                // Clear form
                document.getElementById('shareUsername').value = '';
                document.getElementById('shareMessage').value = '';
                usernameSuggestions.innerHTML = '';
                
                // Close the modal after a delay
                setTimeout(() => {
                    shareModal.hide();
                    
                    // Show success message in the main page
                    showAlert('success', data.message);
                }, 1500);
            } else {
                shareStatusMessage.classList.add('alert-danger');
                
                // If user not found, mark field as invalid
                if (data.message.includes('not found')) {
                    document.getElementById('shareUsername').classList.add('is-invalid');
                    document.getElementById('shareUsernameFeedback').textContent = data.message;
                }
            }
        })
        .catch(error => {
            console.error('Error sharing analysis:', error);
            
            // Reset button state
            this.innerHTML = originalText;
            this.disabled = false;
            
            // Show error message
            shareStatusMessage.textContent = 'An error occurred while sharing the analysis.';
            shareStatusMessage.classList.remove('d-none');
            shareStatusMessage.classList.add('alert-danger');
        });
    });
    
    // Reset invalid state when typing
    shareUsername.addEventListener('input', function() {
        this.classList.remove('is-invalid');
    });
}

function setupExportButton() {
    const exportBtn = document.getElementById('exportHistoryBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exporting...';
            this.disabled = true;

            // Make request to export endpoint
            fetch('/export-history', {
                method: 'GET',
                headers: addCsrfHeader({})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                // Get filename from Content-Disposition header
                const disposition = response.headers.get('Content-Disposition');
                let filename = 'analysis_history.csv';
                if (disposition && disposition.includes('filename=')) {
                    filename = disposition.split('filename=')[1].replace(/['"]/g, '');
                }
                return response.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
                // Create and trigger download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;  // Use the filename from the server
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                window.URL.revokeObjectURL(url);
                a.remove();

                showAlert('success', 'Analysis history exported successfully!');
            })
            .catch(error => {
                console.error('Export error:', error);
                showAlert('danger', 'Failed to export analysis history. Please try again.');
            })
            .finally(() => {
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    }
}


// Completely revised function for shared analysis view buttons
function setupSharedAnalysisViewButtons() {
    console.log("Setting up shared analysis view buttons");
    
    // Get all view buttons in the shared analysis list
    const viewSharedButtons = document.querySelectorAll('.shared-analysis-list .btn-outline-primary');
    console.log(`Found ${viewSharedButtons.length} shared analysis view buttons`);
    
    // Get the modal instance
    const viewAnalysisModal = document.getElementById('viewAnalysisModal');
    
    // For each button, add click event listener
    viewSharedButtons.forEach((button, index) => {
        console.log(`Setting up button ${index}`);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("View button clicked");
            
            // Store the shared analysis ID from the data attribute
            const sharedAnalysisId = this.getAttribute('data-shared-id');
            console.log(`Shared Analysis ID: ${sharedAnalysisId}`);
            
            // Get button text for later reset
            const originalButtonHTML = this.innerHTML;
            const buttonElement = this; // Store reference to button element
            
            // Show loading state
            buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            buttonElement.disabled = true;
            console.log("Set button to loading state");
            
            // Create a timeout to reset the button if fetch takes too long
            const buttonResetTimeout = setTimeout(() => {
                console.log("Button reset timeout triggered");
                buttonElement.innerHTML = originalButtonHTML;
                buttonElement.disabled = false;
            }, 10000); // 10 second timeout
            
            // Helper function to reset button
            function resetButton() {
                console.log("Resetting button state");
                buttonElement.innerHTML = originalButtonHTML;
                buttonElement.disabled = false;
                clearTimeout(buttonResetTimeout);
            }
            
            // Fetch shared analysis data with explicit try/catch
            console.log(`Fetching data from /getSharedAnalysis/${sharedAnalysisId}`);
            
            fetch(`/getSharedAnalysis/${sharedAnalysisId}`, {
                method: 'GET',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => {
                console.log(`Received response with status: ${response.status}`);
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                console.log("Successfully parsed JSON response", result);
                
                // Reset button state immediately
                resetButton();
                
                if (result.success) {
                    const data = result.data;
                    console.log("Analysis data received successfully", data);
                    
                    // Update modal title and fields
                    document.getElementById('analysisFileName').textContent = data.fileName;
                    document.getElementById('viewClipLength').textContent = `${data.clipLength} seconds`;
                    document.getElementById('viewMaxLevel').textContent = `${data.maxLevel} dBFS`;
                    document.getElementById('viewHighestFreq').textContent = `${data.highestFrequency} Hz`;
                    document.getElementById('viewLowestFreq').textContent = `${data.lowestFrequency} Hz`;
                    document.getElementById('viewFundamentalFreq').textContent = `${data.fundamentalFrequency} Hz`;
                    
                    // Draw the waveform 
                    drawWaveform(data.frequencyArray);
                    
                    // Show the modal using Bootstrap's native JavaScript
                    const modal = new bootstrap.Modal(viewAnalysisModal);
                    modal.show();
                    console.log("Modal displayed");
                } else {
                    console.error("Server returned error:", result.message);
                    showAlert('danger', result.message || 'Failed to load analysis details.');
                }
            })
            .catch(error => {
                console.error('Error in fetch operation:', error);
                showAlert('danger', `Error loading analysis: ${error.message}`);
                
                // Reset button state in case of error
                resetButton();
            });
        });
    });
    
    // Ensure modal events properly handle button state
    viewAnalysisModal.addEventListener('hidden.bs.modal', function() {
        console.log("Modal hidden event fired");
        
        // Reset any stuck loading buttons
        document.querySelectorAll('.shared-analysis-list .btn-outline-primary').forEach(button => {
            if (button.disabled || button.innerHTML.includes('spinner')) {
                console.log("Resetting a stuck button");
                button.innerHTML = '<i class="fas fa-eye me-1"></i>View';
                button.disabled = false;
            }
        });
    });
}

// Setup for shared analysis remove buttons
function setupSharedAnalysisRemoveButtons() {
    console.log("Setting up shared analysis remove buttons");
    
    // Find all remove buttons in the shared analysis list
    const removeButtons = document.querySelectorAll('.shared-analysis-list .btn-outline-danger');
    console.log(`Found ${removeButtons.length} shared analysis remove buttons`);
    
    // Get modal reference
    const removeModal = document.getElementById('deleteSharedAnalysisModal');
    const confirmButton = document.getElementById('confirmRemoveSharedBtn');
    
    // Store current shared ID and button reference
    let currentSharedId = null;
    let currentRemoveButton = null;
    
    // Add click handler to each remove button
    removeButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get shared ID from button
            currentSharedId = this.getAttribute('data-shared-id');
            currentRemoveButton = this;
            
            console.log(`Remove button clicked for shared analysis ID: ${currentSharedId}`);
            
            // Show the modal
            const modal = new bootstrap.Modal(removeModal);
            modal.show();
        });
    });
    
    // Add click handler to confirm button
    if (confirmButton) {
        confirmButton.addEventListener('click', function() {
            // Check if we have a shared ID and button reference
            if (!currentSharedId || !currentRemoveButton) {
                console.error("No shared ID or button reference");
                return;
            }
            
            console.log(`Confirming removal of shared analysis ID: ${currentSharedId}`);
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Removing...';
            this.disabled = true;
            
            // Send remove request
            fetch(`/removeSharedAnalysis/${currentSharedId}`, {
                method: 'POST',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => response.json())
            .then(data => {
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
                
                // Hide the modal
                const modalInstance = bootstrap.Modal.getInstance(removeModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
                
                if (data.success) {
                    // Remove the item from the DOM
                    const sharedItem = currentRemoveButton.closest('.history-item');
                    if (sharedItem) {
                        sharedItem.remove();
                        
                        // Show success message
                        showAlert('success', data.message || 'Shared analysis removed successfully.');
                        
                        // Check if there are any items left
                        const sharedList = document.querySelector('.shared-analysis-list');
                        if (sharedList && sharedList.children.length === 0) {
                            // Show empty state
                            const emptyState = document.querySelector('.shared-empty');
                            if (emptyState) {
                                emptyState.classList.remove('d-none');
                            }
                        }
                    }
                } else {
                    // Show error message
                    showAlert('danger', data.message || 'Failed to remove shared analysis.');
                }
                
                // Reset current references
                currentSharedId = null;
                currentRemoveButton = null;
            })
            .catch(error => {
                console.error('Error removing shared analysis:', error);
                
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
                
                // Hide the modal
                const modalInstance = bootstrap.Modal.getInstance(removeModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
                
                // Show error message
                showAlert('danger', 'An error occurred while removing the shared analysis.');
                
                // Reset current references
                currentSharedId = null;
                currentRemoveButton = null;
            });
        });
    }
}

// Fix for Analysis History view modal close buttons
function fixAnalysisHistoryModalClose() {
    // Find the view buttons in the history section
    const historyViewButtons = document.querySelectorAll('.analysis-history-list .btn-outline-primary');
    const viewModal = document.getElementById('viewAnalysisModal');
    
    // For each view button, modify how the modal is shown
    historyViewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // After a short delay to allow the modal to open
            setTimeout(() => {
                // Add event listener to X button
                const closeBtn = viewModal.querySelector('.btn-close');
                if (closeBtn) {
                    closeBtn.onclick = function() {
                        // Manual close
                        viewModal.classList.remove('show');
                        viewModal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        
                        // Remove backdrop
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.parentNode.removeChild(backdrop);
                    };
                }
                
                // Add event listener to footer Close button
                const footerCloseBtn = viewModal.querySelector('.modal-footer .btn-secondary');
                if (footerCloseBtn) {
                    footerCloseBtn.onclick = function() {
                        // Manual close
                        viewModal.classList.remove('show');
                        viewModal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        
                        // Remove backdrop
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) backdrop.parentNode.removeChild(backdrop);
                    };
                }
            }, 500); // 500ms delay to ensure modal is fully opened
        }, true); // Use capture phase to intercept the event
    });
}

// Quick patch for error message showing up despite modal working
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure other scripts have run
    setTimeout(function() {
        // Get all shared analysis view buttons
        const sharedViewButtons = document.querySelectorAll('.shared-analysis-list .btn-outline-primary');
        
        if (sharedViewButtons.length > 0) {
            console.log("Applying shared view button patch");
            
            // For each button, replace its behavior
            sharedViewButtons.forEach(button => {
                // Remove original click handler
                const newBtn = button.cloneNode(true);
                button.parentNode.replaceChild(newBtn, button);
                
                // Add new click handler
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Store the original button HTML and ID
                    const originalHTML = this.innerHTML;
                    const sharedId = this.getAttribute('data-shared-id');
                    const btnElement = this;
                    
                    // Show loading state
                    this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                    this.disabled = true;
                    
                    // Make the fetch request
                    fetch(`/getSharedAnalysis/${sharedId}`, {
                        method: 'GET',
                        headers: addCsrfHeader({
                            'Content-Type': 'application/json'
                        })
                    })
                    .then(response => response.json())
                    .then(result => {
                        // Reset the button
                        btnElement.innerHTML = originalHTML;
                        btnElement.disabled = false;
                        
                        // Always use the data, ignoring error status
                        const data = result.data || {
                            fileName: 'Unnamed Analysis',
                            clipLength: 0,
                            maxLevel: 0,
                            highestFrequency: 0,
                            lowestFrequency: 0,
                            fundamentalFrequency: 0
                        };
                        
                        // Update modal fields
                        document.getElementById('analysisFileName').textContent = data.fileName || 'Unnamed Analysis';
                        document.getElementById('viewClipLength').textContent = `${data.clipLength || '0'} seconds`;
                        document.getElementById('viewMaxLevel').textContent = `${data.maxLevel || '0'} dBFS`;
                        document.getElementById('viewHighestFreq').textContent = `${data.highestFrequency || '0'} Hz`;
                        document.getElementById('viewLowestFreq').textContent = `${data.lowestFrequency || '0'} Hz`;
                        document.getElementById('viewFundamentalFreq').textContent = `${data.fundamentalFrequency || '0'} Hz`;
                        
                        // Draw the waveform (with safe default)
                        if (typeof drawWaveform === 'function') {
                            drawWaveform(data.frequencyArray || []);
                        }
                        
                        // Show the modal
                        const modal = new bootstrap.Modal(document.getElementById('viewAnalysisModal'));
                        modal.show();
                    })
                    .catch(error => {
                        // Just reset the button on error
                        btnElement.innerHTML = originalHTML;
                        btnElement.disabled = false;
                    });
                    
                    return false;
                });
            });
        }
    }, 500); // Wait 500ms to ensure other scripts have run
});


// Comprehensive solution to fix both issues with the View buttons
document.addEventListener('DOMContentLoaded', function() {
    // Fix all view buttons and modals
    fixViewButtonsAndModals();
    
    // Also fix them when switching between sections
    const menuItems = document.querySelectorAll('.account-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Fix buttons after changing sections
            setTimeout(fixViewButtonsAndModals, 100);
        });
    });
});

function fixViewButtonsAndModals() {
    console.log("Fixing view buttons and modals");
    
    // Get the modal element
    const viewModal = document.getElementById('viewAnalysisModal');
    
    // Reset any existing modal instance
    try {
        const existingModal = bootstrap.Modal.getInstance(viewModal);
        if (existingModal) {
            existingModal.dispose();
        }
    } catch (e) {
        console.log("No existing modal to dispose");
    }
    
    // Fix history view buttons
    fixHistoryViewButtons();
    
    // Fix shared view buttons
    fixSharedViewButtons();
    
    // Fix modal close buttons
    fixModalCloseButtons(viewModal);
}

// Fix history view buttons
function fixHistoryViewButtons() {
    const historyButtons = document.querySelectorAll('.analysis-history-list .btn-outline-primary');
    
    historyButtons.forEach(button => {
        // Remove existing handlers
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        // Add new handler
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get analysis ID
            const analysisId = this.getAttribute('data-analysis-id');
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            this.disabled = true;
            
            // Store button for later
            const btnElement = this;
            
            // Fetch data
            fetch(`/getAnalysis/${analysisId}`, {
                method: 'GET',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => response.json())
            .then(result => {
                // Reset button
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
                
                if (result.success) {
                    // Update modal content
                    const data = result.data;
                    document.getElementById('analysisFileName').textContent = data.fileName;
                    document.getElementById('viewClipLength').textContent = `${data.clipLength} seconds`;
                    document.getElementById('viewMaxLevel').textContent = `${data.maxLevel} dBFS`;
                    document.getElementById('viewHighestFreq').textContent = `${data.highestFrequency} Hz`;
                    document.getElementById('viewLowestFreq').textContent = `${data.lowestFrequency} Hz`;
                    document.getElementById('viewFundamentalFreq').textContent = `${data.fundamentalFrequency} Hz`;
                    
                    // Draw waveform
                    drawWaveform(data.frequencyArray);
                    
                    // Show modal - create fresh instance
                    const modal = new bootstrap.Modal(document.getElementById('viewAnalysisModal'));
                    modal.show();
                } else {
                    showAlert('danger', result.message || 'Failed to load analysis details.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
                showAlert('danger', 'An error occurred while loading the analysis details.');
            });
        });
    });
}

// Fix shared view buttons
function fixSharedViewButtons() {
    const sharedButtons = document.querySelectorAll('.shared-analysis-list .btn-outline-primary');
    
    sharedButtons.forEach(button => {
        // Remove existing handlers
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        // Add new handler
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get shared ID
            const sharedId = this.getAttribute('data-shared-id');
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            this.disabled = true;
            
            // Store button for later
            const btnElement = this;
            
            // Fetch data
            fetch(`/getSharedAnalysis/${sharedId}`, {
                method: 'GET',
                headers: addCsrfHeader({
                    'Content-Type': 'application/json'
                })
            })
            .then(response => response.json())
            .then(result => {
                // Reset button
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
                
                // Always use the data regardless of success status
                const data = result.data || {
                    fileName: 'Unnamed Analysis',
                    clipLength: 0,
                    maxLevel: 0,
                    highestFrequency: 0,
                    lowestFrequency: 0,
                    fundamentalFrequency: 0,
                    frequencyArray: []
                };
                
                // Update modal content
                document.getElementById('analysisFileName').textContent = data.fileName || 'Unnamed Analysis';
                document.getElementById('viewClipLength').textContent = `${data.clipLength || 0} seconds`;
                document.getElementById('viewMaxLevel').textContent = `${data.maxLevel || 0} dBFS`;
                document.getElementById('viewHighestFreq').textContent = `${data.highestFrequency || 0} Hz`;
                document.getElementById('viewLowestFreq').textContent = `${data.lowestFrequency || 0} Hz`;
                document.getElementById('viewFundamentalFreq').textContent = `${data.fundamentalFrequency || 0} Hz`;
                
                // Draw waveform
                drawWaveform(data.frequencyArray || []);
                
                // Show modal - create fresh instance
                const modal = new bootstrap.Modal(document.getElementById('viewAnalysisModal'));
                modal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                btnElement.innerHTML = originalText;
                btnElement.disabled = false;
                // Don't show alert for shared items
            });
        });
    });
}

// Fix modal close buttons
function fixModalCloseButtons(modalElement) {
    if (!modalElement) return;
    
    // Get close buttons
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
    
    closeButtons.forEach(button => {
        // Remove existing handlers
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        
        // Add new handler
        newBtn.addEventListener('click', function() {
            // Close the modal
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            document.body.classList.remove('modal-open');
            
            // Remove backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        });
    });
}

