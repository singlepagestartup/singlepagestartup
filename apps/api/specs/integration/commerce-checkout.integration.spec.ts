/**
 * Actual SDK requests, Hono handlers, owning services and PostgreSQL writes.
 * Nested fixture transactions use real savepoints and always roll back. The
 * observer queue and delayed dummy webhook stop at a captured transport boundary.
 * No app.ts jobs, notification delivery or external payment provider starts here.
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("persists cart mutations and derives dummy checkout invoices from current product data", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {Hono} from "hono";
import {sign} from "hono/jwt";
import {getDrizzle,getPostgresClient} from "@sps/shared-backend-database-config";
import {ExceptionFilter,ParseQueryMiddleware,withConsistencyDatabase} from "@sps/shared-backend-api";
import {consistencyContext} from "./libs/shared/backend/api/src/lib/repository/database/context";
import {DATABASE_OPTIONS,RBAC_JWT_SECRET,API_SERVICE_URL,NEXT_PUBLIC_HOST_SERVICE_URL,ALLOWED_BILLING_SERVICE_PROVIDERS} from "@sps/shared-utils";
import {internationalization} from "@sps/shared-configuration";
import {api as subjectApi} from "@sps/rbac/models/subject/sdk/server";

assert(["localhost","127.0.0.1","::1"].includes(String(DATABASE_OPTIONS.host)),"Only local PostgreSQL fixtures are allowed");
assert.equal(ALLOWED_BILLING_SERVICE_PROVIDERS,"dummy");
assert.equal(API_SERVICE_URL,"http://commerce-integration.test");
assert(RBAC_JWT_SECRET);
const modules={
 rbac:(await import("@sps/rbac/backend/app/api")).app,
 ecommerce:(await import("@sps/ecommerce/backend/app/api")).app,
 billing:(await import("@sps/billing/backend/app/api")).app,
};
const services={};
for(const [module,owner] of Object.entries(modules))for(const entry of owner.apps.apps)services[module+entry.route]=entry.app.controller.service;
const service=resource=>{assert(services[resource],"Missing effective owner: "+resource);return services[resource];};
const create=async(resource,data)=>{const row=await service(resource).create({data});assert(row?.id,resource+" did not persist an ID");return row;};
const find=(resource,and)=>service(resource).find({params:{filters:{and}}});
const eq=(column,value)=>({column,method:"eq",value});
const byId=(resource,id)=>service(resource).findById({id});
const suffix=randomUUID(),prefix="issue376-commerce-"+suffix;
const persisted=[];
const remember=(resource,row)=>{persisted.push([resource,row.id]);return row;};
const observer=[],webhooks=[],providers=[];
const db=getDrizzle({}),pg=getPostgresClient(),transaction=db.transaction;
const rollback=Error("ROLLBACK_COMMERCE_FIXTURE");
let nestedSavepoints=0,assertionsComplete=false;
const app=new Hono(),exception=new ExceptionFilter();
app.onError(exception.catch.bind(exception));
app.use(new ParseQueryMiddleware().init());
for(const [module,owner] of Object.entries(modules))app.route("/api/"+module,owner.hono);
// Only the transport is adapted. Every business read/write still reaches the
// exported production controller/service/repository with its original payload.
globalThis.fetch=async(input,init)=>{
 const request=new Request(input,init),url=new URL(request.url);
 assert.equal(url.origin,API_SERVICE_URL,"Unexpected outbound network destination: "+url.origin);
 if(url.pathname==="/api/broadcast/channels/push-message"){
  const form=await request.formData();observer.push(JSON.parse(String(form.get("data"))));
  return Response.json({data:{id:randomUUID(),slug:"captured-observer-transport"}});
 }
 if(url.pathname==="/api/billing/payment-intents/dummy/webhook"){
  webhooks.push(await request.json());
  return Response.json({data:{transportSuppressed:true}});
 }
 assert(/^\/api\/(?:rbac|ecommerce|billing)\//.test(url.pathname),"Unexpected notification/provider route: "+url.pathname);
 if(/^\/api\/billing\/payment-intents\/[^/]+\/dummy$/.test(url.pathname)){
  const form=await request.clone().formData();providers.push(JSON.parse(String(form.get("data"))));
 }
 return app.fetch(request);
};
try{
 await transaction.call(db,async tx=>withConsistencyDatabase(tx,async()=>{
  // Cart creation explicitly opens a transaction. Real savepoints keep those
  // owner transactions inside this disposable fixture rather than committing.
  db.transaction=function(operation,config){
   const ambient=consistencyContext.getStore()?.database;
   if(ambient&&ambient!==db){nestedSavepoints++;return ambient.transaction(operation,config);}
   return transaction.call(db,operation,config);
  };
  const subject=remember("rbac/subjects",await create("rbac/subjects",{slug:prefix+"-guest"}));
  const foreign=remember("rbac/subjects",await create("rbac/subjects",{slug:prefix+"-foreign"}));
  const store=remember("ecommerce/stores",await create("ecommerce/stores",{slug:prefix+"-store",title:{en:"Integration store"}}));
  const product=remember("ecommerce/products",await create("ecommerce/products",{slug:prefix+"-product",type:"one_off",title:{en:"Current integration product"}}));
  const currencies=[];
  for(const name of ["a","b"])currencies.push(remember("billing/currencies",await create("billing/currencies",{slug:prefix+"-"+name,title:"Integration "+name,symbol:name.toUpperCase()})));
  const priceKeys=await find("ecommerce/attribute-keys",[eq("type","price")]);
  const priceKey=priceKeys[0]||remember("ecommerce/attribute-keys",await create("ecommerce/attribute-keys",{slug:prefix+"-price",type:"price",field:"number"}));
  const prices=[],priceProductLinks=[];
  for(let index=0;index<currencies.length;index++){
   const attribute=remember("ecommerce/attributes",await create("ecommerce/attributes",{slug:prefix+"-price-"+index,number:String(index?175:100)}));prices.push(attribute);
   await create("ecommerce/attribute-keys-to-attributes",{attributeKeyId:priceKey.id,attributeId:attribute.id});
   priceProductLinks.push(await create("ecommerce/products-to-attributes",{productId:product.id,attributeId:attribute.id,orderIndex:index}));
   await create("ecommerce/attributes-to-billing-module-currencies",{attributeId:attribute.id,billingModuleCurrencyId:currencies[index].id});
  }
  const specificationKey=remember("ecommerce/attribute-keys",await create("ecommerce/attribute-keys",{slug:prefix+"-specification",type:"default",field:"string",title:{en:"Specification"}}));
  const specification=remember("ecommerce/attributes",await create("ecommerce/attributes",{slug:prefix+"-specification",string:{[internationalization.defaultLanguage.code]:"Current saved specification"}}));
  await create("ecommerce/attribute-keys-to-attributes",{attributeKeyId:specificationKey.id,attributeId:specification.id});
  const specificationLink=await create("ecommerce/products-to-attributes",{productId:product.id,attributeId:specification.id,orderIndex:2});
  const token=await sign({subject:{id:subject.id},exp:Math.floor(Date.now()/1000)+3600},RBAC_JWT_SECRET);
  const foreignToken=await sign({subject:{id:foreign.id},exp:Math.floor(Date.now()/1000)+3600},RBAC_JWT_SECRET);
  const options={headers:{Authorization:"Bearer "+token,"Cache-Control":"no-store"}};
  const ownerProps={id:subject.id,options};
  const carts=()=>subjectApi.ecommerceModuleOrderList({...ownerProps,params:{includeCartDetails:true}});
  const createCart=()=>subjectApi.ecommerceModuleOrderCreate({...ownerProps,data:{productId:product.id,storeId:store.id,quantity:2,billingModule:{currency:{id:currencies[0].id}}}});
  await createCart();
  assert(nestedSavepoints>0,"Actual cart creation must use a real nested SQL transaction");
  let cartList=await carts();assert.equal(cartList.length,1);
  const removedCart=remember("ecommerce/orders",cartList[0]);
  const removedLine=cartList[0].cartDetails.lines[0];
  assert.equal(cartList[0].type,"cart");assert.equal(cartList[0].status,"new");
  assert.deepEqual(cartList[0].cartDetails.storeIds,[store.id]);
  assert.equal(removedLine.orderId,removedCart.id);assert.equal(removedLine.productId,product.id);assert.equal(removedLine.quantity,2);assert.equal(removedLine.product.id,product.id);
  const cartOwnerLink=(await find("rbac/subjects-to-ecommerce-module-orders",[eq("ecommerceModuleOrderId",removedCart.id)]))[0];assert.equal(cartOwnerLink.subjectId,subject.id);
  const cartCurrencyLink=(await find("ecommerce/orders-to-billing-module-currencies",[eq("orderId",removedCart.id)]))[0];assert.equal(cartCurrencyLink.billingModuleCurrencyId,currencies[0].id);
  await subjectApi.ecommerceModuleOrderUpdate({...ownerProps,orderId:removedCart.id,data:{ordersToProducts:[{id:removedLine.id,quantity:4}]}});
  cartList=await carts();assert.equal(cartList[0].id,removedCart.id);assert.equal(cartList[0].cartDetails.lines[0].id,removedLine.id);assert.equal(cartList[0].cartDetails.lines[0].quantity,4);
  assert.equal((await byId("ecommerce/orders-to-products",removedLine.id)).productId,product.id);
  assert.equal((await byId("ecommerce/orders-to-billing-module-currencies",cartCurrencyLink.id)).billingModuleCurrencyId,currencies[0].id);
  const foreignRequest=async(method,data)=>{
   const form=new FormData();if(data)form.set("data",JSON.stringify(data));
   return app.request(API_SERVICE_URL+"/api/rbac/subjects/"+foreign.id+"/ecommerce-module/orders/"+removedCart.id,{method,headers:{Authorization:"Bearer "+foreignToken},...(data?{body:form}:{})});
  };
  assert.equal((await foreignRequest("PATCH",{ordersToProducts:[{id:removedLine.id,quantity:99}]})).status,403);
  assert.equal((await foreignRequest("DELETE")).status,403);
  assert.equal((await byId("ecommerce/orders-to-products",removedLine.id)).quantity,4);
  await subjectApi.ecommerceModuleOrderDelete({...ownerProps,orderId:removedCart.id});
  assert.equal((await carts()).length,0);
  for(const [resource,id] of [["ecommerce/orders",removedCart.id],["ecommerce/orders-to-products",removedLine.id],["rbac/subjects-to-ecommerce-module-orders",cartOwnerLink.id],["ecommerce/orders-to-billing-module-currencies",cartCurrencyLink.id]])assert(!(await byId(resource,id)),"Delete must remove saved cart graph: "+resource);
  await createCart();cartList=await carts();assert.equal(cartList.length,1);
  const checkoutCart=remember("ecommerce/orders",cartList[0]);assert.notEqual(checkoutCart.id,removedCart.id);
  const checkoutLine=cartList[0].cartDetails.lines[0];
  await subjectApi.ecommerceModuleOrderUpdate({...ownerProps,orderId:checkoutCart.id,data:{ordersToProducts:[{id:checkoutLine.id,quantity:4}]}});
  const checkoutCurrency=(await find("ecommerce/orders-to-billing-module-currencies",[eq("orderId",checkoutCart.id)]))[0];
  await service("ecommerce/attributes").update({id:prices[0].id,data:{number:"125"}});
  await service("ecommerce/attributes").update({id:prices[1].id,data:{number:"225"}});
  const email=prefix+"@example.test";
  const identity=remember("rbac/identities",await create("rbac/identities",{provider:"email",email}));
  await create("rbac/subjects-to-identities",{subjectId:subject.id,identityId:identity.id});
  assert.deepEqual(await service("ecommerce/orders").findByIdCheckoutAttributesByCurrency({id:checkoutCart.id,billingModuleCurrencyId:currencies[0].id}),{type:"one_off",interval:undefined,amount:500});
  const checkout=await subjectApi.ecommerceModuleOrderCheckout({...ownerProps,data:{email,provider:"dummy",comment:"Saved cart checkout",ecommerceModule:{orders:[{id:checkoutCart.id}]}}});
  assert.equal(checkout.billingModule.invoices.length,1);
  const verifyCheckout=async({result,orderId,currencyId,quantity,amount,lineId,comment})=>{
   const invoice=remember("billing/invoices",result.billingModule.invoices[0]);
   assert.equal(invoice.provider,"dummy");assert.equal(invoice.status,"open");assert.equal(invoice.amount,amount);assert(invoice.providerId);assert.equal(invoice.paymentUrl,NEXT_PUBLIC_HOST_SERVICE_URL);
   const savedInvoice=await byId("billing/invoices",invoice.id);assert.equal(savedInvoice.amount,amount);assert.equal(savedInvoice.paymentUrl,NEXT_PUBLIC_HOST_SERVICE_URL);
   const order=await byId("ecommerce/orders",orderId);assert.equal(order.type,"history");assert.equal(order.status,"paying");assert.equal(order.comment,comment);
   const lines=await find("ecommerce/orders-to-products",[eq("orderId",orderId)]);assert.equal(lines.length,1);assert.equal(lines[0].productId,product.id);assert.equal(lines[0].quantity,quantity);if(lineId)assert.equal(lines[0].id,lineId);
   assert.equal((await find("ecommerce/stores-to-orders",[eq("orderId",orderId)]))[0].storeId,store.id);
   assert.equal((await find("ecommerce/orders-to-billing-module-currencies",[eq("orderId",orderId)]))[0].billingModuleCurrencyId,currencyId);
   assert.equal((await find("rbac/subjects-to-ecommerce-module-orders",[eq("ecommerceModuleOrderId",orderId)]))[0].subjectId,subject.id);
   const orderIntent=(await find("ecommerce/orders-to-billing-module-payment-intents",[eq("orderId",orderId)]));assert.equal(orderIntent.length,1);
   const intent=remember("billing/payment-intents",await byId("billing/payment-intents",orderIntent[0].billingModulePaymentIntentId));assert.equal(intent.amount,amount);assert.equal(intent.type,"one_off");
   const intentCurrency=await find("billing/payment-intents-to-currencies",[eq("paymentIntentId",intent.id)]);assert.equal(intentCurrency.length,1);assert.equal(intentCurrency[0].currencyId,currencyId);
   const intentInvoice=await find("billing/payment-intents-to-invoices",[eq("paymentIntentId",intent.id)]);assert.equal(intentInvoice.length,1);assert.equal(intentInvoice[0].invoiceId,invoice.id);
   const payload=providers.find(value=>value.currencyId===currencyId);assert(payload,"Real provider request must include selected currency");assert.equal(payload.provider,"dummy");
   const metadataOrder=payload.metadata.ecommerceModule.orders.find(value=>value.id===orderId);assert(metadataOrder);assert.equal(metadataOrder.ordersToProducts[0].id,lines[0].id);assert.equal(metadataOrder.ordersToProducts[0].quantity,quantity);
   const metadataProduct=metadataOrder.ordersToProducts[0].products[0];assert.equal(metadataProduct.id,product.id);
   const attributes=metadataProduct.productsToAttributes;assert(attributes.some(value=>value.id===specificationLink.id&&value.attributes[0].id===specification.id&&value.attributes[0].string[internationalization.defaultLanguage.code]==="Current saved specification"));
   for(let index=0;index<prices.length;index++)assert(attributes.some(value=>value.id===priceProductLinks[index].id&&value.attributes[0].id===prices[index].id&&Number(value.attributes[0].number)===(index?225:125)));
   return invoice;
  };
  const cartInvoice=await verifyCheckout({result:checkout,orderId:checkoutCart.id,currencyId:currencies[0].id,quantity:4,amount:500,lineId:checkoutLine.id,comment:"Saved cart checkout"});
  assert.equal((await byId("ecommerce/orders-to-billing-module-currencies",checkoutCurrency.id)).billingModuleCurrencyId,currencies[0].id);
  assert.equal((await carts()).length,0,"Checked-out cart must leave the active cart list");
  const ownedBefore=new Set((await find("rbac/subjects-to-ecommerce-module-orders",[eq("subjectId",subject.id)])).map(value=>value.ecommerceModuleOrderId));
  const quick=await subjectApi.ecommerceModuleProductCheckout({...ownerProps,productId:product.id,data:{provider:"dummy",quantity:3,storeId:store.id,billingModule:{currency:{id:currencies[1].id}},comment:"One click checkout"}});
  const quickLinks=(await find("rbac/subjects-to-ecommerce-module-orders",[eq("subjectId",subject.id)])).filter(value=>!ownedBefore.has(value.ecommerceModuleOrderId));assert.equal(quickLinks.length,1);
  const quickOrder=remember("ecommerce/orders",await byId("ecommerce/orders",quickLinks[0].ecommerceModuleOrderId));
  const quickInvoice=await verifyCheckout({result:quick,orderId:quickOrder.id,currencyId:currencies[1].id,quantity:3,amount:675,comment:"One click checkout"});
  assert.notEqual(quickInvoice.id,cartInvoice.id);assert.notEqual(quickOrder.id,checkoutCart.id);
  assert.equal((await find("rbac/subjects-to-identities",[eq("subjectId",subject.id)])).length,1,"Existing identity must be reused without notification");
  assert.equal(observer.length,4,"Only the two observer transports per checkout should be captured");
  assert.equal(providers.length,2,"Both actual provider handlers must be called");
  // Dummy schedules its own webhook transport after ten seconds. Capture both
  // before teardown so no pending timer can contact a running local API later.
  const deadline=Date.now()+15000;
  while(webhooks.length<2&&Date.now()<deadline)await new Promise(done=>setTimeout(done,20));
  assert.deepEqual(webhooks.map(value=>value.data.id).sort(),[cartInvoice.id,quickInvoice.id].sort());
  assert.equal((await byId("billing/invoices",cartInvoice.id)).status,"open");assert.equal((await byId("billing/invoices",quickInvoice.id)).status,"open");
  assertionsComplete=true;
  throw rollback;
 }));
 throw Error("Commerce fixture unexpectedly committed");
}catch(error){if(error!==rollback)throw error;}
finally{
 // This child process keeps its deny-by-default transport until exit, including
 // failure paths with a provider timer still pending. No timer may use the network.
 db.transaction=transaction;
 for(const [resource,id] of persisted)assert(!(await byId(resource,id)),"Commerce fixture must roll back: "+resource);
 await pg.end();
}
assert(assertionsComplete);
console.log(JSON.stringify({realDatabase:true,actualSdk:true,actualControllers:true,actualDummyProvider:true,cartCreateUpdateDelete:true,currentAttributes:true,selectedCurrency:true,paymentUrl:true,transactionRolledBack:true,externalPayments:0,notifications:0}));
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
      timeout: 90000,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        API_SERVICE_URL: "http://commerce-integration.test",
        NEXT_PUBLIC_API_SERVICE_URL: "http://commerce-integration.test",
        NEXT_PUBLIC_HOST_SERVICE_URL: "http://commerce-return.test",
        ALLOWED_BILLING_SERVICE_PROVIDERS: "dummy",
        RBAC_JWT_SECRET: "issue376-isolated-commerce-jwt",
        RBAC_SECRET_KEY: "issue376-isolated-commerce-operator",
        BUG_SERVICE_TELEGRAM_BOT_TOKEN: "",
        BUG_SERVICE_TELEGRAM_CHAT_ID: "",
        BUG_SERVICE_PROJECT: "",
      },
    },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  expect(result.stdout).toContain('"actualDummyProvider":true');
  expect(result.stdout).toContain('"transactionRolledBack":true');
}, 100000);
