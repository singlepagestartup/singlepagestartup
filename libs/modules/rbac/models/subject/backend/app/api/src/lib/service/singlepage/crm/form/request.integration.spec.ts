import { spawnSync } from "node:child_process";

it("validates the stored CRM graph, saves one Request per submission and separates notification outcomes", () => {
  // Bun loads the effective app's top-level-await bootstrap. Only the notify
  // transport is replaced; services, repositories and transactions stay real.
  const script = String.raw`
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {getDrizzle,getPostgresClient} from "@sps/shared-backend-database-config";
import {withConsistencyDatabase} from "@sps/shared-backend-api";
import {DATABASE_OPTIONS} from "@sps/shared-utils";
import {api as subjectApi} from "@sps/rbac/models/subject/sdk/server";
import {app} from "@sps/rbac/models/subject/backend/app/api";

assert(["localhost","127.0.0.1","::1"].includes(String(DATABASE_OPTIONS.host)),"Local PostgreSQL is required for rollback fixtures");
const subjectService=app.controller.service;
const crm=subjectService.crmModule;
const notifications=subjectService.notificationModule;
const postgres=getPostgresClient();
const prefix="issue376-crm-"+randomUUID();
const created=[];
const requestIds=[];
const calls=[];
const rollback=Error("ROLLBACK_CRM_ACCEPTANCE_FIXTURE");
const originalNotify=subjectApi.notify;
let delivery="sent";
let subject,form,expectedDeliveries,activeSubmissionId;
const filter=(column,value,method="eq")=>({params:{filters:{and:[{column,method,value}]}}});
const create=async(service,data)=>{
 const record=await service.create({data});
 assert(record?.id,"Effective service must return a persisted ID");
 created.push({service,id:record.id});
 return record;
};
const formLinks=()=>crm.formsToRequests.find(filter("formId",form.id));
subjectApi.notify=async props=>{
 const links=await formLinks();
 const savedRows=await crm.request.find(filter("payload->>submissionId",activeSubmissionId));
 assert.equal(savedRows.length,1,"The active submission must already own one real Request");
 const saved=savedRows[0];
 assert(saved,"Request must be saved before notification transport");
 assert(links.some(link=>link.requestId===saved.id),"Saved Request must have its Form relation");
 assert.equal(props.data.notification.notification.data.crm.form.id,form.id);
 assert.equal(props.data.notification.notification.data.rbac.subject.id,subject.id);
 calls.push(props);
 if(delivery==="failed")throw Error("Synthetic notification transport unavailable");
 return {notificationService:{notifications:[{id:randomUUID(),status:delivery==="queued"?"new":"sent"}]}};
};
try{
 await getDrizzle({}).transaction(async tx=>withConsistencyDatabase(tx,async()=>{
  subject=await create(subjectService,{slug:prefix+"-guest"});
  const admin=await create(subjectService,{slug:prefix+"-recipient"});
  let [role]=await subjectService.role.find(filter("slug","admin"));
  if(!role)role=await create(subjectService.role,{slug:"admin",title:"Administrator"});
  await create(subjectService.subjectsToRoles,{subjectId:admin.id,roleId:role.id});
  let [topic]=await notifications.topic.find(filter("slug","information"));
  if(!topic)topic=await create(notifications.topic,{slug:"information",title:"Information"});
  const fixtureTemplate=await create(notifications.template,{slug:prefix+"-template",title:"CRM acceptance",variant:"crm-form-request-created-admin"});
  const templates=await notifications.template.find(filter("variant","crm-form-request-created-admin","ilike"));
  const admins=await subjectService.subjectsToRoles.find(filter("roleId",role.id));
  const recipientIds=[...new Set(admins.map(link=>link.subjectId))];
  assert(templates.some(template=>template.id===fixtureTemplate.id));
  assert(recipientIds.includes(admin.id));
  expectedDeliveries=templates.length*recipientIds.length;
  assert(expectedDeliveries>0);

  form=await create(crm.form,{slug:prefix+"-form",title:{en:"Stored contact form"}});
  const details=await create(crm.step,{slug:prefix+"-details",title:{en:"Stored details"}});
  const contact=await create(crm.step,{slug:prefix+"-contact",title:{en:"Stored contact"}});
  const foreignStep=await create(crm.step,{slug:prefix+"-foreign-step"});
  const name=await create(crm.input,{slug:prefix+"-name",variant:"text-default",type:"text",isRequired:true,title:{en:"Stored name"}});
  const select=await create(crm.input,{slug:prefix+"-select",variant:"select-option-default",type:"select",isRequired:true,title:{en:"Stored interest"}});
  const note=await create(crm.input,{slug:prefix+"-note",variant:"textarea-default",isRequired:true,title:{en:"Stored message"}});
  const foreignInput=await create(crm.input,{slug:prefix+"-foreign-input",variant:"text-default"});
  const option=await create(crm.option,{slug:prefix+"-option",title:{en:"Stored selected option"}});
  const foreignOption=await create(crm.option,{slug:prefix+"-foreign-option",title:{en:"Unlinked option"}});
  await create(crm.formsToSteps,{formId:form.id,stepId:details.id,orderIndex:20});
  await create(crm.formsToSteps,{formId:form.id,stepId:contact.id,orderIndex:10});
  await create(crm.stepsToInputs,{stepId:contact.id,inputId:select.id,orderIndex:20});
  await create(crm.stepsToInputs,{stepId:contact.id,inputId:name.id,orderIndex:10});
  await create(crm.stepsToInputs,{stepId:details.id,inputId:note.id,orderIndex:10});
  await create(crm.stepsToInputs,{stepId:foreignStep.id,inputId:foreignInput.id});
  await create(crm.inputsToOptions,{inputId:select.id,optionId:option.id,orderIndex:10});
  await create(crm.inputsToOptions,{inputId:foreignInput.id,optionId:foreignOption.id,orderIndex:10});

  const submission=()=>({submissionId:randomUUID(),steps:[
   {id:contact.id,inputs:[{id:name.id,string:"CRM integration sender"},{id:select.id,option:option.id}]},
   {id:details.id,inputs:[{id:note.id,string:"CRM integration message"}]},
  ]});
  const execute=data=>subjectService.crmModuleFormRequestCreate({subjectId:subject.id,crmModuleFormId:form.id,data});
  const invalid=[
   ["required",data=>{data.steps[0].inputs.shift();},/required CRM Input is missing/],
   ["option",data=>{data.steps[0].inputs[1].option=foreignOption.id;},/CRM Option does not belong/],
   ["step",data=>{data.steps[0].id=foreignStep.id;},/CRM Step does not belong/],
   ["input",data=>{data.steps[0].inputs[0].id=foreignInput.id;},/CRM Input does not belong/],
   ["type",data=>{data.steps[0].inputs[0]={id:name.id,number:42};},/invalid type/],
   ["duplicate",data=>{data.steps[0].inputs.push(data.steps[0].inputs[0]);},/duplicated/],
  ];
  for(const [label,change,error] of invalid){
   const data=submission();change(data);
   await assert.rejects(()=>execute(data),error,label);
   assert.deepEqual(await formLinks(),[],label+" must not create a Request relation");
   assert.deepEqual(await crm.request.find(filter("payload->>subjectId",subject.id)),[],label+" must not create an orphan Request");
   assert.equal(calls.length,0,label+" must not reach notification transport");
  }

  const statuses=[];
  for(const status of ["failed","sent","queued"]){
   delivery=status;
   const data=submission();
   activeSubmissionId=data.submissionId;
   data.steps[0].inputs[0].title={en:"FORGED LABEL"};
   data.steps[0].inputs[1].option={id:option.id,title:{en:"FORGED OPTION"}};
   const before=calls.length;
   const first=await execute(data);
   const receipt=first.submissionResult;
   assert.deepEqual(receipt,{saved:true,requestId:receipt.requestId,formId:form.id,notificationStatus:status,replayed:false});
   requestIds.push(receipt.requestId);
   const persisted=await crm.request.findById({id:receipt.requestId});
   assert(persisted,"Receipt must identify a real Request");
   assert.equal(persisted.payload.subjectId,subject.id);
   assert.equal(persisted.payload.formId,form.id);
   assert.equal(persisted.payload.submissionId,data.submissionId);
   assert.equal(persisted.payload.notificationStatus,status);
   const normalized=persisted.payload.form;
   assert.equal(normalized.title.en,"Stored contact form");
   assert.deepEqual(normalized.steps.map(step=>step.id),[contact.id,details.id]);
   assert.deepEqual(normalized.steps[0].inputs.map(input=>input.id),[name.id,select.id]);
   assert.equal(normalized.steps[0].inputs[0].title.en,"Stored name");
   assert.equal(normalized.steps[0].inputs[0].string,"CRM integration sender");
   assert.equal(normalized.steps[0].inputs[1].option.id,option.id);
   assert.equal(normalized.steps[0].inputs[1].option.title.en,"Stored selected option");
   assert.equal(normalized.steps[1].inputs[0].string,"CRM integration message");
   assert(!JSON.stringify(persisted).includes("FORGED"));
   assert.equal(calls.length-before,expectedDeliveries);
   assert.deepEqual([...new Set(calls.slice(before).map(call=>call.id))].sort(),recipientIds.sort());
   for(const call of calls.slice(before))assert.deepEqual(JSON.parse(JSON.stringify(call.data.notification.notification.data.crm.form)),normalized);
   const replay=await execute(data);
   assert.deepEqual(replay.submissionResult,{...receipt,replayed:true});
   assert.equal(calls.length-before,expectedDeliveries,"Replay must not retry delivery");
   const changed=structuredClone(data);changed.steps[0].inputs[0].string="Changed values";
   await assert.rejects(()=>execute(changed),/already used with different values/);
   assert.equal(calls.length-before,expectedDeliveries,"Changed replay must not retry delivery");
   const links=await formLinks();
   assert.equal(links.filter(link=>link.requestId===receipt.requestId).length,1);
   assert.equal(links.length,requestIds.length);
   const rows=await crm.request.find(filter("payload->>subjectId",subject.id));
   assert.equal(rows.length,requestIds.length,"Each submission ID must own one real Request");
   statuses.push(status);
  }
  assert.equal(new Set(requestIds).size,3);
  assert.deepEqual(statuses,["failed","sent","queued"]);
  throw rollback;
 }));
 throw Error("CRM fixture transaction unexpectedly committed");
}catch(error){if(error!==rollback)throw error;}
finally{
 subjectApi.notify=originalNotify;
 try{
  for(const {service,id} of created)assert(!(await service.findById({id})),"Fixture record must be rolled back: "+id);
  for(const id of requestIds)assert(!(await crm.request.findById({id})),"Request must be rolled back: "+id);
 }finally{await postgres.end();}
}
console.log(JSON.stringify({realDatabase:true,effectiveSubjectService:true,storedSchema:true,validationCases:6,idempotentStatuses:["failed","sent","queued"],notificationTransportOnlyStub:true,transactionRolledBack:true}));
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
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 60000,
      maxBuffer: 5 * 1024 * 1024,
      env: {
        ...process.env,
        RBAC_SECRET_KEY: "issue376-isolated-crm-integration",
        BUG_SERVICE_TELEGRAM_BOT_TOKEN: "",
        BUG_SERVICE_TELEGRAM_CHAT_ID: "",
        BUG_SERVICE_PROJECT: "",
      },
    },
  );
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout || String(result.error));
  expect(result.stdout).toContain('"realDatabase":true');
  expect(result.stdout).toContain('"effectiveSubjectService":true');
  expect(result.stdout).toContain('"validationCases":6');
  expect(result.stdout).toContain(
    '"idempotentStatuses":["failed","sent","queued"]',
  );
  expect(result.stdout).toContain('"transactionRolledBack":true');
}, 70000);
