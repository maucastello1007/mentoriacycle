import handler from 'vinext/server/fetch-handler';
import { accessRequest,appOrigin } from '../lib/cloudflare-access';

export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  try{
   const authenticated=await accessRequest(request);
   const path=new URL(request.url).pathname;
   if(path==='/signout-with-chatgpt')return Response.redirect(appOrigin+'/cdn-cgi/access/logout',303);
   if(path==='/signin-with-chatgpt')return Response.redirect(appOrigin+'/',303);
   const response=await handler.fetch(authenticated,env,ctx);
   const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');
   return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }catch(e){return e instanceof Response?e:new Response('Não foi possível validar o acesso. Tente novamente.',{status:503,headers:{'Cache-Control':'no-store'}})}
 }
};
