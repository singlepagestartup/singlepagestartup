/** Real PostgreSQL capture, rollback, membership, cascade and late-commit replay. */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("captures direct SQL and cascades atomically, and delivers both commit orders", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {getPostgresClient} from "@sps/shared-backend-database-config";
import {ConsistencyStore} from "@sps/providers-db";
import {scopeDependencyKey,consistencyContext,trackRepositoryRead} from "./libs/shared/backend/api/src/lib/repository/database/context";
import {pgTable,uuid,text} from "drizzle-orm/pg-core";
import {getDrizzle} from "@sps/shared-backend-database-config";
import {createConsistencyRuntime,consistencyAuth} from "./libs/shared/backend/api/src/lib/mutation-effects/consistency";
import {readFile,readdir} from "node:fs/promises";
const pg=getPostgresClient();const store=new ConsistencyStore();
const suffix=randomUUID().replaceAll("-","");const parent="consistency_parent_"+suffix,child="consistency_child_"+suffix;
const childResource="public."+child,parentResource="public."+parent;
const thread=randomUUID(),message=randomUUID();const key=scopeDependencyKey(childResource,"thread_id",thread);
const initial=await store.status();
try {
  await pg.unsafe('CREATE TABLE "'+parent+'"(id uuid PRIMARY KEY)');
  await pg.unsafe('CREATE TABLE "'+child+'"(id uuid PRIMARY KEY,thread_id uuid REFERENCES "'+parent+'"(id) ON DELETE CASCADE,body text)');
  await pg.unsafe('SELECT sps_consistency.install_capture($1,$2,$3::jsonb)',[parentResource,"fixture.parents",JSON.stringify({id:"id"})]);
  await pg.unsafe('SELECT sps_consistency.install_capture($1,$2,$3::jsonb)',[childResource,"fixture.messages",JSON.stringify({id:"id",threadId:"thread_id",body:"body"})]);
  const Table=pgTable(child,{id:uuid("id"),threadId:uuid("thread_id"),body:text("body")});
  const scope={dependencies:new Map(),resources:new Set(),complete:true,isCovered:()=>store.covered(childResource)};
  await consistencyContext.run(scope,()=>trackRepositoryRead(Table,getDrizzle({}),{and:[{column:"threadId",method:"eq",value:thread}]}));
  assert.equal(scope.dependencies.get(key),"0");
  const ref=await store.register({auth:consistencyAuth(""),identity:"empty thread",dependencies:Object.fromEntries(scope.dependencies)});
  const same=await store.register({auth:consistencyAuth(""),identity:"empty thread",dependencies:Object.fromEntries([...scope.dependencies].reverse())});
  assert.equal(same.ref,ref.ref,"unchanged concurrent reads reuse a private capability");
  const renewed=await store.renew([ref.ref],consistencyAuth(""));assert(renewed.renewedRefs.includes(ref.ref));
  await pg.unsafe('INSERT INTO "'+parent+'"(id) VALUES($1)',[thread]);
  await pg.unsafe('INSERT INTO "'+child+'"(id,thread_id,body) VALUES($1,$2,$3)',[message,thread,"initial"]);
  assert.deepEqual(await store.changed([ref.ref],consistencyAuth("")),[ref.ref]);
  const runtimeA=createConsistencyRuntime({store,verifyAuthorization:async()=>{}}),runtimeB=createConsistencyRuntime({store,verifyAuthorization:async()=>{}});
  const framesA=[],framesB=[];
  const socketA={send:message=>framesA.push(JSON.parse(message)),close:()=>{}},socketB={send:message=>framesB.push(JSON.parse(message)),close:()=>{}};
  const fresh=await store.register({auth:consistencyAuth(""),identity:"two sessions",dependencies:await store.versions([...scope.dependencies.keys()])});
  const subscription=JSON.stringify({type:"subscribe",refs:[fresh.ref],cursor:"0",epoch:initial.epoch});
  await runtimeA.receive(socketA,subscription);await runtimeB.receive(socketB,subscription);
  await pg.unsafe('UPDATE "'+child+'" SET body=$1 WHERE id=$2',["two sessions",message]);
  for(let attempt=0;attempt<80;attempt++){await runtimeA.tick();await runtimeB.tick();if(framesA.some(frame=>frame.refs?.includes(fresh.ref))&&framesB.some(frame=>frame.refs?.includes(fresh.ref)))break;await new Promise(resolve=>setTimeout(resolve,100));}
  assert(framesA.some(frame=>frame.refs?.includes(fresh.ref)));assert(framesB.some(frame=>frame.refs?.includes(fresh.ref)));
  // A reconnect with an old GET baseline must reconcile even after cursor advancement.
  const reconnected=[];await runtimeA.receive({send:message=>reconnected.push(JSON.parse(message)),close:()=>{}},JSON.stringify({type:"subscribe",refs:[fresh.ref],cursor:(await store.status()).cursor,epoch:initial.epoch}));
  assert(reconnected.some(frame=>frame.type==="resync"&&frame.refs.includes(fresh.ref)));
  assert.deepEqual(await store.changed([fresh.ref],"different subject"),[fresh.ref]);
  await pg.unsafe('DELETE FROM sps_consistency.query WHERE ref=$1',[fresh.ref]);
  const before=(await store.versions([key]))[key];
  await assert.rejects(pg.begin(async tx=>{await tx.unsafe('UPDATE "'+child+'" SET body=$1 WHERE id=$2',["rollback",message]);throw new Error("rollback");}));
  assert.equal((await store.versions([key]))[key],before);
  let release;const gate=new Promise(done=>release=done);let started;const ready=new Promise(done=>started=done);
  const lateId=randomUUID();let earlyId=randomUUID();
  while(createHash("sha256").update(earlyId).digest()[0]%16===createHash("sha256").update(lateId).digest()[0]%16)earlyId=randomUUID();
  const late=pg.begin(async tx=>{await tx.unsafe('INSERT INTO "'+child+'"(id,thread_id,body) VALUES($1,$2,$3)',[lateId,thread,"late"]);started();await gate;});
  await ready;
  // A different scope/shard must be able to commit while T1 is open.
  const earlyThread=randomUUID();await pg.unsafe('INSERT INTO "'+parent+'"(id) VALUES($1)',[earlyThread]);
  await pg.unsafe('INSERT INTO "'+child+'"(id,thread_id,body) VALUES($1,$2,$3)',[earlyId,earlyThread,"early"]);
  await store.dispatch();release();await late;await store.dispatch();
  const otherKey=scopeDependencyKey(childResource,"thread_id",earlyThread);
  let events=[];
  for(let attempt=0;attempt<80;attempt++){await store.dispatch();events=await store.events(initial.cursor);if(events.some(event=>event.keys.includes(key))&&events.some(event=>event.keys.includes(otherKey)))break;await new Promise(resolve=>setTimeout(resolve,100));}
  assert(events.some(event=>event.keys.includes(key)));assert(events.some(event=>event.keys.includes(otherKey)));
  const previous=(await store.versions([key]))[key];
  await pg.unsafe('DELETE FROM "'+parent+'" WHERE id=$1',[thread]);
  assert(BigInt((await store.versions([key]))[key])>BigInt(previous));
  await store.dispatch();
  // Exercise maintenance on isolated copies of the generated infrastructure.
  // The live application's epoch and registry are never reset by this test.
  const namespace="consistency_reset_"+suffix;
  try {
    const folder="libs/providers/db/src/lib/drizzle/migrations";
    for(const migration of (await readdir(folder)).filter(name=>name.endsWith('.sql')&&!name.includes('consistency-capture')).sort()) {
      const migrationSql=(await readFile(folder+'/'+migration,'utf8')).replaceAll('"sps_consistency"','"'+namespace+'"').replaceAll('sps_consistency.',namespace+'.');
      for(const statement of migrationSql.split('--> statement-breakpoint'))if(statement.trim())await pg.unsafe(statement);
    }
    const isolated=new ConsistencyStore();
    const wrap=connection=>{
      const tagged=(strings,...values)=>{const translated=strings.map(value=>value.replaceAll('sps_consistency.',namespace+'.'));translated.raw=translated;return connection(translated,...values);};
      tagged.array=connection.array.bind(connection);tagged.begin=callback=>connection.begin(tx=>callback(wrap(tx)));return tagged;
    };
    Object.defineProperty(isolated,'sql',{value:wrap(pg)});
    await pg.unsafe('INSERT INTO "'+namespace+'".state(id,value) VALUES($1,$2)',['epoch','before']);
    await pg.unsafe('INSERT INTO "'+namespace+'".resource(resource,topic,columns) VALUES($1,$2,$3::jsonb)',[childResource,'fixture.messages','{}']);
    await isolated.register({auth:'actor',identity:'maintenance',dependencies:{[childResource+'|reset']:'0'},tags:['fixture-tag']});
    await assert.rejects(isolated.reset(async()=>{throw new Error('Next unavailable');}));
    assert.equal((await isolated.status()).epoch,'before');
    const epoch=await isolated.reset(async tags=>assert(tags.includes('fixture-tag')));
    assert.equal((await isolated.status()).epoch,epoch);
    assert.equal((await isolated.versions([childResource+'|reset']))[childResource+'|reset'],'1');
    assert.equal((await isolated.diagnostics()).pending,1);
    assert.equal((await isolated.diagnostics()).retained_refs,0);
  }finally{await pg.unsafe('DROP SCHEMA IF EXISTS "'+namespace+'" CASCADE');}
  console.log(JSON.stringify({captured:true,rollback:true,emptyMembership:true,cascade:true,lateCommit:true}));
} finally {
  await pg.unsafe('DROP TABLE IF EXISTS "'+child+'"');await pg.unsafe('DROP TABLE IF EXISTS "'+parent+'"');
  await pg.unsafe('DELETE FROM sps_consistency.query WHERE identity=$1',["empty thread"]);
  await pg.unsafe('DELETE FROM sps_consistency.resource WHERE resource=$1 OR resource=$2',[parentResource,childResource]);
  await pg.end();
}
`;
  const result = spawnSync(
    "bun",
    [
      "--tsconfig-override",
      "tsconfig.base.json",
      "--env-file=apps/api/.env",
      "--eval",
      script,
    ],
    {
      cwd: resolve(__dirname, "../../../.."),
      encoding: "utf8",
      timeout: 30000,
    },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  expect(result.stdout).toContain('"lateCommit":true');
}, 40000);
