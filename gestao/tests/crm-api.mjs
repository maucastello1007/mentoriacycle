import assert from 'node:assert/strict';
import {requestJSON} from '../lib/crm-api.ts';
const original=globalThis.fetch;
try{
 globalThis.fetch=async()=>new Response('<!doctype html><title>Cloudflare Access</title>',{status:200,headers:{'Content-Type':'text/html'}});
 await assert.rejects(requestJSON('/api/leads/example',{method:'PUT',body:'{}'}),/sessão expirou/);
 globalThis.fetch=async()=>new Response('Confira nome e etapa.',{status:400});
 await assert.rejects(requestJSON('/api/leads/example'),/Confira nome e etapa/);
 globalThis.fetch=async()=>Response.json({id:'example',answers:{pain:'Preservar o conteúdo'},version:2});
 assert.deepEqual((await requestJSON('/api/leads/example')).answers,{pain:'Preservar o conteúdo'});
 globalThis.fetch=async()=>{const response=Response.json({});Object.defineProperty(response,'redirected',{value:true});return response};
 await assert.rejects(requestJSON('/api/leads/example'),/sessão precisa ser renovada/);
 console.log('API client checks passed: expired-session HTML is rejected, redirects cannot report success, validation errors remain visible and valid JSON is preserved.');
}finally{globalThis.fetch=original}
