import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const TaskStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
}

export const connectorConfig = {
  connector: 'example',
  service: 'auraa-ai-69-service',
  location: 'northamerica-northeast1'
};

export const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';

export function createUser(dcOrVars, vars) {
  return executeMutation(createUserRef(dcOrVars, vars));
}

export const listSkillsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListSkills');
}
listSkillsRef.operationName = 'ListSkills';

export function listSkills(dc) {
  return executeQuery(listSkillsRef(dc));
}

export const assignSkillToAiEmployeeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AssignSkillToAiEmployee', inputVars);
}
assignSkillToAiEmployeeRef.operationName = 'AssignSkillToAiEmployee';

export function assignSkillToAiEmployee(dcOrVars, vars) {
  return executeMutation(assignSkillToAiEmployeeRef(dcOrVars, vars));
}

export const listTasksForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTasksForUser', inputVars);
}
listTasksForUserRef.operationName = 'ListTasksForUser';

export function listTasksForUser(dcOrVars, vars) {
  return executeQuery(listTasksForUserRef(dcOrVars, vars));
}

export const createAgentTaskRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateAgentTask', inputVars);
}
createAgentTaskRef.operationName = 'CreateAgentTask';

export function createAgentTask(dcOrVars, vars) {
  return executeMutation(createAgentTaskRef(dcOrVars, vars));
}

export const listAgentTasksRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAgentTasks');
}
listAgentTasksRef.operationName = 'ListAgentTasks';

export function listAgentTasks(dc) {
  return executeQuery(listAgentTasksRef(dc));
}

