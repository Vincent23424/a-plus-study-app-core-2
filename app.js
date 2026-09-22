const $=s=>document.querySelector(s);
let DATA,questions=[],session=[],sessionPool=[],index=0,selected=null,answered=false,currentMode="";
let sessionAnswers=[];

const state=JSON.parse(localStorage.getItem("c2state")||'{"answered":{},"wrong":[],"starred":[],"stats":{},"theme":"dark"}');
function save(){localStorage.setItem("c2state",JSON.stringify(state))}
function esc(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function mod(id){return DATA.modules.find(m=>m.id===id)}
function getWeak(){
  const scores={};
  questions.forEach(q=>{
    const x=state.stats[q.lesson];
    if(x && sum(x)>0)scores[q.lesson]=x.c/sum(x);
  });
  return Object.entries(scores).sort((a,b)=>a[1]-b[1]).slice(0,5).map(x=>x[0]);
}
function sum(x){return (x.c||0)+(x.w||0)}
function stats(){
  const a=Object.values(state.stats), c=a.reduce((n,x)=>n+(x.c||0),0), t=a.reduce((n,x)=>n+sum(x),0);
  $("#stats").innerHTML=`<div class="stat"><b>${questions.length}</b><span>Questions</span></div><div class="stat"><b>${t?Math.round(c/t*100):0}%</b><span>Accuracy</span></div><div class="stat"><b>${getWeak().length}</b><span>Weak lessons</span></div>`;
  $("#wrongCount").textContent=state.wrong.length;
  $("#starCount").textContent=state.starred.length;
  $("#newCount").textContent=questions.filter(q=>!state.answered[q.id]).length;
  $("#weakCount").textContent=getWeak().length;
}
function show(id){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  window.scrollTo(0,0);
}
function buildHome(){
  const rs=$("#rangeSelect"), em=$("#extraModule");
  for(let i=11;i<=20;i++){
    const o=document.createElement("option");
    o.value=`${i}-${i+2}`;o.textContent=`Modules ${i}–${i+2}`;rs.appendChild(o);
  }
  DATA.modules.forEach(m=>{
    const o=document.createElement("option");o.value=m.id;o.textContent=`Module ${m.id}`;em.appendChild(o);
  });
  DATA.modules.forEach(m=>{
    const card=document.createElement("button");card.className="module";card.dataset.module=m.id;
    card.innerHTML=`<div class="num">MODULE ${m.id}</div><h3>${esc(m.title)}</h3><p>${questions.filter(q=>q.module===m.id).length} questions</p><div class="lesson-list">${m.lessons.map(esc).join(" · ")}</div>`;
    $("#moduleGrid").appendChild(card);
  });
  $("#moduleGrid").addEventListener("click",e=>{
    const b=e.target.closest(".module");
    if(b)start(questions.filter(q=>q.module==b.dataset.module),`Module ${b.dataset.module}`);
  });
}
function uniqueSample(arr,n){
  const copy=[...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy.slice(0,Math.min(n,copy.length));
}
function resetSessionTracking(){
  sessionAnswers=[];
  selected=null;
  answered=false;
}
function start(pool,label){
  if(!pool.length){alert("There are no questions in this set yet.");return}
  const requested=$("#countSelect").value==="All available"?pool.length:+$("#countSelect").value;
  sessionPool=[...pool];
  session=uniqueSample(sessionPool,requested);
  index=0;
  currentMode=label;
  resetSessionTracking();
  show("quiz");
  renderQuestion();
}
function retryCurrent(){
  if(!sessionPool.length)return;
  session=uniqueSample(sessionPool,session.length);
  index=0;
  currentMode=currentMode+" · Retry";
  resetSessionTracking();
  show("quiz");
  renderQuestion();
}
function renderQuestion(){
  const q=session[index];
  selected=null;answered=false;
  $("#quizLabel").textContent=currentMode;
  $("#quizProgress").textContent=`${index+1} / ${session.length}`;
  $("#progressBar").style.width=`${index/session.length*100}%`;
  $("#lessonTag").textContent=q.lesson;
  $("#difficultyTag").textContent=q.difficulty;
  $("#questionText").textContent=q.question;
  $("#answers").innerHTML=q.options.map((o,i)=>`<button class="answer" data-i="${i}">${esc(o)}</button>`).join("");
  $("#feedback").className="feedback";
  $("#feedback").textContent="";
  $("#confirmBtn").disabled=true;
  $("#confirmBtn").classList.remove("hidden");
  $("#nextBtn").classList.add("hidden");
  $("#starBtn").textContent=state.starred.includes(q.id)?"★":"☆";
  $("#starBtn").classList.toggle("on",state.starred.includes(q.id));
}
function choose(i){
  if(answered)return;
  selected=i;
  document.querySelectorAll(".answer").forEach((b,n)=>b.classList.toggle("selected",n===i));
  $("#confirmBtn").disabled=false;
}
function confirmAnswer(){
  if(selected===null||answered)return;
  answered=true;
  const q=session[index],ok=selected===q.answer;
  sessionAnswers[index]=ok;
  if(!state.stats[q.lesson])state.stats[q.lesson]={c:0,w:0};
  state.stats[q.lesson][ok?"c":"w"]++;
  state.answered[q.id]=true;
  if(!ok&&!state.wrong.includes(q.id))state.wrong.push(q.id);
  if(ok)state.wrong=state.wrong.filter(id=>id!==q.id);
  save();
  document.querySelectorAll(".answer").forEach((b,i)=>{
    b.classList.remove("selected");
    if(i===q.answer)b.classList.add("correct");
    if(i===selected&&!ok)b.classList.add("wrong");
  });
  $("#feedback").innerHTML=`<strong>${ok?"Correct":"Not quite."}</strong> ${esc(q.explanation)}`;
  $("#feedback").className="feedback show";
  $("#confirmBtn").classList.add("hidden");
  $("#nextBtn").classList.remove("hidden");
  stats();
}
function next(){
  if(!answered)return;
  if(index<session.length-1){index++;renderQuestion()}
  else finish();
}
function finish(){
  const c=sessionAnswers.filter(Boolean).length,total=session.length,pct=total?Math.round(c/total*100):0;
  show("results");
  $("#resultTitle").textContent=pct>=80?"Session complete":pct>=60?"Good work — keep training":"Keep going — review your weak areas";
  $("#resultScore").textContent=`${c}/${total}`;
  $("#resultDetails").innerHTML=`<div><b>${pct}%</b><span>Score</span></div><div><b>${total-c}</b><span>Missed</span></div><div><b>${state.starred.length}</b><span>Starred</span></div>`;
}
$("#answers").addEventListener("click",e=>{
  const b=e.target.closest(".answer");
  if(b)choose(+b.dataset.i);
});
$("#confirmBtn").onclick=confirmAnswer;
$("#nextBtn").onclick=next;
$("#backQuiz").onclick=()=>{
  if(confirm("Leave this session? Your answered questions are saved."))show("home");
};
$("#homeBtn").onclick=()=>show("home");
$("#resultHome").onclick=()=>show("home");
$("#retryBtn").onclick=retryCurrent;
$("#starBtn").onclick=()=>{
  const id=session[index].id;
  if(state.starred.includes(id))state.starred=state.starred.filter(x=>x!==id);
  else state.starred.push(id);
  save();
  $("#starBtn").textContent=state.starred.includes(id)?"★":"☆";
  $("#starBtn").classList.toggle("on",state.starred.includes(id));
  stats();
};
$("#themeBtn").onclick=()=>{
  document.documentElement.classList.toggle("light");
  state.theme=document.documentElement.classList.contains("light")?"light":"dark";
  save();
};
document.querySelectorAll(".feature-card").forEach(b=>b.onclick=()=>{
  const m=b.dataset.mode;
  if(m==="final")start(questions,"Final Test");
  if(m==="random")start(questions,"Random Practice");
  if(m==="wrong")start(questions.filter(q=>state.wrong.includes(q.id)),"Wrong Questions");
  if(m==="starred")start(questions.filter(q=>state.starred.includes(q.id)),"Starred Questions");
  if(m==="new")start(questions.filter(q=>!state.answered[q.id]),"New Questions");
  if(m==="weak"){
    const w=getWeak();
    start(questions.filter(q=>w.includes(q.lesson)),"Weak Areas");
  }
});
$("#challengeBtn").onclick=()=>{
  const [a,b]=$("#rangeSelect").value.split("-").map(Number),extra=$("#extraModule").value;
  let pool=questions.filter(q=>q.module>=a&&q.module<=b);
  if(extra)pool=pool.concat(questions.filter(q=>q.module==+extra));
  start([...new Map(pool.map(q=>[q.id,q])).values()],`Challenge ${a}–${b}${extra?` + Module ${extra}`:""}`);
};
async function init(){
  DATA=await fetch("questions.json").then(r=>r.json());
  questions=DATA.questions;
  if(state.theme==="light")document.documentElement.classList.add("light");
  buildHome();
  stats();
  if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
}
init();
