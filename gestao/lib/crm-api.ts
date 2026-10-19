export async function requestJSON(url:string,options?:RequestInit){
 const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...options?.headers},cache:'no-store'});
 const text=await response.text();let data;
 try{data=JSON.parse(text)}catch{
  if(response.ok)throw Error('A sessão expirou ou o servidor não confirmou o salvamento. Exporte o rascunho antes de entrar novamente.');
  data={error:text};
 }
 if(!response.ok)throw Error(data?.error||'Não foi possível concluir.');
 if(response.redirected)throw Error('Sua sessão precisa ser renovada. Exporte o rascunho antes de entrar novamente.');
 return data;
}
