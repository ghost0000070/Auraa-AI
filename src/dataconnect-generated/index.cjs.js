const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const TaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
}
exports.TaskStatus = TaskStatus;

const connectorConfig = {
  connector: 'example',
  service: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dcOrVars, vars) {
  return executeMutation(createUserRef(dcOrVars, vars));
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
  return mutationRef(dcInstance, 'AssignSkillToAiEmployee', inputVars);
}
assignSkillToAiEmployeeRef.operationName = 'AssignSkillToAiEmployee';
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

const listAgentTasksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAgentTasks');
}
listAgentTasksRef.operationName = 'ListAgentTasks';
exports.listAgentTasksRef = listAgentTasksRef;

exports.listAgentTasks = function listAgentTasks(dc) {
  return executeQuery(listAgentTasksRef(dc));
};
