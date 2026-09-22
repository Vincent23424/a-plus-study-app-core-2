let questions = [];
let filteredQuestions = [];
let currentQIndex = 0;
let userAnswers = {};
let bookmarks = [];
let timerSeconds = 5400; // 90 min
let timerInterval = null;

let flashcards = [];
let currentFCIndex = 0;
let isFlipped = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    startTimer();
    registerSW();
});

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
    }
}

async function fetchData() {
    try {
        const res = await fetch('questions.json');
        const data = await res.json();
        questions = data.questions || [];
        flashcards = data.flashcards || [];
        filteredQuestions = [...questions];

        document.getElementById('total-q-num').innerText = filteredQuestions.length;
        renderQuestion();
        renderFlashcard();
    } catch (err) {
        console.error("Fel vid laddning:", err);
        document.getElementById('question-text').innerText = "Kunde inte ladda frågorna. Kontrollera questions.json.";
    }
}

function renderQuestion() {
    if (filteredQuestions.length === 0) return;

    const q = filteredQuestions[currentQIndex];
    document.getElementById('current-q-num').innerText = currentQIndex + 1;
    document.getElementById('question-domain').innerText = `Domän ${q.domain}`;
    document.getElementById('question-text').innerText = q.question;

    const progress = ((currentQIndex + 1) / filteredQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        const isSelected = userAnswers[q.id] === idx;
        const isAnswered = userAnswers[q.id] !== undefined;
        const isCorrect = idx === q.correct;

        let styleClasses = "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between text-sm md:text-base font-medium ";

        if (isAnswered) {
            if (isCorrect) {
                styleClasses += "bg-green-500/20 border-green-500 text-green-200";
            } else if (isSelected) {
                styleClasses += "bg-red-500/20 border-red-500 text-red-200";
            } else {
                styleClasses += "bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60";
            }
        } else {
            styleClasses += "bg-slate-800 hover:bg-slate-700/70 border-slate-700 text-slate-200 hover:border-slate-500";
        }

        btn.className = styleClasses;
        btn.innerHTML = `
            <span>${opt}</span>
            <span class="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-blue-500 border-blue-400 text-white' : 'text-slate-400'}">
                ${String.fromCharCode(65 + idx)}
            </span>
        `;

        btn.onclick = () => {
            if (!isAnswered) {
                userAnswers[q.id] = idx;
                renderQuestion();
                updateStats();
            }
        };
        container.appendChild(btn);
    });

    const expBox = document.getElementById('explanation-box');
    if (userAnswers[q.id] !== undefined) {
        document.getElementById('explanation-text').innerText = q.explanation;
        expBox.classList.remove('hidden');
    } else {
        expBox.classList.add('hidden');
    }

    const bookmarkBtn = document.getElementById('bookmark-btn');
    bookmarkBtn.style.color = bookmarks.includes(q.id) ? '#f59e0b' : '';
}

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

function toggleBookmark() {
    const q = filteredQuestions[currentQIndex];
    if (bookmarks.includes(q.id)) {
        bookmarks = bookmarks.filter(id => id !== q.id);
    } else {
        bookmarks.push(q.id);
    }
    renderQuestion();
}

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

function handleTerminalCommand(e) {
    if (e.key === 'Enter') {
        const input = e.target.value.trim().toLowerCase();
        const history = document.getElementById('terminal-history');
        const feedback = document.getElementById('pbq-feedback');

        if (input === 'ipconfig /renew') {
            history.innerHTML += `<div>C:\\Users\\Admin&gt; ${input}</div><div class="text-slate-400">Förnyar DHCP-lease... IP erhållen: 192.168.1.105</div>`;
            feedback.innerHTML = '<span class="text-green-400">Korrekt! Nätverksförbindelsen är återställd.</span>';
        } else if (input === 'ipconfig /release') {
            history.innerHTML += `<div>C:\\Users\\Admin&gt; ${input}</div><div class="text-slate-400">IP-adress frigjord.</div>`;
            feedback.innerHTML = '<span class="text-amber-400">IP släppt. Använd nu ipconfig /renew för att få en ny.</span>';
        } else if (input === 'ipconfig' || input === 'ipconfig /all') {
            history.innerHTML += `<div>C:\\Users\\Admin&gt; ${input}</div><div class="text-slate-400">Visar nätverkskortets konfiguration...</div>`;
            feedback.innerHTML = '<span class="text-amber-400">Korrekt verktyg, men vilket flagg-kommando förnyar din IP?</span>';
        } else {
            history.innerHTML += `<div>C:\\Users\\Admin&gt; ${input}</div><div class="text-red-400">'${input}' känns inte igen.</div>`;
            feedback.innerHTML = '<span class="text-red-400">Okänt kommando. Testa ipconfig /renew.</span>';
        }

        e.target.value = '';
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            alert("Tiden är slut!");
            return;
        }
        timerSeconds--;
        const m = Math.floor(timerSeconds / 60);
        const s = timerSeconds % 60;
        document.getElementById('timer').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
}

function updateStats() {
    const answeredCount = Object.keys(userAnswers).length;
    let correctCount = 0;

    questions.forEach(q => {
        if (userAnswers[q.id] === q.correct) {
            correctCount++;
        }
    });

    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const estimatedScore = 100 + Math.round((correctCount / (questions.length || 1)) * 800);

    document.getElementById('stat-total').innerText = answeredCount;
    document.getElementById('stat-accuracy').innerText = `${accuracy}%`;
    document.getElementById('stat-score').innerText = `${estimatedScore} / 900`;
}
