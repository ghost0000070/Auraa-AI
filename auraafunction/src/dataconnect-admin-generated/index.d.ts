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

export interface AssignSkillToAiEmployeeData {
  aiEmployeeSkill_insert: AiEmployeeSkill_Key;
}

export interface AssignSkillToAiEmployeeVariables {
  aiEmployeeId: UUIDString;
  skillId: UUIDString;
}

export interface CreateAgentTaskData {
  agentTask_insert: AgentTask_Key;
}

export interface CreateAgentTaskVariables {
  prompt: string;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeploymentRequest_Key {
  id: UUIDString;
  __typename?: 'DeploymentRequest_Key';
}

export interface ListAgentTasksData {
  agentTasks: ({
    id: UUIDString;
    prompt: string;
    status?: string | null;
    result?: string | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & AgentTask_Key)[];
}

export interface ListSkillsData {
  skills: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    category?: string | null;
  } & Skill_Key)[];
}

export interface ListTasksForUserData {
  tasks: ({
    id: UUIDString;
    description: string;
    status?: string | null;
    dueDate?: TimestampString | null;
  } & Task_Key)[];
}

export interface ListTasksForUserVariables {
  userId: UUIDString;
}

export interface Purchase_Key {
  id: UUIDString;
  __typename?: 'Purchase_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
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

/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUser(options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;

/** Generated Node Admin SDK operation action function for the 'ListSkills' Query. Allow users to execute without passing in DataConnect. */
export function listSkills(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListSkillsData>>;
/** Generated Node Admin SDK operation action function for the 'ListSkills' Query. Allow users to pass in custom DataConnect instances. */
export function listSkills(options?: OperationOptions): Promise<ExecuteOperationResponse<ListSkillsData>>;

/** Generated Node Admin SDK operation action function for the 'AssignSkillToAiEmployee' Mutation. Allow users to execute without passing in DataConnect. */
export function assignSkillToAiEmployee(dc: DataConnect, vars: AssignSkillToAiEmployeeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AssignSkillToAiEmployeeData>>;
/** Generated Node Admin SDK operation action function for the 'AssignSkillToAiEmployee' Mutation. Allow users to pass in custom DataConnect instances. */
export function assignSkillToAiEmployee(vars: AssignSkillToAiEmployeeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AssignSkillToAiEmployeeData>>;

/** Generated Node Admin SDK operation action function for the 'ListTasksForUser' Query. Allow users to execute without passing in DataConnect. */
export function listTasksForUser(dc: DataConnect, vars: ListTasksForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListTasksForUserData>>;
/** Generated Node Admin SDK operation action function for the 'ListTasksForUser' Query. Allow users to pass in custom DataConnect instances. */
export function listTasksForUser(vars: ListTasksForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListTasksForUserData>>;

/** Generated Node Admin SDK operation action function for the 'CreateAgentTask' Mutation. Allow users to execute without passing in DataConnect. */
export function createAgentTask(dc: DataConnect, vars: CreateAgentTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAgentTaskData>>;
/** Generated Node Admin SDK operation action function for the 'CreateAgentTask' Mutation. Allow users to pass in custom DataConnect instances. */
export function createAgentTask(vars: CreateAgentTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAgentTaskData>>;

/** Generated Node Admin SDK operation action function for the 'ListAgentTasks' Query. Allow users to execute without passing in DataConnect. */
export function listAgentTasks(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAgentTasksData>>;
/** Generated Node Admin SDK operation action function for the 'ListAgentTasks' Query. Allow users to pass in custom DataConnect instances. */
export function listAgentTasks(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAgentTasksData>>;

