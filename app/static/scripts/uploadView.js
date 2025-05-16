window.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.querySelector('#dragDrop');
    const fileInput = document.querySelector('#formFile');
    const nameDisplay = document.getElementById('filename');
    const uploadButton = document.getElementById('uploadButton');
    const fileList = document.getElementById('uploadedFiles');
    const sidePanel = document.getElementById('panel');
    const arrow = document.getElementById('icon');
    const togglePanel = document.getElementById('slide');

    let uploadedList = new Set();
    let panel = false;

    function displayFiles(files) {
        for (let file of files) {
            uploadedList.add(file.name);
        }   
        nameDisplay.textContent = `Selected files: ${[...files].map(f => f.name).join(', ')}`;
    }
            
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => e.preventDefault()); //prevent browser from opening files
    });

    dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    
    dropZone.addEventListener('drop', e => {
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            displayFiles(files);
            fileInput.files = files;
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            displayFiles(fileInput.files);
        }   
    });

    uploadButton.addEventListener('click', () => {
        if (uploadedList.size === 0) {
        alert("Please select a file before uploading!");
        return;
        }
        fileList.innerHTML = '';
        uploadedList.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file;
            fileList.appendChild(li);
        });
        if (!panel) toggleSlidePanel();
        

    });

    togglePanel.addEventListener('click', toggleSlidePanel);

    function toggleSlidePanel() {
        panel = !panel;
        if (panel) {
        sidePanel.classList.add("open");
        arrow.setAttribute('transform', 'rotate(180)');
        } else {
        sidePanel.classList.remove("open");
        arrow.removeAttribute('transform');
        }
    }

    document.getElementById('analyseButton').addEventListener('click', () => {
        chosenFiles = fileInput.files;
        const formData = new FormData();
        for (let i=0 ; i < chosenFiles.length; i++) {
            formData.append('files', chosenFiles[i]);
        }
        fetch('/upload', {
            method: 'POST',
            headers: addCsrfHeader(),
            body: formData
        })
        .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                return response.json();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occured while attempting to upload files.');
        });
    });
});