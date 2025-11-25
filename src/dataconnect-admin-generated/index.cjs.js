const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};
exports.connectorConfig = connectorConfig;

function createAgentTask(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateAgentTask', inputVars, inputOpts);
}
exports.createAgentTask = createAgentTask;

