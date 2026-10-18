import { access,json,failure } from '@/lib/auth';
import { getDb } from '@/db';
import { leads } from '@/db/schema';
export const dynamic='force-dynamic';
export async function GET(){try{await access();const rows=await getDb().select().from(leads);return json(rows.map(r=>({...JSON.parse(r.payload),id:r.id,version:r.version,updatedAt:r.updatedAt,updatedBy:r.updatedBy})))}catch(e){return failure(e)}}
