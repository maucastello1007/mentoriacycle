import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {accessRequest,accessIssuer,accessAudience} from '../lib/cloudflare-access.ts';
const {privateKey,publicKey}=await generateKeyPair('RS256');
const jwk={...await exportJWK(publicKey),kid:'qa-key',alg:'RS256',use:'sig'};
const keys=createLocalJWKSet({keys:[jwk]});
async function token(email='karla.domingos@outlook.com',options={}){
 return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'qa-key'}).setSubject('qa-person').setIssuedAt().setIssuer(options.issuer||accessIssuer).setAudience(options.audience||accessAudience).setExpirationTime(options.expired?Math.floor(Date.now()/1000)-60:'5m').sign(privateKey);
}
const request=t=>new Request('https://gestao.mauriciocastello.com.br/api/workspace',{headers:{'Cf-Access-Jwt-Assertion':t,'oai-authenticated-user-email':'mauriciocastellostop@gmail.com','oai-authenticated-user-id':'forged-owner'}});
const rejected=async(p,status)=>{await assert.rejects(p,e=>e instanceof Response&&e.status===status)};
await rejected(accessRequest(new Request('https://gestao.mauriciocastello.com.br/',{headers:{'oai-authenticated-user-email':'mauriciocastellostop@gmail.com'}}),keys),401);
await rejected(accessRequest(request(await token('outra@exemplo.com')),keys),403);
await rejected(accessRequest(request(await token(undefined,{audience:'outra-aplicacao'})),keys),401);
await rejected(accessRequest(request(await token(undefined,{issuer:'https://outra.cloudflareaccess.com'})),keys),401);
await rejected(accessRequest(request(await token(undefined,{expired:true})),keys),401);
await rejected(accessRequest(request('invalid.invalid.invalid'),keys),401);
const original=await token();const pieces=original.split('.');pieces[1]=Buffer.from(JSON.stringify({email:'mauriciocastellostop@gmail.com'})).toString('base64url');
await rejected(accessRequest(request(pieces.join('.')),keys),401);
const sdr=await accessRequest(request(original),keys);
assert.equal(sdr.headers.get('oai-authenticated-user-email'),'karla.domingos@outlook.com');
assert.equal(sdr.headers.get('oai-authenticated-user-id'),'qa-person');
const owner=await accessRequest(request(await token('mauriciocastellostop@gmail.com')),keys);
assert.equal(owner.headers.get('oai-authenticated-user-email'),'mauriciocastellostop@gmail.com');
console.log('Cloudflare Access: assinatura, emissor, AUD, validade, e-mails autorizados e substituição de identidade forjada verificados.');
