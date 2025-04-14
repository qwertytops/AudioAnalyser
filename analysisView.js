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
        audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
            // Visualize the entire waveform
            visualiseFullWaveform(audioBuffer);

            // Perform analysis and populate data-area
            analyzeAudioData(audioBuffer);

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

function analyzeAudioData(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 4096; // Increase FFT size for better resolution

    // Add a small delay to ensure the audio is playing before analyzing
    setTimeout(() => {
        // Analyze frequency data
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);

        // Perform analysis
        const nyquist = sampleRate / 2;
        const binSize = nyquist / analyser.frequencyBinCount;
        let highestFrequency = 0;
        let lowestFrequency = nyquist;
        let fundamentalFrequency = 0;
        let maxAmplitude = 0;

        frequencyData.forEach((value, index) => {
            const frequency = index * binSize;

            // Ignore 0 Hz and bins with no signal
            if (frequency > 0 && value > 0) {
                highestFrequency = Math.max(highestFrequency, frequency);
                lowestFrequency = Math.min(lowestFrequency, frequency);

                // Update fundamental frequency if this bin has the highest amplitude
                if (value > maxAmplitude) {
                    maxAmplitude = value;
                    fundamentalFrequency = frequency;
                }
            }
        });

        const clipLength = audioBuffer.duration;

        // Calculate signal level in dB
        const signalLevel = 20 * Math.log10(maxAmplitude / 255);
        
        updateDataArea(signalLevel, highestFrequency, lowestFrequency, clipLength, fundamentalFrequency);
    }, 100); // Delay of 100ms to ensure audio is loaded
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
    const noteIndex = Math.round(semitonesFromA4) + 69; // MIDI note number
    const octave = Math.floor(noteIndex / 12) - 1;
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = noteNames[noteIndex % 12];

    const standardNoteFrequency = A4 * Math.pow(2, (noteIndex - 69) / 12);

    // Determine if the frequency is slightly higher or lower
    const difference = frequency - standardNoteFrequency;
    const tolerance = standardNoteFrequency * 0.01; // 2% tolerance for "slightly higher/lower"

    console.log(`Frequency: ${frequency}, Exact Frequency: ${standardNoteFrequency}, Difference: ${difference}, Tolerance: ${tolerance}`);

    let suffix = "";
    if (difference > tolerance) {
        suffix = "+";
    } else if (difference < -tolerance) {
        suffix = "-";
    }

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

        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
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