import { access,sameOrigin,json,failure,body } from '@/lib/auth';
import { getDb } from '@/db';
import { workspace } from '@/db/schema';
import { and,eq } from 'drizzle-orm';
import { validWorkspace } from '@/lib/workspace-validation';
export const dynamic='force-dynamic';
export async function GET(){try{await access(true);const row=(await getDb().select().from(workspace).where(eq(workspace.id,'cycle')))[0];return json(row?{state:JSON.parse(row.payload),version:row.version}:{state:null,version:0})}catch(e){return failure(e)}}
export async function PUT(request:Request){try{await access(true);sameOrigin(request);const input=await body(request,12000000);
 if(!Number.isInteger(input.version)||input.version<0||!validWorkspace(input.state))return json({error:'Backup inválido.'},400);
 const row={id:'cycle',payload:JSON.stringify(input.state),version:input.version+1,updatedAt:new Date().toISOString()};const db=getDb();
 const changed=input.version===0?await db.insert(workspace).values(row).onConflictDoNothing().returning():await db.update(workspace).set(row).where(and(eq(workspace.id,'cycle'),eq(workspace.version,input.version))).returning();
 if(!changed.length)return json({error:'Há uma versão mais recente. Exporte suas alterações e recarregue.',conflict:true},409);return json({version:row.version});}catch(e){return failure(e)}}
