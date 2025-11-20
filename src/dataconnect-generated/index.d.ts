import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
};



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

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  displayName?: string | null;
  email: string;
}

export interface DeploymentRequest_Key {
  id: UUIDString;
  __typename?: 'DeploymentRequest_Key';
}

export interface ListAgentTasksData {
  agentTasks: ({
    id: UUIDString;
    prompt: string;
    status?: TaskStatus | null;
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
    status?: TaskStatus | null;
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

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface ListSkillsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSkillsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSkillsData, undefined>;
  operationName: string;
}
export const listSkillsRef: ListSkillsRef;

export function listSkills(): QueryPromise<ListSkillsData, undefined>;
export function listSkills(dc: DataConnect): QueryPromise<ListSkillsData, undefined>;

interface AssignSkillToAiEmployeeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignSkillToAiEmployeeVariables): MutationRef<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AssignSkillToAiEmployeeVariables): MutationRef<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
  operationName: string;
}
export const assignSkillToAiEmployeeRef: AssignSkillToAiEmployeeRef;

export function assignSkillToAiEmployee(vars: AssignSkillToAiEmployeeVariables): MutationPromise<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
export function assignSkillToAiEmployee(dc: DataConnect, vars: AssignSkillToAiEmployeeVariables): MutationPromise<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;

interface ListTasksForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListTasksForUserVariables): QueryRef<ListTasksForUserData, ListTasksForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListTasksForUserVariables): QueryRef<ListTasksForUserData, ListTasksForUserVariables>;
  operationName: string;
}
export const listTasksForUserRef: ListTasksForUserRef;

export function listTasksForUser(vars: ListTasksForUserVariables): QueryPromise<ListTasksForUserData, ListTasksForUserVariables>;
export function listTasksForUser(dc: DataConnect, vars: ListTasksForUserVariables): QueryPromise<ListTasksForUserData, ListTasksForUserVariables>;

interface CreateAgentTaskRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAgentTaskVariables): MutationRef<CreateAgentTaskData, CreateAgentTaskVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateAgentTaskVariables): MutationRef<CreateAgentTaskData, CreateAgentTaskVariables>;
  operationName: string;
}
export const createAgentTaskRef: CreateAgentTaskRef;

export function createAgentTask(vars: CreateAgentTaskVariables): MutationPromise<CreateAgentTaskData, CreateAgentTaskVariables>;
export function createAgentTask(dc: DataConnect, vars: CreateAgentTaskVariables): MutationPromise<CreateAgentTaskData, CreateAgentTaskVariables>;

interface ListAgentTasksRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAgentTasksData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAgentTasksData, undefined>;
  operationName: string;
}
export const listAgentTasksRef: ListAgentTasksRef;

export function listAgentTasks(): QueryPromise<ListAgentTasksData, undefined>;
export function listAgentTasks(dc: DataConnect): QueryPromise<ListAgentTasksData, undefined>;

