import assert from 'node:assert/strict';
import {dailyBackup} from '../lib/daily-backup.ts';
const at=Date.parse('2026-10-19T03:55:00Z');
function fixture({failFile=false}={}){
 const data=new Map([
 ['cycle/attachment-1',{text:'original attachment',etag:'live-etag',customMetadata:{name:'plano.pdf'},httpMetadata:{contentType:'application/pdf'}}],
 ['backups/daily/2026-09-18/manifest.json',{text:'expired'}],
 ['backups/daily/2026-09-18/files/old-file',{text:'expired file'}],
 ['backups/daily/2026-09-19/manifest.json',{text:'keep boundary'}],
 ['unrelated/2026-09-01/file',{text:'unrelated'}]
 ]);
 let batches=0;
 const bucket={
  async head(key){return data.get(key)||null},
  async list({prefix,cursor}){
   const keys=[...data.keys()].filter(k=>k.startsWith(prefix)&&(!cursor||k>cursor)).sort();
   // Deliberately paginate one item per call.
   return {objects:keys.slice(0,1).map(key=>({key,...data.get(key)})),truncated:keys.length>1,cursor:keys[0]};
  },
  async get(key){
   if(failFile&&key.startsWith('cycle/'))return null;
   const obj=data.get(key);return obj?{...obj,key,size:obj.text.length,async arrayBuffer(){return new TextEncoder().encode(obj.text).buffer}}:null;
  },
  async put(key,value,options={}){
   const text=typeof value==='string'?value:new TextDecoder().decode(value);
   data.set(key,{text,...options});return {};
  },
  async delete(keys){for(const key of Array.isArray(keys)?keys:[keys])data.delete(key)}
 };
 const env={BUCKET:bucket,DB:{
  prepare(sql){return sql},
  async batch(sql){
   batches++;assert.match(sql[0],/FROM leads/);assert.match(sql[1],/FROM workspace/);
   return [
    {success:true,results:[{id:'lead-1',payload:'{"name":"Example"}',version:2}]},
    {success:true,results:[{id:'cycle',payload:'{"people":[]}',version:5}]}
   ];
  }
 }};
 return {env,data,batches:()=>batches};
}
const good=fixture();
const key=await dailyBackup(good.env,at);
assert.equal(key,'backups/daily/2026-10-18/manifest.json');
const manifest=JSON.parse(good.data.get(key).text);
assert.equal(manifest.day,'2026-10-18');
assert.equal(manifest.database.leads[0].version,2);
assert.equal(manifest.database.workspace[0].version,5);
assert.equal(manifest.files.length,1);
const copy=manifest.files[0].backupKey;
assert.equal(good.data.get(copy).text,'original attachment');
assert.equal(good.data.get(copy).customMetadata.name,'plano.pdf');
assert.ok(good.data.has('cycle/attachment-1'));
assert.ok(!good.data.has('backups/daily/2026-09-18/manifest.json'));
assert.ok(!good.data.has('backups/daily/2026-09-18/files/old-file'));
assert.ok(good.data.has('backups/daily/2026-09-19/manifest.json'));
assert.ok(good.data.has('unrelated/2026-09-01/file'));
await dailyBackup(good.env,at);
assert.equal(good.batches(),1,'Retry must preserve completed backup');
good.data.delete('cycle/attachment-1');
assert.equal(good.data.get(copy).text,'original attachment','Live deletion must not erase backup');
const broken=fixture({failFile:true});
await assert.rejects(dailyBackup(broken.env,at),/attachment changed/);
assert.ok(!broken.data.has(key),'Incomplete copy must not get a completed manifest');
assert.ok(broken.data.has('backups/daily/2026-09-18/manifest.json'),'Failure must not expire previous backups');
await assert.rejects(dailyBackup({},at),/requires DB and BUCKET/);
console.log('Daily backup checks passed: contents, files, pagination, retention, retries and failure safety.');
