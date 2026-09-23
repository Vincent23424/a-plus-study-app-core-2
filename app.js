/**
 * Embedded Questions & Modules Data
 */
const pbqScenarios = [{"title":"System File Check","desc":"A Windows system is suspected of having corrupted protected system files.","objective":"Enter the command used to scan protected Windows system files and automatically repair corrupted files.","hint":"Use the System File Checker command from the Windows command-line material.","expected":["sfc /scannow"],"success":"Correct. The System File Checker scan command is accepted.","failure":"Not correct. This scenario requires the SFC scan command used to check protected system files."},{"title":"DHCP Lease Renewal","desc":"A Windows client needs to request a new DHCP lease.","objective":"Enter the Windows command used to renew the DHCP lease.","hint":"Use ipconfig with the lease-renewal switch.","expected":["ipconfig /renew"],"success":"Correct. The DHCP lease renewal command is accepted.","failure":"Not correct. This scenario requires the ipconfig lease-renewal command."},{"title":"DNS Cache Flush","desc":"A Windows client has a stale local DNS resolver cache.","objective":"Enter the command used to clear the local DNS resolver cache.","hint":"Use ipconfig with the DNS-cache flush switch.","expected":["ipconfig /flushdns"],"success":"Correct. The local DNS resolver cache can now be cleared.","failure":"Not correct. This scenario requires the ipconfig DNS-cache flush command."},{"title":"Remote Desktop Port","desc":"A technician needs the default TCP port used by Remote Desktop Protocol.","objective":"Enter the RDP port number.","hint":"Find RDP in the Core 2 ports/protocols material.","expected":["3389"],"success":"Correct. TCP 3389 is the RDP port listed in the Core 2 material.","failure":"Not correct. The required value is the RDP port from the Core 2 material."},{"title":"WPA3 / SAE","desc":"A SOHO wireless network needs the WPA3 authentication method covered in Core 2.","objective":"Enter the wireless security standard or authentication term associated with WPA3.","hint":"Use WPA3 or SAE.","expected":["wpa3","wpa3-sae","sae"],"success":"Correct. WPA3 / SAE is accepted.","failure":"Not correct. Use WPA3 or SAE for this scenario."},{"title":"PowerShell Script","desc":"A technician needs to identify the file extension for a PowerShell script.","objective":"Enter the PowerShell script extension.","hint":"Look at the scripting/file-type material.","expected":[".ps1"],"success":"Correct. .ps1 is the PowerShell script extension.","failure":"Not correct. The PowerShell script extension is required."},{"title":"Backup Type","desc":"A backup plan needs a backup that stores changes since the last full backup.","objective":"Enter the backup type that matches the description.","hint":"Compare full, incremental, and differential backups.","expected":["differential"],"success":"Correct. Differential backup matches the description.","failure":"Not correct. The required backup type stores changes since the last full backup."},{"title":"Change Review","desc":"A proposed IT change needs formal review before implementation.","objective":"Enter the abbreviation for the change board used in change management.","hint":"See the change-management material.","expected":["cab","change advisory board"],"success":"Correct. CAB / Change Advisory Board is accepted.","failure":"Not correct. Enter CAB or Change Advisory Board."}];

class MainApp {
    constructor() {
        this.state = JSON.parse(localStorage.getItem('c2state_v2')) || {
            answered: {},
            wrong: [],
            starred: [],
            stats: {},
            cardsViewed: 0,
            pbqSolved: 0
        };

        this.currentView = 'home';
        
        // Quiz session state
        this.sessionPool = [];
        this.session = [];
        this.sessionIndex = 0;
        this.sessionAnswers = [];
        this.selectedOption = null;
        this.isAnswered = false;
        this.currentModeLabel = '';

        // Flashcard State
        this.selectedModuleId = 'all';
        this.cardIndex = 0;
        this.isCardFlipped = false;

        // PBQ State
        this.currentPBQIndex = 0;

        this.init();
    }

    init() {
        this.initTheme();
        this.buildHomeControls();
        this.renderModulesGrid();
        this.updateGlobalStats();
        this.populateFlashcardDropdown();
        this.populatePBQDropdown();
        this.renderReference();
        this.updateReadiness();
    }

    /* Dark Mode / Theme Handling */
    initTheme() {
        const savedTheme = localStorage.getItem('c2theme');
        // Om inget är sparat eller om det är inställt på dark -> aktivera mörkt läge
        if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark');
            document.body.classList.add('theme-light');
        } else {
            document.documentElement.classList.add('dark');
            document.body.classList.remove('theme-light');
            localStorage.setItem('c2theme', 'dark');
        }
        this.updateThemeButton();
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            document.body.classList.add('theme-light');
            localStorage.setItem('c2theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            document.body.classList.remove('theme-light');
            localStorage.setItem('c2theme', 'dark');
        }
        this.updateThemeButton();
    }

    updateThemeButton() {
        const isDark = document.documentElement.classList.contains('dark');
        const icon = document.getElementById('theme-toggle-icon');
        const label = document.getElementById('theme-toggle-label');
        const btn = document.getElementById('theme-toggle');
        
        if (icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        if (btn) btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }

    updateReadiness() {
        if (!window.DATA) return;
        let correct=0, attempted=0;
        Object.values(this.state.stats).forEach(s=>{correct+=s.c||0;attempted+=(s.c||0)+(s.w||0);});
        const coverage=DATA.questions.length ? Object.keys(this.state.answered).length/DATA.questions.length : 0;
        const accuracy=attempted ? correct/attempted : 0;
        let sum=0,n=0;
        DATA.modules.forEach(m=>{let c=0,t=0;m.lessons.forEach(l=>{const s=this.state.stats[l];if(s){c+=s.c||0;t+=(s.c||0)+(s.w||0);}});if(t){sum+=c/t;n++;}});
        const consistency=n?sum/n:0;
        const readiness=Math.round((coverage*.30+accuracy*.50+consistency*.20)*100);
        const v=document.getElementById('readiness-value'),b=document.getElementById('readiness-bar');
        if(v)v.textContent=readiness+'%'; if(b)b.style.width=readiness+'%';
    }

    populateFlashcardDropdown(){
        if (!window.DATA) return;
        const s=document.getElementById('flashcards-module-select');if(!s)return;
        s.innerHTML='<option value="all">All Modules</option>';
        DATA.modules.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`Module ${m.id}: ${m.title}`;s.appendChild(o);});
        s.value='all';this.selectedModuleId='all';this.flashcardCount=20;
    }

    changeFlashcardModule(v){this.selectedModuleId=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);}

    startFlashcardsForModule(v){this.selectedModuleId=v;const s=document.getElementById('flashcards-module-select');if(s)s.value=v;this.navigateTo('flashcards');}

    loadFlashcards(v){
        if (!window.DATA) return;
        const all=v==='all'?Object.values(DATA.flashcards).flat():[...(DATA.flashcards[String(v)]||[])];
        const n=this.flashcardCount||20; this.currentCards=[...all].sort(()=>Math.random()-.5).slice(0,n==='all'?all.length:Math.min(n,all.length));
        this.cardIndex=0;this.isCardFlipped=false;
        const m=DATA.modules.find(x=>x.id===Number(v));
        const badge=document.getElementById('flashcard-module-badge');
        const title=document.getElementById('flashcard-title');
        if(badge) badge.textContent=v==='all'?'All Modules':`Module ${m.id}`;
        if(title) title.textContent=v==='all'?'Core 2 — Modules 11–22':m.title;
        this.renderCard();
    }

    populatePBQDropdown(){
        const existing=document.getElementById('pbq-scenario-select');if(!existing)return;
        existing.innerHTML=pbqScenarios.map((s,i)=>`<option value="${i}">Scenario ${i+1}: ${s.title}</option>`).join('');
    }

    renderReference(){
        const data={"Ports & Protocols":[["22","SSH — Secure Shell"],["23","Telnet"],["25","SMTP"],["53","DNS"],["67/68","DHCP"],["80","HTTP"],["110","POP3"],["143","IMAP"],["137–139","NetBIOS/NetBT"],["389","LDAP"],["443","HTTPS"],["445","SMB/CIFS"],["3389","RDP"],["5900","VNC"]],"Windows / Security":[["NTFS","New Technology File System"],["ReFS","Resilient File System"],["BitLocker","Windows drive encryption"],["EFS","Encrypting File System"],["UAC","User Account Control"],["WPA2","Wireless security protocol"],["WPA3","Wireless security protocol"],["SAE","Simultaneous Authentication of Equals"],["RADIUS","Remote Authentication Dial-In User Service"],["AES","Advanced Encryption Standard"],["MDM","Mobile Device Management"]],"Script & File Types":[[".ps1","PowerShell script"],[".bat","Batch file"],[".vbs","VBScript"],[".js","JavaScript"],[".py","Python"],[".pyw","Python windowed script"],[".exe","Windows executable"],[".msi","Windows installer package"]],"Windows Commands & Tools":[["ipconfig","Windows IP configuration"],["ping","Network connectivity test"],["netstat","Network connection/status information"],["nslookup","DNS query tool"],["tracert","Route tracing tool"],["pathping","Network path and packet-loss information"],["chkdsk","Disk/file-system checking tool"],["diskpart","Disk partition management tool"],["robocopy","File copying tool"],["gpupdate","Updates Group Policy settings"],["gpresult","Displays resulting Group Policy settings"],["sfc","System File Checker"],["eventvwr.msc","Event Viewer"],["diskmgmt.msc","Disk Management"],["taskschd.msc","Task Scheduler"],["devmgmt.msc","Device Manager"],["certmgr.msc","Certificate Manager"],["lusrmgr.msc","Local Users and Groups"],["perfmon.msc","Performance Monitor"],["gpedit.msc","Group Policy Editor"],["msinfo32.exe","System Information"],["resmon.exe","Resource Monitor"],["msconfig.exe","System Configuration"],["cleanmgr.exe","Disk Cleanup"],["dfrgui.exe","Disk Defragment"],["regedit.exe","Registry Editor"]],"Wireless / Connectivity":[["2.4 GHz","Wi-Fi frequency band"],["5 GHz","Wi-Fi frequency band"],["6 GHz","Wi-Fi frequency band"],["802.11","IEEE wireless LAN standard"],["NFC","Near Field Communication"],["RFID","Radio Frequency Identification"]],"Backup & Operations":[["Full backup","Copies all selected data"],["Incremental backup","Copies changes since the last backup"],["Differential backup","Copies changes since the last full backup"],["GFS","Grandfather-Father-Son backup rotation"],["3-2-1","Backup rule described in Core 2 objectives"],["CAB","Change board / change review"],["Risk analysis","Evaluation of risk associated with a change"]]}; const root=document.getElementById('reference-content');if(!root)return;
        root.innerHTML=Object.entries(data).map(([title,items])=>`<div class="glass-card rounded-2xl p-5 border border-slate-800"><h3 class="font-bold text-white mb-3">${title}</h3><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">${items.map(x=>`<div class="p-3 rounded-xl bg-slate-900 border border-slate-800"><div class="font-mono font-bold text-cyan-300 text-xs">${x[0]}</div><div class="text-xs text-slate-300 mt-1">${x[1]}</div></div>`).join('')}</div></div>`).join('');
    }

    saveState() {
        localStorage.setItem('c2state_v2', JSON.stringify(this.state));
        this.updateGlobalStats();
        this.updateReadiness();
    }

    navigateTo(viewId) {
        this.currentView = viewId;
        ['home', 'flashcards', 'quiz', 'pbq', 'results', 'stats', 'reference'].forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el) el.classList.add('hidden');
            const nav = document.getElementById(`nav-${v}`);
            if (nav) {
                nav.classList.remove('bg-brand-600', 'text-white');
                nav.classList.add('text-slate-400');
            }
        });

        const activeView = document.getElementById(`view-${viewId}`);
        if (activeView) activeView.classList.remove('hidden');
        const activeNav = document.getElementById(`nav-${viewId}`);
        if (activeNav) {
            activeNav.classList.add('bg-brand-600', 'text-white');
            activeNav.classList.remove('text-slate-400');
        }

        if (viewId === 'flashcards') this.loadFlashcards(this.selectedModuleId);
        if (viewId === 'pbq') this.loadPBQScenario(this.currentPBQIndex);
        if (viewId === 'stats') this.renderStatsView();
        if (viewId === 'reference') this.renderReference();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    getWeakLessons() {
        if (!window.DATA) return [];
        const scores = {};
        DATA.questions.forEach(q => {
            const x = this.state.stats[q.lesson];
            if (x && (x.c + x.w) > 0) scores[q.lesson] = x.c / (x.c + x.w);
        });
        return Object.entries(scores).sort((a,b) => a[1] - b[1]).slice(0, 5).map(x => x[0]);
    }

    updateGlobalStats() {
        if (!window.DATA) return;
        const totalQ = DATA.questions.length;
        let correctTotal = 0;
        let attemptedTotal = 0;

        Object.values(this.state.stats).forEach(s => {
            correctTotal += s.c || 0;
            attemptedTotal += (s.c || 0) + (s.w || 0);
        });

        const accuracy = attemptedTotal > 0 ? Math.round((correctTotal / attemptedTotal) * 100) : 0;
        const weakCount = this.getWeakLessons().length;

        const qEl = document.getElementById('stat-total-q');
        const accEl = document.getElementById('stat-accuracy-home');
        const wrEl = document.getElementById('stat-wrong-home');
        const stEl = document.getElementById('stat-starred-home');

        if(qEl) qEl.textContent = totalQ;
        if(accEl) accEl.textContent = `${accuracy}%`;
        if(wrEl) wrEl.textContent = this.state.wrong.length;
        if(stEl) stEl.textContent = this.state.starred.length;

        const bWr = document.getElementById('badge-wrong');
        const bWk = document.getElementById('badge-weak');
        const bSt = document.getElementById('badge-starred');
        const bNw = document.getElementById('badge-new');

        if(bWr) bWr.textContent = this.state.wrong.length;
        if(bWk) bWk.textContent = weakCount;
        if(bSt) bSt.textContent = this.state.starred.length;
        if(bNw) bNw.textContent = DATA.questions.filter(q => !this.state.answered[q.id]).length;
    }

    buildHomeControls() {
        if (!window.DATA) return;
        const rs = document.getElementById('rangeSelect');
        const em = document.getElementById('extraModule');
        if(!rs || !em) return;

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
            o.textContent = `Module ${m.id}`;
            em.appendChild(o);
        });
    }

    renderModulesGrid() {
        if (!window.DATA) return;
        const grid = document.getElementById('modulesGrid');
        if(!grid) return;
        grid.innerHTML = '';

        DATA.modules.forEach(m => {
            const qCount = DATA.questions.filter(q => q.module === m.id).length;
            const card = document.createElement('div');
            card.className = "glass-card rounded-2xl p-5 flex flex-col justify-between border border-slate-800 hover:border-brand-500/60 transition-all";
            card.innerHTML = `
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr ${m.color} flex items-center justify-center text-white shadow-md">
                            <i class="fa-solid ${m.icon} text-lg"></i>
                        </div>
                        <span class="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300">Mod ${m.id}</span>
                    </div>
                    <h4 class="font-bold text-base text-white mb-1">${m.title}</h4>
                    <p class="text-xs text-slate-400 leading-relaxed mb-3">${qCount} Questions Available</p>
                    
                    <div class="flex flex-wrap gap-1 mb-4">
                        ${m.lessons.map(l => `<span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-brand-accent border border-slate-700/50">${l}</span>`).join('')}
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button onclick="app.startFlashcardsForModule(${m.id})" class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-clone text-brand-accent"></i> Cards
                    </button>
                    <button onclick="app.startModuleQuiz(${m.id})" class="flex-1 py-2 rounded-xl bg-brand-600/90 hover:bg-brand-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-play"></i> Quiz
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    startPracticeMode(mode) {
        if (!window.DATA) return;
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
        } else if (mode === 'weak') {
            const weak = this.getWeakLessons();
            pool = DATA.questions.filter(q => weak.includes(q.lesson));
            label = 'Weak Areas Practice';
        } else if (mode === 'starred') {
            pool = DATA.questions.filter(q => this.state.starred.includes(q.id));
            label = 'Starred Questions Review';
        } else if (mode === 'new') {
            pool = DATA.questions.filter(q => !this.state.answered[q.id]);
            label = 'New Unanswered Questions';
        }

        if (!pool.length) {
            alert("No questions available in this practice set yet!");
            return;
        }

        this.startSession(pool, label);
    }

    startChallenge() {
        if (!window.DATA) return;
        const rsVal = document.getElementById('rangeSelect')?.value;
        const extra = document.getElementById('extraModule')?.value;
        if(!rsVal) return;

        const rs = rsVal.split('-').map(Number);
        
        let pool = DATA.questions.filter(q => q.module >= rs[0] && q.module <= rs[1]);
        if (extra) {
            pool = pool.concat(DATA.questions.filter(q => q.module === Number(extra)));
        }

        pool = [...new Map(pool.map(q => [q.id, q])).values()];

        this.startSession(pool, `Challenge Modules ${rs[0]}–${rs[1]}${extra ? ` + Mod ${extra}` : ''}`);
    }

    startModuleQuiz(modId) {
        if (!window.DATA) return;
        const pool = DATA.questions.filter(q => q.module === modId);
        const mod = DATA.modules.find(m => m.id === modId);
        this.startSession(pool, `Module ${modId}: ${mod.title}`);
    }

    startSession(pool, label) {
        const countVal = document.getElementById('countSelect')?.value || '20';
        const requested = countVal === 'All available' ? pool.length : parseInt(countVal);

        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.sessionPool = pool;
        this.session = shuffled.slice(0, Math.min(requested, shuffled.length));
        this.sessionIndex = 0;
        this.sessionAnswers = [];
        this.currentModeLabel = label;

        this.navigateTo('quiz');
        this.renderQuizQuestion();
    }

    retrySession() {
        this.startSession(this.sessionPool, `${this.currentModeLabel} (Retry)`);
    }

    renderQuizQuestion() {
        const q = this.session[this.sessionIndex];
        if (!q) return;

        this.selectedOption = null;
        this.isAnswered = false;

        document.getElementById('quizLabel').textContent = this.currentModeLabel;
        document.getElementById('lessonTag').textContent = q.lesson;
        document.getElementById('difficultyTag').textContent = q.difficulty || 'Core 2';
        document.getElementById('questionText').textContent = q.question;
        document.getElementById('quizProgress').textContent = `${this.sessionIndex + 1} / ${this.session.length}`;
        
        const pct = (this.sessionIndex / this.session.length) * 100;
        document.getElementById('progressBar').style.width = `${pct}%`;

        const starBtn = document.getElementById('starBtn');
        const isStarred = this.state.starred.includes(q.id);
        if(starBtn) starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;

        const ansDiv = document.getElementById('answers');
        if(ansDiv) {
            ansDiv.innerHTML = '';
            q.options.forEach((optText, idx) => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-sm font-medium text-slate-200 transition-all flex items-center justify-between group";
                btn.onclick = () => this.selectOption(idx);
                btn.id = `opt-${idx}`;
                btn.innerHTML = `
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 rounded-lg bg-slate-900 text-slate-400 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center font-mono text-xs font-bold transition-all">${String.fromCharCode(65 + idx)}</span>
                        <span>${optText}</span>
                    </div>
                    <i class="fa-regular fa-circle text-slate-600 group-hover:text-brand-400 text-lg"></i>
                `;
                ansDiv.appendChild(btn);
            });
        }

        document.getElementById('feedback').className = "hidden p-4 rounded-2xl border space-y-2";
        document.getElementById('confirmBtn').classList.remove('hidden');
        document.getElementById('nextBtn').classList.add('hidden');
    }

    selectOption(idx) {
        if (this.isAnswered) return;
        this.selectedOption = idx;

        const ansDiv = document.getElementById('answers');
        if(!ansDiv) return;
        Array.from(ansDiv.children).forEach((child, i) => {
            if (i === idx) {
                child.className = "w-full text-left p-4 rounded-xl bg-brand-600/20 border-2 border-brand-500 text-sm font-medium text-white flex items-center justify-between";
                child.querySelector('i').className = "fa-solid fa-circle-dot text-brand-accent text-lg";
            } else {
                child.className = "w-full text-left p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-sm font-medium text-slate-400 flex items-center justify-between opacity-60";
                child.querySelector('i').className = "fa-regular fa-circle text-slate-600 text-lg";
            }
        });
    }

    confirmAnswer() {
        if (this.selectedOption === null || this.isAnswered) {
            alert("Please select an answer first.");
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

        this.saveState();

        const ansDiv = document.getElementById('answers');
        if(ansDiv) {
            Array.from(ansDiv.children).forEach((child, i) => {
                if (i === q.answer) {
                    child.className = "w-full text-left p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-sm font-medium text-emerald-200 flex items-center justify-between";
                } else if (i === this.selectedOption && !isCorrect) {
                    child.className = "w-full text-left p-4 rounded-xl bg-rose-500/20 border-2 border-rose-500 text-sm font-medium text-rose-200 flex items-center justify-between";
                }
            });
        }

        const fb = document.getElementById('feedback');
        if(fb) {
            fb.classList.remove('hidden');
            if (isCorrect) {
                fb.className = "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1";
                fb.innerHTML = `<b class="text-emerald-400 text-sm block"><i class="fa-solid fa-circle-check"></i> Correct!</b> ${q.explanation}`;
            } else {
                fb.className = "p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 space-y-1";
                fb.innerHTML = `<b class="text-rose-400 text-sm block"><i class="fa-solid fa-circle-xmark"></i> Incorrect. Correct: (${String.fromCharCode(65 + q.answer)}) ${q.options[q.answer]}</b> ${q.explanation}`;
            }
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

        this.saveState();
        const starBtn = document.getElementById('starBtn');
        const isStarred = this.state.starred.includes(q.id);
        if(starBtn) starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;
    }

    showResults() {
        const correctCount = this.sessionAnswers.filter(Boolean).length;
        const total = this.session.length;
        const pct = Math.round((correctCount / total) * 100);

        this.navigateTo('results');

        document.getElementById('resultTitle').textContent = pct >= 80 ? "Session Completed! Excellent Work!" : "Session Completed! Keep Training!";
        document.getElementById('resultScore').textContent = `${correctCount}/${total}`;
        document.getElementById('resultPct').textContent = `${pct}% Score`;

        document.getElementById('resultDetails').innerHTML = `
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <b class="text-white text-base block">${pct}%</b>
                <span class="text-slate-400">Accuracy</span>
            </div>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <b class="text-rose-400 text-base block">${total - correctCount}</b>
                <span class="text-slate-400">Missed</span>
            </div>
            <div class="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <b class="text-amber-400 text-base block">${this.state.starred.length}</b>
                <span class="text-slate-400">Starred Total</span>
            </div>
        `;
    }

    renderCard() {
        const inner = document.getElementById('flashcard-inner');
        if (this.isCardFlipped && inner) {
            inner.classList.remove('rotate-y-180');
            this.isCardFlipped = false;
        }

        const card = this.currentCards[this.cardIndex];
        if(card) {
            document.getElementById('card-front-text').textContent = card.term;
            document.getElementById('card-back-text').textContent = card.def;
            document.getElementById('card-progress-count').textContent = `${this.cardIndex + 1} / ${this.currentCards.length}`;
        }
    }

    flipCard() {
        const inner = document.getElementById('flashcard-inner');
        this.isCardFlipped = !this.isCardFlipped;
        if (this.isCardFlipped) {
            if(inner) inner.classList.add('rotate-y-180');
            this.state.cardsViewed = (this.state.cardsViewed || 0) + 1;
            this.saveState();
        } else {
            if(inner) inner.classList.remove('rotate-y-180');
        }
    }

    nextCard() {
        if(!this.currentCards || !this.currentCards.length) return;
        this.cardIndex = (this.cardIndex + 1) % this.currentCards.length;
        this.renderCard();
    }

    prevCard() {
        if(!this.currentCards || !this.currentCards.length) return;
        this.cardIndex = (this.cardIndex - 1 + this.currentCards.length) % this.currentCards.length;
        this.renderCard();
    }

    loadPBQScenario(index) {
        this.currentPBQIndex = index;
        const sc = pbqScenarios[index];
        if(!sc) return;
        document.getElementById('pbq-scenario-title').textContent = sc.title;
        document.getElementById('pbq-scenario-desc').textContent = sc.desc;
        document.getElementById('pbq-scenario-objective').textContent = sc.objective;

        const body = document.getElementById('terminal-body');
        if(body) {
            body.innerHTML = `
                <div>Microsoft Windows [Version 10.0.19045.3803]</div>
                <div>(c) Microsoft Corporation. All rights reserved.</div>
                <div class="text-slate-400 pb-2">Type your command below to execute scenario task:</div>
            `;
        }
    }

    selectPBQScenario(idx) {
        this.loadPBQScenario(idx);
    }

    handleTerminalCommand(e) {
        if (e.key === 'Enter') this.execTerminalCommand();
    }

    execTerminalCommand() {
        const input = document.getElementById('terminal-input');
        const cmd = input?.value.trim();
        if (!cmd) return;

        const body = document.getElementById('terminal-body');
        if(!body) return;
        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = `<span class="text-slate-400">C:\\Windows\\System32&gt;</span> ${cmd}`;
        body.appendChild(cmdLine);

        const sc = pbqScenarios[this.currentPBQIndex];
        const respLine = document.createElement('div');

        if (sc.expected.some(c => cmd.toLowerCase().includes(c.toLowerCase()))) {
            respLine.className = "text-emerald-300 font-mono whitespace-pre-line my-1 p-2 bg-emerald-950/40 rounded border border-emerald-800/50";
            respLine.textContent = sc.success;
            this.state.pbqSolved = (this.state.pbqSolved || 0) + 1;
            this.saveState();
        } else if (cmd.toLowerCase() === 'help') {
            respLine.className = "text-amber-300 font-mono my-1";
            respLine.textContent = "Available CLI commands: sfc, chkdsk, ipconfig, netstat, wpa3, clear.";
        } else {
            respLine.className = "text-rose-400 font-mono my-1";
            respLine.textContent = `'${cmd}' is not recognized as a command for this scenario. Try again or check hint.`;
        }

        body.appendChild(respLine);
        input.value = '';
        body.scrollTop = body.scrollHeight;
    }

    clearTerminal() {
        const body = document.getElementById('terminal-body');
        if(body) {
            body.innerHTML = `
                <div>Microsoft Windows [Version 10.0.19045.3803]</div>
                <div class="text-slate-400 pb-2">Terminal cleared.</div>
            `;
        }
    }

    renderStatsView() {
        if (!window.DATA) return;
        const list = document.getElementById('module-stats-list');
        if(!list) return;
        list.innerHTML = '';
        
        DATA.modules.forEach(m => {
            const lessons = m.lessons;
            let modCorrect = 0;
            let modTotal = 0;

            lessons.forEach(l => {
                const s = this.state.stats[l];
                if (s) {
                    modCorrect += s.c || 0;
                    modTotal += (s.c || 0) + (s.w || 0);
                }
            });

            const pct = modTotal > 0 ? Math.round((modCorrect / modTotal) * 100) : 0;

            const row = document.createElement('div');
            row.className = "p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs";
            row.innerHTML = `
                <div>
                    <span class="font-bold text-white">Module ${m.id}: ${m.title}</span>
                    <span class="text-slate-400 block text-[10px]">${m.lessons.join(' · ')}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-emerald-400 font-bold font-mono">${pct}% Accuracy</span>
                    <span class="text-slate-400 font-mono">(${modTotal} attempted)</span>
                </div>
            `;
            list.appendChild(row);
        });
    }

    resetProgress() {
        if (confirm("Are you sure you want to reset all quiz progress and stats?")) {
            this.state = { answered: {}, wrong: [], starred: [], stats: {}, cardsViewed: 0, pbqSolved: 0 };
            this.saveState();
            this.renderStatsView();
        }
    }
}

let app;
window.onload = function() {
    app = new MainApp();
};
