import { roleFor } from './roles';

export const memberEmail=(value:unknown)=>typeof value==='string'?value.trim().toLowerCase():'';
export function validateMemberAccess(state:any){
 const emails=new Set<string>();
 for(const person of state.people){
  if(person.email!==undefined&&typeof person.email!=='string')throw new Response('Confira o e-mail do mentorado.',{status:400});
  const email=memberEmail(person.email);
  if(email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>320||roleFor(email)||emails.has(email)))throw new Response('Use um e-mail válido e exclusivo para cada mentorado, diferente dos e-mails da equipe.',{status:400});
  if(email)emails.add(email);
  for(const stage of person.stages)for(const task of stage.tasks){
   if(task.released!==undefined&&typeof task.released!=='boolean'||task.instructions!==undefined&&(typeof task.instructions!=='string'||task.instructions.length>15000))throw new Response('Confira a liberação e as instruções das tarefas.',{status:400});
  }
 }
}
export function memberPerson(state:any,email:string){
 const normalized=memberEmail(email);
 const matches=(state?.people||[]).filter((p:any)=>normalized&&memberEmail(p.email)===normalized);
 if(matches.length!==1)throw new Response('Seu e-mail ainda não foi vinculado a um acompanhamento. Fale com seu mentor.',{status:403});
 return matches[0];
}
export function memberProjection(state:any,email:string,version:number){
 const person=memberPerson(state,email);
 return {name:person.name,version,tasks:person.stages.flatMap((stage:any)=>stage.tasks.filter((task:any)=>task.released===true).map((task:any)=>({id:task.id,stage:stage.name,title:task.title,instructions:typeof task.instructions==='string'?task.instructions:'',date:typeof task.date==='string'?task.date:'',done:task.done===true})))};
}
export function completeMemberTask(state:any,email:string,id:string,done:boolean){
 const person=memberPerson(state,email);
 const matches=person.stages.flatMap((stage:any)=>stage.tasks).filter((task:any)=>task.id===id&&task.released===true);
 if(matches.length!==1)throw new Response('Tarefa indisponível para este acesso.',{status:404});
 matches[0].done=done;
}
