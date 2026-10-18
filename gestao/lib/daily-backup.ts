const prefix = 'backups/daily/';
const zone = 'America/Cuiaba';
function localDay(time:number){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
 return ['year','month','day'].map(type=>parts.find(p=>p.type===type)!.value).join('-');
}
async function* objects(bucket:R2Bucket,path:string){
 let cursor:string|undefined;
 do{
  const page=await bucket.list({prefix:path,cursor,limit:1000});
  for(const object of page.objects)yield object;
  cursor=page.truncated?page.cursor:undefined;
 }while(cursor);
}

/** Private daily recovery set. manifest.json is written last, marking completion. */
export async function dailyBackup(env:Cloudflare.Env,scheduledTime:number){
 const db=env.DB,bucket=env.BUCKET;
 if(!db||!bucket)throw Error('Daily backup requires DB and BUCKET.');
 const day=localDay(scheduledTime),folder=prefix+day+'/';
 const manifestKey=folder+'manifest.json';
 if(!await bucket.head(manifestKey)){
  const [leads,workspace]=await db.batch([
   db.prepare('SELECT * FROM leads ORDER BY id'),
   db.prepare('SELECT * FROM workspace ORDER BY id')
  ]);
  if(!leads.success||!workspace.success)throw Error('Database snapshot failed.');
  const files=[];
  for await(const listed of objects(bucket,'cycle/')){
   const file=await bucket.get(listed.key);
   if(!file||file.etag!==listed.etag)throw Error('An attachment changed during backup; no complete backup was recorded.');
   const backupKey=folder+'files/'+listed.key.slice('cycle/'.length);
   await bucket.put(backupKey,await file.arrayBuffer(),{
    customMetadata:file.customMetadata,httpMetadata:file.httpMetadata
   });
   files.push({originalKey:listed.key,backupKey,size:file.size,etag:file.etag,
    customMetadata:file.customMetadata,httpMetadata:file.httpMetadata});
  }
  const manifest={
   format:'cycle-disaster-recovery-v1',day,timeZone:zone,
   scheduledAt:new Date(scheduledTime).toISOString(),completedAt:new Date().toISOString(),
   database:{leads:leads.results,workspace:workspace.results},files
  };
  await bucket.put(manifestKey,JSON.stringify(manifest),{httpMetadata:{contentType:'application/json'}});
 }
 // Only expire recovery objects after today's complete recovery set exists.
 // Keep today and the preceding 29 local dates. Never touch live cycle/ objects.
 const cutoff=localDay(scheduledTime-29*24*60*60*1000);
 let expired:string[]=[];
 for await(const object of objects(bucket,prefix)){
  const date=object.key.slice(prefix.length,prefix.length+10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&date<cutoff){
   expired.push(object.key);
   if(expired.length===1000){await bucket.delete(expired);expired=[]}
  }
 }
 if(expired.length)await bucket.delete(expired);
 console.log(JSON.stringify({event:'cycle_daily_backup_complete',day,manifestKey}));
 return manifestKey;
}
