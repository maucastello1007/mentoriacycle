import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const run=(args)=>{const r=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,CYCLE_DIRECT_CLOUDFLARE:'1'}});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1)};
run(['scripts/bundle-legacy.mjs']);
run(['scripts/run-framework.mjs','build']);
const file='dist/server/wrangler.json';
const config=JSON.parse(readFileSync(file,'utf8'));
const deployment=JSON.parse(readFileSync('config/cloudflare-deploy.json','utf8'));
config.name=deployment.worker_name;
config.account_id=deployment.account_id;
config.d1_databases[0].database_name=deployment.database_name;
config.d1_databases[0].database_id=deployment.database_id;
config.workers_dev=false;
config.preview_urls=false;
// 03:55 UTC is 23:55 on the previous local day in Cuiabá (UTC-4).
config.triggers={...config.triggers,crons:['55 3 * * *']};
// Bindings must point to the database and bucket created in the owner's account.
// Their IDs are public configuration; credentials never belong here.
if(process.env.CYCLE_D1_DATABASE_ID)config.d1_databases[0].database_id=process.env.CYCLE_D1_DATABASE_ID;
if(process.env.CYCLE_R2_BUCKET)config.r2_buckets[0].bucket_name=process.env.CYCLE_R2_BUCKET;
else if(deployment.r2_bucket)config.r2_buckets[0].bucket_name=deployment.r2_bucket;
writeFileSync(file,JSON.stringify(config,null,2)+'\n');
console.log('Build Cloudflare preparado. Confirme as vinculações de D1 e R2 antes de publicar.');
