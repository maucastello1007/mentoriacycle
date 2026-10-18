// Forms inside the page work without browser prompt/confirm support.
function cycleDialog(message,initial,confirmation=false){return new Promise(resolve=>{
const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#00000099;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
const box=document.createElement('form');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',message);box.style.cssText='background:white;color:#171717;border-radius:16px;padding:28px;width:100%;max-width:480px;box-shadow:0 20px 80px #0003';
const heading=document.createElement('h3');heading.textContent=message;box.append(heading);
let input;if(!confirmation){input=document.createElement('input');input.type='text';input.value=initial??'';input.setAttribute('aria-label',message);input.style.cssText='width:100%;margin:8px 0 20px';box.append(input)}
const actions=document.createElement('div');actions.className='row';const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';const accept=document.createElement('button');accept.type='submit';accept.className='primary';accept.textContent=confirmation?'Confirmar':'Salvar';actions.append(cancel,accept);box.append(actions);overlay.append(box);document.body.append(overlay);const previous=document.activeElement;
function finish(value){document.removeEventListener('keydown',key);overlay.remove();previous?.focus?.();resolve(value)}
function key(e){if(e.key==='Escape'){e.preventDefault();finish(confirmation?false:null)}if(e.key==='Tab'){const fields=[...(input?[input]:[]),cancel,accept],i=fields.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();accept.focus()}else if(!e.shiftKey&&i===fields.length-1){e.preventDefault();fields[0].focus()}}}
document.addEventListener('keydown',key);cancel.onclick=()=>finish(confirmation?false:null);box.onsubmit=e=>{e.preventDefault();finish(confirmation?true:input.value)};(input||accept).focus();input?.select();
})}
function cyclePrompt(message,initial=''){return cycleDialog(message,initial,false)}
function cycleConfirm(message){return cycleDialog(message,'',true)}
