import { requireChatGPTUser } from './chatgpt-auth';
import { roleFor } from '@/lib/roles';
import CRM from './crm';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireChatGPTUser('/');const role=roleFor(user.email);if(!role)return <main style={{padding:40}}>Este e-mail não tem acesso ao Cycle. Entre com o e-mail autorizado.</main>;return <CRM role={role}/>}
