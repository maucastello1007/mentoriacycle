import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { roleFor } from './roles.ts';

export const accessIssuer='https://icy-glade-f82f.cloudflareaccess.com';
export const accessAudience='a3c25c511fff783518fe1a2d6205f15db65c96b7e922162aa77410fa06cc0950';
export const appOrigin='https://gestao.mauriciocastello.com.br';
const publicKeys=createRemoteJWKSet(new URL(accessIssuer+'/cdn-cgi/access/certs'));

// Cloudflare headers supplied by the visitor are never used as an identity.
// Only a verified Access application token may populate the internal headers.
export async function accessRequest(request:Request,keys:JWTVerifyGetKey=publicKeys){
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token)throw new Response('Entre pelo endereço gestao.mauriciocastello.com.br.',{status:401,headers:{'Cache-Control':'no-store'}});
 let payload;
 try{({payload}=await jwtVerify(token,keys,{issuer:accessIssuer,audience:accessAudience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']}))}
 catch{throw new Response('Login inválido ou expirado. Entre novamente.',{status:401,headers:{'Cache-Control':'no-store'}})}
 if(typeof payload.email!=='string'||typeof payload.sub!=='string'||!payload.sub||!roleFor(payload.email))throw new Response('Este e-mail não tem acesso ao Cycle.',{status:403});
 const headers=new Headers(request.headers);
 for(const name of [...headers.keys()])if(name.toLowerCase().startsWith('oai-authenticated-user-'))headers.delete(name);
 headers.set('oai-authenticated-user-id',payload.sub);
 headers.set('oai-authenticated-user-email',payload.email.trim().toLowerCase());
 headers.delete('Cf-Access-Jwt-Assertion');
 return new Request(request,{headers});
}
