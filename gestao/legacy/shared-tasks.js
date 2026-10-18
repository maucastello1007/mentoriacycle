// Prepared for activation after the user confirms the scope of content cleanup.
const sharedTaskText=text=>normalizeCycleTitle(text);
const sharedStageKey=s=>s.kind==='prelaunch'||sharedTaskText(s.name).includes('pre-lancamento')?'prelaunch':sharedTaskText(s.name);
function blankSharedTask(t){return {id:uid(),title:t.title,owner:t.owner||'Minha entrega',date:'',done:false,notes:'',attachments:[]}}
function sharedLists(){return [state.model,...state.people.map(p=>p.stages)]}
function addSharedTaskEverywhere(sourceStage,task){const key=sharedStageKey(sourceStage);for(const list of sharedLists()){let target=list.find(s=>sharedStageKey(s)===key);if(!target){target=stage(sourceStage.name);if(key==='prelaunch')target.kind='prelaunch';list.push(target)}target.tasks??=[];if(!target.tasks.some(t=>sharedTaskText(t.title)===sharedTaskText(task.title)))target.tasks.push(blankSharedTask(task))}}
function initializeSharedTasks(){if(state.sharedTasksInitialized)return;
const sources=state.people.filter(p=>['samuel rocha','thalita miana'].some(name=>sharedTaskText(p.name).includes(name)));
for(const p of sources)for(const s of p.stages.filter(s=>sharedStageKey(s)==='prelaunch'))for(const t of [...s.tasks])addSharedTaskEverywhere(s,t);
if(sources.length)state.sharedTasksInitialized=true;
}
let sharedKnownIds=new Set();
function rememberSharedTasks(){sharedKnownIds=new Set(sharedLists().flatMap(list=>list.flatMap(s=>(s.tasks||[]).map(t=>t.id))))}
initializeSharedTasks();rememberSharedTasks();
const beforeSharedSave=save;
save=function(){const additions=[];for(const list of sharedLists())for(const s of list)for(const t of s.tasks||[])if(!sharedKnownIds.has(t.id))additions.push({s,t});for(const {s,t} of additions)addSharedTaskEverywhere(s,t);rememberSharedTasks();return beforeSharedSave()};
save();
