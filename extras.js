/* =====================================================================
   extras.js — additions for the A+ Core 2 Study App
   1. Shuffled answer order for every practice session
   2. Per-answer explanations + page references (questions with src:"guide")
   3. Mock Exam: domain-weighted, timer, flags, review grid, estimated score
   Loaded after app.js. It only adds to MainApp; nothing in app.js is removed.
   ===================================================================== */
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* ---------- Shuffle options (keeps explanations and refs attached) ---------- */
  function withShuffledOptions(q) {
    if (q.options.some(o => /\b(all|none|both)\s+of\s+the\s+(above|these)\b/i.test(o))) return q;
    const order = shuffle(q.options.map((_, i) => i));
    const c = Object.assign({}, q);
    c.options = order.map(i => q.options[i]);
    c.answer = order.indexOf(q.answer);
    if (q.optionWhy) c.optionWhy = order.map(i => q.optionWhy[i]);
    if (q.optionRefs) c.optionRefs = order.map(i => q.optionRefs[i]);
    return c;
  }

  const origStartSession = MainApp.prototype.startSession;
  MainApp.prototype.startSession = function (pool, label, countOverride) {
    origStartSession.call(this, pool, label, countOverride === undefined ? null : countOverride);
    this.session = this.session.map(q => (q.id && String(q.id).startsWith('cmd-')) ? q : withShuffledOptions(q));
    this.renderQuizQuestion();
  };

  /* ---------- Per-answer explanations after Confirm ---------- */
  const origConfirm = MainApp.prototype.confirmAnswer;
  MainApp.prototype.confirmAnswer = function () {
    const wasAnswered = this.isAnswered;
    const q = this.session[this.sessionIndex];
    origConfirm.call(this);
    if (wasAnswered || !q || this.isFinalExam || !this.isAnswered) return;
    const fb = document.getElementById('feedback');
    if (!fb) return;
    // Questions from the page-cited bank get the full breakdown; older ones keep their original text.
    if (q.optionWhy) {
      const rows = q.options.map((t, i) => {
        const good = i === q.answer, mine = i === this.selectedOption;
        const tone = good ? 'text-emerald-300' : (mine ? 'text-rose-300' : 'text-slate-300');
        const mark = good ? '✓' : (mine ? '✗' : '•');
        return `<li class="py-2 border-t border-slate-700/60">
          <div class="${tone} font-semibold">${mark} ${LETTERS[i]}. ${esc(t)}${mine ? ' <span class="text-[10px] uppercase tracking-wider opacity-80">(your answer)</span>' : ''}</div>
          <div class="text-slate-300 mt-1">${esc(q.optionWhy[i])}</div>
          ${q.optionRefs && q.optionRefs[i] ? `<div class="text-[11px] text-slate-400 font-mono mt-1">Guide: ${esc(q.optionRefs[i])}</div>` : ''}
        </li>`;
      }).join('');
      fb.insertAdjacentHTML('beforeend', `
        <div class="mt-2 text-xs"><b class="text-brand-accent">Why each answer is right or wrong</b>
          <ul class="mt-1">${rows}</ul></div>
        ${q.ref ? `<div class="text-[11px] text-amber-300 font-mono mt-2"><i class="fa-solid fa-book-open mr-1"></i>Study Guide: ${esc(q.ref)}</div>` : ''}`);
    }
  };

  /* ---------- Domains for the Mock Exam ---------- */
  const DOMAINS = [
    { id: '1', name: 'Operating Systems', w: 28, lessons: ['11C', '12A', '12B', '12C', '12D', '13A', '13B', '13C', '14A', '14C', '16A', '16B', '17A', '17B', '17C'] },
    { id: '2', name: 'Security', w: 28, lessons: ['15A', '15B', '15C', '18A', '18B', '18C', '18D', '19A', '19B', '19C', '19D', '20A', '21B'] },
    { id: '3', name: 'Software Troubleshooting', w: 23, lessons: ['14D', '20B', '20C'] },
    { id: '4', name: 'Operational Procedures', w: 21, lessons: ['11A', '11B', '14B', '21A', '21C', '22A', '22B', '22C'] },
  ];
  const lessonCode = l => (String(l).match(/^\d+[A-Z]/) || [''])[0];
  const domainOf = q => { const c = lessonCode(q.lesson); const d = DOMAINS.find(d => d.lessons.includes(c)); return d ? d.id : null; };

  /* Largest-remainder split of N questions by domain weight */
  function allocate(n) {
    const raw = DOMAINS.map(d => ({ id: d.id, x: n * d.w / 100 }));
    const out = {}; let used = 0;
    raw.forEach(r => { out[r.id] = Math.floor(r.x); used += out[r.id]; });
    raw.sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)));
    for (let i = 0; used < n; i++, used++) out[raw[i % raw.length].id]++;
    return out;
  }

  const fmtTime = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const scaled = pct => Math.round(100 + 800 * pct);

  /* ---------- Mock Exam ---------- */
  Object.assign(MainApp.prototype, {
    mockEl() { return document.getElementById('view-mock'); },

    renderMockHome() {
      const el = this.mockEl();
      const st = this.state.mockAttempts || [];
      const m = this.mock && !this.mock.finished ? this.mock : null;
      const best = st.length ? Math.max(...st.map(a => a.scaled)) : null;
      el.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-6">
          <div class="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 class="text-xl font-bold text-white"><i class="fa-solid fa-stopwatch text-amber-400 mr-2"></i>Mock Exam (220-1202)</h2>
            <p class="text-sm text-slate-300">Timed, multiple-choice practice exam. Questions are drawn so each domain gets the same share as the official exam objectives. Answers and explanations stay hidden until you submit.</p>
            <ul class="text-xs text-slate-300 grid sm:grid-cols-2 gap-1.5">
              ${DOMAINS.map(d => `<li class="bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 flex justify-between"><span>${d.name}</span><b class="text-brand-accent">${d.w}%</b></li>`).join('')}
            </ul>
            ${m ? `<div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-sm text-amber-200 flex flex-wrap items-center justify-between gap-3">
                <span>An exam is in progress.</span>
                <button onclick="app.mockResume()" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs">Resume exam</button></div>` : `
            <div class="grid sm:grid-cols-2 gap-4">
              <label class="text-xs text-slate-300 space-y-1">Length
                <select id="mockLen" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100">
                  <option value="rand">Full exam (random 75–90 questions)</option>
                  <option value="45">Short (45 questions)</option>
                  <option value="30">Quick check (30 questions)</option>
                </select></label>
              <label class="text-xs text-slate-300 space-y-1">Time limit
                <select id="mockTime" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100">
                  <option value="120">120 minutes (90 + 30 extra)</option>
                  <option value="90">90 minutes (real exam)</option>
                  <option value="0">No time limit</option>
                </select></label>
            </div>
            <button onclick="app.mockStart()" class="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-brand-accent to-emerald-500 text-slate-950 font-bold text-sm">
              <i class="fa-solid fa-play mr-2"></i>Start mock exam</button>`}
            <p class="text-[11px] text-slate-400">This mock has multiple-choice questions only. For performance-based practice use the PBQ &amp; Lab tab. The score is an <b>estimate</b>: CompTIA does not publish how raw scores become the 100–900 scale. Pass mark is 700.</p>
          </div>
          ${st.length ? `<div class="glass-card rounded-3xl p-6 space-y-3">
            <h3 class="font-bold text-white text-sm">Previous attempts <span class="text-slate-400 font-normal">(best estimate: ${best})</span></h3>
            <div class="overflow-x-auto"><table class="w-full text-xs text-left">
              <thead class="text-slate-400"><tr><th class="py-1 pr-3">Date</th><th class="pr-3">Questions</th><th class="pr-3">Correct</th><th class="pr-3">Est. score</th><th>Time</th></tr></thead>
              <tbody>${st.slice(-8).reverse().map(a => `<tr class="border-t border-slate-800"><td class="py-1.5 pr-3">${new Date(a.date).toLocaleDateString()}</td><td class="pr-3">${a.total}</td><td class="pr-3">${a.correct} (${Math.round(100 * a.correct / a.total)}%)</td><td class="pr-3 ${a.scaled >= 700 ? 'text-emerald-400' : 'text-rose-400'}">${a.scaled}</td><td>${fmtTime(a.secs)}</td></tr>`).join('')}</tbody>
            </table></div></div>` : ''}
        </div>`;
    },

    mockStart() {
      const lenV = document.getElementById('mockLen').value;
      const mins = Number(document.getElementById('mockTime').value);
      const n = lenV === 'rand' ? 75 + Math.floor(Math.random() * 16) : Number(lenV);
      const alloc = allocate(n);
      const items = [];
      DOMAINS.forEach(d => {
        const pool = shuffle(DATA.questions.filter(q => domainOf(q) === d.id));
        pool.slice(0, alloc[d.id]).forEach(q => items.push({ q: withShuffledOptions(q), dom: d.id }));
      });
      this.mock = {
        items: shuffle(items), answers: [], flags: {}, idx: 0, finished: false, review: 'all',
        started: Date.now(), limit: mins * 60, tick: null,
      };
      this.mock.items.forEach((_, i) => this.mock.answers[i] = null);
      this.mockRunTimer();
      this.mockRenderQ();
    },

    mockResume() { this.mockRenderQ(); },

    mockRunTimer() {
      const m = this.mock; if (m.tick) clearInterval(m.tick);
      m.tick = setInterval(() => {
        if (!this.mock || this.mock !== m || m.finished) { clearInterval(m.tick); return; }
        const t = document.getElementById('mockClock');
        const el = (Date.now() - m.started) / 1000;
        if (m.limit) {
          const left = m.limit - el;
          if (t) { t.textContent = fmtTime(left); t.className = 'font-mono font-bold ' + (left < 300 ? 'text-rose-400' : 'text-amber-300'); }
          if (left <= 0) { clearInterval(m.tick); this.mockFinish(true); }
        } else if (t) t.textContent = fmtTime(el);
      }, 1000);
    },

    mockRenderQ() {
      const m = this.mock, el = this.mockEl();
      const it = m.items[m.idx], q = it.q, sel = m.answers[m.idx];
      const answered = m.answers.filter(a => a !== null).length;
      const flagged = Object.keys(m.flags).filter(k => m.flags[k]).length;
      const left = m.limit ? m.limit - (Date.now() - m.started) / 1000 : (Date.now() - m.started) / 1000;
      el.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span class="text-slate-300">Question <b class="text-white">${m.idx + 1}</b> / ${m.items.length} · answered ${answered} · flagged ${flagged}</span>
            <span><i class="fa-regular fa-clock mr-1 text-slate-400"></i><span id="mockClock" class="font-mono font-bold text-amber-300">${fmtTime(left)}</span></span>
          </div>
          <div class="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
            <div class="flex items-start justify-between gap-3">
              <h2 class="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-line">${esc(q.question)}</h2>
              <button onclick="app.mockFlag()" class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border ${m.flags[m.idx] ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'}">
                <i class="fa-${m.flags[m.idx] ? 'solid' : 'regular'} fa-flag mr-1"></i>${m.flags[m.idx] ? 'Flagged' : 'Flag'}</button>
            </div>
            <div class="space-y-3">
              ${q.options.map((o, i) => `<button onclick="app.mockPick(${i})" class="w-full text-left p-4 rounded-xl text-sm font-medium flex gap-3 items-start border-2 ${sel === i ? 'bg-brand-600/20 border-brand-500 text-white' : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700'}">
                <span class="w-6 h-6 shrink-0 rounded-lg bg-slate-900 text-slate-300 flex items-center justify-center font-mono text-xs">${LETTERS[i]}</span><span>${esc(o)}</span></button>`).join('')}
            </div>
            <div class="flex flex-wrap justify-between gap-2 pt-1">
              <button onclick="app.mockGo(${m.idx - 1})" ${m.idx === 0 ? 'disabled' : ''} class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-40"><i class="fa-solid fa-chevron-left mr-1"></i>Previous</button>
              <button onclick="app.mockOverview()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"><i class="fa-solid fa-table-cells mr-1"></i>Review grid</button>
              ${m.idx < m.items.length - 1
                ? `<button onclick="app.mockGo(${m.idx + 1})" class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold">Next<i class="fa-solid fa-chevron-right ml-1"></i></button>`
                : `<button onclick="app.mockOverview()" class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold">Finish &amp; review</button>`}
            </div>
          </div>
        </div>`;
    },

    mockPick(i) { this.mock.answers[this.mock.idx] = i; this.mockRenderQ(); },
    mockFlag() { this.mock.flags[this.mock.idx] = !this.mock.flags[this.mock.idx]; this.mockRenderQ(); },
    mockGo(i) { const m = this.mock; if (i < 0 || i >= m.items.length) return; m.idx = i; this.mockRenderQ(); window.scrollTo({ top: 0 }); },

    mockOverview() {
      const m = this.mock, el = this.mockEl();
      const un = m.answers.filter(a => a === null).length;
      const fl = Object.keys(m.flags).filter(k => m.flags[k]).length;
      el.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="glass-card rounded-3xl p-6 space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-lg font-bold text-white">Review grid</h2>
              <span class="text-xs">Time left: <b id="mockClock" class="font-mono text-amber-300">${m.limit ? fmtTime(m.limit - (Date.now() - m.started) / 1000) : fmtTime((Date.now() - m.started) / 1000)}</b></span>
            </div>
            <p class="text-xs text-slate-300">${un} unanswered · ${fl} flagged. Tap a number to go back to that question.</p>
            <div class="grid grid-cols-6 sm:grid-cols-10 gap-2">
              ${m.items.map((_, i) => {
        const a = m.answers[i] !== null, f = m.flags[i];
        return `<button onclick="app.mockGo(${i})" class="relative py-2 rounded-lg text-xs font-bold border ${a ? 'bg-brand-600/30 border-brand-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}">${i + 1}${f ? '<i class="fa-solid fa-flag text-amber-400 absolute -top-1 -right-1 text-[10px]"></i>' : ''}</button>`;
      }).join('')}
            </div>
            <div class="flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span><span class="inline-block w-3 h-3 rounded bg-brand-600/40 border border-brand-500 align-middle"></span> answered</span>
              <span><span class="inline-block w-3 h-3 rounded bg-slate-800 border border-slate-600 align-middle"></span> unanswered</span>
              <span><i class="fa-solid fa-flag text-amber-400"></i> flagged</span>
            </div>
            <div class="flex flex-wrap justify-between gap-2 pt-2">
              <button onclick="app.mockGo(${m.idx})" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">Back to question</button>
              <button onclick="app.mockFinish(false)" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-accent to-emerald-500 text-slate-950 text-xs font-bold">Submit exam</button>
            </div>
          </div>
        </div>`;
    },

    mockFinish(auto) {
      const m = this.mock; if (!m || m.finished) return;
      const un = m.answers.filter(a => a === null).length;
      if (!auto && un && !confirm(`${un} question${un > 1 ? 's are' : ' is'} unanswered and will count as wrong. Submit anyway?`)) return;
      m.finished = true; m.auto = !!auto; clearInterval(m.tick);
      m.secs = Math.min((Date.now() - m.started) / 1000, m.limit || Infinity);
      // Score + update the same stats the practice modes use (so Weak Areas stay accurate)
      const dom = {}; DOMAINS.forEach(d => dom[d.id] = { c: 0, t: 0 });
      let correct = 0;
      m.items.forEach((it, i) => {
        const ok = m.answers[i] === it.q.answer;
        dom[it.dom].t++; if (ok) { dom[it.dom].c++; correct++; }
        const q = it.q, L = q.lesson;
        if (!this.state.stats[L]) this.state.stats[L] = { c: 0, w: 0 };
        this.state.stats[L][ok ? 'c' : 'w']++;
        this.state.answered[q.id] = true;
        if (!ok && !this.state.wrong.includes(q.id)) this.state.wrong.push(q.id);
        else if (ok) this.state.wrong = this.state.wrong.filter(x => x !== q.id);
      });
      m.dom = dom; m.correct = correct;
      m.pct = correct / m.items.length; m.scaled = scaled(m.pct);
      this.state.mockAttempts = (this.state.mockAttempts || []).concat([{ date: Date.now(), total: m.items.length, correct, scaled: m.scaled, secs: m.secs }]).slice(-30);
      this.saveState();
      this.updateReadiness && this.updateReadiness();
      this.mockRenderResults();
    },

    mockRenderResults() {
      const m = this.mock, el = this.mockEl();
      const pass = m.scaled >= 700;
      const bars = DOMAINS.map(d => {
        const x = m.dom[d.id], p = x.t ? Math.round(100 * x.c / x.t) : 0;
        return `<div class="space-y-1"><div class="flex justify-between text-xs"><span class="text-slate-200">${d.name} <span class="text-slate-500">(${d.w}% of exam)</span></span><span class="font-mono text-slate-300">${x.c}/${x.t} · ${p}%</span></div>
          <div class="h-2.5 rounded-full bg-slate-800 overflow-hidden"><div class="h-full ${p >= 70 ? 'bg-emerald-500' : (p >= 50 ? 'bg-amber-500' : 'bg-rose-500')}" style="width:${p}%"></div></div></div>`;
      }).join('');
      const mode = m.review;
      const rows = m.items.map((it, i) => ({ it, i, ok: m.answers[i] === it.q.answer }))
        .filter(r => mode === 'all' || (mode === 'wrong' && !r.ok) || (mode === 'flag' && m.flags[r.i]))
        .map(({ it, i, ok }) => {
          const q = it.q, a = m.answers[i];
          return `<details class="rounded-xl border ${ok ? 'border-emerald-700/50' : 'border-rose-700/60'} bg-slate-900/60 p-3">
            <summary class="cursor-pointer text-sm text-slate-100"><span class="${ok ? 'text-emerald-400' : 'text-rose-400'} font-bold mr-2">${ok ? '✓' : '✗'} ${i + 1}.</span>${esc(q.question.length > 140 ? q.question.slice(0, 140) + '…' : q.question)}${m.flags[i] ? ' <i class="fa-solid fa-flag text-amber-400 ml-1"></i>' : ''}</summary>
            <div class="mt-3 text-xs space-y-1.5">
              <div class="text-slate-200 whitespace-pre-line mb-2">${esc(q.question)}</div>
              ${q.options.map((o, k) => {
            const good = k === q.answer, mine = k === a;
            return `<div class="p-2 rounded-lg ${good ? 'bg-emerald-500/15 text-emerald-200' : (mine ? 'bg-rose-500/15 text-rose-200' : 'text-slate-300')}">
                  <b>${LETTERS[k]}.</b> ${esc(o)}${good ? ' <b>(correct)</b>' : ''}${mine && !good ? ' <b>(your answer)</b>' : ''}
                  ${q.optionWhy ? `<div class="mt-1 opacity-90">${esc(q.optionWhy[k])}${q.optionRefs && q.optionRefs[k] ? ` <span class="font-mono text-[10px] text-slate-400">[${esc(q.optionRefs[k])}]</span>` : ''}</div>` : ''}</div>`;
          }).join('')}
              ${a === null ? '<div class="text-amber-300">You did not answer this question.</div>' : ''}
              <div class="text-slate-300 mt-2"><b>Explanation:</b> ${esc(q.explanation)}</div>
              ${q.ref ? `<div class="text-amber-300 font-mono text-[11px]">Study Guide: ${esc(q.ref)}</div>` : ''}
            </div></details>`;
        }).join('') || '<p class="text-xs text-slate-400">Nothing to show for this filter.</p>';
      el.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="glass-card rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <div class="text-xs uppercase tracking-wider text-slate-400">Estimated score${m.auto ? ' · time ran out, auto-submitted' : ''}</div>
            <div class="text-6xl font-extrabold ${pass ? 'text-emerald-400' : 'text-rose-400'}">${m.scaled}</div>
            <div class="text-sm font-bold ${pass ? 'text-emerald-300' : 'text-rose-300'}">${pass ? 'Would pass (estimate)' : 'Would not pass yet (estimate)'} · pass mark 700 of 900</div>
            <div class="text-xs text-slate-400">${m.correct} of ${m.items.length} correct (${Math.round(100 * m.pct)}%) · ${fmtTime(m.secs)}. This is a simple linear estimate, not an official CompTIA score.</div>
          </div>
          <div class="glass-card rounded-3xl p-6 space-y-3"><h3 class="font-bold text-white text-sm">By domain</h3>${bars}</div>
          <div class="glass-card rounded-3xl p-6 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-bold text-white text-sm">Answer review</h3>
              <div class="flex gap-1 text-xs">${[['all', 'All'], ['wrong', 'Wrong'], ['flag', 'Flagged']].map(([k, l]) => `<button onclick="app.mockReviewFilter('${k}')" class="px-3 py-1.5 rounded-lg font-semibold ${mode === k ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-300'}">${l}</button>`).join('')}</div></div>
            <div class="space-y-2">${rows}</div>
          </div>
          <div class="flex gap-2"><button onclick="app.mock=null;app.renderMockHome()" class="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold">New mock exam</button>
            <button onclick="app.navigateTo('home')" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">Home</button></div>
        </div>`;
    },
    mockReviewFilter(k) { this.mock.review = k; this.mockRenderResults(); },
  });


  /* PBQ practice now lives in an embedded simulator; the old scenario selector is gone. */
  MainApp.prototype.loadPBQScenario = function () {};
  MainApp.prototype.selectPBQScenario = function () {};

  /* ---------- Navigation: add the 'mock' view ---------- */
  const VIEWS = ['home', 'flashcards', 'quiz', 'pbq', 'results', 'stats', 'reference', 'mock'];
  MainApp.prototype.navigateTo = function (viewId) {
    this.currentView = viewId;
    VIEWS.forEach(v => {
      const e = document.getElementById(`view-${v}`); if (e) e.classList.add('hidden');
      ['nav-', 'mobile-nav-'].forEach(p => { const n = document.getElementById(p + v); if (n) { n.classList.remove('bg-brand-600', 'text-white'); n.classList.add('text-slate-400'); } });
    });
    const e = document.getElementById(`view-${viewId}`); if (e) e.classList.remove('hidden');
    ['nav-', 'mobile-nav-'].forEach(p => { const n = document.getElementById(p + viewId); if (n) { n.classList.add('bg-brand-600', 'text-white'); n.classList.remove('text-slate-400'); } });
    if (viewId === 'flashcards') this.loadFlashcards(this.selectedModuleId);
    if (viewId === 'pbq') this.loadPBQScenario(this.currentPBQIndex);
    if (viewId === 'stats') this.renderStatsView();
    if (viewId === 'reference') this.renderReference();
    if (viewId === 'mock') {
      if (this.mock && this.mock.finished) this.mockRenderResults();
      else this.renderMockHome();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
})();

/* =====================================================================
   Statistics backup: download and upload the progress as a JSON file.
   The file contains the same data that is kept in this browser
   (answers, wrong questions, stars, lesson stats, mock exam history).
   ===================================================================== */
(function () {
  'use strict';
  const FILE_APP = 'aplus-core2';
  const esc2 = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function validate(obj) {
    if (!obj || obj.app !== FILE_APP || typeof obj.state !== 'object' || obj.state === null) return 'This file is not a statistics file from this app.';
    const s = obj.state;
    if (s.answered && typeof s.answered !== 'object') return 'The file has an invalid "answered" section.';
    if (s.wrong && !Array.isArray(s.wrong)) return 'The file has an invalid "wrong" section.';
    if (s.starred && !Array.isArray(s.starred)) return 'The file has an invalid "starred" section.';
    if (s.stats) {
      if (typeof s.stats !== 'object') return 'The file has an invalid "stats" section.';
      for (const k of Object.keys(s.stats)) {
        const v = s.stats[k];
        if (!v || typeof v.c !== 'number' || typeof v.w !== 'number') return 'The file has invalid lesson statistics.';
      }
    }
    if (s.mockAttempts && !Array.isArray(s.mockAttempts)) return 'The file has an invalid "mockAttempts" section.';
    return null;
  }

  function summary(s) {
    const answered = Object.keys(s.answered || {}).length;
    const wrong = (s.wrong || []).length;
    const starred = (s.starred || []).length;
    const mocks = (s.mockAttempts || []).length;
    return `${answered} answered, ${wrong} wrong, ${starred} starred, ${mocks} mock exams`;
  }

  function merge(cur, imp) {
    const out = Object.assign({}, cur);
    out.answered = Object.assign({}, cur.answered || {}, imp.answered || {});
    out.wrong = Array.from(new Set([...(cur.wrong || []), ...(imp.wrong || [])]));
    out.starred = Array.from(new Set([...(cur.starred || []), ...(imp.starred || [])]));
    const stats = Object.assign({}, cur.stats || {});
    Object.keys(imp.stats || {}).forEach(k => {
      const a = stats[k] || { c: 0, w: 0 }, b = imp.stats[k];
      stats[k] = { c: (a.c || 0) + (b.c || 0), w: (a.w || 0) + (b.w || 0) };
    });
    out.stats = stats;
    out.cardsViewed = Math.max(cur.cardsViewed || 0, imp.cardsViewed || 0);
    out.pbqSolved = Math.max(cur.pbqSolved || 0, imp.pbqSolved || 0);
    out.pbqCompleted = Object.assign({}, cur.pbqCompleted || {}, imp.pbqCompleted || {});
    const seen = new Map();
    [...(cur.mockAttempts || []), ...(imp.mockAttempts || [])].forEach(a => seen.set(String(a.date), a));
    out.mockAttempts = Array.from(seen.values()).sort((x, y) => x.date - y.date).slice(-30);
    return out;
  }

  MainApp.prototype.downloadStats = function () {
    const payload = { app: FILE_APP, version: 1, exported: new Date().toISOString(), state: this.state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = `aplus-core2-stats-${d}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  MainApp.prototype.renderStatsIO = function () {
    const list = document.getElementById('module-stats-list');
    if (!list || document.getElementById('stats-io')) return;
    const panel = document.createElement('div');
    panel.id = 'stats-io';
    panel.className = 'glass-card rounded-2xl p-5 space-y-3 mb-4';
    panel.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-white text-sm">Back up your progress</h3>
          <p class="text-xs text-slate-400">Progress is saved in this browser only. Download a file to keep a copy or move to another device.</p>
        </div>
        <button id="stats-download" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"><i class="fa-solid fa-download mr-1"></i>Download statistics</button>
      </div>
      <div class="border-t border-slate-800 pt-3 space-y-2">
        <label class="block text-xs text-slate-300">Upload a statistics file
          <input id="stats-file" type="file" accept="application/json,.json" class="block w-full text-xs text-slate-300 mt-1"></label>
        <div id="stats-preview" class="text-xs text-slate-400"></div>
        <div id="stats-actions" class="hidden flex flex-wrap gap-2">
          <button id="stats-merge" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold">Merge with my progress</button>
          <button id="stats-replace" class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">Replace my progress</button>
          <button id="stats-cancel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold">Cancel</button>
        </div>
        <div id="stats-msg" class="text-xs"></div>
      </div>`;
    list.parentNode.insertBefore(panel, list);

    let pending = null;
    const msg = (t, ok) => { const m = document.getElementById('stats-msg'); m.textContent = t; m.className = 'text-xs ' + (ok ? 'text-emerald-400' : 'text-rose-400'); };
    const hideActions = () => { document.getElementById('stats-actions').classList.add('hidden'); pending = null; };

    document.getElementById('stats-download').onclick = () => this.downloadStats();
    document.getElementById('stats-file').onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0];
      hideActions(); document.getElementById('stats-msg').textContent = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let obj;
        try { obj = JSON.parse(reader.result); } catch (e) { msg('That file is not valid JSON.', false); return; }
        const err = validate(obj);
        if (err) { msg(err, false); return; }
        pending = obj.state;
        document.getElementById('stats-preview').innerHTML = `File from ${esc2(obj.exported ? new Date(obj.exported).toLocaleString() : 'unknown date')}: ${esc2(summary(obj.state))}.`;
        document.getElementById('stats-actions').classList.remove('hidden');
      };
      reader.onerror = () => msg('The file could not be read.', false);
      reader.readAsText(file);
    };
    document.getElementById('stats-merge').onclick = () => {
      if (!pending) return;
      this.state = merge(this.state, pending);
      this.saveState(); this.renderStatsView();
      hideActions(); msg('Statistics merged.', true);
    };
    document.getElementById('stats-replace').onclick = () => {
      if (!pending) return;
      if (!confirm('This replaces all progress in this browser with the file. Continue?')) return;
      this.state = Object.assign({ answered: {}, wrong: [], starred: [], stats: {}, cardsViewed: 0, pbqSolved: 0 }, pending);
      this.saveState(); this.renderStatsView();
      hideActions(); msg('Statistics replaced with the file.', true);
    };
    document.getElementById('stats-cancel').onclick = () => { hideActions(); document.getElementById('stats-file').value = ''; document.getElementById('stats-preview').textContent = ''; };
  };

  const origRender = MainApp.prototype.renderStatsView;
  MainApp.prototype.renderStatsView = function () {
    origRender.call(this);
    this.renderStatsIO();
  };
})();
