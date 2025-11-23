import { CreateAgentTaskData, CreateAgentTaskVariables } from '../';
import { UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateAgentTask(options?: useDataConnectMutationOptions<CreateAgentTaskData, FirebaseError, CreateAgentTaskVariables>): UseDataConnectMutationResult<CreateAgentTaskData, CreateAgentTaskVariables>;
export function useCreateAgentTask(dc: DataConnect, options?: useDataConnectMutationOptions<CreateAgentTaskData, FirebaseError, CreateAgentTaskVariables>): UseDataConnectMutationResult<CreateAgentTaskData, CreateAgentTaskVariables>;
