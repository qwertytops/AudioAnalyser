let dropZone;
let fileInput;
let analyseButton;

const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();

window.onload = function () {
    dropZone = document.getElementById('drop-zone');
    fileInput = document.getElementById('fileInput');
    analyseButton = document.getElementById('analyseButton');

    console.log('Drop Zone:', dropZone);
    console.log('File Input:', fileInput);

    // Event listener for clicking the drop zone
    dropZone.addEventListener('click', () => {
        console.log('Drop zone clicked');
        fileInput.click();
    });

    // Event listener for dragover
    dropZone.addEventListener('dragover', (e) => {
        console.log('Dragover event');
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    // Event listener for dragleave
    dropZone.addEventListener('dragleave', () => {
        console.log('Dragleave event');
        dropZone.classList.remove('dragover');
    });

    // Event listener for drop
    dropZone.addEventListener('drop', (e) => {
        console.log('Drop event');
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
        console.log('File input changed');
        if (fileInput.files.length > 0) {
            displayFileName(fileInput.files[0]);
        }
        analyseButton.disabled = false;
    });

    console.log('All event listeners attached');
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
        alert('No file selected!');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        // Decode the audio data
        audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
            // Visualize the entire waveform
            visualizeFullWaveform(audioBuffer);

            // Smoothly scroll to the canvas
            const canvas = document.getElementById("oscilloscope");
            canvas.scrollIntoView({ behavior: "smooth", block: "start" });
        }, (error) => {
            console.error('Error decoding audio file:', error);
            alert('Error decoding audio file.');
        });
    };

    reader.onerror = function () {
        console.error('Error reading file:', reader.error);
        alert('Error reading file.');
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
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

function visualizeFullWaveform(audioBuffer) {
    const canvas = document.getElementById("oscilloscope");
    const canvasCtx = canvas.getContext("2d");

    // Get the audio data from the first channel
    const rawData = audioBuffer.getChannelData(0); // Use the first channel
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Downsample the audio data to fit the canvas width
    const samplesPerPixel = Math.ceil(rawData.length / canvasWidth);
    const downsampledData = [];
    for (let i = 0; i < rawData.length; i += samplesPerPixel) {
        downsampledData.push(rawData[i]);
    }

    // Normalize the data to fit within the canvas height
    const normalizedData = downsampledData.map(value => (value + 1) / 2 * canvasHeight);

    // Clear the canvas
    canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw the waveform
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvasHeight / 2); // Start at the middle of the canvas

    for (let i = 0; i < normalizedData.length; i++) {
        const x = i;
        const y = canvasHeight - normalizedData[i];
        canvasCtx.lineTo(x, y);
    }

    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    canvasCtx.lineWidth = 2;
    canvasCtx.stroke();
}