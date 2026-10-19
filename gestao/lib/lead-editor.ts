import type {Lead} from './lead';
export function leadContent(lead:Lead){const {version,history,updatedAt,updatedBy,...content}=lead;return JSON.stringify({...content,newNote:content.newNote||''})}
export function updateAnswer(lead:Lead,key:string,value:string):Lead{return {...lead,answers:{...lead.answers,[key]:value}}}
export function reconcileSave(current:Lead,sent:Lead,saved:Lead):Lead{
 if(current.id!==sent.id)return current;
 if(leadContent(current)===leadContent(sent))return saved;
 const next={...current,version:saved.version,history:saved.history,updatedAt:saved.updatedAt,updatedBy:saved.updatedBy};
 if(current.newNote===sent.newNote)delete next.newNote;
 return next;
}
export function mergeLeadRows(current:Lead[],incoming:Lead[]):Lead[]{
 const records=new Map(current.map(lead=>[lead.id,lead]));
 for(const lead of incoming){const previous=records.get(lead.id);if(!previous||lead.version>=previous.version)records.set(lead.id,lead)}
 return [...records.values()];
}
export function captureLeadControls(lead:Lead,root:unknown):Lead{
 const result=structuredClone(lead);
 type Control={getAttribute:(key:string)=>string|null;value:string;type?:string;checked?:boolean};
 const controls=root as {querySelectorAll:(selector:string)=>ArrayLike<Control>}|null;
 Array.from(controls?.querySelectorAll('[data-lead-field]')||[]).forEach(control=>{
  const field=control.getAttribute('data-lead-field') as keyof Lead;
  if(!['name','phone','email','instagram','source','nextAction','nextDate','reason','newNote','phase','permission','doNotContact','aware','calendarStatus'].includes(field))return;
  (result as unknown as Record<string,unknown>)[field]=control.type==='checkbox'?Boolean(control.checked):control.value;
 });
 Array.from(controls?.querySelectorAll('[data-answer-key]')||[]).forEach(control=>{
  const key=control.getAttribute('data-answer-key');if(key)result.answers[key]=control.value;
 });
 return result;
}
