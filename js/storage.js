const DB_KEY="malofit_v2";
const DEFAULT={
  memories:[],
  stats:{sessions:0,correct:0,attempts:0,xp:0,history:[],daily:{}},
  settings:{theme:"system",speed:1,language:"en"},
  streak:{days:0,last:null}
};

function loadDB(){
  try{
    const raw=JSON.parse(localStorage.getItem(DB_KEY))||{};
    const db={...structuredClone(DEFAULT),...raw};
    db.stats={...structuredClone(DEFAULT.stats),...(raw.stats||{})};
    db.settings={...structuredClone(DEFAULT.settings),...(raw.settings||{})};
    db.streak={...structuredClone(DEFAULT.streak),...(raw.streak||{})};
    db.memories=Array.isArray(raw.memories)?raw.memories:[];
    return db;
  }catch{return structuredClone(DEFAULT)}
}
function saveDB(db){localStorage.setItem(DB_KEY,JSON.stringify(db))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function splitChunks(text,size=70){
  const parts=String(text||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  for(const part of parts){
    if(part.length<=size){out.push(part);continue}
    const words=part.split(/\s+/), buf=[];
    let len=0;
    for(const w of words){
      if(len+w.length+(buf.length?1:0)>size&&buf.length){out.push(buf.join(" "));buf.length=0;len=0}
      buf.push(w);len+=w.length+(buf.length>1?1:0);
    }
    if(buf.length)out.push(buf.join(" "));
  }
  return out.length?out:[String(text||"")];
}
function createMemory(data){
  const db=loadDB(),now=new Date().toISOString();
  const m={
    id:uid(),title:data.title,text:data.text,category:data.category||"Other",
    colour:data.colour||"violet",deadline:data.deadline||"",created:now,updated:now,
    confidence:0,interval:0,due:now,attempts:0,correct:0,
    chunks:splitChunks(data.text),chunkSize:70
  };
  db.memories.unshift(m);saveDB(db);return m
}
function getMemory(id){return loadDB().memories.find(m=>m.id===id)}
function updateMemory(id,patch){
  const db=loadDB(),m=db.memories.find(x=>x.id===id);
  if(m){
    Object.assign(m,patch,{updated:new Date().toISOString()});
    if(patch.text!==undefined){m.chunks=splitChunks(patch.text,m.chunkSize||70)}
    saveDB(db)
  }
  return m
}
function deleteMemory(id){const db=loadDB();db.memories=db.memories.filter(m=>m.id!==id);saveDB(db)}
function recordReview(id,quality,mode="practice",chunkIndex=null){
  const db=loadDB(),m=db.memories.find(x=>x.id===id);if(!m)return;
  const now=new Date(),day=now.toISOString().slice(0,10);
  m.attempts++;m.correct+=quality>=3?1:0;m.confidence=Math.round((m.correct/m.attempts)*100);
  const intervals=[1,2,4,7,14,30,60];
  const index=quality<=1?0:Math.min(intervals.length-1,Math.floor((m.confidence||0)/20));
  m.interval=intervals[index];const d=new Date();d.setDate(d.getDate()+m.interval);m.due=d.toISOString();
  db.stats.sessions++;db.stats.attempts++;if(quality>=3)db.stats.correct++;
  db.stats.xp+=quality<=1?2:quality===2?5:quality===3?10:15;
  db.stats.history.unshift({date:now.toISOString(),memoryId:id,quality,mode,chunkIndex});
  db.stats.history=db.stats.history.slice(0,500);
  db.stats.daily[day]=(db.stats.daily[day]||0)+1;
  const today=new Date().toDateString();
  if(db.streak.last!==today){
    const last=db.streak.last?new Date(db.streak.last):null;
    if(last){
      const diff=Math.round((new Date(today)-new Date(last.toDateString()))/86400000);
      db.streak.days=diff===1?db.streak.days+1:1
    }else db.streak.days=1;
    db.streak.last=today
  }
  saveDB(db)
}
function dueMemories(){const now=Date.now();return loadDB().memories.filter(m=>!m.due||new Date(m.due).getTime()<=now)}
function getDailyChallenge(){
  const db=loadDB(),day=new Date().toISOString().slice(0,10);
  const seed=[...day].reduce((a,c)=>a+c.charCodeAt(0),0);
  const challenges=[
    {id:"practice3",icon:"🎯",goal:3,label:"Complete 3 practice rounds",value:db.stats.daily[day]||0,target:3},
    {id:"perfect1",icon:"✨",goal:1,label:"Get a Good/Easy result",value:db.stats.history.filter(h=>h.date?.slice(0,10)===day&&h.quality>=3).length,target:1},
    {id:"practice5",icon:"🔥",goal:5,label:"Complete 5 practice rounds",value:db.stats.daily[day]||0,target:5}
  ];
  return challenges[seed%challenges.length]
}
function getAchievements(){
  const db=loadDB(),acc=db.stats.attempts?db.stats.correct/db.stats.attempts*100:0;
  return [
    {id:"first",icon:"🌱",name:"First steps",desc:"Complete your first practice",done:db.stats.sessions>=1},
    {id:"streak2",icon:"🔥",name:"On a roll",desc:"Practise on 2 days",done:db.streak.days>=2},
    {id:"collector",icon:"📚",name:"Collector",desc:"Create 5 memories",done:db.memories.length>=5},
    {id:"accuracy90",icon:"💯",name:"Sharp mind",desc:"Reach 90% accuracy",done:acc>=90&&db.stats.attempts>=5},
    {id:"xp100",icon:"⚡",name:"Charged up",desc:"Earn 100 XP",done:db.stats.xp>=100},
    {id:"sessions25",icon:"🏆",name:"Dedicated",desc:"Complete 25 rounds",done:db.stats.sessions>=25},
    {id:"streak7",icon:"🌈",name:"Week warrior",desc:"Reach a 7-day streak",done:db.streak.days>=7},
    {id:"library10",icon:"🧠",name:"Memory palace",desc:"Create 10 memories",done:db.memories.length>=10}
  ]
}
