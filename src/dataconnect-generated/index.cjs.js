const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'operations1',
  service: 'auraa-ai-69-3-service',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser');
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dc) {
  return executeMutation(createUserRef(dc));
};

const listSkillsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSkills');
}
listSkillsRef.operationName = 'ListSkills';
exports.listSkillsRef = listSkillsRef;

exports.listSkills = function listSkills(dc) {
  return executeQuery(listSkillsRef(dc));
};

const assignSkillToAiEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignSkillToAIEmployee', inputVars);
}
assignSkillToAiEmployeeRef.operationName = 'AssignSkillToAIEmployee';
exports.assignSkillToAiEmployeeRef = assignSkillToAiEmployeeRef;

exports.assignSkillToAiEmployee = function assignSkillToAiEmployee(dcOrVars, vars) {
  return executeMutation(assignSkillToAiEmployeeRef(dcOrVars, vars));
};

const listTasksForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTasksForUser', inputVars);
}
listTasksForUserRef.operationName = 'ListTasksForUser';
exports.listTasksForUserRef = listTasksForUserRef;

exports.listTasksForUser = function listTasksForUser(dcOrVars, vars) {
  return executeQuery(listTasksForUserRef(dcOrVars, vars));
};
