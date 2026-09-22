// Global App State
let questions = [];
let filteredQuestions = [];
let currentQIndex = 0;
let userAnswers = {};
let bookmarks = [];
let timerSeconds = 5400; // 90 minuter
let timerInterval = null;

// Flashcard State
let flashcards = [];
let currentFCIndex = 0;
let isFlipped = false;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    startTimer();
    registerServiceWorker();
});

// Register Service Worker for PWA Offline Support
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('Service Worker registrerad.'))
            .catch(err => console.error('Service Worker misslyckades:', err));
    }
}

// Fetch JSON Data
async function fetchData() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questions = data.questions;
        flashcards = data.flashcards || [];
        filteredQuestions = [...questions];
        
        document.getElementById('total-q-num').innerText = filteredQuestions.length;
        renderQuestion();
        renderFlashcard();
    } catch (error) {
        console.error("Fel vid laddning av frågor:", error);
        document.getElementById('question-text').innerText = "Kunde inte ladda frågorna. Kontrollera att questions.json finns.";
    }
}

// Render Current Question
function renderQuestion() {
    if (filteredQuestions.length === 0) return;

    const q = filteredQuestions[currentQIndex];
    document.getElementById('current-q-num').innerText = currentQIndex + 1;
    document.getElementById('question-domain').innerText = `Domän ${q.domain}`;
    document.getElementById('question-text').innerText = q.question;

    // Update Progress Bar
    const progress = ((currentQIndex + 1) / filteredQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    // Render Options
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition flex items-center justify-between group";
        
        const isSelected = userAnswers[q.id] === idx;
        if (isSelected) {
            btn.classList.add('border-blue-500', 'bg-blue-500/10');
        }

        btn.innerHTML = `
            <span class="text-sm md:text-base">${opt}</span>
            <span class="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-xs group-hover:border-blue-400">
                ${String.fromCharCode(65 + idx)}
            </span>
        `;
        btn.onclick = () => selectOption(idx);
        container.appendChild(btn);
    });

    // Handle Explanation View
    const explanationBox = document.getElementById('explanation-box');
    if (userAnswers[q.id] !== undefined) {
        document.getElementById('explanation-text').innerText = q.explanation;
        explanationBox.classList.remove('hidden');
    } else {
        explanationBox.classList.add('hidden');
    }

    // Update Bookmark Button
    const bookmarkBtn = document.getElementById('bookmark-btn');
    bookmarkBtn.style.color = bookmarks.includes(q.id) ? '#f59e0b' : '';
}

// Select Option & Verify
function selectOption(index) {
    const q = filteredQuestions[currentQIndex];
    userAnswers[q.id] = index;
    renderQuestion();
    updateStats();
}

// Navigation Controls
function nextQuestion() {
    if (currentQIndex < filteredQuestions.length - 1) {
        currentQIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQIndex > 0) {
        currentQIndex--;
        renderQuestion();
    }
}

// Filter Questions by Domain
function filterQuestions() {
    const val = document.getElementById('domain-filter').value;
    if (val === 'all') {
        filteredQuestions = [...questions];
    } else {
        filteredQuestions = questions.filter(q => q.domain.startsWith(val));
    }
    currentQIndex = 0;
    document.getElementById('total-q-num').innerText = filteredQuestions.length;
    renderQuestion();
}

// Toggle Bookmark
function toggleBookmark() {
    const q = filteredQuestions[currentQIndex];
    if (bookmarks.includes(q.id)) {
        bookmarks = bookmarks.filter(id => id !== q.id);
    } else {
        bookmarks.push(q.id);
    }
    renderQuestion();
}

// Mode Switching (Quiz / Flashcards / PBQ / Stats)
function switchMode(mode) {
    ['quiz', 'flashcards', 'pbq', 'stats'].forEach(m => {
        document.getElementById(`${m}-section`).classList.add('hidden');
        document.getElementById(`nav-${m}`).classList.remove('bg-blue-600', 'text-white');
        document.getElementById(`nav-${m}`).classList.add('text-slate-400');
    });

    document.getElementById(`${mode}-section`).classList.remove('hidden');
    document.getElementById(`nav-${mode}`).classList.add('bg-blue-600', 'text-white');
    document.getElementById(`nav-${mode}`).classList.remove('text-slate-400');
}

// Flashcards Logic
function renderFlashcard() {
    if (flashcards.length === 0) return;
    const fc = flashcards[currentFCIndex];
    document.getElementById('fc-category').innerText = fc.category;
    document.getElementById('fc-content').innerText = isFlipped ? fc.back : fc.front;
}

function flipCard() {
    isFlipped = !isFlipped;
    renderFlashcard();
}

function nextCard() {
    isFlipped = false;
    currentFCIndex = (currentFCIndex + 1) % flashcards.length;
    renderFlashcard();
}

function prevCard() {
    isFlipped = false;
    currentFCIndex = (currentFCIndex - 1 + flashcards.length) % flashcards.length;
    renderFlashcard();
}

// PBQ Interactive Terminal Logic
function handleTerminalCommand(e) {
    if (e.key === 'Enter') {
        const input = e.target.value.trim().toLowerCase();
        const history = document.getElementById('terminal-history');
        const feedback = document.getElementById('pbq-feedback');

        if (input === 'ipconfig /renew') {
            history.innerHTML += `<br>C:\\Users\\Admin> ${input}<br><span class="text-slate-400">Begär ny IP-adress från DHCP... Framgångsrikt! IP: 192.168.1.105</span>`;
            feedback.innerHTML = '<span class="text-green-400">Korrekt utfört! Nätverksanslutningen har återställts.</span>';
        } else if (input === 'ipconfig /all') {
            history.innerHTML += `<br>C:\\Users\\Admin> ${input}<br><span class="text-slate-400">Visar fullständig nätverkskonfiguration...</span>`;
            feedback.innerHTML = '<span class="text-amber-400">Bra start, men du behöver förnya leasingsavtalet.</span>';
        } else {
            history.innerHTML += `<br>C:\\Users\\Admin> ${input}<br><span class="text-red-400">'${input}' känns inte igen som ett internt kommando.</span>`;
            feedback.innerHTML = '<span class="text-red-400">Felaktigt kommando. Försök igen (Tips: använd ipconfig).</span>';
        }

        e.target.value = '';
    }
}

// Timer Counter
function startTimer() {
    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Tiden har gått ut!");
            return;
        }
        timerSeconds--;
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        document.getElementById('timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, 1000);
}

// Update Statistics
function updateStats() {
    const answeredCount = Object.keys(userAnswers).length;
    let correctCount = 0;

    questions.forEach(q => {
        if (userAnswers[q.id] === q.correct) {
            correctCount++;
        }
    });

    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const estimatedScore = 100 + Math.round((correctCount / questions.length) * 800);

    document.getElementById('stat-total').innerText = answeredCount;
    document.getElementById('stat-accuracy').innerText = `${accuracy}%`;
    document.getElementById('stat-score').innerText = `${estimatedScore} / 900`;
}
