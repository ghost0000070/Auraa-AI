import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AIEmployeeSkill_Key {
  aiEmployeeId: UUIDString;
  skillId: UUIDString;
  __typename?: 'AIEmployeeSkill_Key';
}

export interface AIEmployee_Key {
  id: UUIDString;
  __typename?: 'AIEmployee_Key';
}

export interface AssignSkillToAiEmployeeData {
  aIEmployeeSkill_insert: AIEmployeeSkill_Key;
}

export interface AssignSkillToAiEmployeeVariables {
  aiEmployeeId: UUIDString;
  skillId: UUIDString;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface ListSkillsData {
  skills: ({
    id: UUIDString;
    name: string;
    description: string;
    category: string;
  } & Skill_Key)[];
}

export interface ListTasksForUserData {
  tasks: ({
    id: UUIDString;
    description?: string | null;
    status: string;
    dueDate?: TimestampString | null;
  } & Task_Key)[];
}

export interface ListTasksForUserVariables {
  userId: UUIDString;
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
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

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

