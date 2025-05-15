document.addEventListener('DOMContentLoaded', () => {
    const analysisSelect = document.getElementById('analysisSelect');
    const clipLengthField = document.getElementById('clipLengthField');
    const maxLevelField = document.getElementById('maxLevelField');
    const highestFrequencyField = document.getElementById('highestFrequencyField');
    const lowestFrequencyField = document.getElementById('lowestFrequencyField');
    const fundamentalFrequencyField = document.getElementById('fundamentalFrequencyField');
    const recipientInput = document.getElementById('recipientInput');
    const usernameSuggestions = document.getElementById('usernameSuggestions');
    
    // Get references to the modal elements
    const shareResultModal = new bootstrap.Modal(document.getElementById('shareResultModal'));
    const shareResultMessage = document.getElementById('shareResultMessage');

    // Function to fetch and populate analysis fields
    function populateAnalysisFields(analysisId) {
        fetch(`/api/analysis/${analysisId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch analysis data');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    showShareResultModal('error', data.error);
                    return;
                }

                // Populate the fields with the fetched data
                clipLengthField.textContent = `${data.clipLength.toFixed(2)}s`;
                maxLevelField.textContent = `${data.maxLevel.toFixed(2)} dBFS`;
                highestFrequencyField.textContent = `${data.highestFrequency.toFixed(2)} Hz`;
                lowestFrequencyField.textContent = `${data.lowestFrequency.toFixed(2)} Hz`;
                fundamentalFrequencyField.textContent = `${data.fundamentalFrequency.toFixed(2)} Hz`;

                // Draw the frequency array on the canvas
                visualiseFullWaveform(data.frequencyArray);
                console.log('here3')
            })
            .catch(error => {
                console.error('Error fetching analysis:', error);
                showShareResultModal('error', 'An error occurred while fetching the analysis data.');
            });
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
        console.log("fetching...")
        fetch(queryString)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch username suggestions');
                }
                return response.json();
            })
            .then(usernames => {
                console.log(usernames);
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

    // Hide suggestions when clicking outside the input field
    document.addEventListener('click', (event) => {
        if (!recipientInput.contains(event.target) && !usernameSuggestions.contains(event.target)) {
            usernameSuggestions.innerHTML = '';
        }
    });
});

// Helper function to show the share result modal
function showShareResultModal(type, message) {
    const shareResultModal = new bootstrap.Modal(document.getElementById('shareResultModal'));
    const shareResultMessage = document.getElementById('shareResultMessage');
    
    // Set message content
    shareResultMessage.textContent = message;
    
    // Set message style based on type
    shareResultMessage.className = ''; // Reset classes
    if (type === 'error') {
        shareResultMessage.classList.add('text-danger');
    } else {
        shareResultMessage.classList.add('text-success');
    }
    
    // Show the modal
    shareResultModal.show();
}

function visualiseFullWaveform(rawData) {
    const canvas = document.getElementById("oscilloscope");
    const canvasCtx = canvas.getContext("2d");

    // Adjust canvas resolution for high-DPI displays without resizing
    const devicePixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;

    canvasCtx.scale(devicePixelRatio, devicePixelRatio);

    // Downsample the audio data to fit the canvas width
    const samplesPerPixel = Math.ceil(rawData.length / canvasWidth);
    const downsampledData = [];
    for (let i = 0; i < rawData.length; i += samplesPerPixel) {
        downsampledData.push(rawData[i]);
    }

    // Normalize the data to fit within the canvas height
    const normalisedData = downsampledData.map(value => (value + 1) / 2 * canvasHeight);

    function drawWaveform() {
        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw the waveform
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvasHeight / 2); // Start at the middle of the canvas

        for (let x = 0; x < normalisedData.length; x++) {
            const y = canvasHeight - normalisedData[x];
            canvasCtx.lineTo(x, y);
        }

        canvasCtx.strokeStyle = 'rgb(0, 8, 255)';
        canvasCtx.lineWidth = 1;
        canvasCtx.stroke();
    }

    drawWaveform();
}

function shareAnalysis() {
    const analysisSelect = document.getElementById('analysisSelect');
    const recipientInput = document.getElementById('recipientInput');
    const messageInput = document.getElementById('message');

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
        showShareResultModal('success', 'Analysis shared successfully!');
        
        // Optional: Clear input fields after successful share
        recipientInput.value = '';
        messageInput.value = '';
    })
    .catch(error => {
        console.error("Error details:", error);
        showShareResultModal('error', `Failed to share analysis: ${error.message}`);
    });
}