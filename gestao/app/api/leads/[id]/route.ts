import { access,sameOrigin,json,failure,body } from '@/lib/auth';
import { getDb } from '@/db';
import { leads } from '@/db/schema';
import { and,eq } from 'drizzle-orm';
import { validateLead } from '@/lib/lead';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{await access();const {id}=await params;const row=(await getDb().select().from(leads).where(eq(leads.id,id)))[0];if(!row)return json({error:'Lead não encontrado.'},404);return json({...JSON.parse(row.payload),id:row.id,version:row.version,updatedAt:row.updatedAt,updatedBy:row.updatedBy})}catch(e){return failure(e)}}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{
 const {user,role}=await access();sameOrigin(request);const {id}=await params;const l=validateLead(await body(request));if(l.id!==id)return json({error:'ID inválido.'},400);
 const db=getDb();const previous=(await db.select().from(leads).where(eq(leads.id,id)))[0];
 if((previous?.version??0)!==l.version)return json({error:'Outra pessoa atualizou este lead. Recarregue antes de salvar.',conflict:true},409);
 const old=previous?JSON.parse(previous.payload):null;if(role==='sdr'&&['Ganho','Em decisão','Reunião realizada'].includes(l.phase)&&l.phase!==old?.phase)return json({error:'Maurício registra o resultado da reunião e da venda.'},403);const history=old?.history??[];
 history.push({at:new Date().toISOString(),actor:user.email,text:old?`Ficha atualizada${old.phase!==l.phase?' · '+old.phase+' → '+l.phase:''}`:'Lead cadastrado'});
 if(l.newNote&&typeof l.newNote==='string'&&l.newNote.length<=5000)history.push({at:new Date().toISOString(),actor:user.email,text:l.newNote});
 const clean={...l,name:l.name.trim(),history:history.slice(-1000)};delete clean.newNote;
 const row={id,payload:JSON.stringify(clean),version:l.version+1,updatedAt:new Date().toISOString(),updatedBy:user.email};
 const changed=previous?await db.update(leads).set(row).where(and(eq(leads.id,id),eq(leads.version,l.version))).returning():await db.insert(leads).values(row).onConflictDoNothing().returning();
 if(!changed.length)return json({error:'Atualização concorrente. Recarregue.',conflict:true},409);
 const stored=changed[0];return json({...JSON.parse(stored.payload),id:stored.id,version:stored.version,updatedAt:stored.updatedAt,updatedBy:stored.updatedBy});}catch(e){return failure(e)}}
