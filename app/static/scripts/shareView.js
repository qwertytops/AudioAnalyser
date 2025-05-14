function switchContent(section, clickedItem) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    document.querySelectorAll('.sidebar-Option').forEach(item => item.classList.remove('active'));
    clickedItem.classList.add('active');
}

// Add an event listener to the Share button when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.addEventListener('click', function() {
            // Get form data
            const message = document.querySelector('textarea').value;
            const analysisId = document.querySelector('.analysis-select').value;
            const friendId = document.querySelector('#friendSelect').value;
            
            // Validate friend selection
            if (friendId === null || friendId === 'Select a friend') {
                alert('Please select a friend to share with');
                return;
            }
            
            // Disable all interactive elements while sharing
            disableAllControls();
            
            // Update button text to show progress
            shareButton.textContent = 'Sharing...';
            
            // Prepare data for AJAX request
            const data = {
                message: message,
                analysisId: analysisId,
                friendId: friendId
            };
            
            // Make AJAX call
            shareAnalysis(data);
        });
    }
    
    // Look for modal close buttons and cancel buttons to ensure they work
    document.addEventListener('click', function(event) {
        // Check if this is a modal close or cancel button
        if (event.target.classList.contains('modal-close') || 
            event.target.id === 'cancelShare' ||
            event.target.classList.contains('cancel-button')) {
            
            // Reset all controls when modal is closed
            resetControls();
            
            // If there's a modal overlay, remove it
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.remove();
            }
            
            // Prevent event from bubbling up
            event.stopPropagation();
        }
    });
});

/**
 * Function to disable all interactive controls
 */
function disableAllControls() {
    // Disable the Share button itself
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.disabled = true;
    }
    
    // Disable the sidebar options
    document.querySelectorAll('.sidebar-Option').forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
        option.style.opacity = '0.6';
    });
    
    // Disable form elements
    document.querySelector('textarea').disabled = true;
    document.querySelectorAll('select').forEach(select => {
        select.disabled = false; // Keep selects enabled in case user needs to change selection in modal
    });
}

/**
 * Function to send share data to the server via AJAX
 * @param {Object} data - The data to be shared
 */
function shareAnalysis(data) {
    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest();
    
    // Configure it: POST-request to the /share-analysis endpoint
    xhr.open('POST', '/share-analysis', true);
    
    // Set the appropriate headers for JSON data
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    
    // Set up what happens on successful data submission
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the JSON response
            try {
                const response = JSON.parse(xhr.responseText);
                
                // Handle successful share
                handleSuccessfulShare(response);
            } catch (e) {
                // Handle JSON parsing error
                console.error('Error parsing JSON response:', e);
                handleFailedShare('Error processing server response');
            }
        } else {
            // Handle HTTP error
            handleFailedShare('Server returned error: ' + xhr.status);
        }
    };
    
    // Set up what happens in case of error
    xhr.onerror = function() {
        handleFailedShare('Network error occurred');
    };
    
    // Send the request with the stringified data
    xhr.send(JSON.stringify(data));
}

/**
 * Function to handle a successful share operation
 * @param {Object} response - The server response
 */
function handleSuccessfulShare(response) {
    // Re-enable controls
    resetControls();
    
    // Show success message
    if (response.message) {
        alert(response.message);
    } else {
        alert('Analysis shared successfully!');
    }
}

/**
 * Function to handle a failed share operation
 * @param {string} errorMessage - The error message to display
 */
function handleFailedShare(errorMessage) {
    // Re-enable controls
    resetControls();
    
    // Show error message
    alert('Failed to share analysis: ' + errorMessage);
}

/**
 * Reset all UI controls after share operation completes
 */
function resetControls() {
    // Re-enable share button and restore text
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        shareButton.disabled = false;
        shareButton.textContent = 'Share';
    }
    
    // Re-enable sidebar options
    document.querySelectorAll('.sidebar-Option').forEach(option => {
        option.classList.remove('disabled');
        option.style.pointerEvents = 'auto';
        option.style.opacity = '1';
    });
    
    // Re-enable form elements
    const textarea = document.querySelector('textarea');
    if (textarea) {
        textarea.disabled = false;
    }
    
    document.querySelectorAll('select').forEach(select => {
        select.disabled = false;
    });
}

/**
 * Handle modal confirmation for sharing
 * This should be called by the modal's Share button
 */
function confirmShare() {
    // Get the Share button from the main form
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
        // Re-enable it first to ensure the click event works
        shareButton.disabled = false;
        
        // Trigger the click event programmatically
        shareButton.click();
    }
    
    // Remove the confirmation modal
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
}
