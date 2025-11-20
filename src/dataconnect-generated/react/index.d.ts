import { CreateUserData, CreateUserVariables, ListSkillsData, AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables, ListTasksForUserData, ListTasksForUserVariables, CreateAgentTaskData, CreateAgentTaskVariables, ListAgentTasksData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, CreateUserVariables>): UseDataConnectMutationResult<CreateUserData, CreateUserVariables>;

export function useListSkills(options?: useDataConnectQueryOptions<ListSkillsData>): UseDataConnectQueryResult<ListSkillsData, undefined>;
export function useListSkills(dc: DataConnect, options?: useDataConnectQueryOptions<ListSkillsData>): UseDataConnectQueryResult<ListSkillsData, undefined>;

export function useAssignSkillToAiEmployee(options?: useDataConnectMutationOptions<AssignSkillToAiEmployeeData, FirebaseError, AssignSkillToAiEmployeeVariables>): UseDataConnectMutationResult<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
export function useAssignSkillToAiEmployee(dc: DataConnect, options?: useDataConnectMutationOptions<AssignSkillToAiEmployeeData, FirebaseError, AssignSkillToAiEmployeeVariables>): UseDataConnectMutationResult<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;

export function useListTasksForUser(vars: ListTasksForUserVariables, options?: useDataConnectQueryOptions<ListTasksForUserData>): UseDataConnectQueryResult<ListTasksForUserData, ListTasksForUserVariables>;
export function useListTasksForUser(dc: DataConnect, vars: ListTasksForUserVariables, options?: useDataConnectQueryOptions<ListTasksForUserData>): UseDataConnectQueryResult<ListTasksForUserData, ListTasksForUserVariables>;

export function useCreateAgentTask(options?: useDataConnectMutationOptions<CreateAgentTaskData, FirebaseError, CreateAgentTaskVariables>): UseDataConnectMutationResult<CreateAgentTaskData, CreateAgentTaskVariables>;
export function useCreateAgentTask(dc: DataConnect, options?: useDataConnectMutationOptions<CreateAgentTaskData, FirebaseError, CreateAgentTaskVariables>): UseDataConnectMutationResult<CreateAgentTaskData, CreateAgentTaskVariables>;

export function useListAgentTasks(options?: useDataConnectQueryOptions<ListAgentTasksData>): UseDataConnectQueryResult<ListAgentTasksData, undefined>;
export function useListAgentTasks(dc: DataConnect, options?: useDataConnectQueryOptions<ListAgentTasksData>): UseDataConnectQueryResult<ListAgentTasksData, undefined>;
