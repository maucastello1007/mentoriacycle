import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let role='sdr',email='sdr@example.test';
const records=new Map();
const fields={id:'id',version:'version'};
function predicate(condition,row){return !condition||condition(row)}
const db={
 select:()=>({from:()=>({where:async condition=>[...records.values()].filter(row=>predicate(condition,row))})}),
 insert:()=>({values:row=>({onConflictDoNothing:()=>({returning:async()=>{
  if(records.has(row.id))return [];records.set(row.id,structuredClone(row));return [structuredClone(row)];
 }})})}),
 update:()=>({set:row=>({where:condition=>({returning:async()=>{
  const old=records.get(row.id);if(!old||!predicate(condition,old))return [];records.set(row.id,structuredClone(row));return [structuredClone(row)];
 }})})})
};
const auth={
 async access(){return {role,user:{email}}},
 sameOrigin(request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new Response('Origem inválida.',{status:403})},
 json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}})},
 failure(error){return error instanceof Response?error:Response.json({error:String(error)},{status:500})},
 async body(request){return request.json()}
};
const modules={};
function load(path){
 if(modules[path])return modules[path];
 const output=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};
 const require=(name)=>{
  if(name==='@/lib/auth')return auth;
  if(name==='@/db')return {getDb:()=>db};
  if(name==='@/db/schema')return {leads:fields};
  if(name==='drizzle-orm')return {eq:(key,value)=>row=>row[key]===value,and:(...conditions)=>row=>conditions.every(c=>c(row))};
  if(name==='@/lib/lead')return load('lib/lead.ts');
  if(name==='./schedule')return load('lib/schedule.ts');
  throw Error('Unexpected import '+name);
 };
 vm.runInNewContext(output,{require,module,exports:module.exports,Response,Request,Intl,Date,JSON,console},{filename:path});
 modules[path]=module.exports;return module.exports;
}
const route=load('app/api/leads/[id]/route.ts');
const lead={id:'regression-1',name:'Example',phone:'11999999999',email:'lead@example.test',instagram:'@example',source:'Instagram',phase:'Novo contato',nextAction:'Retorno',nextDate:'2026-10-20',permission:true,doNotContact:false,aware:true,reason:'',meeting:'',zone:'America/Campo_Grande',calendarStatus:'Não agendado',answers:{structure:'Consultório próprio',pain:'Organizar retornos',prevention:'Em construção',patients:'100',offer:'Sim',prophylaxis:'20',revenue:'De R$ 20 mil a R$ 40 mil',goal:'Estruturar prevenção',autonomy:'Sim',time:'Sim',decision:'Sozinha',investment:'Sim',summary:'Organizar acompanhamento'},history:[],version:0};
function request(data){return new Request('https://example.test/api/leads/'+lead.id,{method:'PUT',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify(data)})}
const params={params:Promise.resolve({id:lead.id})};
let response=await route.PUT(request(lead),params);assert.equal(response.status,200);
const saved=await response.json();assert.deepEqual(saved.answers,lead.answers);assert.equal(saved.version,1);
for(const userRole of ['sdr','owner']){
 role=userRole;email=userRole+'@example.test';
 const response=await route.GET(new Request('https://example.test/api/leads/'+lead.id),params);
 assert.equal(response.status,200);
 const fetched=await response.json();assert.deepEqual(fetched.answers,lead.answers);assert.equal(fetched.phone,lead.phone);assert.equal(fetched.version,1);
}
role='sdr';email='sdr@example.test';
response=await route.PUT(request({...saved,answers:{...saved.answers,pain:'Resposta atualizada'}}),params);assert.equal(response.status,200);
const updated=await response.json();assert.equal(updated.version,2);assert.equal(updated.answers.pain,'Resposta atualizada');
assert.equal((await route.PUT(request({...saved,answers:{}}),params)).status,409,'Stale draft must not wipe current answers');
assert.equal(JSON.parse(records.get(lead.id).payload).answers.pain,'Resposta atualizada');
assert.equal((await route.PUT(request({...updated,phase:'Ganho'}),params)).status,403,'SDR restrictions must remain');
assert.equal((await route.PUT(request({...updated,answers:{unexpected:'invalid'}}),params)).status,400,'Invalid answer keys must remain rejected');
console.log('Lead API checks passed: SDR save, owner/SDR readback of all 13 answers, update, stale-write protection and role restrictions.');

let optionalBase=updated;
for(const userRole of ['sdr','owner']){
 role=userRole;email=userRole+'@example.test';
 for(const phase of ['Qualificado CYCLE','Agendado']){
  const partial={...optionalBase,phase,answers:{},meeting:'2026-10-21T13:00:00.000Z',calendarStatus:'Confirmado'};
  const response=await route.PUT(request(partial),params);assert.equal(response.status,200,phase+' must allow unanswered questions for '+userRole);
  optionalBase=await response.json();assert.deepEqual(optionalBase.answers,{});
  assert.deepEqual((await (await route.GET(new Request('https://example.test/api/leads/'+lead.id),params)).json()).answers,{});
 }
}
assert.equal((await route.PUT(request({...optionalBase,meeting:''}),params)).status,400,'Scheduled meetings still require date and confirmation');
console.log('Optional qualification checks passed for both profiles, including blank answers in Qualificado and Agendado.');
