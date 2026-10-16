import { formatTime, calculateActiveSegments, decrementTime, addTime, resetTimer as resetTimerLogic, isTimerComplete, setInitialTime } from './timerLogic.js';
import { getRandomStudent, parseStudentNames, getDefaultStudents, validateStudents, getFileBaseName } from './dieLogic.js';
import { saveToStorage as saveToStorageLogic, loadFromStorage as loadFromStorageLogic, clearStorage, createStorageData } from './storageLogic.js';
import { isRemarkFile, getRemarkFileName, generateRemarkHTML } from './remarkLogic.js';
import { savePDF, loadPDF as loadSavedPDF, clearPDF } from './pdfStorage.js';
import { registerServiceWorker } from './pwaLogic.js';
import { getTargetPage, getNavState, shouldRestorePDF, getFitScale, isRenderableScale, getCanvasPixelSize } from './pdfLogic.js';
import { resolveKeyAction } from './keyboardLogic.js';
import { isSidebarWidthAllowed } from './layoutLogic.js';

// Browser and library dependencies are injected so this module has no side effects on import.
// main.js is the browser entry point that supplies the real values.
export function createApp({ document, window, pdfjs, remarkSource }) {
    // PDF Viewer State
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let currentRenderTask = null;
    let restoredPageNum = 1;
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');
    const pdfViewer = document.getElementById('pdfViewer');
    const dropZone = document.getElementById('dropZone');

    // Remark Viewer State
    let remarkViewer = document.getElementById('remarkViewer');
    let remarkDropZone = document.getElementById('remarkDropZone');
    let remarkFrame = document.getElementById('remarkFrame');
    let currentRemarkFile = null;
    let currentRemarkContent = null;

    // Timer State
    let timerMinutes = 0;
    let timerSeconds = 0;
    let initialTimerMinutes = 0;
    let initialTimerSeconds = 0;
    let timerInterval = null;
    let timerRunning = false;
    const timerDisplay = document.getElementById('timerDisplay');
    const startPauseBtn = document.getElementById('startPauseBtn');
    const timerCircle = document.querySelector('.timer-circle');
    const resetBtn = document.getElementById('resetBtn');

    // Student Die State
    let students = getDefaultStudents();
    let studentFileName = '';
    let isRolling = false;
    let studentResetTimeout = null;
    const STUDENT_RESET_DELAY_MS = 15000;
    const dieDisplay = document.querySelector('.die-face');
    const studentNameDisplay = document.getElementById('studentName');
    const dieHint = document.getElementById('dieHint');
    const DIE_HINT_DURATION_MS = 4000;
    let dieHintTimeout = null;
    const deleteBtn = document.getElementById('deleteBtn');
    const openFileBtn = document.getElementById('openFileBtn');
    const deleteConfirmation = document.getElementById('deleteConfirmation');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    let deleteConfirmationTimeout = null;

    // Sidebar State
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('resizeHandle');
    let isResizing = false;

    // Initialize
    function init() {
        setupPDFViewer();
        setupKeyboardShortcuts();
        setupTimer();
        setupStudentDie();
        setupResizableSidebar();
        setupPresentationReset();
        registerServiceWorker();
        updateNavButtons();
        loadFromStorage();
        restorePDF();
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
            } else if (file && isRemarkFile(file)) {
                loadRemarkFile(file);
            }
        });

        dropZone.addEventListener('click', openPDFPicker);

        new ResizeObserver(() => {
            if (pdfDoc) renderPage(pageNum);
        }).observe(pdfViewer);

        document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const action = resolveKeyAction({
                key: e.key,
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                altKey: e.altKey,
                isEditableTarget: e.target.matches('input, textarea, select, [contenteditable]'),
            }, Boolean(currentRemarkContent));
            if (!action) return;

            e.preventDefault();
            if (action.type === 'openRemark') {
                openRemarkInNewWindow();
            } else {
                changePage(action.delta);
            }
        });
    }

    function changePage(delta) {
        if (pdfDoc) {
            const target = getTargetPage(pageNum, delta, pdfDoc.numPages);
            if (target === null) return;
            pageNum = target;
            updateNavButtons();
            renderPage(pageNum);
            saveToStorage();
        } else if (currentRemarkContent && remarkFrame.contentWindow) {
            if (delta > 0) {
                remarkFrame.contentWindow.postMessage('nextSlide', '*');
            } else {
                remarkFrame.contentWindow.postMessage('previousSlide', '*');
            }
        }
    }

    function updateNavButtons() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        const nav = getNavState({
            hasPdf: Boolean(pdfDoc),
            pageNum,
            numPages: pdfDoc ? pdfDoc.numPages : 0,
            hasRemark: Boolean(currentRemarkContent),
        });
        prevBtn.disabled = nav.prevDisabled;
        nextBtn.disabled = nav.nextDisabled;
    }

    function openPDFPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,.md,.markdown,.remark';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.type === 'application/pdf') {
                    loadPDF(file);
                } else if (isRemarkFile(file)) {
                    loadRemarkFile(file);
                }
            }
        };
        input.click();
    }

    function loadPDF(file) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const buffer = this.result;
            savePDF(buffer.slice(0), file.name);
            clearRemarkState();
            saveToStorage();
            openPDFData(buffer);
        };
        fileReader.readAsArrayBuffer(file);
    }

    function updatePDFViewerState() {
        dropZone.style.display = pdfDoc ? 'none' : 'block';
        canvas.hidden = !pdfDoc;
    }

    function openPDFData(buffer, startPage = 1) {
        return pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise.then((pdf) => {
            pdfDoc = pdf;
            pageNum = Math.min(Math.max(startPage, 1), pdf.numPages);
            updatePDFViewerState();
            updateNavButtons();
            renderPage(pageNum);
            saveToStorage();
        });
    }

    async function restorePDF() {
        if (currentRemarkContent) return;
        const saved = await loadSavedPDF();
        if (!shouldRestorePDF({
            hasRemark: Boolean(currentRemarkContent),
            hasSavedPDF: Boolean(saved),
            hasPdf: Boolean(pdfDoc),
        })) return;
        try {
            await openPDFData(saved.data, restoredPageNum);
        } catch (error) {
            console.error('Error restoring PDF:', error);
            clearPDF();
        }
    }

    function renderPage(num) {
        pageRendering = true;
        pdfDoc.getPage(num).then((page) => {
            if (currentRenderTask) currentRenderTask.cancel();
            const pageSize = page.getViewport({ scale: 1 });
            const fitScale = getFitScale(pageSize.width, pageSize.height, pdfViewer.clientWidth, pdfViewer.clientHeight);
            if (!isRenderableScale(fitScale)) return;
            const viewport = page.getViewport({ scale: fitScale });
            const dpr = window.devicePixelRatio || 1;
            const pixelSize = getCanvasPixelSize(viewport.width, viewport.height, dpr);
            canvas.width = pixelSize.width;
            canvas.height = pixelSize.height;
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;

            const renderTask = page.render({
                canvasContext: ctx,
                viewport: viewport,
                transform: [dpr, 0, 0, dpr, 0, 0]
            });
            currentRenderTask = renderTask;

            renderTask.promise.then(() => {
                pageRendering = false;
                if (pageNumPending !== null) {
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            }, (error) => {
                if (error.name !== 'RenderingCancelledException') console.error(error);
            });
        });
    }

    function loadRemarkFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            currentRemarkContent = this.result;
            currentRemarkFile = file;
            clearPDF();
            pdfDoc = null;
            updatePDFViewerState();
            displayRemarkInViewer(currentRemarkContent);
            saveToStorage();
        };
        fileReader.readAsText(file);
    }

    function displayRemarkInViewer(markdownContent) {
        pdfViewer.style.display = 'none';
        remarkViewer.style.display = 'flex';
        remarkDropZone.style.display = 'none';

        const html = generateRemarkHTML(markdownContent, remarkSource);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        remarkFrame.src = url;
        updateNavButtons();
    }

    function openRemarkInNewWindow() {
        if (!currentRemarkContent) return;

        const html = generateRemarkHTML(currentRemarkContent, remarkSource);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    function clearRemarkState() {
        currentRemarkContent = null;
        currentRemarkFile = null;
        remarkFrame.src = '';
        remarkViewer.style.display = 'none';
        remarkDropZone.style.display = 'block';
        pdfViewer.style.display = 'flex';
    }

    function resetPresentation() {
        clearRemarkState();
        clearPDF();
        pdfDoc = null;
        pageNum = 1;
        updatePDFViewerState();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        updateNavButtons();
        saveToStorage();
    }

    function setupPresentationReset() {
        const resetPresentationBtn = document.getElementById('resetPresentationBtn');
        resetPresentationBtn.addEventListener('click', resetPresentation);
    }

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
        timerCircle.classList.add('running');

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
        timerCircle.classList.remove('running');
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

    function setupStudentDie() {
        dieDisplay.addEventListener('click', () => {
            flashDieHint();
            rollDie();
        });
        updateDieHint();

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

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation();
        });

        openFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openStudentPicker();
        });

        confirmDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteStudents();
        });

        cancelDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideDeleteConfirmation();
        });
    }

    function updateDieHint() {
        const hasStudents = studentFileName !== '';
        dieHint.hidden = hasStudents;
        openFileBtn.hidden = hasStudents;
        deleteBtn.hidden = !hasStudents;
    }

    function flashDieHint() {
        if (dieHint.hidden) return;
        dieDisplay.classList.add('show-hint');
        clearTimeout(dieHintTimeout);
        dieHintTimeout = setTimeout(() => dieDisplay.classList.remove('show-hint'), DIE_HINT_DURATION_MS);
    }

    function rollDie() {
        if (isRolling || !validateStudents(students)) return;
        isRolling = true;
        clearTimeout(studentResetTimeout);

        let count = 0;
        const maxCount = 10;
        const interval = setInterval(() => {
            const student = getRandomStudent(students);
            setStudentName(student);
            count++;

            if (count >= maxCount) {
                clearInterval(interval);
                isRolling = false;
                studentResetTimeout = setTimeout(() => {
                    setStudentName(studentFileName);
                    studentResetTimeout = null;
                }, STUDENT_RESET_DELAY_MS);
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
            clearTimeout(studentResetTimeout);
            students = parseStudentNames(text);
            studentFileName = getFileBaseName(file.name);
            updateDieHint();
            saveToStorage();
            setStudentName(studentFileName);
        };
        reader.readAsText(file);
    }

    function openStudentPicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'text/plain,.txt';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file && file.type === 'text/plain') {
                loadStudentsFromFile(file);
            }
        };
        input.click();
    }

    function showDeleteConfirmation() {
        deleteConfirmation.style.display = 'flex';
        dieDisplay.classList.add('confirming');
        clearTimeout(deleteConfirmationTimeout);
        deleteConfirmationTimeout = setTimeout(() => {
            hideDeleteConfirmation();
        }, 5000);
    }

    function hideDeleteConfirmation() {
        deleteConfirmation.style.display = 'none';
        dieDisplay.classList.remove('confirming');
        clearTimeout(deleteConfirmationTimeout);
    }

    function deleteStudents() {
        students = getDefaultStudents();
        studentFileName = '';
        updateDieHint();
        hideDeleteConfirmation();
        saveToStorage();
        setStudentName('');
    }

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

        if (isSidebarWidthAllowed(newWidth)) {
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

    function saveToStorage() {
        const data = createStorageData(timerMinutes, timerSeconds, timerRunning, students, sidebar.style.width, initialTimerMinutes, initialTimerSeconds, studentFileName, currentRemarkContent, currentRemarkFile?.name || '', pageNum);
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
            restoredPageNum = data.pageNum || 1;

            if (data.sidebarWidth) {
                sidebar.style.width = data.sidebarWidth;
            }

            if (data.remarkContent) {
                currentRemarkContent = data.remarkContent;
                currentRemarkFile = { name: data.remarkFileName || 'presentation.md' };
                displayRemarkInViewer(currentRemarkContent);
            }

            updateTimerDisplay();
            updateSegments();
            studentNameDisplay.textContent = studentFileName;
            updateDieHint();
            updateNavButtons();

            if (data.timerRunning) {
                startTimer();
            }
        }
    }

    return { init };
}
