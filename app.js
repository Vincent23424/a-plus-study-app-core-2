        /**
         * Embedded Questions & Modules Data
         */
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
                this.practiceCount = Number(localStorage.getItem('c2_practice_count')) || 10;

                // Flashcard State
                this.selectedModuleId = 11;
                this.cardIndex = 0;
                this.isCardFlipped = false;

                // PBQ State
                this.currentPBQIndex = 0;

                this.init();
            }

            init() {
                this.buildHomeControls();
                this.renderModulesGrid();
                this.updateGlobalStats();
                this.populateFlashcardDropdown();
                this.populatePBQDropdown();
                this.renderReference();
                this.updateReadiness();
                this.setPracticeCount(this.practiceCount);
            }

            updateReadiness() {
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
            startAllModules(){
                const sel=document.getElementById('all-module-count'); const val=sel?sel.value:'20';
                const pool=[...DATA.questions].sort(()=>Math.random()-.5); const n=val==='all'?pool.length:Math.min(Number(val),pool.length);
                this.startSession(pool.slice(0,n),`All Modules — ${n} Questions`);
            }
            changeFlashcardCount(v){this.flashcardCount=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);}
            populateFlashcardDropdown(){
                const s=document.getElementById('flashcards-module-select');s.innerHTML='<option value="all">All Modules</option>';
                DATA.modules.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`Module ${m.id}: ${m.title}`;s.appendChild(o);});
                s.value='all';this.selectedModuleId='all';this.flashcardCount=20;
            }
            changeFlashcardModule(v){this.selectedModuleId=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);}
            startFlashcardsForModule(v){this.selectedModuleId=v;document.getElementById('flashcards-module-select').value=v;this.navigateTo('flashcards');}
            loadFlashcards(v){
                const all=v==='all'?Object.values(DATA.flashcards).flat():[...(DATA.flashcards[String(v)]||[])];
                const n=this.flashcardCount||20; this.currentCards=[...all].sort(()=>Math.random()-.5).slice(0,n==='all'?all.length:Math.min(n,all.length));
                this.cardIndex=0;this.isCardFlipped=false;
                const m=DATA.modules.find(x=>x.id===Number(v));
                document.getElementById('flashcard-module-badge').textContent=v==='all'?'All Modules':`Module ${m.id}`;
                document.getElementById('flashcard-title').textContent=v==='all'?'Core 2 — Modules 11–22':m.title;
                const av=document.getElementById('flashcards-available');if(av)av.textContent=`${all.length} available`;
                this.renderCard();
            }
            populatePBQDropdown(){
                const existing=document.getElementById('pbq-scenario-select');if(!existing)return;
                existing.innerHTML=pbqScenarios.map((s,i)=>`<option value="${i}">Scenario ${i+1}: ${s.title}</option>`).join('');
            }
            submitPBQ(){
                const input=document.getElementById('terminal-input'),cmd=(input.value||'').trim().toLowerCase(),sc=pbqScenarios[this.currentPBQIndex];if(!cmd)return;
                const ok=sc.expected.some(x=>cmd===x.toLowerCase()||cmd.includes(x.toLowerCase())); const fb=document.getElementById('pbq-feedback');
                if(fb){fb.className=`mb-3 p-3 rounded-xl text-xs border ${ok?'bg-emerald-950/40 border-emerald-800 text-emerald-300':'bg-rose-950/40 border-rose-800 text-rose-300'}`;fb.innerHTML=ok?`<b>✓ Correct</b><div class="mt-1">${sc.success}</div>`:`<b>✗ Not correct</b><div class="mt-1">${sc.failure}</div><div class="mt-1 text-slate-500">Use the hint if needed and submit again.</div>`;}
                if(ok){const key=`pbq-${this.currentPBQIndex}`;this.state.pbqCompleted=this.state.pbqCompleted||{};if(!this.state.pbqCompleted[key]){this.state.pbqCompleted[key]=true;this.state.pbqSolved=(this.state.pbqSolved||0)+1;this.saveState();}}
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

                document.getElementById(`view-${viewId}`).classList.remove('hidden');
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
                const scores = {};
                DATA.questions.forEach(q => {
                    const x = this.state.stats[q.lesson];
                    if (x && (x.c + x.w) > 0) scores[q.lesson] = x.c / (x.c + x.w);
                });
                return Object.entries(scores).sort((a,b) => a[1] - b[1]).slice(0, 5).map(x => x[0]);
            }

            updateGlobalStats() {
                const totalQ = DATA.questions.length;
                const answeredKeys = Object.keys(this.state.answered);
                let correctTotal = 0;
                let attemptedTotal = 0;

                Object.values(this.state.stats).forEach(s => {
                    correctTotal += s.c || 0;
                    attemptedTotal += (s.c || 0) + (s.w || 0);
                });

                const accuracy = attemptedTotal > 0 ? Math.round((correctTotal / attemptedTotal) * 100) : 0;
                const weakCount = this.getWeakLessons().length;

                // Home hero stats
                document.getElementById('stat-total-q').textContent = totalQ;
                document.getElementById('stat-accuracy-home').textContent = `${accuracy}%`;
                document.getElementById('stat-wrong-home').textContent = this.state.wrong.length;
                document.getElementById('stat-starred-home').textContent = this.state.starred.length;

                // Feature card badges
                document.getElementById('badge-wrong').textContent = this.state.wrong.length;
                document.getElementById('badge-weak').textContent = weakCount;
                document.getElementById('badge-starred').textContent = this.state.starred.length;
                document.getElementById('badge-new').textContent = DATA.questions.filter(q => !this.state.answered[q.id]).length;
            }

            buildHomeControls() {
                const rs = document.getElementById('rangeSelect');
                const em = document.getElementById('extraModule');
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
                const grid = document.getElementById('modulesGrid');
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

            setPracticeCount(count) {
                this.practiceCount = Number(count) === 20 ? 20 : 10;
                localStorage.setItem('c2_practice_count', String(this.practiceCount));

                document.querySelectorAll('[data-practice-count]').forEach(btn => {
                    const active = Number(btn.dataset.practiceCount) === this.practiceCount;
                    btn.classList.toggle('bg-brand-600', active);
                    btn.classList.toggle('text-white', active);
                    btn.classList.toggle('border-brand-500', active);
                    btn.classList.toggle('bg-slate-800', !active);
                    btn.classList.toggle('text-slate-300', !active);
                    btn.classList.toggle('border-slate-700', !active);
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

                this.startSession(pool, label, this.practiceCount);
            }

            startChallenge() {
                const rs = document.getElementById('rangeSelect').value.split('-').map(Number);
                const extra = document.getElementById('extraModule').value;
                
                let pool = DATA.questions.filter(q => q.module >= rs[0] && q.module <= rs[1]);
                if (extra) {
                    pool = pool.concat(DATA.questions.filter(q => q.module === Number(extra)));
                }

                // De-duplicate
                pool = [...new Map(pool.map(q => [q.id, q])).values()];

                this.startSession(pool, `Challenge Modules ${rs[0]}–${rs[1]}${extra ? ` + Mod ${extra}` : ''}`);
            }

            startModuleQuiz(modId) {
                const pool = DATA.questions.filter(q => q.module === modId);
                const mod = DATA.modules.find(m => m.id === modId);
                this.startSession(pool, `Module ${modId}: ${mod.title}`);
            }

            startSession(pool, label, countOverride = null) {
                const countVal = document.getElementById('countSelect')?.value || '10';
                const requested = countOverride !== null
                    ? Math.min(Number(countOverride), pool.length)
                    : (countVal === 'All available' ? pool.length : parseInt(countVal));

                // Shuffle pool
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

                // Star Button State
                const starBtn = document.getElementById('starBtn');
                const isStarred = this.state.starred.includes(q.id);
                starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;

                // Render Answers
                const ansDiv = document.getElementById('answers');
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

                // Reset feedback and action buttons
                document.getElementById('feedback').className = "hidden p-4 rounded-2xl border space-y-2";
                document.getElementById('confirmBtn').classList.remove('hidden');
                document.getElementById('nextBtn').classList.add('hidden');
            }

            selectOption(idx) {
                if (this.isAnswered) return;
                this.selectedOption = idx;

                const ansDiv = document.getElementById('answers');
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

                // Update Local Storage stats
                if (!this.state.stats[q.lesson]) this.state.stats[q.lesson] = { c: 0, w: 0 };
                this.state.stats[q.lesson][isCorrect ? 'c' : 'w']++;
                this.state.answered[q.id] = true;

                if (!isCorrect && !this.state.wrong.includes(q.id)) {
                    this.state.wrong.push(q.id);
                } else if (isCorrect) {
                    this.state.wrong = this.state.wrong.filter(id => id !== q.id);
                }

                this.saveState();

                // Highlight Options
                const ansDiv = document.getElementById('answers');
                Array.from(ansDiv.children).forEach((child, i) => {
                    if (i === q.answer) {
                        child.className = "w-full text-left p-4 rounded-xl bg-emerald-500/20 border-2 border-emerald-500 text-sm font-medium text-emerald-200 flex items-center justify-between";
                    } else if (i === this.selectedOption && !isCorrect) {
                        child.className = "w-full text-left p-4 rounded-xl bg-rose-500/20 border-2 border-rose-500 text-sm font-medium text-rose-200 flex items-center justify-between";
                    }
                });

                // Show Feedback
                const fb = document.getElementById('feedback');
                fb.classList.remove('hidden');
                if (isCorrect) {
                    fb.className = "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1";
                    fb.innerHTML = `<b class="text-emerald-400 text-sm block"><i class="fa-solid fa-circle-check"></i> Correct!</b> ${q.explanation}`;
                } else {
                    fb.className = "p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 space-y-1";
                    fb.innerHTML = `<b class="text-rose-400 text-sm block"><i class="fa-solid fa-circle-xmark"></i> Incorrect. Correct: (${String.fromCharCode(65 + q.answer)}) ${q.options[q.answer]}</b> ${q.explanation}`;
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
                starBtn.innerHTML = isStarred ? `<i class="fa-solid fa-star text-amber-400 text-lg"></i>` : `<i class="fa-regular fa-star text-slate-400 text-lg"></i>`;
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

            /* Flashcards logic */
            populateFlashcardDropdown() {
                const select = document.getElementById('flashcards-module-select');
                select.innerHTML = '';
                DATA.modules.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = `Module ${m.id}: ${m.title}`;
                    select.appendChild(opt);
                });
            }

            startFlashcardsForModule(modId) {
                this.selectedModuleId = modId;
                document.getElementById('flashcards-module-select').value = modId;
                this.navigateTo('flashcards');
            }

            changeFlashcardModule(modId) {
                this.selectedModuleId = parseInt(modId);
                this.loadFlashcards(this.selectedModuleId);
            }

            loadFlashcards(modId) {
                const mod = DATA.modules.find(m => m.id === parseInt(modId));
                const cards = DATA.flashcards[modId] || [
                    { term: "Standard Concept", def: "Flashcards content available in primary guide." }
                ];

                this.currentCards = cards;
                this.cardIndex = 0;
                this.isCardFlipped = false;

                document.getElementById('flashcard-module-badge').textContent = `Module ${mod.id}`;
                document.getElementById('flashcard-title').textContent = mod.title;
                this.renderCard();
            }

            renderCard() {
                const inner = document.getElementById('flashcard-inner');
                if (this.isCardFlipped) {
                    inner.classList.remove('rotate-y-180');
                    this.isCardFlipped = false;
                }

                const card = this.currentCards[this.cardIndex];
                document.getElementById('card-front-text').textContent = card.term;
                document.getElementById('card-back-text').textContent = card.def;
                document.getElementById('card-progress-count').textContent = `${this.cardIndex + 1} / ${this.currentCards.length}`;
            }

            flipCard() {
                const inner = document.getElementById('flashcard-inner');
                this.isCardFlipped = !this.isCardFlipped;
                if (this.isCardFlipped) {
                    inner.classList.add('rotate-y-180');
                    this.state.cardsViewed = (this.state.cardsViewed || 0) + 1;
                    this.saveState();
                } else {
                    inner.classList.remove('rotate-y-180');
                }
            }

            nextCard() {
                this.cardIndex = (this.cardIndex + 1) % this.currentCards.length;
                this.renderCard();
            }

            prevCard() {
                this.cardIndex = (this.cardIndex - 1 + this.currentCards.length) % this.currentCards.length;
                this.renderCard();
            }

            shuffleCards() {
                this.currentCards.sort(() => Math.random() - 0.5);
                this.cardIndex = 0;
                this.renderCard();
            }

            /* PBQ Terminal logic */
            loadPBQScenario(index) {
                this.currentPBQIndex = index;
                const sc = pbqScenarios[index];
                document.getElementById('pbq-scenario-title').textContent = sc.title;
                document.getElementById('pbq-scenario-desc').textContent = sc.desc;
                document.getElementById('pbq-scenario-objective').textContent = sc.objective;
                document.getElementById('pbq-hint-text').textContent = sc.hint;
                document.getElementById('pbq-hint-box').classList.add('hidden');

                const body = document.getElementById('terminal-body');
                body.innerHTML = `
                    <div>Microsoft Windows [Version 10.0.19045.3803]</div>
                    <div>(c) Microsoft Corporation. All rights reserved.</div>
                    <div class="text-slate-400 pb-2">Type your command below to execute scenario task:</div>
                `;
            }

            selectPBQScenario(idx) {
                this.loadPBQScenario(idx);
            }

            togglePBQHint() {
                document.getElementById('pbq-hint-box').classList.toggle('hidden');
            }

            handleTerminalCommand(e) {
                if (e.key === 'Enter') this.execTerminalCommand();
            }

            execTerminalCommand() {
                const input = document.getElementById('terminal-input');
                const cmd = input.value.trim();
                if (!cmd) return;

                const body = document.getElementById('terminal-body');
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
                document.getElementById('terminal-body').innerHTML = `
                    <div>Microsoft Windows [Version 10.0.19045.3803]</div>
                    <div class="text-slate-400 pb-2">Terminal cleared.</div>
                `;
            }

            /* Render Stats Page */
            renderStatsView() {
                const list = document.getElementById('module-stats-list');
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

        // Feature overrides for the original Gemini design.
        MainApp.prototype.populateFlashcardDropdown = function(){const s=document.getElementById('flashcards-module-select');s.innerHTML='<option value="all">All Modules</option>';DATA.modules.forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=`Module ${m.id}: ${m.title}`;s.appendChild(o);});s.value='all';this.selectedModuleId='all';this.flashcardCount=20;};
        MainApp.prototype.changeFlashcardModule=function(v){this.selectedModuleId=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);};
        MainApp.prototype.changeFlashcardCount=function(v){this.flashcardCount=v==='all'?'all':Number(v);this.loadFlashcards(this.selectedModuleId);};
        MainApp.prototype.startFlashcardsForModule=function(v){this.selectedModuleId=v;document.getElementById('flashcards-module-select').value=v;this.navigateTo('flashcards');};
        MainApp.prototype.loadFlashcards=function(v){const all=v==='all'?Object.values(DATA.flashcards).flat():[...(DATA.flashcards[String(v)]||[])];const n=this.flashcardCount||20;this.currentCards=[...all].sort(()=>Math.random()-.5).slice(0,n==='all'?all.length:Math.min(n,all.length));this.cardIndex=0;this.isCardFlipped=false;const m=DATA.modules.find(x=>x.id===Number(v));document.getElementById('flashcard-module-badge').textContent=v==='all'?'All Modules':`Module ${m.id}`;document.getElementById('flashcard-title').textContent=v==='all'?'Core 2 — Modules 11–22':m.title;const av=document.getElementById('flashcards-available');if(av)av.textContent=`${all.length} available`;this.renderCard();};
        MainApp.prototype.updateReadiness=function(){let c=0,a=0;Object.values(this.state.stats).forEach(s=>{c+=s.c||0;a+=(s.c||0)+(s.w||0);});const coverage=DATA.questions.length?Math.min(Object.keys(this.state.answered).length,DATA.questions.length)/DATA.questions.length:0;const accuracy=a?c/a:0;let sum=0,n=0;DATA.modules.forEach(m=>{let mc=0,mt=0;m.lessons.forEach(l=>{const s=this.state.stats[l];if(s){mc+=s.c||0;mt+=(s.c||0)+(s.w||0);}});if(mt){sum+=mc/mt;n++;}});const consistency=n?sum/n:0;const r=Math.round((coverage*.30+accuracy*.50+consistency*.20)*100);const v=document.getElementById('readiness-value'),b=document.getElementById('readiness-bar');if(v)v.textContent=r+'%';if(b)b.style.width=r+'%';};
        MainApp.prototype.startAllModules=function(){const val=document.getElementById('all-module-count')?.value||'20';const pool=[...DATA.questions].sort(()=>Math.random()-.5);const n=val==='all'?pool.length:Math.min(Number(val),pool.length);this.startSession(pool.slice(0,n),`All Modules — ${n} Questions`);};
        MainApp.prototype.navigateTo=function(viewId){this.currentView=viewId;['home','flashcards','quiz','pbq','results','stats','reference'].forEach(v=>{const e=document.getElementById(`view-${v}`);if(e)e.classList.add('hidden');const n=document.getElementById(`nav-${v}`);if(n){n.classList.remove('bg-brand-600','text-white');n.classList.add('text-slate-400');}});const e=document.getElementById(`view-${viewId}`);if(e)e.classList.remove('hidden');const n=document.getElementById(`nav-${viewId}`);if(n){n.classList.add('bg-brand-600','text-white');n.classList.remove('text-slate-400');}if(viewId==='flashcards')this.loadFlashcards(this.selectedModuleId);if(viewId==='pbq')this.loadPBQScenario(this.currentPBQIndex);if(viewId==='stats')this.renderStatsView();if(viewId==='reference')this.renderReference();window.scrollTo({top:0,behavior:'smooth'});};
        MainApp.prototype.populatePBQDropdown=function(){const s=document.getElementById('pbq-scenario-select');if(!s)return;s.innerHTML=pbqScenarios.map((x,i)=>`<option value="${i}">Scenario ${i+1}: ${x.title}</option>`).join('');};
        MainApp.prototype.submitPBQ=function(){const input=document.getElementById('terminal-input'),cmd=(input?.value||'').trim().toLowerCase(),sc=pbqScenarios[this.currentPBQIndex];if(!cmd)return;const ok=sc.expected.some(x=>cmd===x.toLowerCase()||cmd.includes(x.toLowerCase()));const fb=document.getElementById('pbq-feedback');if(fb){fb.className=`mb-3 p-3 rounded-xl text-xs border ${ok?'bg-emerald-950/40 border-emerald-800 text-emerald-300':'bg-rose-950/40 border-rose-800 text-rose-300'}`;fb.innerHTML=ok?`<b>✓ Correct</b><div class="mt-1">${sc.success}</div>`:`<b>✗ Not correct</b><div class="mt-1">${sc.failure}</div><div class="mt-1 text-slate-500">Use the hint if needed and submit again.</div>`;}if(ok){const key=`pbq-${this.currentPBQIndex}`;this.state.pbqCompleted=this.state.pbqCompleted||{};if(!this.state.pbqCompleted[key]){this.state.pbqCompleted[key]=true;this.state.pbqSolved=(this.state.pbqSolved||0)+1;this.saveState();}}input.value='';};
        let app;
        window.onload = function() {
            app = new MainApp();
        };
