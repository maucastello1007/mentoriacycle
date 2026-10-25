import { requireChatGPTUser } from './chatgpt-auth';
import { roleFor } from '@/lib/roles';
import CRM from './crm';
import MemberArea from './member-area';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireChatGPTUser('/');const role=roleFor(user.email);if(!role)return <MemberArea/>;return <CRM role={role}/>}
