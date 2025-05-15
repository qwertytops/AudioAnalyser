document.addEventListener('DOMContentLoaded', () => {
    const analysisSelect = document.getElementById('analysisSelect');
    const clipLengthField = document.getElementById('clipLengthField');
    const maxLevelField = document.getElementById('maxLevelField');
    const highestFrequencyField = document.getElementById('highestFrequencyField');
    const lowestFrequencyField = document.getElementById('lowestFrequencyField');
    const fundamentalFrequencyField = document.getElementById('fundamentalFrequencyField');
    const recipientInput = document.getElementById('recipientInput');
    const usernameSuggestions = document.getElementById('usernameSuggestions');
    const shareButton = document.getElementById('shareButton');
    
    // Get references to the modal elements
    const shareResultModal = new bootstrap.Modal(document.getElementById('shareResultModal'));
    const shareResultMessage = document.getElementById('shareResultMessage');

    // Function to fetch and populate analysis fields
    function populateAnalysisFields(analysisId) {
        // Show loading state
        setLoadingState(true);
        
        fetch(`/api/analysis/${analysisId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch analysis data');
                }
                return response.json();
            })
            .then(data => {
                // Reset loading state
                setLoadingState(false);
                
                if (data.error) {
                    showShareResultModal('error', data.error);
                    return;
                }

                // Populate the fields with the fetched data
                clipLengthField.textContent = `${data.clipLength.toFixed(2)} seconds`;
                maxLevelField.textContent = `${data.maxLevel.toFixed(2)} dBFS`;
                highestFrequencyField.textContent = `${data.highestFrequency.toFixed(2)} Hz`;
                lowestFrequencyField.textContent = `${data.lowestFrequency.toFixed(2)} Hz`;
                fundamentalFrequencyField.textContent = `${data.fundamentalFrequency.toFixed(2)} Hz`;

                // Draw the frequency array on the canvas
                visualiseFullWaveform(data.frequencyArray);
            })
            .catch(error => {
                // Reset loading state
                setLoadingState(false);
                
                console.error('Error fetching analysis:', error);
                showShareResultModal('error', 'An error occurred while fetching the analysis data.');
            });
    }
    
    // Helper function to set loading state
    function setLoadingState(isLoading) {
        const fields = [
            clipLengthField, 
            maxLevelField, 
            highestFrequencyField, 
            lowestFrequencyField, 
            fundamentalFrequencyField
        ];
        
        if (isLoading) {
            fields.forEach(field => {
                field.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
            });
        }
    }

    // Event listener for the select dropdown
    analysisSelect.addEventListener('change', (event) => {
        const selectedAnalysisId = event.target.value;
        if (selectedAnalysisId) {
            populateAnalysisFields(selectedAnalysisId);
        }
    });

    // Populate fields for the initially selected analysis
    if (analysisSelect.value) {
        populateAnalysisFields(analysisSelect.value);
    }

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
                        recipientInput.value = username; // Set the input value to the clicked username
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
    recipientInput.addEventListener('click', (event) => {
        const query = event.target.value.trim();
        fetchUsernameSuggestions(query);
    });
    recipientInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        fetchUsernameSuggestions(query);
    });
    
    // Add event listener for share button
    shareButton.addEventListener('click', shareAnalysis);

    // Hide suggestions when clicking outside the input field
    document.addEventListener('click', (event) => {
        if (!recipientInput.contains(event.target) && !usernameSuggestions.contains(event.target)) {
            usernameSuggestions.innerHTML = '';
        }
    });
});

// Helper function to show the share result modal
function showShareResultModal(type, message, showNavigationOptions = false) {
    const shareResultModal = document.getElementById('shareResultModal');
    const shareResultMessage = document.getElementById('shareResultMessage');
    const modalHeader = document.querySelector('#shareResultModal .modal-header');
    const modalTitle = document.getElementById('shareResultModalLabel');
    const modalFooter = document.querySelector('#shareResultModal .modal-footer');
    
    // Set message content
    shareResultMessage.textContent = message;
    
    // Set message style based on type
    shareResultMessage.className = ''; // Reset classes
    modalHeader.className = 'modal-header'; // Reset header classes
    
    // Reset footer content
    modalFooter.innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
    
    if (type === 'error') {
        shareResultMessage.classList.add('text-danger');
        modalHeader.classList.add('bg-danger', 'text-white');
        modalTitle.textContent = 'Error';
    } else {
        shareResultMessage.classList.add('text-success');
        modalHeader.classList.add('bg-success', 'text-white');
        modalTitle.textContent = 'Success';
        
        // Add navigation options for success case if requested
        if (showNavigationOptions) {
            // Add buttons to navigate to account page or analyze another file
            const accountButton = document.createElement('a');
            accountButton.href = '/account?section=history'; // Add URL parameter to trigger history section
            accountButton.className = 'btn btn-primary me-2';
            accountButton.id = 'viewHistoryBtn';
            accountButton.innerHTML = '<i class="fas fa-history me-1"></i>View Analysis History';
            
            // Add click event to show loading state
            accountButton.addEventListener('click', function(e) {
                // Prevent default navigation
                e.preventDefault();
                
                // Show loading state
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
                this.disabled = true;
                
                // Navigate to the account page after a brief delay
                setTimeout(() => {
                    window.location.href = this.href;
                }, 100);
            });
            
            const uploadButton = document.createElement('a');
            uploadButton.href = '/upload';
            uploadButton.className = 'btn btn-info me-2';
            uploadButton.innerHTML = '<i class="fas fa-upload me-1"></i>Upload New Audio';
            
            // Insert before the Close button
            modalFooter.prepend(accountButton);
            modalFooter.prepend(uploadButton);
        }
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(shareResultModal);
    modal.show();
    
    // Auto-dismiss success modals after 6 seconds if not an error
    if (type !== 'error') {
        setTimeout(() => {
            modal.hide();
        }, 6000);
    }
    
    // Ensure the modal backdrop is removed when the modal is closed
    shareResultModal.addEventListener('hidden.bs.modal', function (event) {
        // Remove any lingering backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
    }, { once: true });
}

function visualiseFullWaveform(rawData) {
    const canvas = document.getElementById("oscilloscope");
    if (!canvas) return;
    
    const canvasCtx = canvas.getContext("2d");

    // Adjust canvas resolution for high-DPI displays without resizing
    const devicePixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;

    canvasCtx.scale(devicePixelRatio, devicePixelRatio);

    // Clear the canvas
    canvasCtx.fillStyle = '#f8f9fa';
    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // For dark mode, use a darker background
    if (document.documentElement.getAttribute('data-bs-theme') === 'dark') {
        canvasCtx.fillStyle = '#343a40';
        canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Downsample the audio data to fit the canvas width
    const samplesPerPixel = Math.ceil(rawData.length / canvasWidth);
    const downsampledData = [];
    for (let i = 0; i < rawData.length; i += samplesPerPixel) {
        downsampledData.push(rawData[i]);
    }

    // Normalize the data to fit within the canvas height
    const normalisedData = downsampledData.map(value => (value + 1) / 2 * canvasHeight);

    function drawWaveform() {
        // Draw the waveform
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvasHeight / 2); // Start at the middle of the canvas

        for (let x = 0; x < normalisedData.length; x++) {
            const y = canvasHeight - normalisedData[x];
            canvasCtx.lineTo(x, y);
        }

        canvasCtx.strokeStyle = 'rgb(67, 97, 238)'; // Match primary color
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();
    }

    drawWaveform();
}

function shareAnalysis() {
    const analysisSelect = document.getElementById('analysisSelect');
    const recipientInput = document.getElementById('recipientInput');
    const messageInput = document.getElementById('message');
    const shareButton = document.getElementById('shareButton');

    const selectedAnalysisId = analysisSelect.value;
    const recipientUsername = recipientInput.value.trim();
    const message = messageInput.value.trim();

    if (!selectedAnalysisId) {
        showShareResultModal('error', 'Please select an analysis to share.');
        return;
    }

    if (!recipientUsername) {
        showShareResultModal('error', 'Please enter a username to share with.');
        return;
    }
    
    // Show loading state on the button
    const originalButtonText = shareButton.innerHTML;
    shareButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sharing...';
    shareButton.disabled = true;

    const requestData = {
        analysisId: selectedAnalysisId,
        to: recipientUsername,
        message: message || ""
    };

    fetch('/share', {
        method: 'POST',
        headers: addCsrfHeader({
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Success response:", data);
        
        // Clear input fields after successful share
        recipientInput.value = '';
        messageInput.value = '';
        
        // Reset button state
        shareButton.innerHTML = originalButtonText;
        shareButton.disabled = false;
        
        // Show success modal with additional navigation options
        showShareResultModal('success', 'Analysis shared successfully!', true);
    })
    .catch(error => {
        console.error("Error details:", error);
        showShareResultModal('error', `Failed to share analysis: ${error.message}`);
        
        // Reset button state
        shareButton.innerHTML = originalButtonText;
        shareButton.disabled = false;
    });
}