const params=new URLSearchParams(location.search),memory=getMemory(params.get("id")),modeParam=params.get("mode")||"choose";
if(!memory){location.href="library.html"}else{
let mode=modeParam,index=0,started=Date.now(),roundStart=Date.now();
const chunks=(memory.chunks&&memory.chunks.length?memory.chunks:splitChunks(memory.text,70));
const sentences=chunks.length?chunks:memory.text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
const modes=["reveal","slider","first","blank","scramble","type","choice","listen","speak","familiarize"];
const labels={reveal:"Reveal",slider:"Slider",first:"First Letter",blank:"Fill the Blank",scramble:"Scramble",type:"Type It",choice:"Multiple Choice",listen:"Listen",speak:"Speak",familiarize:"Familiarize"};
document.querySelector("#gameTitle").textContent=memory.title;
function render(){
 const text=sentences[index]||memory.text;
 document.querySelector("#gameProgress").textContent=`${index+1} / ${sentences.length}`;
 const g=document.querySelector("#game");
 if(mode==="choose")g.innerHTML=`<div class="game-card"><div class="eyebrow">PRACTICE MODE</div><h1>Choose your game</h1><p class="muted">Practise the same material in different ways.</p><div class="game-mode-grid">${modes.map(x=>`<button class="game-mode" data-mode="${x}"><b>${labels[x]}</b><small>${modeDescription(x)}</small></button>`).join("")}</div></div>`;
 else if(mode==="reveal")g.innerHTML=`<div class="game-card"><div class="eyebrow">REVEAL</div><h1>Try to say it before revealing.</h1><p id="answerText" class="game-text reveal-text">${esc(text)}</p><button id="reveal" class="btn btn-primary btn-lg">Reveal</button></div>`;
 else if(mode==="slider")g.innerHTML=`<div class="game-card"><div class="eyebrow">SLIDER</div><h1>Reveal only as much as you need.</h1><input id="revealSlider" class="reveal-slider" type="range" min="0" max="100" value="0"><div class="slider-value"><span id="sliderPct">0%</span></div><p id="sliderText" class="game-text slider-mask">${esc(text)}</p><button id="sliderDone" class="btn btn-primary btn-lg">I remember it</button></div>`;
 else if(mode==="first")g.innerHTML=`<div class="game-card"><div class="eyebrow">FIRST LETTER</div><h1>Use the first letters as clues.</h1><p class="game-text clue">${firstLetters(text)}</p><textarea id="answer" class="game-input" rows="5" placeholder="Type what you remember..."></textarea><button id="check" class="btn btn-primary btn-lg">Check</button></div>`;
 else if(mode==="blank")g.innerHTML=`<div class="game-card"><div class="eyebrow">FILL THE BLANK</div><h1>Complete the missing words.</h1><p class="game-text">${makeBlanks(text)}</p><textarea id="answer" class="game-input" rows="4" placeholder="Type the missing words..."></textarea><button id="check" class="btn btn-primary btn-lg">Check</button></div>`;
 else if(mode==="scramble")g.innerHTML=`<div class="game-card"><div class="eyebrow">SCRAMBLE</div><h1>Put the words back in order.</h1><div id="scrambleWords" class="scramble-box">${scramble(text).map((w,j)=>`<button class="word-chip" data-word="${j}">${esc(w)}</button>`).join("")}</div><p id="assembled" class="game-text small"></p><button id="clearWords" class="btn btn-ghost">Clear</button> <button id="checkScramble" class="btn btn-primary">Check</button></div>`;
 else if(mode==="type")g.innerHTML=`<div class="game-card"><div class="eyebrow">TYPE IT</div><h1>Write it from memory.</h1><textarea id="answer" class="game-input" rows="7" placeholder="Start typing..."></textarea><button id="check" class="btn btn-primary btn-lg">Check</button></div>`;
 else if(mode==="choice"){const opts=choiceOptions(text);g.innerHTML=`<div class="game-card"><div class="eyebrow">MULTIPLE CHOICE</div><h1>Which one is correct?</h1><div class="choice-grid">${opts.map((x,j)=>`<button class="choice" data-choice="${j}">${esc(x)}</button>`).join("")}</div></div>`}
 else if(mode==="listen")g.innerHTML=`<div class="game-card"><div class="eyebrow">LISTEN</div><h1>Listen, then recall.</h1><button id="play" class="btn btn-primary btn-lg">🔊 Play</button><p class="game-text faded">${esc(text)}</p><button id="show" class="btn btn-ghost">Show text</button></div>`;
 else if(mode==="speak")g.innerHTML=`<div class="game-card"><div class="eyebrow">SPEAK</div><h1>Say it out loud.</h1><p class="muted">Speak the line from memory, then self-check.</p><button id="play" class="btn btn-primary btn-lg">🔊 Hear reference</button><p class="game-text faded">${esc(text)}</p><button id="doneSpeak" class="btn btn-secondary">I recalled it</button></div>`;
 else if(mode==="familiarize")g.innerHTML=`<div class="game-card"><div class="eyebrow">FAMILIARIZE</div><h1>Read it slowly.</h1><p class="game-text">${esc(text)}</p><div class="progress"><i style="width:${Math.round((index+1)/sentences.length*100)}%"></i></div><button id="next" class="btn btn-primary btn-lg">Continue</button></div>`;
 bind(text);
}
function bind(text){
 document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;index=0;roundStart=Date.now();render()});
 const rev=document.querySelector("#reveal");
 if(rev)rev.onclick=()=>{document.querySelector("#answerText").classList.remove("reveal-text");rev.textContent=index+1<sentences.length?"Next":"Finish";rev.onclick=()=>finish(4)};
 const slider=document.querySelector("#revealSlider");
 if(slider){
   const out=document.querySelector("#sliderText"),pct=document.querySelector("#sliderPct");
   const update=()=>{const p=+slider.value;out.style.setProperty("--reveal",p+"%");pct.textContent=p+"%";};
   slider.oninput=update;update();
   document.querySelector("#sliderDone").onclick=()=>finish(+slider.value>=80?4:+slider.value>=55?3:2);
 }
 const check=document.querySelector("#check");if(check)check.onclick=()=>finish(scoreText(document.querySelector("#answer").value,text));
 document.querySelector("#next")?.addEventListener("click",()=>index+1<sentences.length?(index++,render()):finish(4));
 document.querySelector("#play")?.addEventListener("click",()=>speak(text));
 document.querySelector("#show")?.addEventListener("click",()=>{const p=document.querySelector(".faded");if(p)p.classList.remove("faded")});
 document.querySelector("#doneSpeak")?.addEventListener("click",()=>finish(4));
 document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>finish(b.dataset.choice==="0"?4:1));
 const words=document.querySelectorAll(".word-chip"),assembled=document.querySelector("#assembled");
 words.forEach(w=>w.onclick=()=>{w.classList.toggle("selected");assembled.textContent=[...document.querySelectorAll(".word-chip.selected")].map(x=>x.textContent).join(" ")});
 document.querySelector("#clearWords")?.addEventListener("click",()=>{words.forEach(x=>x.classList.remove("selected"));assembled.textContent=""});
 document.querySelector("#checkScramble")?.addEventListener("click",()=>{const a=assembled.textContent.trim().toLowerCase(),t=text.trim().toLowerCase();finish(a===t?4:1)});
}
function finish(quality){
 recordReview(memory.id,quality,mode,index);
 if(index+1<sentences.length){index++;roundStart=Date.now();render()}
 else{location.href=`results.html?id=${memory.id}&mode=${encodeURIComponent(mode)}&quality=${quality}&seconds=${Math.round((Date.now()-started)/1000)}`}
}
function scoreText(a,t){a=a.trim().toLowerCase().replace(/[^\w\s]/g,"");t=t.trim().toLowerCase().replace(/[^\w\s]/g,"");if(a===t)return 4;const aa=new Set(a.split(/\s+/)),bb=t.split(/\s+/);const hit=bb.filter(x=>aa.has(x)).length/Math.max(bb.length,1);return hit>.82?4:hit>.62?3:hit>.4?2:1}
function firstLetters(t){return t.split(/\s+/).map(w=>w.length>2?w[0]+"_".repeat(Math.min(3,w.length-1)):w).join(" ")}
function makeBlanks(t){return t.split(/\s+/).map((w,i)=>i%4===1&&w.length>3?`<span class="blank-word">____</span>`:esc(w)).join(" ")}
function scramble(t){return t.split(/\s+/).sort(()=>Math.random()-.5)}
function choiceOptions(t){const all=loadDB().memories.map(m=>(m.chunks||[m.text]).join(" ")).filter(x=>x!==memory.text);return [t,...all.sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5)}
function modeDescription(x){return {reveal:"Hide and reveal",slider:"Gradual text reveal",first:"First-letter clues",blank:"Missing words",scramble:"Order the words",type:"Type from memory",choice:"Pick the answer",listen:"Listen and recall",speak:"Say it aloud",familiarize:"Read and absorb"}[x]}
function speak(t){if("speechSynthesis"in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=loadDB().settings.speed||1;speechSynthesis.speak(u)}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
render();
document.querySelector("#speak").onclick=()=>speak(memory.text);
}
