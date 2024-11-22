// FFmpeg instance
let ffmpeg = null;
let selectedFile = null;
let fetchFileGlobal = null;
let convertedVideoBlob = null;

// Initialize FFmpeg
async function initFFmpeg() {
    try {
        const { createFFmpeg, fetchFile } = FFmpeg;
        fetchFileGlobal = fetchFile;
        ffmpeg = createFFmpeg({ log: true });
      
        await ffmpeg.load();
        console.log('FFmpeg loaded');
    } catch (error) {
        console.error('FFmpeg load error:', error);
    }
}

// Add this helper function at the top
function showStep(stepId) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    // Show the requested step
    document.getElementById(stepId).classList.add('active');
}

// Handle file selection
function handleFileSelect(file) {
    if (!file || !file.type.includes('gif')) {
        alert('Please select a GIF file');
        return;
    }

    selectedFile = file;
    
    // Show GIF preview
    const gifPreview = document.getElementById('gifPreview');
    gifPreview.src = URL.createObjectURL(file);
    
    // Switch to preview step
    showStep('previewStep');
}

// Handle file conversion
async function convertToVideo() {
    if (!selectedFile || !ffmpeg) return;

    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';

    try {
        // Read the file as ArrayBuffer
        // const fileData = await selectedFile.arrayBuffer();
        
        // Write the file to FFmpeg's virtual filesystem
        await ffmpeg.FS('writeFile', 'input.gif', await fetchFileGlobal(selectedFile));

        // Run FFmpeg command to convert GIF to WebM
        await ffmpeg.run.apply(null, [
            '-i', 'input.gif',
            '-c:v', 'libvpx',
            '-crf', '20',
            '-b:v', '1M',
            '-auto-alt-ref', '0',
            'output.webm'
        ]);

        // Read the output file
        const data = await ffmpeg.FS('readFile', 'output.webm');
        convertedVideoBlob = new Blob([data.buffer], { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(convertedVideoBlob);
        
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.src = videoUrl;

        // Show video step
        showStep('videoStep');

    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error converting file. Please try again.');
    } finally {
        convertBtn.textContent = 'Convert to Video';
        convertBtn.disabled = false;
    }
}

// Add the download handler function
function handleDownload() {
    if (!convertedVideoBlob) return;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(convertedVideoBlob);
    
    // Get original filename and replace extension
    const originalName = selectedFile.name.replace(/\.gif$/, '');
    downloadLink.download = `${originalName}.webm`;
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Initialize the application
async function init() {
    // Initialize FFmpeg
    await initFFmpeg();

    // Set up file input handler
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Set up drag and drop
    const dropZone = document.getElementById('dropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // Set up convert button handler
    document.getElementById('convertBtn').addEventListener('click', convertToVideo);

    // Add download button handler
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
}

// Start the application
init(); 