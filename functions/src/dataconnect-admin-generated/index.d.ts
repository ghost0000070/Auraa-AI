import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AgentTask_Key {
  id: UUIDString;
  __typename?: 'AgentTask_Key';
}

export interface AiEmployeeSkill_Key {
  aiEmployeeId: UUIDString;
  skillId: UUIDString;
  __typename?: 'AiEmployeeSkill_Key';
}

export interface AiEmployee_Key {
  id: UUIDString;
  __typename?: 'AiEmployee_Key';
}

export interface BusinessGoal_Key {
  id: UUIDString;
  __typename?: 'BusinessGoal_Key';
}

export interface CreateAgentTaskData {
  agentTask_insert: AgentTask_Key;
}

export interface CreateAgentTaskVariables {
  prompt: string;
}

export interface DeploymentRequest_Key {
  id: UUIDString;
  __typename?: 'DeploymentRequest_Key';
}

export interface Purchase_Key {
  id: UUIDString;
  __typename?: 'Purchase_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface SharedKnowledge_Key {
  id: UUIDString;
  __typename?: 'SharedKnowledge_Key';
}

export interface Skill_Key {
  id: UUIDString;
  __typename?: 'Skill_Key';
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateAgentTask' Mutation. Allow users to execute without passing in DataConnect. */
export function createAgentTask(dc: DataConnect, vars: CreateAgentTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAgentTaskData>>;
/** Generated Node Admin SDK operation action function for the 'CreateAgentTask' Mutation. Allow users to pass in custom DataConnect instances. */
export function createAgentTask(vars: CreateAgentTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAgentTaskData>>;

