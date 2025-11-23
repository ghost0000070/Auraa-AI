const { mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};
exports.connectorConfig = connectorConfig;

const createAgentTaskRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateAgentTask', inputVars);
}
createAgentTaskRef.operationName = 'CreateAgentTask';
exports.createAgentTaskRef = createAgentTaskRef;

exports.createAgentTask = function createAgentTask(dcOrVars, vars) {
  return executeMutation(createAgentTaskRef(dcOrVars, vars));
};
