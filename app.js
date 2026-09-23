/**
 * CompTIA A+ Core 2 (Modules 11-22) App Engine
 */

// Reserv-data ifall data.js saknas eller inte laddats helt
if (typeof window.DATA === 'undefined') {
    window.DATA = {
        modules: [
            { id: 11, title: "Managing Support Procedures", color: "from-blue-600 to-indigo-600", icon: "fa-clipboard-list", lessons: ["11A Documentation", "11B Professional Communication", "11C Operating Systems"] },
            { id: 12, title: "Configuring Windows", color: "from-sky-600 to-blue-600", icon: "fa-sliders", lessons: ["12A Windows User Settings", "12B Windows System Settings", "12C Applications", "12D Cloud Apps"] },
            { id: 13, title: "Managing Windows", color: "from-emerald-600 to-teal-600", icon: "fa-terminal", lessons: ["13A Management Consoles", "13B Command-Line Tools", "13C Windows Networking"] },
            { id: 14, title: "Supporting Windows", color: "from-amber-600 to-orange-600", icon: "fa-wrench", lessons: ["14A Network Troubleshooting", "14B Remote Access", "14C Performance Tools", "14D OS Troubleshooting"] },
            { id: 15, title: "Securing Windows", color: "from-purple-600 to-indigo-600", icon: "fa-shield-halved", lessons: ["15A Logical Security", "15B Windows Security Settings", "15C Windows Shares"] },
            { id: 16, title: "Installing Operating Systems", color: "from-cyan-600 to-blue-600", icon: "fa-[#111625]", lessons: ["16A Windows Editions", "16B OS Installations & Upgrades"] },
            { id: 17, title: "Supporting Other OS", color: "from-yellow-600 to-amber-600", icon: "fa-shapes", lessons: ["17A Linux Features", "17B Package & Network Mgmt", "17C macOS Features"] },
            { id: 18, title: "Configuring SOHO Network Security", color: "from-rose-600 to-red-600", icon: "fa-wifi", lessons: ["18A Attacks & Threats", "18B Wireless Security", "18C SOHO Router Security"] },
            { id: 19, title: "Managing Security Settings", color: "from-fuchsia-600 to-pink-600", icon: "fa-key", lessons: ["19A Account Security", "19B Workstation Security", "19C Browser Security"] },
            { id: 20, title: "Supporting Mobile Software", color: "from-emerald-600 to-green-600", icon: "fa-mobile-screen", lessons: ["20A Mobile OS Security", "20B Mobile App Troubleshooting"] },
            { id: 21, title: "Using Data Security", color: "from-blue-600 to-cyan-600", icon: "fa-database", lessons: ["21A Data Backup & Recovery", "21B Data Handling Best Practices", "21C Artificial Intelligence"] },
            { id: 22, title: "Implementing Operational Procedures", color: "from-indigo-600 to-purple-600", icon: "fa-code", lessons: ["22A Change Management", "22B Safety & Environment", "22C Scripting Basics"] }
        ],
        questions: [],
        flashcards: {}
    };

    // Generera 35 frågor per modul (420 frågor totalt) om data.js saknas
    let qId = 1;
    window.DATA.modules.forEach(m => {
        window.DATA.flashcards[m.id] = [];
        for (let i = 1; i <= 35; i++) {
            const lesson = m.lessons[(i - 1) % m.lessons.length];
            window.DATA.questions.push({
                id: qId++,
                module: m.id,
                lesson: lesson,
                question: `[Module ${m.id} - ${lesson}] Which tool or command is most appropriate for troubleshooting this objective? (Question #${i})`,
                options: [
                    "ipconfig /flushdns",
                    "sfc /scannow",
                    "gpupdate /force",
                    "chkdsk /f"
                ],
                answer: (i % 4),
                explanation: `This option directly targets the requirements of ${lesson}.`
            });

            if (i <= 10) {
                window.DATA.flashcards[m.id].push({
                    term: `Key Concept ${i} (${lesson})`,
                    def: `Core definition and objective details regarding ${lesson}.`
                });
            }
        }
    });
}

const pbqScenarios = [
    { title: "System File Check", desc: "A Windows system has corrupted protected system files.", objective: "Run the command to repair system files.", expected: ["sfc /scannow"], success: "Correct. System File Checker executed successfully.", failure: "Incorrect." },
    { title: "DHCP Renewal", desc: "Renew client IP configuration.", objective: "Enter the lease renewal command.", expected: ["ipconfig /renew"], success: "Correct. DHCP lease renewed.", failure: "Incorrect." }
];

class MainApp {
    constructor() {
        this.state = JSON.parse(localStorage.getItem('c2state_v3')) || {
            answered: {},
            wrong: [],
            starred: [],
            stats: {}
        };

        this.currentView = 'home';
        this.session = [];
        this.sessionIndex = 0;
        this.sessionAnswers = [];
        this.selectedOption = null;
        this.isAnswered = false;
        this.currentCards = [];
        this.cardIndex = 0;
        this.cardFlipped = false;

        this.init();
    }

    init() {
        this.buildHomeControls();
        this.renderModulesGrid();
        this.updateGlobalStats();
        this.populateFlashcardDropdown();
        this.populatePBQDropdown();
        this.renderReference();
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
    }

    navigateTo(viewId) {
        ['home', 'flashcards', 'quiz', 'pbq', 'results', 'stats', 'reference'].forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');
            const nav = document.getElementById(`nav-${v}`);
            if (nav) {
                nav.classList.remove('bg-indigo-600', 'text-white');
                nav.classList.add('text-slate-400');
            }
        });

        const activeView = document.getElementById(`view-${viewId}`);
        if (activeView) activeView.classList.remove('hidden');
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) {
            activeNav.classList.add('bg-indigo-600', 'text-white');
            activeNav.classList.remove('text-slate-400');
        }

        if (viewId === 'flashcards') this.loadFlashcards(this.selectedModuleId || 'all');
        if (viewId === 'pbq') this.loadPBQScenario(0);
        if (viewId === 'stats') this.renderStatsView();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateGlobalStats() {
        const totalQ = DATA.questions.length;
        let correctTotal = 0, attemptedTotal = 0;

        Object.values(this.state.stats).forEach(s => {
            correctTotal += s.c || 0;
            attemptedTotal += (s.c || 0) + (s.w || 0);
        });

        const accuracy = attemptedTotal > 0 ? Math.round((correctTotal / attemptedTotal) * 100) : 0;

        document.getElementById('stat-total-q').textContent = totalQ;
        document.getElementById('stat-accuracy-home').textContent = `${accuracy}%`;
        document.getElementById('stat-wrong-home').textContent = this.state.wrong.length;
        document.getElementById('stat-starred-home').textContent = this.state.starred.length;

        document.getElementById('badge-wrong').textContent = this.state.wrong.length;
        document.getElementById('badge-starred').textContent = this.state.starred.length;
        document.getElementById('badge-new').textContent = DATA.questions.filter(q => !this.state.answered[q.id]).length;
    }

    buildHomeControls() {
        const rs = document.getElementById('rangeSelect');
        const em = document.getElementById('extraModule');
        if (!rs || !em) return;

        rs.innerHTML = '';
        em.innerHTML = '<option value="">No extra module</option>';

        for (let i = 11; i <= 20; i++) {
            const o = document.createElement('option');
            o.value = `${i}-${i+2}`;
            o.textContent = `Modules ${i}–${i+2}`;
            rs.appendChild(o);
        }

        DATA.modules.forEach(m => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = `Mod ${m.id}`;
            em.appendChild(o);
        });
    }

    renderModulesGrid() {
        const grid = document.getElementById('modulesGrid');
        if (!grid) return;
        grid.innerHTML = '';

        DATA.modules.forEach(m => {
            const qCount = DATA.questions.filter(q => q.module === m.id).length;
            const card = document.createElement('div');
            card.className = "card-dark rounded-2xl p-5 flex flex-col justify-between";
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold">
                            <i class="fa-solid ${m.icon}"></i>
                        </div>
                        <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#0b0f19] text-slate-400 border border-slate-800">Mod ${m.id}</span>
                    </div>
                    <h4 class="font-bold text-sm text-white mb-1">${m.title}</h4>
                    <p class="text-[11px] text-slate-400 mb-3">${qCount} Questions Available</p>
                    
                    <div class="flex flex-wrap gap-1 mb-4">
                        ${m.lessons.map(l => `<span class="text-[9px] px-2 py-0.5 rounded bg-[#0b0f19] text-slate-300 border border-slate-800">${l}</span>`).join('')}
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button onclick="app.startFlashcardsForModule(${m.id})" class="py-2 rounded-xl bg-[#0b0f19] hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-clone text-sky-400"></i> Cards
                    </button>
                    <button onclick="app.startModuleQuiz(${m.id})" class="py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-play"></i> Quiz
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    startPracticeMode(mode) {
        let pool = [];
        let label = '';

        if (mode === 'final') {
            pool = [...DATA.questions];
            label = 'Final Test (Modules 11–22)';
        } else if (mode === 'random') {
            pool = [...DATA.questions];
            label = 'Random Practice';
        } else if (mode === 'wrong') {
            pool = DATA.questions.filter(q => this.state.wrong.includes(q.id));
            label = 'Wrong Questions Practice';
        } else if (mode === 'starred') {
            pool = DATA.questions.filter(q => this.state.starred.includes(q.id));
            label = 'Starred Questions';
        } else if (mode === 'new') {
            pool = DATA.questions.filter(q => !this.state.answered[q.id]);
            label = 'New Questions';
        } else {
            pool = [...DATA.questions];
            label = 'Practice';
        }

        if (!pool.length) {
            alert("No questions available in this set.");
            return;
        }

        this.startSession(pool, label);
    }

    startChallenge() {
        const rsVal = document.getElementById('rangeSelect')?.value;
        if (!rsVal) return;
        const rs = rsVal.split('-').map(Number);
        const pool = DATA.questions.filter(q => q.module >= rs[0] && q.module <= rs[1]);
        this.startSession(pool, `Challenge Modules ${rs[0]}–${rs[1]}`);
    }

    startModuleQuiz(modId) {
        const pool = DATA.questions.filter(q => q.module === modId);
        const mod = DATA.modules.find(m => m.id === modId);
        this.startSession(pool, `Module ${modId}: ${mod.title}`);
    }

    startSession(pool, label) {
        const countVal = document.getElementById('countSelect')?.value || '10';
        const count = countVal === 'All available' ? pool.length : parseInt(countVal);

        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.session = shuffled.slice(0, Math.min(count, shuffled.length));
        this.sessionIndex = 0;
        this.sessionAnswers = [];
        this.currentModeLabel = label;

        this.navigateTo('quiz');
        this.renderQuizQuestion();
    }

    renderQuizQuestion() {
        const q = this.session[this.sessionIndex];
        if (!q) return;

        this.selectedOption = null;
        this.isAnswered = false;

        document.getElementById('quizLabel').textContent = this.currentModeLabel;
        document.getElementById('lessonTag').textContent = q.lesson;
        document.getElementById('questionText').textContent = q.question;
        document.getElementById('quizProgress').textContent = `${this.sessionIndex + 1} / ${this.session.length}`;
        document.getElementById('progressBar').style.width = `${(this.sessionIndex / this.session.length) * 100}%`;

        const starBtn = document.getElementById('starBtn');
        const isStarred = this.state.starred.includes(q.id);
        if (starBtn) starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-base"></i>` : `<i class="fa-regular fa-star text-slate-400 text-base"></i>`;

        const ansDiv = document.getElementById('answers');
        ansDiv.innerHTML = '';

        q.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-4 rounded-xl bg-[#111625] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-all flex items-center justify-between";
            btn.onclick = () => this.selectOption(idx);
            btn.id = `opt-${idx}`;
            btn.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-lg bg-[#0b0f19] text-slate-400 flex items-center justify-center font-mono text-xs font-bold">${String.fromCharCode(65 + idx)}</span>
                    <span>${optText}</span>
                </div>
            `;
            ansDiv.appendChild(btn);
        });

        document.getElementById('feedback').className = "hidden p-4 rounded-2xl border space-y-1 text-xs";
        document.getElementById('confirmBtn').classList.remove('hidden');
        document.getElementById('nextBtn').classList.add('hidden');
    }

    selectOption(idx) {
        if (this.isAnswered) return;
        this.selectedOption = idx;

        const ansDiv = document.getElementById('answers');
        Array.from(ansDiv.children).forEach((child, i) => {
            if (i === idx) {
                child.className = "w-full text-left p-4 rounded-xl bg-indigo-600/20 border-2 border-indigo-500 text-xs font-medium text-white flex items-center justify-between";
            } else {
                child.className = "w-full text-left p-4 rounded-xl bg-[#111625]/50 border border-slate-800/80 text-xs font-medium text-slate-400 flex items-center justify-between opacity-60";
            }
        });
    }

    confirmAnswer() {
        if (this.selectedOption === null || this.isAnswered) {
            alert("Välj ett svar först!");
            return;
        }

        this.isAnswered = true;
        const q = this.session[this.sessionIndex];
        const isCorrect = (this.selectedOption === q.answer);

        this.sessionAnswers[this.sessionIndex] = isCorrect;

        if (!this.state.stats[q.lesson]) this.state.stats[q.lesson] = { c: 0, w: 0 };
        this.state.stats[q.lesson][isCorrect ? 'c' : 'w']++;
        this.state.answered[q.id] = true;

        if (!isCorrect && !this.state.wrong.includes(q.id)) {
            this.state.wrong.push(q.id);
        } else if (isCorrect) {
            this.state.wrong = this.state.wrong.filter(id => id !== q.id);
        }

        localStorage.setItem('c2state_v3', JSON.stringify(this.state));
        this.updateGlobalStats();

        const ansDiv = document.getElementById('answers');
        Array.from(ansDiv.children).forEach((child, i) => {
            if (i === q.answer) {
                child.className = "w-full text-left p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-xs font-medium text-emerald-200 flex items-center justify-between";
            } else if (i === this.selectedOption && !isCorrect) {
                child.className = "w-full text-left p-4 rounded-xl bg-rose-500/20 border-2 border-rose-500 text-xs font-medium text-rose-200 flex items-center justify-between";
            }
        });

        const fb = document.getElementById('feedback');
        fb.classList.remove('hidden');
        if (isCorrect) {
            fb.className = "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200";
            fb.innerHTML = `<b class="text-emerald-400 block mb-1">Rätt svar!</b> ${q.explanation}`;
        } else {
            fb.className = "p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200";
            fb.innerHTML = `<b class="text-rose-400 block mb-1">Fel svar. Rätt svar var (${String.fromCharCode(65 + q.answer)})</b> ${q.explanation}`;
        }

        document.getElementById('confirmBtn').classList.add('hidden');
        document.getElementById('nextBtn').classList.remove('hidden');
    }

    nextQuestion() {
        if (this.sessionIndex < this.session.length - 1) {
            this.sessionIndex++;
            this.renderQuizQuestion();
        } else {
            this.showResults();
        }
    }

    toggleStarCurrentQuestion() {
        const q = this.session[this.sessionIndex];
        if (!q) return;

        if (this.state.starred.includes(q.id)) {
            this.state.starred = this.state.starred.filter(id => id !== q.id);
        } else {
            this.state.starred.push(q.id);
        }

        localStorage.setItem('c2state_v3', JSON.stringify(this.state));
        this.updateGlobalStats();

        const starBtn = document.getElementById('starBtn');
        const isStarred = this.state.starred.includes(q.id);
        if (starBtn) starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-base"></i>` : `<i class="fa-regular fa-star text-slate-400 text-base"></i>`;
    }

    showResults() {
        const correctCount = this.sessionAnswers.filter(Boolean).length;
        const total = this.session.length;
        const pct = Math.round((correctCount / total) * 100);

        this.navigateTo('results');

        document.getElementById('resultTitle').textContent = pct >= 80 ? "Snyggt jobbat!" : "Övning ger färdighet!";
        document.getElementById('resultScore').textContent = `${correctCount}/${total} Rätt`;
        document.getElementById('resultPct').textContent = `${pct}%`;

        document.getElementById('resultDetails').innerHTML = `
            <div class="bg-[#111625] p-3 rounded-xl border border-slate-800">
                <b class="text-white text-base block">${pct}%</b>
                <span class="text-slate-400">Resultat</span>
            </div>
            <div class="bg-[#111625] p-3 rounded-xl border border-slate-800">
                <b class="text-rose-400 text-base block">${total - correctCount}</b>
                <span class="text-slate-400">Felaktiga</span>
            </div>
            <div class="bg-[#111625] p-3 rounded-xl border border-slate-800">
                <b class="text-amber-400 text-base block">${this.state.starred.length}</b>
                <span class="text-slate-400">Stjärnmärkta</span>
            </div>
        `;
    }

    populateFlashcardDropdown() {
        const s = document.getElementById('flashcards-module-select');
        if (!s) return;
        s.innerHTML = '<option value="all">Alla moduler</option>';
        DATA.modules.forEach(m => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = `Modul ${m.id}: ${m.title}`;
            s.appendChild(o);
        });
    }

    startFlashcardsForModule(modId) {
        this.selectedModuleId = modId;
        const s = document.getElementById('flashcards-module-select');
        if (s) s.value = modId;
        this.navigateTo('flashcards');
    }

    changeFlashcardModule(val) {
        this.selectedModuleId = val;
        this.loadFlashcards(val);
    }

    loadFlashcards(modId) {
        if (modId === 'all') {
            this.currentCards = Object.values(DATA.flashcards).flat();
        } else {
            this.currentCards = DATA.flashcards[modId] || [];
        }
        this.cardIndex = 0;
        this.cardFlipped = false;
        this.renderCard();
    }

    renderCard() {
        const card = this.currentCards[this.cardIndex];
        const typeEl = document.getElementById('card-type');
        const textEl = document.getElementById('card-content-text');
        const progEl = document.getElementById('card-progress-count');

        if (!card) {
            if (textEl) textEl.textContent = "Inga flashcards tillgängliga.";
            return;
        }

        if (typeEl) typeEl.textContent = this.cardFlipped ? "DEFINITION" : "BEGREPP / TERM";
        if (textEl) textEl.textContent = this.cardFlipped ? card.def : card.term;
        if (progEl) progEl.textContent = `${this.cardIndex + 1} / ${this.currentCards.length}`;
    }

    flipCard() {
        this.cardFlipped = !this.cardFlipped;
        this.renderCard();
    }

    nextCard() {
        if (!this.currentCards.length) return;
        this.cardIndex = (this.cardIndex + 1) % this.currentCards.length;
        this.cardFlipped = false;
        this.renderCard();
    }

    prevCard() {
        if (!this.currentCards.length) return;
        this.cardIndex = (this.cardIndex - 1 + this.currentCards.length) % this.currentCards.length;
        this.cardFlipped = false;
        this.renderCard();
    }

    populatePBQDropdown() {
        const s = document.getElementById('pbq-scenario-select');
        if (!s) return;
        s.innerHTML = pbqScenarios.map((sc, i) => `<option value="${i}">Scenario ${i+1}: ${sc.title}</option>`).join('');
    }

    selectPBQScenario(idx) {
        this.loadPBQScenario(idx);
    }

    loadPBQScenario(idx) {
        const sc = pbqScenarios[idx];
        if (!sc) return;
        document.getElementById('pbq-scenario-title').textContent = sc.title;
        document.getElementById('pbq-scenario-desc').textContent = sc.desc;
        document.getElementById('pbq-scenario-objective').textContent = sc.objective;

        const body = document.getElementById('terminal-body');
        if (body) {
            body.innerHTML = `<div>Microsoft Windows [Version 10.0.19045.3803]</div><div>Skriv ditt kommando nedan:</div>`;
        }
    }

    handleTerminalCommand(e) {
        if (e.key === 'Enter') this.execTerminalCommand();
    }

    execTerminalCommand() {
        const input = document.getElementById('terminal-input');
        const cmd = input?.value.trim();
        if (!cmd) return;

        const body = document.getElementById('terminal-body');
        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = `<span class="text-slate-400">C:\\Windows\\System32&gt;</span> ${cmd}`;
        body.appendChild(cmdLine);

        const sc = pbqScenarios[0];
        const respLine = document.createElement('div');

        if (sc.expected.some(c => cmd.toLowerCase().includes(c.toLowerCase()))) {
            respLine.className = "text-emerald-300 my-1";
            respLine.textContent = sc.success;
        } else {
            respLine.className = "text-rose-400 my-1";
            respLine.textContent = `'${cmd}' kändes inte igen eller är felaktigt svar.`;
        }

        body.appendChild(respLine);
        input.value = '';
        body.scrollTop = body.scrollHeight;
    }

    clearTerminal() {
        const body = document.getElementById('terminal-body');
        if (body) body.innerHTML = '<div>Terminal rensad.</div>';
    }

    renderStatsView() {
        const list = document.getElementById('module-stats-list');
        if (!list) return;
        list.innerHTML = '';

        DATA.modules.forEach(m => {
            let correct = 0, total = 0;
            m.lessons.forEach(l => {
                const s = this.state.stats[l];
                if (s) {
                    correct += s.c || 0;
                    total += (s.c || 0) + (s.w || 0);
                }
            });

            const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

            const row = document.createElement('div');
            row.className = "p-3 card-dark rounded-xl flex items-center justify-between text-xs";
            row.innerHTML = `
                <div>
                    <span class="font-bold text-white">Modul ${m.id}: ${m.title}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-emerald-400 font-bold font-mono">${pct}% Rätt</span>
                    <span class="text-slate-400 font-mono">(${total} gjorda)</span>
                </div>
            `;
            list.appendChild(row);
        });
    }

    renderReference() {
        const ref = document.getElementById('reference-content');
        if (!ref) return;
        ref.innerHTML = `
            <div class="card-dark rounded-2xl p-5">
                <h3 class="font-bold text-white mb-3">Viktiga Portar</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div class="p-2 bg-[#0b0f19] rounded border border-slate-800"><b class="text-indigo-400 block">22</b> SSH</div>
                    <div class="p-2 bg-[#0b0f19] rounded border border-slate-800"><b class="text-indigo-400 block">53</b> DNS</div>
                    <div class="p-2 bg-[#0b0f19] rounded border border-slate-800"><b class="text-indigo-400 block">80</b> HTTP</div>
                    <div class="p-2 bg-[#0b0f19] rounded border border-slate-800"><b class="text-indigo-400 block">3389</b> RDP</div>
                </div>
            </div>
        `;
    }

    resetProgress() {
        if (confirm("Vill du nollställa all statistik och framsteg?")) {
            this.state = { answered: {}, wrong: [], starred: [], stats: {} };
            localStorage.setItem('c2state_v3', JSON.stringify(this.state));
            this.updateGlobalStats();
            this.renderStatsView();
        }
    }
}

let app;
window.onload = function() {
    app = new MainApp();
};
