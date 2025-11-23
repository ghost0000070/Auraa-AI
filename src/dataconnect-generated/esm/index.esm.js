import { mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};

export const createAgentTaskRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateAgentTask', inputVars);
}
createAgentTaskRef.operationName = 'CreateAgentTask';

export function createAgentTask(dcOrVars, vars) {
  return executeMutation(createAgentTaskRef(dcOrVars, vars));
}

