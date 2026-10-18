const cyclePrelaunchItems=[
'Nome e identidade visual',
'Público prioritário',
'Protocolo clínico',
'Critérios de risco e periodicidade',
'O que está e o que não está incluído',
'Número estimado de consultas/ano',
'Preço e formas de pagamento',
'Regras de adesão, cancelamento e renovação',
'Capacidade da agenda',
'Prontuário e documentação',
'Jornada do paciente',
'Processo de cobrança',
'Treinamento da equipe',
'Materiais físicos e digitais',
'Indicadores que serão acompanhados'
];
const normalizeCycleTitle=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\d+[.)]\s*/,'').replace(/[;.]$/,'').trim();
function installCyclePrelaunch(){for(const list of [state.model,...state.people.map(p=>p.stages)]){
let target=list.find(s=>s.kind==='prelaunch'||normalizeCycleTitle(s.name).includes('pre-lancamento'));
if(!target){target=stage('Pré-lançamento / Buzz');const launch=list.findIndex(s=>normalizeCycleTitle(s.name)==='lancamento');list.splice(launch<0?list.length:launch,0,target)}
target.kind='prelaunch';if(target.cyclePrelaunchChecklistVersion===1)continue;
target.tasks??=[];for(const title of cyclePrelaunchItems)if(!target.tasks.some(t=>normalizeCycleTitle(t.title)===normalizeCycleTitle(title)))target.tasks.push({id:uid(),title,owner:'Minha entrega',date:'',done:false});
target.cyclePrelaunchChecklistVersion=1;
}save()}
installCyclePrelaunch();
