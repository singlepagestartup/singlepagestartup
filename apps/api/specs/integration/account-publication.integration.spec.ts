/**
 * Effective owner Services/Repositories and Hono controllers against local
 * PostgreSQL/Redis. Fixtures commit so concurrent calls use independent real
 * transactions. Finally removes only IDs created by this process, including
 * failed-transaction IDs, and compares existing rows. No app.ts jobs/providers.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("persists one owned author/article atomically and guards raw Profiles before enabled caches", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {getTableName,sql} from "drizzle-orm";
import {Hono} from "hono";
import {sign,verify} from "hono/jwt";
import {getPostgresClient} from "@sps/shared-backend-database-config";
import {CRUDService,ExceptionFilter,ParseQueryMiddleware,createConsistencyRuntime} from "@sps/shared-backend-api";
import {consistencyContext,resourceIdentity} from "./libs/shared/backend/api/src/lib/repository/database/context";
import {Middleware as HTTPCache} from "./libs/middlewares/src/lib/http-cache";
import {Middleware as IsAuthorized} from "./libs/middlewares/src/lib/is-authorized";
import {controllerGuardedRoutes} from "./libs/middlewares/src/lib/is-authorized/routes";
import {RawSocialProfileRead,rawSocialProfileReadRoutes} from "@sps/rbac/models/subject/backend/app/middlewares";
import {Provider as KVProvider} from "@sps/providers-kv";
import {DATABASE_OPTIONS,KV_HOST,RBAC_JWT_SECRET,RBAC_SECRET_KEY,API_SERVICE_URL} from "@sps/shared-utils";

assert(["localhost","127.0.0.1","::1"].includes(String(DATABASE_OPTIONS.host)),"Local PostgreSQL fixtures required");
assert(["localhost","127.0.0.1","::1"].includes(KV_HOST),"Local Redis required");
assert(RBAC_JWT_SECRET&&RBAC_SECRET_KEY,"Isolated fixture credentials required");
const token=randomUUID(),prefix="issue376-account-"+token,namespace="sps:issue376:account:"+token+":";
const hostname="http://account-"+token+".test";
const pg=getPostgresClient(),redis=new KVProvider({type:"redis"}),rawRedis=redis.client.client;
const nativeFetch=globalThis.fetch,nativeCreate=CRUDService.prototype.create;
const kvGet=KVProvider.prototype.get,kvSet=KVProvider.prototype.set,kvIncr=KVProvider.prototype.incr;
let cacheGets=0,cacheSets=0,currentApp;
const created=[],baseline=new Map();
KVProvider.prototype.get=function(props){cacheGets++;return kvGet.call(this,{...props,prefix:namespace+props.prefix});};
KVProvider.prototype.set=async function(props){const result=await kvSet.call(this,{...props,prefix:namespace+props.prefix});cacheSets++;return result;};
KVProvider.prototype.incr=function(props){return kvIncr.call(this,{...props,prefix:namespace+props.prefix});};
// SDK loopback is still exercised through its real request/response transport,
// but resolves to this isolated Hono assembly, never the running API process.
globalThis.fetch=async(input,init)=>{
 const request=new Request(input,init),url=new URL(request.url);
 assert.equal(url.origin,new URL(API_SERVICE_URL).origin,"External transport is forbidden in this fixture");
 assert(currentApp,"Fixture Hono transport is not ready");
 return currentApp.request(new Request(hostname+url.pathname+url.search,request));
};
const deadline=async(promise,label)=>{let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+" timed out")),10000);})]);}finally{clearTimeout(timer);}};
if(rawRedis.status!=="ready")await deadline(new Promise((done,reject)=>{rawRedis.once("ready",done);rawRedis.once("error",reject);}),"Redis readiness");
assert.equal(await rawRedis.ping(),"PONG");
const modules={
 rbac:(await import("@sps/rbac/backend/app/api")).app,
 social:(await import("@sps/social/backend/app/api")).app,
 blog:(await import("@sps/blog/backend/app/api")).app,
 ecommerce:(await import("@sps/ecommerce/backend/app/api")).app,
 "file-storage":(await import("@sps/file-storage/backend/app/api")).app,
};
const services={};for(const [name,app] of Object.entries(modules))for(const entry of app.apps.apps)services[name+entry.route]=entry.app.controller.service;
const service=resource=>{assert(services[resource],"Missing effective Service "+resource);return services[resource];};
const create=(resource,data)=>service(resource).create({data});
const find=(resource,column,value)=>service(resource).find({params:{filters:{and:[{column,method:"eq",value}]}}});
const subjectService=service("rbac/subjects"),profileService=service("social/profiles");
const digest=rows=>createHash("sha256").update(JSON.stringify(rows.slice().sort((a,b)=>a.id.localeCompare(b.id)))).digest("hex");
const snapshots=["rbac/subjects","rbac/identities","rbac/subjects-to-identities","rbac/roles","rbac/permissions","rbac/subjects-to-roles","rbac/roles-to-permissions","rbac/subjects-to-social-module-profiles","rbac/subjects-to-blog-module-articles","social/profiles","social/profiles-to-blog-module-articles","blog/articles","blog/categories-to-articles"];
for(const resource of snapshots)baseline.set(resource,digest(await service(resource).find({params:{limit:100000}})));
// Only observe successful real inserts; no repository/transaction is replaced.
CRUDService.prototype.create=async function(props){const row=await nativeCreate.call(this,props);if(row?.id)created.push({table:getTableName(this.repository.Table),id:row.id});return row;};
let completed=false;
try{
 const registered=async name=>{
  const subject=await create("rbac/subjects",{slug:prefix+"-"+name,variant:"default"});
  const identity=await create("rbac/identities",{provider:"email",account:prefix+"-"+name+"@example.test"});
  await create("rbac/subjects-to-identities",{subjectId:subject.id,identityId:identity.id});return subject;
 };
 const a=await registered("a"),b=await registered("b"),admin=await registered("admin");
 const guest=await create("rbac/subjects",{slug:prefix+"-guest",variant:"default"});
 const agent=await create("rbac/subjects",{slug:prefix+"-agent",variant:"agent"});
 const agentIdentity=await create("rbac/identities",{provider:"email",account:prefix+"-agent@example.test"});
 await create("rbac/subjects-to-identities",{subjectId:agent.id,identityId:agentIdentity.id});
 const tokens={};for(const [key,subject] of Object.entries({a,b,admin,guest,agent}))tokens[key]=await sign({subject:{id:subject.id},exp:Math.floor(Date.now()/1000)+3600},RBAC_JWT_SECRET);
 const ensured=await Promise.all([subjectService.socialModuleProfileOwnershipEnsure({subjectId:a.id}),subjectService.socialModuleProfileOwnershipEnsure({subjectId:a.id})]);
 assert.equal(ensured[0].profile.id,ensured[1].profile.id,"Independent concurrent transactions must reuse one personal Profile");
 const personal=ensured[0].profile;
 assert.equal((await find("rbac/subjects-to-social-module-profiles","subjectId",a.id)).filter(row=>row.variant==="default").length,1);
 assert.equal((await subjectService.socialModuleProfileOwnershipEnsure({subjectId:a.id})).profile.id,personal.id);
 // Existing Telegram handles/IDs must be reused through their ownership link.
 const telegram=await create("social/profiles",{slug:prefix+"-telegram",variant:"telegram",title:{en:"Telegram fixture"}});
 await create("rbac/subjects-to-social-module-profiles",{subjectId:b.id,socialModuleProfileId:telegram.id});
 assert.equal((await subjectService.socialModuleProfileOwnershipEnsure({subjectId:b.id})).profile.id,telegram.id);
 assert.equal((await profileService.findById({id:telegram.id})).slug,telegram.slug);
 const c=await registered("profile-rollback"),ownProfile=subjectService.socialModule.profile,originalProfileCreate=ownProfile.create;
 ownProfile.create=async function(props){await originalProfileCreate.call(this,props);await this.repository.db.execute(sql.raw("SELECT 1 / 0"));throw Error("SQL failure must abort this real Profile transaction");};
 try{await assert.rejects(()=>subjectService.socialModuleProfileOwnershipEnsure({subjectId:c.id}));}finally{ownProfile.create=originalProfileCreate;}
 assert.equal((await find("social/profiles","slug","subject-"+c.id)).length,0);
 assert.equal((await find("rbac/subjects-to-social-module-profiles","subjectId",c.id)).length,0);
 const cPersonal=(await subjectService.socialModuleProfileOwnershipEnsure({subjectId:c.id})).profile;
 tokens.c=await sign({subject:{id:c.id},exp:Math.floor(Date.now()/1000)+3600},RBAC_JWT_SECRET);
 const category=await create("blog/categories",{slug:prefix+"-category",title:{en:"Frontend"}});
 const rich=text=>JSON.stringify({type:"doc",content:[{type:"paragraph",content:[{type:"text",text}]}]});
 const input=requestId=>({requestId,title:{en:"An actual transaction"},subtitle:{en:rich("One author, one article")},description:{en:JSON.stringify({type:"doc",content:[{type:"paragraph",content:[{type:"text",text:"Owned publication"}]},{type:"codeBlock",attrs:{language:"typescript"},content:[{type:"text",text:"const owner = currentSubject.id;"}]}]})},categoryId:category.id});
 const apps=[];
 for(const mode of ["legacy","consistency"]){
  const app=new Hono(),exception=new ExceptionFilter();app.onError(exception.catch.bind(exception));
  const runtime=createConsistencyRuntime({verifyAuthorization:async value=>{if(value)await verify(value.replace(/^Bearer\s+/i,""),RBAC_JWT_SECRET,"HS256");}});
  app.use(runtime.middleware());
  // Deliberately broad public read policy models stale roleless permissions;
  // actual controller ownership and raw-Profile guard must still reject access.
  app.use(new IsAuthorized({allowedRoutes:[...controllerGuardedRoutes,{regexPath:/^\/api\/social\/profiles(?:\/.*)?$/,methods:["GET","HEAD"]},{regexPath:/^\/api\/rbac\/subjects\/[^/]+\/social-module\/.*$/,methods:["GET"]},{regexPath:/^\/api\/account-cache-control$/,methods:["GET"]}]}).init());
  app.use(new ParseQueryMiddleware().init());
  app.use(new RawSocialProfileRead(()=>subjectService).init());
  if(mode==="legacy")app.use(new HTTPCache({excludedRoutes:rawSocialProfileReadRoutes}).init());
  else app.use(runtime.cache({excludedRoutes:[...rawSocialProfileReadRoutes,...controllerGuardedRoutes]}));
  let calls=0;app.get("/api/account-cache-control",async c=>{calls++;const key=resourceIdentity(profileService.repository.Table)+"|reset",version=(await runtime.store.versions([key]))[key],context=consistencyContext.getStore();context.complete=true;context.dependencies.set(key,version);return c.json({data:{calls}});});
  const readExecutions=new Map();
  app.use(async(context,next)=>{if(context.req.method==="GET"&&context.req.path.startsWith("/api/social/profiles/authors"))readExecutions.set(context.req.url,(readExecutions.get(context.req.url)||0)+1);await next();});
  for(const [name,owner] of Object.entries(modules))app.route("/api/"+name,owner.hono);
  const request=async(path,who="anonymous",options={})=>{currentApp=app;return app.request("http://account-"+token+"-"+mode+".test"+path,{...options,headers:{...(tokens[who]?{Authorization:"Bearer "+tokens[who]}:{}),...(who==="operator"?{"X-RBAC-SECRET-KEY":RBAC_SECRET_KEY}:{}),...(options.headers||{})}});};
  const publish=(data,who="a",subject=a.id)=>request("/api/rbac/subjects/"+subject+"/blog-module/articles",who,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({data})});
  const beforeSets=cacheSets;
  assert.equal((await(await request("/api/account-cache-control")).json()).data.calls,1);
  for(let attempt=0;cacheSets===beforeSets&&attempt<100;attempt++)await new Promise(done=>setTimeout(done,10));
  assert(cacheSets>beforeSets,"Enabled "+mode+" cache must persist a control");
  const control=await request("/api/account-cache-control");assert.equal((await control.json()).data.calls,1);assert.equal(calls,1);if(mode==="consistency")assert.equal(control.headers.get("X-SPS-Cache"),"hit");
  apps.push({mode,request,publish,runtime,readExecutions});
 }
 const {publish,request}=apps[1];
 const authorPaths=["/api/social/profiles/authors?profileId="+cPersonal.id,"/api/social/profiles/authors/count?profileId="+cPersonal.id,"/api/social/profiles/authors/"+cPersonal.id];
 const capturedAuthorRelation=resourceIdentity(service("social/profiles-to-blog-module-articles").repository.Table),warmDependencies=[],freshnessFailures=[];
 const expectFresh=(label,check)=>{try{check();}catch(error){freshnessFailures.push(label+": "+error.message);}};
 for(const fixture of apps)for(let index=0;index<authorPaths.length;index++){
  const path=authorPaths[index],beforeSets=cacheSets,response=await fixture.request(path),data=(await response.clone().json()).data;
  assert.deepEqual(data,index===0?[]:index===1?0:null);
  const encoded=response.headers.get("x-sps-consistency");assert(encoded,"Author read must provide real captured dependency metadata");
  const metadata=JSON.parse(Buffer.from(encoded,"base64url").toString()),tracked=await fixture.runtime.store.readDependencies(metadata.ref);
  assert(tracked&&Object.keys(tracked.dependencies).some(key=>key.startsWith(capturedAuthorRelation+"|")),"Empty Author query must track its candidate association before SQL");
  warmDependencies.push({fixture,dependencies:tracked.dependencies});
  assert(await fixture.runtime.store.covered(capturedAuthorRelation),"Author association must have its deployed database row trigger");
  if(fixture.mode==="consistency"){
   for(let attempt=0;cacheSets===beforeSets&&attempt<100;attempt++)await new Promise(done=>setTimeout(done,10));
   assert(cacheSets>beforeSets,"Consistency Author response must actually be stored");
  }else assert.equal(cacheSets,beforeSets,"Legacy author aggregate must bypass response storage");
  const executions=()=>[...fixture.readExecutions.values()].reduce((sum,value)=>sum+value,0),beforeExecutions=executions();
  const cached=await fixture.request(path);assert.deepEqual((await cached.json()).data,data);
  if(fixture.mode==="consistency"){assert.equal(executions(),beforeExecutions,"Consistency Author warm read must actually hit cache");assert.equal(cached.headers.get("X-SPS-Cache"),"hit");}
  else{assert.equal(executions(),beforeExecutions+1,"Legacy Author read must execute its fresh captured reader");assert.equal(cacheSets,beforeSets,"Legacy author aggregate must not populate the response cache");}
 }
 const cacheRequest=input(randomUUID()),cacheCreated=await publish(cacheRequest,"c",c.id);assert.equal(cacheCreated.status,201,await cacheCreated.clone().text());
 const cacheArticle=(await cacheCreated.json()).data.article;
 for(const {fixture,dependencies} of warmDependencies){const current=await fixture.runtime.store.versions(Object.keys(dependencies));assert(Object.entries(dependencies).some(([key,version])=>current[key]!==version),"Actual committed publication must advance the captured empty-query generation");}
 for(const fixture of apps.slice().reverse())for(let index=0;index<authorPaths.length;index++){
  const response=await fixture.request(authorPaths[index]),data=(await response.json()).data;
  expectFresh(fixture.mode+" publication "+index,()=>{
   if(index===0){assert.equal(data.length,1,"Cached empty author list must reflect committed publication");assert.equal(data[0].id,cPersonal.id);}
   else if(index===1)assert.equal(data,1,"Cached zero author count must reflect committed publication");
   else assert.equal(data?.id,cPersonal.id,"Cached absent author detail must reflect committed publication");
  });
 }
 const cacheLink=(await find("social/profiles-to-blog-module-articles","blogModuleArticleId",cacheArticle.id))[0];
 await service("social/profiles-to-blog-module-articles").delete({id:cacheLink.id});
 for(const fixture of apps.slice().reverse())for(let index=0;index<authorPaths.length;index++){
  const data=(await(await fixture.request(authorPaths[index])).json()).data;
  expectFresh(fixture.mode+" association removal "+index,()=>assert.deepEqual(data,index===0?[]:index===1?0:null,"Author response must reflect removal of its last public association"));
 }
 const initial=input(randomUUID());
 const published=await Promise.all([publish(initial),publish(initial)]);
 for(const response of published)assert.equal(response.status,201,await response.clone().text());
 const first=(await published[0].json()).data,second=(await published[1].json()).data;
 assert.equal(first.article.id,second.article.id);
 assert.equal(first.author.id,personal.id);
 for(const [resource,column,ownerColumn,ownerId] of [["rbac/subjects-to-blog-module-articles","blogModuleArticleId","subjectId",a.id],["social/profiles-to-blog-module-articles","blogModuleArticleId","profileId",personal.id],["blog/categories-to-articles","articleId","categoryId",category.id]]){const rows=await find(resource,column,first.article.id);assert.equal(rows.length,1);assert.equal(rows[0][ownerColumn],ownerId);}
 assert.equal((await find("blog/articles","slug","article-"+initial.requestId)).length,1);
 assert.equal((await publish({...initial,title:{en:"Changed retry"}})).status,409);
 assert.equal((await publish(initial,"b",b.id)).status,409);
 const collision=input(randomUUID()),collided=await Promise.all([publish(collision),publish(collision,"b",b.id)]);
 assert.deepEqual(collided.map(response=>response.status).sort(),[201,409],"Foreign Subjects racing one global request UUID must create one Article");
 assert.equal((await find("blog/articles","slug","article-"+collision.requestId)).length,1);
 assert.equal((await publish(input(randomUUID()),"b",a.id)).status,401);
 for(const who of ["guest","agent"]){const subject=who==="guest"?guest:agent;assert.equal((await publish(input(randomUUID()),who,subject.id)).status,403);}
 assert((await publish(input(randomUUID()),"anonymous")).status>=400);
 assert((await publish({...input(randomUUID()),profileId:telegram.id})).status>=400,"Forged author must fail strict input validation");
 assert((await publish({...input(randomUUID()),categoryId:randomUUID()})).status>=400);
 // Fail each real insert only after it succeeds; the owning ambient transaction
 // must roll back Article, author, owner and category rows together.
 for(const target of [subjectService.blogModule.article,subjectService.subjectsToBlogModuleArticles,subjectService.socialModule.profilesToBlogModuleArticles,subjectService.blogModule.categoriesToArticles]){
  const original=target.create,attempt=input(randomUUID());
  target.create=async function(props){const row=await original.call(this,props);throw Error("Injected failure after actual SQL insert "+row.id);};
  try{assert((await publish(attempt)).status>=400);}finally{target.create=original;}
  assert.equal((await find("blog/articles","slug","article-"+attempt.requestId)).length,0,"Failed owner transaction must leave no Article");
  const retried=await publish(attempt);assert.equal(retried.status,201,await retried.clone().text());
  const id=(await retried.json()).data.article.id;
  assert.equal((await find("rbac/subjects-to-blog-module-articles","blogModuleArticleId",id)).length,1);
  assert.equal((await find("social/profiles-to-blog-module-articles","blogModuleArticleId",id)).length,1);
  assert.equal((await find("blog/categories-to-articles","articleId",id)).length,1);
 }
 const editorial=await create("social/profiles",{slug:prefix+"-editorial",title:{en:"Editorial"},adminTitle:"NEVER-PUBLIC-ADMIN",allowedMcpTools:["NEVER-PUBLIC-TOOL"]});
 const privateProfile=await create("social/profiles",{slug:"subject-"+guest.id,title:{en:"Unpublished"},adminTitle:"NEVER-PUBLIC-PRIVATE"});
 const ai=await create("social/profiles",{slug:prefix+"-ai",variant:"artificial-intelligence",title:{en:"Private assistant"},adminTitle:"NEVER-PUBLIC-AI"});
 await create("social/profiles-to-blog-module-articles",{profileId:editorial.id,blogModuleArticleId:first.article.id});
 await create("social/profiles-to-blog-module-articles",{profileId:ai.id,blogModuleArticleId:first.article.id});
 const checkProjection=value=>{const serialized=JSON.stringify(value);for(const forbidden of [a.id,b.id,guest.id,"subject-", "NEVER-PUBLIC", "allowedMcpTools", "adminTitle", "identityId", "subjectId"])assert(!serialized.includes(forbidden),"Public DTO contains "+forbidden);};
 for(const fixture of apps){
  for(const id of [personal.id,editorial.id]){
   const response=await fixture.request("/api/social/profiles/authors/"+id);assert.equal(response.status,200);const data=(await response.json()).data;assert.equal(data.id,id);checkProjection(data);
   assert.equal((await(await fixture.request("/api/social/profiles/authors/count?profileId="+id)).json()).data,1);
  }
  for(const id of [privateProfile.id,ai.id]){assert.equal((await(await fixture.request("/api/social/profiles/authors?profileId="+id)).json()).data.length,0);assert.equal((await(await fixture.request("/api/social/profiles/authors/count?profileId="+id)).json()).data,0);}
 }
 // A former participant can have no public author publication or current Chat
 // membership. Existing Message/Action relations still carry its safe badge.
 const avatar=await create("file-storage/files",{slug:prefix+"-avatar",file:"/"+prefix+".png",mimeType:"image/png",extension:"png",width:32,height:32,adminTitle:"NEVER-PUBLIC-FILE"});
 await create("social/profiles-to-file-storage-module-files",{profileId:privateProfile.id,fileStorageModuleFileId:avatar.id});
 const chat=await create("social/chats",{slug:prefix+"-chat"});
 await create("social/profiles-to-chats",{profileId:personal.id,chatId:chat.id});
 const message=await create("social/messages",{description:"Historical fixture message"});
 await create("social/chats-to-messages",{chatId:chat.id,messageId:message.id});
 await create("social/profiles-to-messages",{profileId:privateProfile.id,messageId:message.id});
 const action=await create("social/actions",{payload:{kind:"fixture"}});
 await create("social/chats-to-actions",{chatId:chat.id,actionId:action.id});
 await create("social/profiles-to-actions",{profileId:privateProfile.id,actionId:action.id});
 for(const fixture of apps)for(const [collection,field,item] of [["messages","authorProfiles",message],["actions","actorProfiles",action]]){
  const path=(subject,profile)=>"/api/rbac/subjects/"+subject+"/social-module/profiles/"+profile+"/chats/"+chat.id+"/"+collection;
  const response=await fixture.request(path(a.id,personal.id),"a");assert.equal(response.status,200,await response.clone().text());
  const data=(await response.json()).data.find(row=>row.id===item.id);assert(data);assert.equal(data[field][0].id,privateProfile.id);assert.equal(data[field][0].avatar.id,avatar.id);
  assert.deepEqual(Object.keys(data[field][0]).sort(),["avatar","id","subtitle","title"]);assert(!JSON.stringify(data[field]).includes("subject-"));assert(!JSON.stringify(data[field]).includes("NEVER-PUBLIC"));
  const denied=await fixture.request(path(b.id,telegram.id),"b");assert.equal(denied.status,401,await denied.clone().text());assert(!(await denied.text()).includes(privateProfile.id));
 }
 const role=await create("rbac/roles",{slug:prefix+"-raw-admin",title:"Fixture raw Profile administrator"});
 const adminGrant=await create("rbac/subjects-to-roles",{subjectId:admin.id,roleId:role.id});
 for(const path of ["/api/social/profiles","/api/social/profiles/count","/api/social/profiles/[social.profiles.id]"]){
  const matches=await service("rbac/permissions").find({params:{filters:{and:[{column:"path",method:"eq",value:path},{column:"method",method:"eq",value:"GET"},{column:"type",method:"eq",value:"HTTP"}]}}});
  const permission=matches[0]||await create("rbac/permissions",{path,method:"GET",type:"HTTP"});
  await create("rbac/roles-to-permissions",{roleId:role.id,permissionId:permission.id});
 }
 const rawShapes=["/api/social/profiles?filters[and]="+encodeURIComponent(JSON.stringify([{column:"id",method:"eq",value:personal.id}])),"/api/social/profiles/count","/api/social/profiles/"+personal.id,"/api/social/profiles/"+personal.id.toUpperCase(),"/api/social/profiles/%7B"+personal.id+"%7D","/api/social/profiles/"+personal.id.replaceAll("-","")];
 for(const fixture of apps){
  const beforeGets=cacheGets,beforeSets=cacheSets;
  for(const path of rawShapes)for(const method of ["GET","HEAD"]){
   for(const who of ["admin","operator"]){const response=await fixture.request(path,who,{method});assert.equal(response.status,200,fixture.mode+" "+who+" "+method+" "+path+" "+await response.text());assert.equal(response.headers.get("Cache-Control"),"private, no-store");}
   for(const who of ["anonymous","guest","a","b"]){const response=await fixture.request(path,who,{method});assert.equal(response.status,403,fixture.mode+" "+who+" "+method+" "+path);assert(!(await response.text()).includes(personal.slug));}
  }
  assert.equal(cacheGets,beforeGets,fixture.mode+" guarded raw Profile reads must bypass cache lookup");assert.equal(cacheSets,beforeSets,fixture.mode+" raw Profile reads must not be stored");
 }
 // Revoke this fixture's non-commerce administrative binding through its owner
 // repository. This proves fresh authorization after a persisted deletion;
 // app.ts payment/entitlement revocation side effects are outside this suite.
 await subjectService.subjectsToRoles.repository.deleteFirstByField("id",adminGrant.id);
 for(const fixture of apps)for(const path of rawShapes)for(const method of ["GET","HEAD"])assert.equal((await fixture.request(path,"admin",{method})).status,403);
 assert.equal(freshnessFailures.length,0,JSON.stringify(freshnessFailures));
 completed=true;
}finally{
 CRUDService.prototype.create=nativeCreate;
 globalThis.fetch=nativeFetch;
 const cleanupErrors=[];
 try{
  for(const row of created.slice().reverse())try{assert(/^[a-zA-Z0-9_]+$/.test(row.table));await pg.unsafe('DELETE FROM "'+row.table+'" WHERE id = $1',[row.id]);}catch(error){cleanupErrors.push(error);}
  for(const row of created)assert.equal((await pg.unsafe('SELECT id FROM "'+row.table+'" WHERE id = $1',[row.id])).length,0,"Fixture ID survived cleanup: "+row.table);
  for(const resource of snapshots)assert.equal(digest(await service(resource).find({params:{limit:100000}})),baseline.get(resource),"Existing records changed: "+resource);
 }finally{
  await redis.delByPrefix({prefix:namespace});
  await pg.unsafe("DELETE FROM sps_consistency.query WHERE identity LIKE $1",["http://account-"+token+"%"]);
  await pg.end();await rawRedis.quit();
  KVProvider.prototype.get=kvGet;KVProvider.prototype.set=kvSet;KVProvider.prototype.incr=kvIncr;
 }
 if(cleanupErrors.length)throw new AggregateError(cleanupErrors,"Fixture cleanup failed");
}
assert(completed);
console.log(JSON.stringify({realPostgreSQL:true,independentConcurrentTransactions:true,profileEnsureReused:true,telegramProfilePreserved:true,atomicArticleRetry:true,rollbackAfterEachInsert:true,publicAuthorAllowlist:true,publicAuthorCapturedGeneration:true,consistencyAuthorCacheFresh:true,legacyAuthorReadThrough:true,scopedHistoricalChatPresentations:true,actualRedisCaches:["legacy","consistency"],rawProfileGetHeadAliases:true,adminRevocation:true,fixturesRemoved:true,existingRecordsUnchanged:true}));
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
      timeout: 150000,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        RBAC_JWT_SECRET: "issue376-isolated-account-jwt",
        RBAC_SECRET_KEY: "issue376-isolated-account-operator",
        KV_PROVIDER: "redis",
        BUG_SERVICE_TELEGRAM_BOT_TOKEN: "",
        BUG_SERVICE_TELEGRAM_CHAT_ID: "",
        BUG_SERVICE_PROJECT: "",
      },
    },
  );
  if (result.status !== 0)
    throw new Error(
      (result.stderr || result.stdout || String(result.error)).slice(-12000),
    );
  expect(result.stdout).toContain('"fixturesRemoved":true');
  expect(result.stdout).toContain('"existingRecordsUnchanged":true');
}, 160000);
