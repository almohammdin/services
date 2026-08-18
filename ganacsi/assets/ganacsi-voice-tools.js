const TARGETS=['platform','sales','expenses','review','activity','money','assistant','opportunity','market'];

export const GANACSI_TOOL_DECLARATIONS=[
  {name:'get_business_context',description:'Read the current GANACSI concept-demo business data and the profile remembered on this device before answering questions about sales, expenses, cash flow, receivables, comparisons or follow-up.',parametersJsonSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'navigate_to_target',description:'Move the GANACSI interface to the relevant target instead of only explaining where it is.',parametersJsonSchema:{type:'object',properties:{target_id:{type:'string',enum:TARGETS}},required:['target_id'],additionalProperties:false}},
  {name:'remember_business_profile',description:'Store stable business facts that the user explicitly states during the concept demo, such as business type, city, payment channels or a preference. This memory is local to this demo device.',parametersJsonSchema:{type:'object',properties:{business_type:{type:'string'},city:{type:'string'},payment_channels:{type:'array',items:{type:'string'}},preference:{type:'string'},note:{type:'string'}},additionalProperties:false}}
];

export async function executeGanacsiTool(name,args={}){
  const bridge=window.GanacsiAssistantBridge;
  if(!bridge)return {ok:false,error:'ganacsi-bridge-unavailable'};
  if(name==='get_business_context')return {ok:true,context:bridge.getBusinessContext()};
  if(name==='navigate_to_target')return bridge.navigateToTarget(args.target_id);
  if(name==='remember_business_profile')return bridge.rememberBusinessProfile(args);
  return {ok:false,error:'unknown-tool'};
}
