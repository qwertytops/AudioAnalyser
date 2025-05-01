let dropZone;
let fileInput;
let analyseButton;

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
let audioSource = null; // To store the current audio source

window.onload = function () {
    dropZone = document.getElementById('drop-zone');
    fileInput = document.getElementById('fileInput');
    analyseButton = document.getElementById('analyseButton');
    saveButton = document.getElementById('saveButton');

    // Event listener for clicking the drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Event listener for dragover
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Event listener for dragleave
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    // Event listener for drop
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            displayFileName(files[0]);
        }
        analyseButton.disabled = false;
    });

    // Event listener for file input change
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            displayFileName(fileInput.files[0]);
        }
        analyseButton.disabled = false;
    });

    analyseButton.addEventListener('click', () => {
        analyseButton.scrollIntoView({ behavior: "smooth", block: "start" });
        analyseFile();
    })
};

function displayFileName(file) {
    const dropZoneText = document.getElementById('drop-zone-text');
    if (file) {
        dropZoneText.textContent = `Selected ${file.name}`;
    } else {
        dropZoneText.textContent = 'Drag & drop files here or click to browse';
    }
}

function analyseFile() {
    const file = fileInput.files[0];
    if (!file) {
        alert('No file selected');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Decode the audio data
        audioCtx.decodeAudioData(arrayBuffer, async (audioBuffer) => {
            visualiseFullWaveform(audioBuffer); // works with regular audio context

            const offlineCtx = new OfflineAudioContext(
                audioBuffer.numberOfChannels,
                audioBuffer.length,
                audioBuffer.sampleRate
            );
            const offlineSource = offlineCtx.createBufferSource();
            offlineSource.buffer = audioBuffer;

            const analysisNode = offlineCtx.createAnalyser();
            const fftSize = parseInt(document.getElementById('fftSize').value, 10);
            analysisNode.fftSize = fftSize;
            const bufferLengthAlt = analysisNode.frequencyBinCount;

            const dataArray = new Uint8Array(bufferLengthAlt);
            let fullArray = new Uint32Array(bufferLengthAlt);

            offlineSource.connect(analysisNode);
            offlineSource.connect(offlineCtx.destination);
            offlineSource.start(0);

            const step = 0.1;
            let totalSteps = 0;
            const durationInSeconds = audioBuffer.duration;

            let maxLevel = -Infinity;

            for (let i = 0; i < durationInSeconds; i += step) {
                const stoptime = i;
                // the trick is to call suspend at each time point you're interested in. 
                // do not await since it won't ever happen - you can only suspend a running context,
                // and we'll run it on the last line by calling startRendering. these will only start resolving as the context is rendering
                // so we're essentially scheduling stopping time points
              
                void offlineCtx.suspend(i).then((a) => {

                    analysisNode.getByteFrequencyData(dataArray);
                    maxLevel = Math.max(calculateDBFSFloat(analysisNode), maxLevel);

                    fullArray.forEach((_, index) => {
                        fullArray[index] += dataArray[index];
                    });

                    void offlineCtx.resume();
                });
                totalSteps++;
            }
              
            await offlineCtx.startRendering();
            fullArray.forEach((_, index) => {
                fullArray[index] = fullArray[index] / totalSteps;
            });
            analyzeAudioData(fullArray, analysisNode, audioBuffer.sampleRate, audioBuffer.duration, maxLevel);

            // Setup play, pause, and stop controls
            setupAudioControls(audioBuffer);

            // Smoothly scroll to the analyse button
            analyseButton.scrollIntoView({ behavior: "smooth", block: "start" });
        }, (error) => {
            console.error('Error decoding audio file:', error);
            alert('Error decoding audio file');
        });
    };

    reader.onerror = function () {
        console.error('Error reading file:', reader.error);
        alert('Error reading file');
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
}

function analyzeAudioData(frequencyData, analyser, sampleRate, duration, maxLevel) {
    // console.log("Frequency data is:", frequencyData);

    const noiseFloor = parseFloat(document.getElementById('noiseFloor').value);

    // Perform analysis
    const nyquist = sampleRate / 2;
    const binSize = nyquist / analyser.frequencyBinCount;
    let highestFrequency = 0;
    let lowestFrequency = nyquist;
    let fundamentalFrequency = 0;
    let maxAmplitude = 0;

    frequencyData.forEach((value, index) => {
        const frequency = index * binSize;
        const signalLevel = 20 * Math.log10(value / 255);
        // console.log(frequency, value);

        // Ignore 0 Hz and bins with no signal
        if (frequency > 0 && signalLevel > noiseFloor) {
            highestFrequency = Math.max(highestFrequency, frequency);
            lowestFrequency = Math.min(lowestFrequency, frequency);

            // Update fundamental frequency if this bin has the highest amplitude
            if (value > maxAmplitude) {
                maxAmplitude = value;
                fundamentalFrequency = frequency;
            }
        }
    });

    // Calculate signal level in dBFS
    // const signalLevel = 20 * Math.log10(maxAmplitude / 255);
    // console.log(maxAmplitude, maxAmplitude / 255, Math.log10(maxAmplitude / 255), signalLevel);
    const signalLevel = maxLevel;
    
    updateDataArea(signalLevel, highestFrequency, lowestFrequency, duration, fundamentalFrequency);
}

function updateDataArea(signalLevel,highestFrequency, lowestFrequency, clipLength, fundamentalFrequency) {
    document.getElementById("max-db").textContent = signalLevel.toFixed(2) + " dB";
    document.getElementById("highest-frequency").textContent = highestFrequency.toFixed(2);
    document.getElementById("highest-pitch").textContent = frequencyToPitchStr(highestFrequency);
    document.getElementById("lowest-frequency").textContent = lowestFrequency.toFixed(2);
    document.getElementById("lowest-pitch").textContent = frequencyToPitchStr(lowestFrequency);
    document.getElementById("clip-length").textContent = clipLength.toFixed(2);
    document.getElementById("fundamental-frequency").textContent = fundamentalFrequency.toFixed(2);
    document.getElementById("fundamental-pitch").textContent = frequencyToPitchStr(fundamentalFrequency);
}

function frequencyToPitchStr(frequency) {
    if (frequency <= 0) return "N/A";

    const A4 = 440;
    const semitonesFromA4 = 12 * Math.log2(frequency / A4);
    let noteIndex = Math.round(semitonesFromA4) + 69; // MIDI note number
    const octave = Math.floor(noteIndex / 12) - 1;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    while (noteIndex < 0) { noteIndex = 12; }
    const noteName = noteNames[noteIndex % 12];

    const standardNoteFrequency = A4 * Math.pow(2, (noteIndex - 69) / 12);

    // Determine if the frequency is slightly higher or lower
    const difference = frequency - standardNoteFrequency;
    const tolerance = standardNoteFrequency * 0.01; // 2% tolerance for "slightly higher/lower"

    let suffix = "";
    // if (difference > tolerance) {
    //     suffix = "+";
    // } else if (difference < -tolerance) {
    //     suffix = "-";
    // }

    return `${noteName}${octave}${suffix}`;
}

function visualizeAudio() {
    const canvas = document.getElementById("oscilloscope");
    const canvasCtx = canvas.getContext("2d");

    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    draw();
}

function visualiseFullWaveform(audioBuffer) {
    const canvas = document.getElementById("oscilloscope");
    const canvasCtx = canvas.getContext("2d");

    // Adjust canvas resolution for high-DPI displays without resizing
    const devicePixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = canvas.offsetWidth;
    const canvasHeight = canvas.offsetHeight;

    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;

    canvasCtx.scale(devicePixelRatio, devicePixelRatio);

    // Get the audio data from the first channel
    const rawData = audioBuffer.getChannelData(0);

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

let isPlaying = false;
let isPaused = false;

function setupAudioControls(audioBuffer) {
    playButton.addEventListener("click", () => {
        console.log('play')
        playAudio(audioBuffer);
    });

    pauseButton.addEventListener("click", () => {
        console.log('un/pause')
        if (!isPlaying) { return; }
        if (!isPaused) {
            audioCtx.suspend().then(() => {
                isPaused = true;
            });
        } else {
            audioCtx.resume().then(() => {
                isPaused = false;
            })
        }
    });

    stopButton.addEventListener("click", () => {
        console.log('stop');
        stopAudio();
    });
}

function stopAudio() {
    if (!audioSource || !isPlaying) { return; }
    if (isPaused) {
        audioCtx.resume();
    }
    audioSource.stop();
    audioSource.disconnect();
    audioSource = null;
    isPlaying = false;
    isPaused = false;
}

function playAudio(audioBuffer) {
    stopAudio();
    
    audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioCtx.destination);
    audioSource.start();
    isPlaying = true;
}

function calculateDBFSFloat(analyser) {
    const bufferLength = analyser.fftSize;
    const timeDomainData = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(timeDomainData);
    // console.log("tdd:", timeDomainData);

    // Convert the byte data (0-255) to normalized amplitude (-1 to 1)
    const normalizedData = Array.from(timeDomainData).map(value => (value - 128) / 128);
    // console.log("nd:", normalizedData);

    // Calculate RMS (Root Mean Square) amplitude
    const rms = Math.sqrt(
        normalizedData.reduce((sum, value) => sum + value * value, 0) / bufferLength
    );
    // console.log("rms:", rms);

    // Calculate dBFS
    const dbfs = 20 * Math.log10(rms);
    return dbfs;
}

function saveAnalysis() {
    const analysisData = {
        filename: document.getElementById('drop-zone-text').textContent.replace('Selected ', ''),
        clipLength: document.getElementById('clip-length').textContent,
        maxLevel: document.getElementById('max-db').textContent,
        highestFrequency: document.getElementById('highest-frequency').textContent,
        lowestFrequency: document.getElementById('lowest-frequency').textContent,
        fundamentalFrequency: document.getElementById('fundamental-frequency').textContent,
    };

    console.log('Saving analysis:', analysisData);

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
    })
    .then((response) => {
        if (response.ok) {
            // Show the Bootstrap modal
            const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
            shareModal.show();

            // Add event listener to the "Share" button in the modal
            document.getElementById('confirmShareButton').addEventListener('click', () => {
                window.location.href = '/share';
            });
        } else if (response.status === 401) {
            alert('You must be logged in to save and share your analysis.');
            window.location.href = '/signUp';
        }
    })
    .catch((error) => {
        console.error('Error saving analysis:', error);
        alert('An error occurred while saving the analysis.');
    });
}

// Add the toggleTheme function from introductoryView.js
function toggleTheme() {
    const htmlElement = document.documentElement;
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
// Apply saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
});

// Add this to your JavaScript file or in a <script> tag at the end of your HTML file
document.addEventListener('DOMContentLoaded', function() {
    // Hide oscilloscope and results sections initially
    const oscilloscope = document.querySelector('#oscilloscope'); // Update with your actual ID
    const resultsSection = document.querySelector('#data-area');
    const playButton = document.querySelector('#playButton'); // Update with your actual button ID
    const pauseButton = document.querySelector('#pauseButton'); // Update with your actual button ID
    const stopButton = document.querySelector('#stopButton'); // Update with your actual button ID
    
    if (oscilloscope) oscilloscope.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';
    if (playButton) playButton.style.display = 'none';
    if (pauseButton) pauseButton.style.display = 'none';
    if (stopButton) stopButton.style.display = 'none';
    
    // Add event listener to the Analysis button
    const analyseButton = document.querySelector('#analyseButton'); // Update with your actual button ID
    
    if (analyseButton) {
        analyseButton.addEventListener('click', function() {
            // Show the hidden sections when button is clicked
            if (oscilloscope) oscilloscope.style.display = 'block';
            if (resultsSection) resultsSection.style.display = 'block';
            if (playButton) playButton.style.display = 'inline-block';
            if (pauseButton) pauseButton.style.display = 'inline-block';
            if (stopButton) stopButton.style.display = 'inline-block';
        });
    }
});

