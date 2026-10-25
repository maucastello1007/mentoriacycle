import { getChatGPTUser } from '@/app/chatgpt-auth';
import { sameOrigin,json,failure,body } from '@/lib/auth';
import { getDb } from '@/db';
import { workspace } from '@/db/schema';
import { and,eq } from 'drizzle-orm';
import { memberProjection,completeMemberTask } from '@/lib/members';
export const dynamic='force-dynamic';
async function memberRecord(){
 const user=await getChatGPTUser();
 if(!user)throw new Response('Entre para continuar.',{status:401});
 const db=getDb(),row=(await db.select().from(workspace).where(eq(workspace.id,'cycle')))[0];
 if(!row)throw new Response('Seu acompanhamento ainda não está disponível.',{status:403});
 return {db,row,state:JSON.parse(row.payload),email:user.email};
}
export async function GET(){try{const {state,email,row}=await memberRecord();return json(memberProjection(state,email,row.version))}catch(e){return failure(e)}}
export async function PATCH(request:Request){try{
 sameOrigin(request);const input=await body(request,2000);
 if(!input||typeof input.id!=='string'||typeof input.done!=='boolean'||!Number.isSafeInteger(input.version)||input.version<1)return json({error:'Atualização inválida.'},400);
 const {db,row,state,email}=await memberRecord();
 completeMemberTask(state,email,input.id,input.done);
 if(row.version!==input.version)return json({error:'As tarefas foram atualizadas. Atualize a lista antes de tentar novamente.'},409);
 const next={...row,payload:JSON.stringify(state),version:row.version+1,updatedAt:new Date().toISOString()};
 const changed=await db.update(workspace).set(next).where(and(eq(workspace.id,'cycle'),eq(workspace.version,row.version))).returning();
 if(!changed.length)return json({error:'As tarefas mudaram. Atualize a lista antes de tentar novamente.'},409);
 return json(memberProjection(state,email,next.version));
}catch(e){return failure(e)}}
