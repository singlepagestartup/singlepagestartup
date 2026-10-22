/**
 * Real PostgreSQL repositories, effective controllers and Redis response caches.
 * Fixtures live in an ambient transaction which is always rolled back. Stored
 * bytes use FileStorage.importPath/local storage and are removed in finally.
 * This composes production middleware/controllers without starting app.ts jobs.
 * It proves resource guards and cache/byte isolation, not payment acceptance.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("isolates real private graph and bytes before both enabled response caches", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdtemp,writeFile,unlink,rm,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,normalize} from "node:path";
import {Hono} from "hono";
import {sign,verify} from "hono/jwt";
import {getDrizzle,getPostgresClient} from "@sps/shared-backend-database-config";
import {ExceptionFilter,ParseQueryMiddleware,createConsistencyRuntime,withConsistencyDatabase} from "@sps/shared-backend-api";
import {consistencyContext,resourceIdentity} from "./libs/shared/backend/api/src/lib/repository/database/context";
import {Middleware as HTTPCache} from "./libs/middlewares/src/lib/http-cache";
import {Provider as KVProvider} from "@sps/providers-kv";
import {DATABASE_OPTIONS,KV_HOST,FILE_STORAGE_PROVIDER,FILE_STORAGE_FOLDER,RBAC_JWT_SECRET} from "@sps/shared-utils";
import {internationalization} from "@sps/shared-configuration";
import {ProtectedBlogContent,protectedContentRoutes} from "@sps/rbac/models/subject/backend/app/middlewares";
import {Service as Graph} from "./libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph";
import {Middleware as IsAuthorized} from "./libs/middlewares/src/lib/is-authorized";
import {controllerGuardedRoutes} from "./libs/middlewares/src/lib/is-authorized/routes";

assert(["localhost","127.0.0.1","::1"].includes(String(DATABASE_OPTIONS.host)),"Local disposable-fixture PostgreSQL required");
assert(["localhost","127.0.0.1","::1"].includes(KV_HOST),"Local Redis required");
assert.equal(FILE_STORAGE_PROVIDER,"local","This fixture never writes remote storage");
assert(RBAC_JWT_SECRET,"Fixture JWT secret required");
const token=randomUUID(),namespace="sps:issue376:private-integration:"+token+":";
const hostname="http://private-content-"+token+".test";
const marker="SPS-PRIVATE-INTEGRATION-"+token;
const bytes=Buffer.from(marker+"\nPrivate managed binary fixture.\n");
const originalDate=globalThis.Date;
let clock=originalDate.now();
const files=[];
const persisted={};
const directory=await mkdtemp(join(tmpdir(),"sps-private-integration-"));
const redis=new KVProvider({type:"redis"});
const rawRedis=redis.client.client;
const get=KVProvider.prototype.get,set=KVProvider.prototype.set,incr=KVProvider.prototype.incr;
let cacheGets=0,cacheSets=0;
KVProvider.prototype.get=function(props){cacheGets++;return get.call(this,{...props,prefix:namespace+props.prefix});};
KVProvider.prototype.set=async function(props){const result=await set.call(this,{...props,prefix:namespace+props.prefix});cacheSets++;return result;};
KVProvider.prototype.incr=function(props){return incr.call(this,{...props,prefix:namespace+props.prefix});};
const deadline=async(promise,label)=>{
 let timer;
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+" timed out")),10000);})]);}
 finally{clearTimeout(timer);}
};
if(rawRedis.status!=="ready")await deadline(new Promise((done,reject)=>{rawRedis.once("ready",done);rawRedis.once("error",reject);}),"Redis readiness");
assert.equal(await rawRedis.ping(),"PONG");
const modules={
 "website-builder":(await import("@sps/website-builder/backend/app/api")).app,
 "file-storage":(await import("@sps/file-storage/backend/app/api")).app,
 blog:(await import("@sps/blog/backend/app/api")).app,
 rbac:(await import("@sps/rbac/backend/app/api")).app,
 ecommerce:(await import("@sps/ecommerce/backend/app/api")).app,
 billing:(await import("@sps/billing/backend/app/api")).app,
};
const services={};
for(const [module,app] of Object.entries(modules))for(const entry of app.apps.apps)services[module+entry.route]=entry.app.controller.service;
const service=resource=>{assert(services[resource],"Missing effective owner "+resource);return services[resource];};
const create=async(resource,data)=>{const result=await service(resource).create({data});assert(result?.id,"Owner create returned no ID: "+resource);return result;};
const pg=getPostgresClient();
const rollback=Error("ROLLBACK_PRIVATE_CONTENT_FIXTURE");
let assertions=0;
try{
 await getDrizzle({}).transaction(async tx=>withConsistencyDatabase(tx,async()=>{
  const prefix="issue376-"+token;
  const subjectA=await create("rbac/subjects",{slug:prefix+"-subscriber"});
  persisted.subjectId=subjectA.id;
  const subjectB=await create("rbac/subjects",{slug:prefix+"-other"});
  const guest=await create("rbac/subjects",{slug:prefix+"-guest"});
  // A deliberately has no Identity: a guest JWT may own a valid paid subscription.
  for(const subject of [subjectB]){
   const identity=await create("rbac/identities",{provider:"email",account:prefix+subject.id+"@example.test"});
   await create("rbac/subjects-to-identities",{subjectId:subject.id,identityId:identity.id});
  }
  const role=await create("rbac/roles",{slug:prefix+"-role",title:prefix+"-role"});
  const grant=await create("rbac/subjects-to-roles",{subjectId:subjectA.id,roleId:role.id});
  const product=await create("ecommerce/products",{slug:prefix+"-subscription",type:"subscription"});
  const currency=await create("billing/currencies",{slug:prefix+"-currency",title:prefix+" currency",symbol:"TEST"});
  await create("rbac/roles-to-ecommerce-module-products",{roleId:role.id,ecommerceModuleProductId:product.id});
  const firstKey=async(type)=>{
   const rows=await service("ecommerce/attribute-keys").find({params:{filters:{and:[{column:"type",method:"eq",value:type}]}}});
   return rows[0]||create("ecommerce/attribute-keys",{slug:prefix+"-"+type,type,field:type==="price"?"number":"string"});
  };
  for(const type of ["price","interval"]){
   const key=await firstKey(type);
   const attribute=await create("ecommerce/attributes",{slug:prefix+"-attribute-"+type,...(type==="price"?{number:"100"}:{string:{[internationalization.defaultLanguage.code]:"minute"}})});
   await create("ecommerce/attribute-keys-to-attributes",{attributeKeyId:key.id,attributeId:attribute.id});
   await create("ecommerce/products-to-attributes",{productId:product.id,attributeId:attribute.id});
   if(type==="price")await create("ecommerce/attributes-to-billing-module-currencies",{attributeId:attribute.id,billingModuleCurrencyId:currency.id});
  }
  const invoice=await create("billing/invoices",{provider:"dummy",status:"paid",amount:100});
  const order=await create("ecommerce/orders",{type:"history",status:"paid"});
  await create("ecommerce/orders-to-products",{orderId:order.id,productId:product.id,quantity:1});
  await create("ecommerce/orders-to-billing-module-currencies",{orderId:order.id,billingModuleCurrencyId:currency.id,amount:"100"});
  const paymentIntent=await create("billing/payment-intents",{type:"subscription",interval:"minute",amount:100,status:"succeeded"});
  await create("billing/payment-intents-to-currencies",{paymentIntentId:paymentIntent.id,currencyId:currency.id});
  await create("billing/payment-intents-to-invoices",{paymentIntentId:paymentIntent.id,invoiceId:invoice.id});
  await create("ecommerce/orders-to-billing-module-payment-intents",{orderId:order.id,billingModulePaymentIntentId:paymentIntent.id});
  await create("rbac/subjects-to-ecommerce-module-orders",{subjectId:subjectA.id,ecommerceModuleOrderId:order.id});
  assert.deepEqual(await service("ecommerce/orders").findByIdCheckoutAttributes({id:order.id,billingModuleCurrencyId:currency.id}),{type:"subscription",interval:"minute",amount:100});
  clock=originalDate.now();
  const periodStart=new originalDate(clock-1000),periodEnd=new originalDate(clock+60000);
  // Trusted fixture capability: period acceptance/payment orchestration is tested separately.
  const accepted=await service("ecommerce/orders").repository.writeSubscriptionPeriod({id:order.id,before:order,startsAt:periodStart,endsAt:periodEnd,invoiceId:invoice.id,status:"delivering"});
  assert(accepted,"Fixture period CAS must persist through owning repository");
  const persistedPeriod=await service("ecommerce/orders").findById({id:order.id});
  assert.equal(persistedPeriod.subscriptionPeriodEndsAt.getTime(),periodEnd.getTime(),"Owning repository must preserve the expiry milliseconds");
  const article=await create("blog/articles",{slug:prefix+"-article",description:{en:"Public introduction"}});
  persisted.articleId=article.id;
  const publicWidget=await create("website-builder/widgets",{slug:prefix+"-public",description:{en:"Public widget"}});
  const privateWidget=await create("website-builder/widgets",{slug:prefix+"-private",description:{en:marker}});
  const publicLink=await create("blog/articles-to-website-builder-module-widgets",{articleId:article.id,websiteBuilderModuleWidgetId:publicWidget.id,variant:"default",orderIndex:0});
  const privateLink=await create("blog/articles-to-website-builder-module-widgets",{articleId:article.id,websiteBuilderModuleWidgetId:privateWidget.id,variant:"private",orderIndex:1});
  await create("blog/articles-to-ecommerce-module-products",{articleId:article.id,ecommerceModuleProductId:product.id,variant:"subscription"});
  const feature=await create("website-builder/features",{slug:prefix+"-feature",description:{en:marker}});
  const slider=await create("website-builder/sliders",{slug:prefix+"-slider"});
  const slide=await create("website-builder/slides",{slug:prefix+"-slide",title:{en:marker}});
  const buttonsArray=await create("website-builder/buttons-arrays",{slug:prefix+"-buttons"});
  const button=await create("website-builder/buttons",{slug:prefix+"-button",title:{en:marker}});
  const logotype=await create("website-builder/logotypes",{slug:prefix+"-logo"});
  const source=join(directory,"private.txt");await writeFile(source,bytes);
  await mkdir(join(process.cwd(),"public",FILE_STORAGE_FOLDER),{recursive:true});
  const file=await service("file-storage/files").importPath({filePath:source,slug:prefix+"-file"});
  persisted.fileId=file.id;
  files.push(join(process.cwd(),"public",file.file.replace(/^\/+/g,"")));
  const alias=await create("file-storage/files",{file:"/"+file.file,slug:prefix+"-file-alias",mimeType:"text/plain"});
  const publicSource=join(directory,"public.txt");await writeFile(publicSource,"Public integration media");
  const publicFile=await service("file-storage/files").importPath({filePath:publicSource,slug:prefix+"-public-file"});
  files.push(join(process.cwd(),"public",publicFile.file.replace(/^\/+/g,"")));
  const cases=[
   ["website-builder/widgets",privateWidget.id],["website-builder/features",feature.id],
   ["website-builder/sliders",slider.id],["website-builder/slides",slide.id],
   ["website-builder/buttons-arrays",buttonsArray.id],["website-builder/buttons",button.id],
   ["website-builder/logotypes",logotype.id],["file-storage/files",file.id],["file-storage/files",alias.id],
   ["blog/articles-to-website-builder-module-widgets",privateLink.id],
  ];
  for(const [relation,data] of [
   ["widgets-to-features",{widgetId:privateWidget.id,featureId:feature.id}],
   ["widgets-to-sliders",{widgetId:privateWidget.id,sliderId:slider.id}],
   ["widgets-to-buttons-arrays",{widgetId:privateWidget.id,buttonsArrayId:buttonsArray.id}],
   ["widgets-to-logotypes",{widgetId:privateWidget.id,logotypeId:logotype.id}],
   ["widgets-to-file-storage-module-files",{widgetId:privateWidget.id,fileStorageModuleFileId:file.id}],
   ["sliders-to-slides",{sliderId:slider.id,slideId:slide.id}],
   ["slides-to-buttons-arrays",{slideId:slide.id,buttonsArrayId:buttonsArray.id}],
   ["slides-to-file-storage-module-files",{slideId:slide.id,fileStorageModuleFileId:file.id}],
   ["features-to-buttons-arrays",{featureId:feature.id,buttonsArrayId:buttonsArray.id}],
   ["features-to-file-storage-module-files",{featureId:feature.id,fileStorageModuleFileId:file.id}],
   ["buttons-arrays-to-buttons",{buttonsArrayId:buttonsArray.id,buttonId:button.id}],
   ["buttons-to-file-storage-module-files",{buttonId:button.id,fileStorageModuleFileId:file.id}],
   ["logotypes-to-file-storage-module-files",{logotypeId:logotype.id,fileStorageModuleFileId:file.id}],
  ]){const edge=await create("website-builder/"+relation,data);cases.push(["website-builder/"+relation,edge.id]);}
  const tokens={};for(const [name,subject] of Object.entries({active:subjectA,other:subjectB,guest}))tokens[name]=await sign({subject:{id:subject.id},exp:Math.floor(clock/1000)+3600},RBAC_JWT_SECRET);
  // Preserve native Date instances used by Postgres/Zod while controlling exact expiry.
  globalThis.Date=new Proxy(originalDate,{construct(target,args){return Reflect.construct(target,args.length?args:[clock]);},apply(){return new originalDate(clock).toString();},get(target,key){return key==="now"?()=>clock:Reflect.get(target,key);}});
  const graphFactory=()=>new Graph(services);
  const filter=(column,method,value)=>"?filters[and]="+encodeURIComponent(JSON.stringify([{column,method,value}]));
  const fixtureApps=[];
  for(const mode of ["legacy","consistency"]){
   const app=new Hono();const exception=new ExceptionFilter();app.onError(exception.catch.bind(exception));
   const guard=new ProtectedBlogContent(graphFactory);
   app.use(guard.bytes());
   // This is the production raw-Response static composition, without importing app.ts schedulers.
   app.on(["GET","HEAD"],"/public/*",async c=>{
    const relative=normalize(decodeURIComponent(c.req.path.replace(/^\/public\/?/,"")));
    if(!relative||relative.startsWith(".."))return c.notFound();
    for(const root of [join(process.cwd(),"public"),join(process.cwd(),"apps/api/public")]){
     const location=join(root,relative);if(!location.startsWith(root))continue;
     const stored=Bun.file(location);if(!await stored.exists())continue;
     return new Response(c.req.method==="HEAD"?null:await stored.arrayBuffer(),{headers:{"Content-Type":stored.type||"application/octet-stream","Content-Length":String(stored.size)}});
    }
    return c.notFound();
   });
   const runtime=createConsistencyRuntime({verifyAuthorization:async value=>{if(value)await verify(value.replace(/^Bearer\s+/i,""),RBAC_JWT_SECRET,"HS256");}});
   app.use(runtime.middleware());
   // Test-only transaction plumbing: runtime's new read context retains the real fixture tx.
   app.use(async(c,next)=>withConsistencyDatabase(tx,()=>next()));
   // Public route permissions are deliberately broad; resource guards must still deny bodies.
   app.use(new IsAuthorized({allowedRoutes:[...protectedContentRoutes,...controllerGuardedRoutes,{regexPath:/^\/api\/private-content-cache-control$/,methods:["GET"]}]}).init());
   app.use(new ParseQueryMiddleware().init());app.use(guard.init());
   const legacy=new HTTPCache({excludedRoutes:protectedContentRoutes});
   if(mode==="legacy")app.use(legacy.init());
   else app.use(runtime.cache({excludedRoutes:[...protectedContentRoutes,...controllerGuardedRoutes]}));
   let controlCalls=0;
   app.get("/api/private-content-cache-control",async c=>{
    controlCalls++;
    // A synthetic immutable control supplies truthful real-DB generation metadata.
    const key=resourceIdentity(service("website-builder/widgets").repository.Table)+"|reset";
    const version=(await runtime.store.versions([key]))[key];
    const context=consistencyContext.getStore();context.complete=true;context.dependencies.set(key,version);
    return c.json({data:{controlCalls}});
   });
   for(const [module,owner] of Object.entries(modules))app.route("/api/"+module,owner.hono);
   const request=async(path,who="anonymous",extra={})=>{
    const separator=path.includes("?")?"&":"?";
    const headers={...(tokens[who]?{Authorization:"Bearer "+tokens[who]}:{}),...(extra.headers||{})};
    return app.request(hostname+path+separator+"integration="+mode,{...extra,headers});
   };
   fixtureApps.push({request,mode});
   let beforeSets=cacheSets;
   assert.equal((await(await request("/api/private-content-cache-control")).json()).data.controlCalls,1);
   for(let attempt=0;cacheSets===beforeSets&&attempt<100;attempt++)await new Promise(done=>setTimeout(done,10));
   assert(cacheSets>beforeSets,mode+" cache must actually store the control");
   const control=await request("/api/private-content-cache-control");
   assert.equal((await control.json()).data.controlCalls,1,mode+" control must be served from enabled real cache");
   assert.equal(controlCalls,1);if(mode==="consistency")assert.equal(control.headers.get("X-SPS-Cache"),"hit");
   const beforeProtectedGets=cacheGets,beforeProtectedSets=cacheSets;
   for(const [resource,id] of cases){
    const path="/api/"+resource;
    const active=await request(path+"/"+id,"active");assert.equal(active.status,200,mode+" active "+resource);assert.equal((await active.json()).data.id,id);
    for(const who of ["anonymous","other","guest"]){const denied=await request(path+"/"+id,who);assert.equal(denied.status,403,mode+" "+who+" denied "+resource);assert(!(await denied.text()).includes(marker));}
    const query=filter("id","eq",id);
    for(const who of ["anonymous","other","guest"]){
     assert.deepEqual((await(await request(path+query,who)).json()).data,[],mode+" "+who+" scoped list "+resource);
     assert.equal((await(await request(path+"/count"+query,who)).json()).data,0,mode+" "+who+" scoped count "+resource);
    }
   }
   const pair=filter("id","inArray",[publicWidget.id,privateWidget.id]);
   assert.deepEqual((await(await request("/api/website-builder/widgets"+pair)).json()).data.map(row=>row.id),[publicWidget.id]);
   assert.equal((await(await request("/api/website-builder/widgets/count"+pair)).json()).data,1);
   assert.equal((await(await request("/api/website-builder/widgets/count"+pair,"active")).json()).data,2);
   const widened=await request("/api/website-builder/widgets?filters[or]="+encodeURIComponent(JSON.stringify([{column:"id",method:"eq",value:privateWidget.id}])));assert.equal(widened.status,400);
   assert.equal((await request("/api/website-builder/widgets/"+privateWidget.id.toUpperCase())).status,403);
   const contentPath="/api/rbac/subjects/"+subjectA.id+"/blog-module/articles/"+article.id+"/content";
   const granted=(await(await request(contentPath,"active")).json()).data;assert.equal(granted.access.state,"granted");assert.deepEqual(granted.items.map(item=>item.kind),["public","private"]);assert(JSON.stringify(granted).includes(marker));
   const otherPath="/api/rbac/subjects/"+subjectB.id+"/blog-module/articles/"+article.id+"/content";
   const locked=(await(await request(otherPath,"other")).json()).data;assert.equal(locked.access.state,"locked");assert(!JSON.stringify(locked).includes(marker));assert.equal(locked.items[1].widget,undefined);assert.equal(locked.items[1].relation,undefined);
   const guestContentPath="/api/rbac/subjects/"+guest.id+"/blog-module/articles/"+article.id+"/content";
   const unpaidGuest=(await(await request(guestContentPath,"guest")).json()).data;assert.equal(unpaidGuest.access.state,"guest");assert(!JSON.stringify(unpaidGuest).includes(marker));assert.equal(unpaidGuest.items[1].widget,undefined);assert.equal(unpaidGuest.items[1].relation,undefined);
   assert.equal((await request(contentPath,"other")).status,403);
   const guestRead=await request("/api/rbac/subjects/"+guest.id,"guest");assert.equal(guestRead.status,200);assert.equal((await guestRead.json()).data.id,guest.id);
   const bytePaths=["/public"+file.file,"/public"+alias.file,"/api/file-storage/files/"+file.id+"/content","/api/file-storage/files/"+alias.id+"/content"];
   for(const path of bytePaths){
    for(const extra of [{},{method:"HEAD"},{headers:{Range:"bytes=0-7"}}]){
     const granted=await request(path,"active",extra);assert([200,206].includes(granted.status));assert.equal(granted.headers.get("Cache-Control"),"private, no-store");assert(granted.headers.get("Vary")?.includes("Authorization"));
     const body=await granted.text();if(extra.method!=="HEAD")assert(body===bytes.toString()||bytes.toString().startsWith(body));
     for(const who of ["anonymous","other","guest"]){const denied=await request(path,who,extra);assert.equal(denied.status,403,mode+" "+who+" denied bytes "+path);assert(!(await denied.text()).includes(marker));}
    }
   }
   assert.equal((await request("/public"+publicFile.file)).status,200);
   assert.equal(cacheGets,beforeProtectedGets,mode+" guarded requests must bypass real cache lookups");assert.equal(cacheSets,beforeProtectedSets,mode+" guarded responses must not be stored");
   clock=periodEnd.getTime()-1;assert.equal((await request("/api/website-builder/widgets/"+privateWidget.id,"active")).status,200);
   clock=periodEnd.getTime();assert.equal((await request("/api/website-builder/widgets/"+privateWidget.id,"active")).status,403);
   for(const path of bytePaths)for(const method of ["GET","HEAD"]){
    const expiredBytes=await request(path,"active",{method});assert.equal(expiredBytes.status,403,mode+" exact expiry bytes "+path);assert(!(await expiredBytes.text()).includes(marker));
   }
   const expired=(await(await request(contentPath,"active")).json()).data;assert.equal(expired.access.state,"expired");assert(!JSON.stringify(expired).includes(marker));
   clock=periodEnd.getTime()-1000;
   assertions++;
  }
  const grantService=service("rbac/subjects-to-roles");
  grantService.configureRevocation({revoke:async removed=>{
   assert.equal(removed.subjectId,subjectA.id);assert.equal(removed.roleId,role.id);
   await service("ecommerce/orders").revokeSubscription({id:order.id});
  },canFulfill:async()=>false});
  await grantService.delete({id:grant.id});
  assert((await service("ecommerce/orders").findById({id:order.id})).subscriptionRevokedAt,"Real grant deletion must persist owner revocation");
  for(const {request,mode} of fixtureApps){const response=await request("/api/website-builder/widgets/"+privateWidget.id,"active");assert.equal(response.status,403,mode+" Role revoke");assert(!(await response.text()).includes(marker));}
  throw rollback;
 }));
 throw Error("Fixture transaction unexpectedly committed");
}catch(error){if(error!==rollback)throw error;}
finally{
 globalThis.Date=originalDate;
 for(const [resource,key] of [["rbac/subjects","subjectId"],["blog/articles","articleId"],["file-storage/files","fileId"]])if(persisted[key])assert(!(await service(resource).findById({id:persisted[key]})),"Fixture record must be rolled back: "+resource);
 await Promise.all(files.map(path=>unlink(path).catch(error=>{if(error.code!=="ENOENT")throw error;})));
 await rm(directory,{recursive:true,force:true});
 await redis.delByPrefix({prefix:namespace});
 await pg.unsafe("DELETE FROM sps_consistency.query WHERE identity LIKE $1",[hostname+"%"]);
 await pg.end();await rawRedis.quit();
}
assert.equal(assertions,2);
console.log(JSON.stringify({realDatabase:true,effectiveControllers:true,actualRedisCaches:["legacy","consistency"],protectedGraphRelationKinds:13,fileAliases:true,rawStaticHeaders:true,rangeDenied:true,exactExpiry:true,roleRevoked:true,guestOwnSubject:true,transactionRolledBack:true}));
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
        RBAC_JWT_SECRET: "issue376-isolated-integration-jwt",
        RBAC_SECRET_KEY: "issue376-isolated-integration-operator",
        FILE_STORAGE_PROVIDER: "local",
        KV_PROVIDER: "redis",
        BUG_SERVICE_TELEGRAM_BOT_TOKEN: "",
        BUG_SERVICE_TELEGRAM_CHAT_ID: "",
        BUG_SERVICE_PROJECT: "",
      },
    },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  expect(result.stdout).toContain('"transactionRolledBack":true');
  expect(result.stdout).toContain(
    '"actualRedisCaches":["legacy","consistency"]',
  );
}, 160000);
