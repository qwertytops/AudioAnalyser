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