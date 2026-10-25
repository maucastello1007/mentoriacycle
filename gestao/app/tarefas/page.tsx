import {requireChatGPTUser} from '../chatgpt-auth';
import MemberArea from '../member-area';
export const dynamic='force-dynamic';
export default async function TasksPage(){await requireChatGPTUser('/tarefas');return <MemberArea/>}
