export function validWorkspace(s:any){
 const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(v);
 const stages=(a:any)=>Array.isArray(a)&&a.length<=200&&a.every((x:any)=>x&&id(x.id)&&typeof x.name==='string'&&Array.isArray(x.tasks)&&x.tasks.length<=10000&&x.tasks.every((t:any)=>t&&id(t.id)&&typeof t.title==='string'&&(!t.attachments||Array.isArray(t.attachments)&&t.attachments.every((f:any)=>id(f.id)&&typeof f.name==='string'))));
 return s&&stages(s.model)&&Array.isArray(s.people)&&s.people.length<=5000&&s.people.every((p:any)=>p&&id(p.id)&&typeof p.name==='string'&&stages(p.stages))&&(!s.salesMeetings||Array.isArray(s.salesMeetings)&&s.salesMeetings.every((m:any)=>m&&id(m.id)&&typeof m.name==='string'&&Array.isArray(m.questions)&&m.questions.every((q:any)=>id(q.id)&&typeof q.text==='string')));
}
