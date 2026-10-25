import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let user={email:'ana@example.test'},forceConflict=false;
let record={id:'cycle',version:1,payload:JSON.stringify({model:[],people:[
 {id:'ana',name:'Ana',email:' ANA@example.test ',payments:[{secret:'pagamentos privados'}],stages:[{id:'s1',name:'Diagnóstico',notes:'segredo',tasks:[{id:'a1',title:'Atividade da Ana',released:true,instructions:'Orientação pública',done:false,date:'2026-11-01',notes:'anotação privada',attachments:[{name:'contrato privado'}]},{id:'a2',title:'Rascunho privado',released:false}]}]},
 {id:'bia',name:'Bia',email:'bia@example.test',stages:[{id:'s2',name:'Plano',tasks:[{id:'b1',title:'Atividade da Bia',released:true,done:false}]}]}
 ],salesMeetings:[{secret:'reunião privada'}]})};
const fields={id:'id',version:'version'};
const db={select:()=>({from:()=>({where:async()=>record?[structuredClone(record)]:[]})}),update:()=>({set:row=>({where:condition=>({returning:async()=>{if(forceConflict||!record||!condition(record))return [];record=structuredClone(row);return [record]}})})})};
const cache={};
function load(path){if(cache[path])return cache[path];const module={exports:{}};cache[path]=module.exports;
 const require=name=>{
  if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>user};
  if(name==='@/lib/auth')return load('lib/auth.ts');
  if(name==='@/lib/members')return load('lib/members.ts');
  if(name==='./roles')return load('lib/roles.ts');
  if(name==='@/db')return {getDb:()=>db};
  if(name==='@/db/schema')return {workspace:fields};
  if(name==='drizzle-orm')return {eq:(key,value)=>row=>row[key]===value,and:(...items)=>row=>items.every(item=>item(row))};
  throw Error('Unexpected import '+name);
 };
 const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,require,Response,Request,URL,Date,JSON,console},{filename:path});return module.exports;
}
const api=load('app/api/member/route.ts'),members=load('lib/members.ts'),auth=load('lib/auth.ts');
const patch=(data,origin='https://example.test')=>api.PATCH(new Request('https://example.test/api/member',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)}));
let response=await api.GET();assert.equal(response.status,200);let data=await response.json();
assert.deepEqual(Object.keys(data).sort(),['name','tasks','version']);assert.equal(data.name,'Ana');assert.equal(data.tasks.length,1);assert.equal(data.tasks[0].id,'a1');
assert.deepEqual(Object.keys(data.tasks[0]).sort(),['date','done','id','instructions','stage','title']);assert.ok(!JSON.stringify(data).includes('privad'));assert.ok(!JSON.stringify(data).includes('Bia'));
await assert.rejects(auth.access(),e=>e.status===403);await assert.rejects(auth.access(true),e=>e.status===403);
response=await patch({id:'b1',done:true,version:1});assert.equal(response.status,404);
response=await patch({id:'a2',done:true,version:1});assert.equal(response.status,404);
assert.equal((await patch({id:'a1',done:true,version:1},'https://attacker.test')).status,403);
assert.equal((await patch({id:'a1',done:'true',version:1})).status,400);
response=await patch({id:'a1',done:true,version:1,email:'bia@example.test',name:'Forged',notes:'forged'});assert.equal(response.status,200);data=await response.json();assert.equal(data.version,2);assert.equal(data.tasks[0].done,true);
let stored=JSON.parse(record.payload);assert.equal(stored.people[0].name,'Ana');assert.equal(stored.people[1].stages[0].tasks[0].done,false);assert.equal(stored.people[0].stages[0].tasks[0].notes,'anotação privada');
assert.equal((await patch({id:'a1',done:false,version:1})).status,409);assert.equal(record.version,2);
forceConflict=true;assert.equal((await patch({id:'a1',done:false,version:2})).status,409);forceConflict=false;
user={email:'bia@example.test'};data=await (await api.GET()).json();assert.equal(data.name,'Bia');assert.deepEqual(data.tasks.map(t=>t.id),['b1']);
user={email:'unknown@example.test'};assert.equal((await api.GET()).status,403);assert.equal((await patch({id:'a1',done:true,version:2})).status,403);
user=null;assert.equal((await api.GET()).status,401);
user={email:'karla.domingos@outlook.com'};assert.equal((await auth.access()).role,'sdr');await assert.rejects(auth.access(true),e=>e.status===403);
user={email:'mauriciocastellostop@gmail.com'};assert.equal((await auth.access(true)).role,'owner');
members.validateMemberAccess(stored);
let invalid=structuredClone(stored);invalid.people[1].email='ana@EXAMPLE.test';assert.throws(()=>members.validateMemberAccess(invalid),e=>e.status===400);
invalid=structuredClone(stored);invalid.people[0].email='mauriciocastellostop@gmail.com';assert.throws(()=>members.validateMemberAccess(invalid),e=>e.status===400);
invalid=structuredClone(stored);invalid.people[0].email='invalid';assert.throws(()=>members.validateMemberAccess(invalid),e=>e.status===400);
invalid=structuredClone(stored);invalid.people[0].stages[0].tasks[0].released='yes';assert.throws(()=>members.validateMemberAccess(invalid),e=>e.status===400);
stored.people[0].stages[0].tasks[0].released=false;record.payload=JSON.stringify(stored);user={email:'ana@example.test'};assert.equal((await (await api.GET()).json()).tasks.length,0);assert.equal((await patch({id:'a1',done:true,version:2})).status,404);
stored.people[0].email='new@example.test';record.payload=JSON.stringify(stored);assert.equal((await api.GET()).status,403);
console.log('Member API: isolamento por e-mail, projeção sem dados privados, liberação/revogação, conclusão persistida, papéis de equipe, validação e conflitos verificados.');
