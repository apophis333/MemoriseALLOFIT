const I18N={
en:{Dashboard:"Dashboard",Library:"Library",Review:"Review",Statistics:"Statistics",Settings:"Settings","Scripts & chunks":"Scripts & chunks",Home:"Home",Stats:"Stats",More:"More",Preferences:"PREFERENCES",YourProgress:"YOUR PROGRESS",language:"Language",theme:"Theme"},
es:{Dashboard:"Panel",Library:"Biblioteca",Review:"Repaso",Statistics:"Estadísticas",Settings:"Ajustes","Scripts & chunks":"Guiones y bloques",Home:"Inicio",Stats:"Estadísticas",More:"Más",Preferences:"PREFERENCIAS",YourProgress:"TU PROGRESO",language:"Idioma",theme:"Tema"},
fr:{Dashboard:"Tableau de bord",Library:"Bibliothèque",Review:"Révision",Statistics:"Statistiques",Settings:"Paramètres","Scripts & chunks":"Scripts et blocs",Home:"Accueil",Stats:"Stats",More:"Plus",Preferences:"PRÉFÉRENCES",YourProgress:"VOS PROGRÈS",language:"Langue",theme:"Thème"},
de:{Dashboard:"Dashboard",Library:"Bibliothek",Review:"Wiederholen",Statistics:"Statistiken",Settings:"Einstellungen","Scripts & chunks":"Skripte & Blöcke",Home:"Start",Stats:"Stats",More:"Mehr",Preferences:"EINSTELLUNGEN",YourProgress:"DEIN FORTSCHRITT",language:"Sprache",theme:"Design"},
ja:{Dashboard:"ダッシュボード",Library:"ライブラリ",Review:"復習",Statistics:"統計",Settings:"設定","Scripts & chunks":"台本とチャンク",Home:"ホーム",Stats:"統計",More:"その他",Preferences:"設定",YourProgress:"進捗",language:"言語",theme:"テーマ"}
};

document.addEventListener("DOMContentLoaded",()=>{
 const db=loadDB();applyTheme(db.settings.theme);applyLanguage(db.settings.language||"en");
 const $=s=>document.querySelector(s);
 if($("#dateLine"))$("#dateLine").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());
 if($("#streak"))$("#streak").textContent=db.streak.days;
 if($("#count"))$("#count").textContent=db.memories.length;
 if($("#due"))$("#due").textContent=dueMemories().length;
 if($("#xp"))$("#xp").textContent=db.stats.xp;
 if($("#accuracy"))$("#accuracy").textContent=db.stats.attempts?Math.round(db.stats.correct/db.stats.attempts*100)+"%":"—";
 renderCards($("#recent"),db.memories.slice(0,4));renderCards($("#library"),db.memories);
 if($("#library")){const redraw=()=>{let all=loadDB().memories,q=$("#search").value.toLowerCase(),f=$("#filter").value;renderCards($("#library"),all.filter(m=>(!q||m.title.toLowerCase().includes(q)||m.text.toLowerCase().includes(q))&&(f==="all"||m.category===f)))};$("#search").addEventListener("input",redraw);$("#filter").addEventListener("change",redraw)}
 if($("#memoryForm"))$("#memoryForm").addEventListener("submit",e=>{e.preventDefault();createMemory({title:$("#title").value.trim(),text:$("#text").value.trim(),category:$("#category").value,deadline:$("#deadline").value,colour:$("#colour").value});location.href="library.html"});
 if($("#reviewList"))renderReview();
 if($("#sessions")){
   const s=db.stats;$("#sessions").textContent=s.sessions;$("#correct").textContent=s.correct;
   $("#statAccuracy").textContent=s.attempts?Math.round(s.correct/s.attempts*100)+"%":"—";$("#statXP").textContent=s.xp;
   renderHistory(s);renderAchievements();renderChallenge();renderChart();
 }
 if($("#theme")){
   $("#theme").value=db.settings.theme;$("#speed").value=db.settings.speed;
   if($("#language"))$("#language").value=db.settings.language||"en";
   $("#theme").addEventListener("change",e=>{const d=loadDB();d.settings.theme=e.target.value;saveDB(d);applyTheme(e.target.value)});
   $("#speed").addEventListener("input",e=>{const d=loadDB();d.settings.speed=+e.target.value;saveDB(d)});
   $("#language")?.addEventListener("change",e=>{const d=loadDB();d.settings.language=e.target.value;saveDB(d);location.reload()});
   $("#export").onclick=()=>{const blob=new Blob([JSON.stringify(loadDB(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="memoriseallofit-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
   $("#import").onchange=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(data.memories&&data.stats){saveDB(data);location.reload()}else alert("That backup does not look valid.")}catch{alert("Could not read that backup.")}};r.readAsText(file)};
   $("#reset").onclick=()=>{if(confirm("Delete all MemoriseALLOFIT data from this browser?")){localStorage.removeItem(DB_KEY);location.href="index.html"}}
 }
});
function applyTheme(t){document.documentElement.dataset.theme=t}
function applyLanguage(lang){
 const map=I18N[lang]||I18N.en;
 document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(map[k])el.textContent=map[k]});
 document.documentElement.lang=lang;
}
function renderHistory(s){
 const el=document.querySelector("#history"); if(!el)return;
 el.innerHTML=s.history.slice(0,20).map(h=>`<div class="history-row"><i class="dot"></i><span>${new Date(h.date).toLocaleDateString()} — ${getMemory(h.memoryId)?.title||"Memory"} — ${["","Again","Hard","Good","Easy"][h.quality]||"Review"}${h.mode?` • ${h.mode}`:""}</span></div>`).join("")||'<p class="muted">No practice sessions yet.</p>'
}
function renderAchievements(){
 const el=document.querySelector("#achievements");if(!el)return;
 el.innerHTML=getAchievements().map(a=>`<div class="achievement ${a.done?"unlocked":""}"><span class="achievement-icon">${a.icon}</span><b>${a.name}</b><small>${a.desc}</small><em>${a.done?"Unlocked":"Locked"}</em></div>`).join("")
}
function renderChallenge(){
 const c=getDailyChallenge(),el=document.querySelector("#challenge");if(!el)return;
 const pct=Math.min(100,Math.round(c.value/c.target*100));
 el.innerHTML=`<div class="challenge-icon">${c.icon}</div><div class="challenge-main"><b>Daily challenge</b><span>${c.label}</span><div class="progress"><i style="width:${pct}%"></i></div><small>${Math.min(c.value,c.target)} / ${c.target}</small></div><strong>${pct}%</strong>`
}
function renderChart(){
 const el=document.querySelector("#activityChart");if(!el)return;
 const db=loadDB(),days=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString(undefined,{weekday:"short"}),value:db.stats.daily[key]||0})}
 const max=Math.max(1,...days.map(x=>x.value));
 el.innerHTML=days.map(d=>`<div class="bar-wrap" title="${d.key}: ${d.value}"><div class="bar" style="height:${Math.max(6,d.value/max*100)}%"></div><small>${d.label}</small></div>`).join("")
}
function renderCards(el,memories){
 if(!el)return;if(!memories.length){el.innerHTML='<div class="empty">🧠<br><b>Nothing here yet.</b><br>Create your first memorisation to get started.</div>';return}
 el.innerHTML=memories.map(m=>`<article class="memory-card card ${m.colour}"><div class="memory-meta"><span>${esc(m.category)}</span><span>${m.confidence||0}%</span></div><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p><div class="progress"><i style="width:${m.confidence||0}%"></i></div><div class="card-actions"><a class="btn btn-primary" href="game.html?id=${m.id}&mode=reveal">Practise</a><a class="btn btn-ghost" href="game.html?id=${m.id}&mode=choose">Games</a><a class="btn btn-ghost" href="edit.html?id=${m.id}">Edit</a><button class="btn btn-ghost delete" data-id="${m.id}">Delete</button></div></article>`).join("");
 el.querySelectorAll(".delete").forEach(b=>b.onclick=()=>{if(confirm("Delete this memorisation?")){deleteMemory(b.dataset.id);renderCards(el,loadDB().memories)}})
}
function renderReview(){const el=document.querySelector("#reviewList"),items=dueMemories();el.innerHTML=items.length?items.map(m=>`<div class="review-item card"><div><h3>${esc(m.title)}</h3><p>${esc(m.category)} • ${m.confidence||0}% confidence • ${m.chunks?.length||1} chunks</p></div><a class="btn btn-primary" href="game.html?id=${m.id}&mode=first">Review</a></div>`).join(""):'<div class="card empty">🎉<br><b>You are all caught up!</b><br>Come back later for another review.</div>'}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
