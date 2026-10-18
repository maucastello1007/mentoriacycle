const salesQuestions=[
['Situação atual','Como funciona a prevenção no seu consultório hoje?'],
['Situação atual','Qual é o perfil dos seus pacientes e como está sua agenda?'],
['Desafios','Qual é sua maior dificuldade para estruturar ou manter um programa preventivo?'],
['Desafios','O que você já tentou e quais resultados teve?'],
['Desafios','Como essa dificuldade afeta sua rotina, seus pacientes e os resultados do consultório?'],
['Objetivos','O que você gostaria de alcançar com um programa preventivo?'],
['Objetivos','Que resultado faria você considerar a mentoria um bom investimento?'],
['Objetivos','Em quanto tempo você gostaria de colocar esse programa em funcionamento?'],
['Momento e compromisso','Por que você está buscando ajuda agora?'],
['Momento e compromisso','Quanto tempo você e sua equipe conseguem dedicar à implantação?'],
['Momento e compromisso','Quem participaria da execução e quais recursos já estão disponíveis?'],
['Expectativas','O que você espera de mim durante a mentoria Cycle?'],
['Expectativas','Qual tipo de acompanhamento ajuda você a colocar um plano em prática?'],
['Investimento e decisão','Você já definiu um orçamento para a mentoria e para implantar o programa?'],
['Investimento e decisão','Além de você, alguém participa dessa decisão?'],
['Investimento e decisão','O que você precisa esclarecer para decidir se a Cycle faz sentido para você?'],
['Próximos passos','Se decidirmos seguir, quando você gostaria de começar?'],
['Próximos passos','Qual é o próximo passo combinado e quando vamos retomá-lo?']
];
state.salesMeetings??=[];let selectedSales=null;
function salesMeeting(){return state.salesMeetings.find(m=>m.id===selectedSales)}
function openSales(id){selectedSales=id;go('sales')}
function updateSales(field,value){const m=salesMeeting();if(!m)return;m[field]=value;try{save();salesSaved('Salvo neste navegador.')}catch{salesSaved('Não foi possível salvar. Copie suas anotações e exporte um backup.')}}
function salesSaved(text){const e=document.getElementById('sales-save-status');if(e)e.textContent=text}
function updateSalesAnswer(id,value){const q=salesMeeting()?.questions.find(q=>q.id===id);if(!q)return;q.answer=value;try{save();salesSaved('Salvo neste navegador.')}catch{salesSaved('Não foi possível salvar. Exporte um backup.')}}
async function addSalesMeeting(){const name=await cyclePrompt('Nome do dentista');if(!name?.trim())return;const m={id:uid(),name:name.trim(),city:'',date:'',status:'Agendada',notes:'',nextContact:'',questions:salesQuestions.map(([group,text])=>({id:uid(),group,text,answer:''}))};state.salesMeetings.push(m);save();openSales(m.id)}
async function addSalesQuestion(){const text=await cyclePrompt('Qual pergunta deseja adicionar?');if(!text?.trim())return;salesMeeting().questions.push({id:uid(),group:'Perguntas adicionais',text:text.trim(),answer:''});save();render()}
async function editSalesQuestion(id){const q=salesMeeting().questions.find(q=>q.id===id),text=await cyclePrompt('Editar pergunta',q.text);if(!text?.trim())return;q.text=text.trim();save();render()}
function salesPage(){const m=salesMeeting();let html=`<header><div><div class="tag">Cycle · Conversas com novos dentistas</div><h2>Reuniões de venda</h2><p class="muted">Conheça o dentista, avalie a compatibilidade com a mentoria e combine os próximos passos.</p></div><div class="row"><button onclick="backup()">Exportar backup</button><button class="primary" onclick="addSalesMeeting()">+ Nova reunião</button></div></header>`;
if(!m)return html+`<section class="card"><h3>Suas reuniões</h3>${state.salesMeetings.length?state.salesMeetings.map(m=>`<div class="task"><div style="flex:1"><strong>${esc(m.name)}</strong><p class="muted">${esc(m.city||'Cidade não informada')} · ${esc(m.status)} ${m.date?'· '+esc(m.date.split('-').reverse().join('/')):''}</p></div><button onclick="openSales('${m.id}')">Abrir reunião →</button></div>`).join(''):'<div class="empty">Cadastre uma reunião para registrar o dentista, a cidade e as respostas do roteiro.</div>'}</section>`;
html+=`<div class="row" style="margin-top:20px"><button onclick="selectedSales=null;render()">← Todas as reuniões</button><small id="sales-save-status" role="status" class="muted">Preenchimento com salvamento automático neste navegador.</small></div><section class="card"><h3>Dados da reunião</h3><div class="grid"><div><label for="sales-name">Nome do dentista</label><input id="sales-name" style="width:100%" value="${esc(m.name)}" oninput="updateSales('name',this.value)"></div><div><label for="sales-city">Cidade / UF</label><input id="sales-city" style="width:100%" placeholder="Ex.: Cuiabá / MT" value="${esc(m.city)}" oninput="updateSales('city',this.value)"></div><div><label for="sales-date">Data da reunião</label><input id="sales-date" type="date" value="${esc(m.date)}" onchange="updateSales('date',this.value)"></div><div><label for="sales-status">Andamento</label><select id="sales-status" onchange="updateSales('status',this.value)">${['Agendada','Realizada','Proposta enviada','Em negociação','Fechada','Não avançou'].map(s=>`<option ${m.status===s?'selected':''}>${s}</option>`).join('')}</select></div></div></section>`;
for(const group of new Set(m.questions.map(q=>q.group))){html+=`<section class="card"><h3>${esc(group)}</h3>${m.questions.filter(q=>q.group===group).map(q=>`<div style="margin:20px 0"><div class="row"><label style="flex:1" for="sales-answer-${q.id}">${esc(q.text)}</label><button onclick="editSalesQuestion('${q.id}')">Editar pergunta</button></div><textarea id="sales-answer-${q.id}" style="min-height:90px" placeholder="Registre a resposta do dentista…" oninput="updateSalesAnswer('${q.id}',this.value)">${esc(q.answer)}</textarea></div>`).join('')}</section>`}
return html+`<button onclick="addSalesQuestion()">+ Adicionar pergunta</button><section class="card"><label for="sales-notes">Suas anotações e próximos passos</label><textarea id="sales-notes" oninput="updateSales('notes',this.value)" placeholder="Registre sua avaliação, proposta e combinados…">${esc(m.notes)}</textarea><label style="margin-top:18px" for="sales-next">Data do próximo contato</label><input id="sales-next" type="date" value="${esc(m.nextContact)}" onchange="updateSales('nextContact',this.value)"></section>`}
const beforeSalesRender=render;render=function(){beforeSalesRender();const nav=document.getElementById('nav');nav.innerHTML=`<button class="${view==='sales'?'active':''}" onclick="selectedSales=null;go('sales')">∞ Reuniões de venda</button>`+nav.innerHTML;if(view==='sales')document.getElementById('app').innerHTML=salesPage()};
save();
