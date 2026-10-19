import assert from 'node:assert/strict';
import {captureLeadControls,leadContent,mergeLeadRows,reconcileSave,updateAnswer} from '../lib/lead-editor.ts';
const initial={id:'example',name:'Example',phone:'',email:'',instagram:'',source:'Instagram',phase:'Novo contato',nextAction:'Contato',nextDate:'2026-10-20',permission:false,doNotContact:false,aware:false,reason:'',meeting:'',zone:'America/Campo_Grande',calendarStatus:'Não agendado',answers:{},history:[],version:1};
const first=updateAnswer(initial,'structure','Consultório próprio');
const second=updateAnswer(first,'pain','Organizar os retornos');
assert.equal(second.answers.structure,'Consultório próprio');
assert.equal(second.answers.pain,'Organizar os retornos');
assert.deepEqual(initial.answers,{});
const sent=structuredClone(second),saved={...sent,version:2,updatedBy:'sdr@example.test',history:[{at:'2026-10-19',actor:'sdr@example.test',text:'Salvo'}]};
const typedDuringRequest={...updateAnswer(sent,'goal','Prevenção estruturada'),phone:'1234',newNote:'Anotação nova'};
const next=reconcileSave(typedDuringRequest,sent,saved);
assert.equal(next.answers.goal,'Prevenção estruturada');
assert.equal(next.answers.pain,sent.answers.pain);
assert.equal(next.phone,'1234');assert.equal(next.newNote,'Anotação nova');
assert.equal(next.version,2);assert.notEqual(leadContent(next),leadContent(saved));
const savedAgain={...next,version:3,updatedBy:'sdr@example.test'};
assert.equal(leadContent(reconcileSave(next,next,savedAgain)),leadContent(savedAgain));
const another={...initial,id:'other',name:'Other'};
assert.equal(reconcileSave(another,sent,saved),another,'Response must not replace another open record');
const stale={...initial,version:1,answers:{}};
assert.deepEqual(mergeLeadRows([saved],[stale])[0].answers,sent.answers,'Stale list reload must not erase saved answers');
const oldNote={...sent,newNote:'Interaction'};
const moreTyping={...oldNote,phone:'5678'};
assert.equal(reconcileSave(moreTyping,oldNote,saved).newNote,undefined,'A saved interaction must not be appended twice');
function control(attributes,value,type='text',checked=false){return {getAttribute:key=>attributes[key]||null,value,type,checked}}
const root={querySelectorAll(selector){return selector==='[data-lead-field]'?[
 control({'data-lead-field':'phone'},'9999'),
 control({'data-lead-field':'permission'},'on','checkbox',true),
 control({'data-lead-field':'version'},'0'),
]:[control({'data-answer-key':'structure'},'Texto preenchido antes do evento React'),
 control({'data-answer-key':'revenue'},'De R$ 20 mil a R$ 40 mil')]}};
const captured=captureLeadControls(second,root);
assert.equal(captured.phone,'9999');assert.equal(captured.permission,true);assert.equal(captured.version,1);
assert.equal(captured.answers.structure,'Texto preenchido antes do evento React');
assert.equal(captured.answers.pain,'Organizar os retornos');
assert.equal(captured.answers.revenue,'De R$ 20 mil a R$ 40 mil');
assert.equal(second.phone,'');
assert.deepEqual(JSON.parse(JSON.stringify(saved)).answers,sent.answers,'Answers must round-trip through storage JSON');
console.log('Lead editor checks passed: all answers, late input, in-flight edits, stale lists, note history and record isolation.');
