import { getChatGPTUser } from '@/app/chatgpt-auth';
import { roleFor } from './roles';
export async function access(owner=false){const user=await getChatGPTUser();if(!user)throw new Response('Entre para continuar.',{status:401});const role=roleFor(user.email);if(!role||(owner&&role!=='owner'))throw new Response('Acesso restrito.',{status:403});return {user,role}}
export function sameOrigin(r:Request){if(r.headers.get('origin')!==new URL(r.url).origin)throw new Response('Origem inválida.',{status:403})}
export function json(v:unknown,status=200){return Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}})}
export function failure(e:unknown){return e instanceof Response?e:json({error:'Não foi possível concluir. Os registros anteriores foram preservados.'},500)}
export async function body(r:Request,max=2000000){const raw=await r.text();if(raw.length>max)throw new Response('Conteúdo muito grande.',{status:413});try{return JSON.parse(raw)}catch{throw new Response('Dados inválidos.',{status:400})}}
