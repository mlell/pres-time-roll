import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerCode from './pdf.worker.inline.js';
import { formatTime, calculateActiveSegments, decrementTime, addTime, resetTimer as resetTimerLogic, isTimerComplete, setInitialTime } from './timerLogic.js';
import { getRandomStudent, parseStudentNames, getDefaultStudents, validateStudents, getFileBaseName } from './dieLogic.js';
import { saveToStorage as saveToStorageLogic, loadFromStorage as loadFromStorageLogic, clearStorage, createStorageData } from './storageLogic.js';

// Create a Blob URL from the inlined worker code.
// This avoids file:// CORS restrictions that block loading external worker scripts.
const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

// PDF Viewer State
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const dropZone = document.getElementById('dropZone');
const pdfControls = document.getElementById('pdfControls');
const pageInfo = document.getElementById('pageInfo');

// Timer State
let timerMinutes = 0;
let timerSeconds = 0;
let initialTimerMinutes = 0;
let initialTimerSeconds = 0;
let timerInterval = null;
let timerRunning = false;
const timerDisplay = document.getElementById('timerDisplay');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Student Die State
let students = getDefaultStudents();
let studentFileName = '';
let isRolling = false;
const dieDisplay = document.querySelector('.die-face');
const studentNameDisplay = document.getElementById('studentName');

// Sidebar State
const sidebar = document.getElementById('sidebar');
const resizeHandle = document.getElementById('resizeHandle');
let isResizing = false;

// Initialize
function init() {
    setupPDFViewer();
    setupTimer();
    setupStudentDie();
    setupResizableSidebar();
    loadFromStorage();
}

// PDF Viewer Functions
function setupPDFViewer() {
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
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            loadPDF(file);
        }
    });

    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                loadPDF(file);
            }
        };
        input.click();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        renderPage(pageNum);
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        renderPage(pageNum);
    });
}

function loadPDF(file) {
    const fileReader = new FileReader();
    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedarray).promise.then((pdf) => {
            pdfDoc = pdf;
            pageNum = 1;
            dropZone.style.display = 'none';
            pdfControls.style.display = 'flex';
            renderPage(pageNum);
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
            pageRendering = false;
            pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

// Timer Functions
function setupTimer() {
    document.querySelectorAll('.time-btn[data-minutes]').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            const newTime = addTime(timerMinutes, timerSeconds, minutes, initialTimerMinutes, initialTimerSeconds);
            timerMinutes = newTime.minutes;
            timerSeconds = newTime.seconds;
            if (newTime.initialMinutes !== undefined) {
                initialTimerMinutes = newTime.initialMinutes;
                initialTimerSeconds = newTime.initialSeconds;
            }
            updateTimerDisplay();
            updateSegments();
            saveToStorage();
        });
    });

    startPauseBtn.addEventListener('click', toggleTimer);
    resetBtn.addEventListener('click', resetTimer);
}

function toggleTimer() {
    if (timerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerMinutes === 0 && timerSeconds === 0) return;
    timerRunning = true;
    startPauseBtn.classList.add('paused');
    
    timerInterval = setInterval(() => {
        const result = decrementTime(timerMinutes, timerSeconds);
        timerMinutes = result.minutes;
        timerSeconds = result.seconds;
        
        if (result.complete) {
            timerComplete();
            return;
        }
        
        updateTimerDisplay();
        updateSegments();
        saveToStorage();
    }, 1000);
}

function pauseTimer() {
    timerRunning = false;
    startPauseBtn.classList.remove('paused');
    clearInterval(timerInterval);
    saveToStorage();
}

function resetTimer() {
    pauseTimer();
    const reset = resetTimerLogic();
    timerMinutes = reset.minutes;
    timerSeconds = reset.seconds;
    initialTimerMinutes = reset.initialMinutes;
    initialTimerSeconds = reset.initialSeconds;
    updateTimerDisplay();
    updateSegments();
    saveToStorage();
}

function timerComplete() {
    pauseTimer();
    playBeep();
    // Reset initial time when timer completes
    initialTimerMinutes = 0;
    initialTimerSeconds = 0;
    updateSegments();
    saveToStorage();
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerMinutes, timerSeconds);
}

function updateSegments() {
    const activeSegments = calculateActiveSegments(timerMinutes, timerSeconds, initialTimerMinutes, initialTimerSeconds);
    const segments = document.querySelectorAll('.segment');
    
    segments.forEach((segment, index) => {
        if (index < activeSegments) {
            segment.classList.add('active');
        } else {
            segment.classList.remove('active');
        }
    });
}

function playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, 200);
}

// Student Die Functions
function setupStudentDie() {
    dieDisplay.addEventListener('click', rollDie);
    
    // Add drag and drop functionality for loading student list
    const dieSection = document.querySelector('.die-section');
    
    dieSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        dieDisplay.classList.add('dragover');
    });

    dieSection.addEventListener('dragleave', (e) => {
        if (!dieSection.contains(e.relatedTarget)) {
            dieDisplay.classList.remove('dragover');
        }
    });

    dieSection.addEventListener('drop', (e) => {
        e.preventDefault();
        dieDisplay.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            loadStudentsFromFile(file);
        }
    });
}

function rollDie() {
    if (isRolling || !validateStudents(students)) return;
    isRolling = true;
    
    let count = 0;
    const maxCount = 10;
    const interval = setInterval(() => {
        const student = getRandomStudent(students);
        setStudentName(student);
        count++;
        
        if (count >= maxCount) {
            clearInterval(interval);
            isRolling = false;
        }
    }, 100);
}

function setStudentName(text) {
    const previousText = studentNameDisplay.textContent;
    if (previousText) {
        const ghost = studentNameDisplay.cloneNode(true);
        ghost.removeAttribute('id');
        ghost.classList.add('name-ghost');
        dieDisplay.appendChild(ghost);
        ghost.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-30px)', opacity: 0 }
        ], { duration: 250, easing: 'ease-out', fill: 'forwards' }).onfinish = () => ghost.remove();
    }

    studentNameDisplay.textContent = text;
    studentNameDisplay.getAnimations().forEach(animation => animation.cancel());
    studentNameDisplay.animate([
        { transform: 'translateY(30px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 250, easing: 'ease-out' });
}

function loadStudentsFromFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        students = parseStudentNames(text);
        studentFileName = getFileBaseName(file.name);
        saveToStorage();
        setStudentName(studentFileName);
    };
    reader.readAsText(file);
}

// Resizable Sidebar Functions
function setupResizableSidebar() {
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
}

function startResize(e) {
    isResizing = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
}

function resize(e) {
    if (!isResizing) return;
    
    const containerWidth = document.querySelector('.container').offsetWidth;
    const newWidth = containerWidth - e.clientX;
    
    if (newWidth >= 200 && newWidth <= 500) {
        sidebar.style.width = `${newWidth}px`;
    }
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        saveToStorage();
    }
}

// Storage Functions
function saveToStorage() {
    const data = createStorageData(timerMinutes, timerSeconds, timerRunning, students, sidebar.style.width, initialTimerMinutes, initialTimerSeconds, studentFileName);
    saveToStorageLogic('classtimer', data);
}

function loadFromStorage() {
    const data = loadFromStorageLogic('classtimer');
    if (data) {
        timerMinutes = data.timerMinutes || 0;
        timerSeconds = data.timerSeconds || 0;
        initialTimerMinutes = data.initialTimerMinutes || 0;
        initialTimerSeconds = data.initialTimerSeconds || 0;
        students = data.students || getDefaultStudents();
        studentFileName = data.studentFileName || '';
        
        if (data.sidebarWidth) {
            sidebar.style.width = data.sidebarWidth;
        }
        
        updateTimerDisplay();
        updateSegments();
        studentNameDisplay.textContent = studentFileName;
    }
}

// Start the app
init();
