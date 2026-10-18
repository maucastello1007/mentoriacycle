import { access,failure } from '@/lib/auth';
import { legacyHTML } from '@/lib/legacy-bundle';
export const dynamic='force-dynamic';
export async function GET(){try{await access(true);return new Response(legacyHTML,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"frame-ancestors 'self'"}})}catch(e){return failure(e)}}
