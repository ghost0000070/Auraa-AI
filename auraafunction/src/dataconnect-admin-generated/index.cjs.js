const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};
exports.connectorConfig = connectorConfig;

function createUser(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateUser', inputVars, inputOpts);
};
exports.createUser = createUser;

function listSkills(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListSkills', inputVars, inputOpts);
};
exports.listSkills = listSkills;

function assignSkillToAiEmployee(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('AssignSkillToAiEmployee', inputVars, inputOpts);
};
exports.assignSkillToAiEmployee = assignSkillToAiEmployee;

function listTasksForUser(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListTasksForUser', inputVars, inputOpts);
};
exports.listTasksForUser = listTasksForUser;

function createAgentTask(dcOrVarsOrOptions, varsOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrVarsOrOptions, varsOrOptions, options, true, true);
  dcInstance.useGen(true);
  return dcInstance.executeMutation('CreateAgentTask', inputVars, inputOpts);
};
exports.createAgentTask = createAgentTask;

function listAgentTasks(dcOrOptions, options) {
  const { dc: dcInstance, vars: inputVars, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('ListAgentTasks', inputVars, inputOpts);
};
exports.listAgentTasks = listAgentTasks;

