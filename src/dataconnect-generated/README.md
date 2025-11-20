# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListSkills*](#listskills)
  - [*ListTasksForUser*](#listtasksforuser)
  - [*ListAgentTasks*](#listagenttasks)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*AssignSkillToAiEmployee*](#assignskilltoaiemployee)
  - [*CreateAgentTask*](#createagenttask)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListSkills
You can execute the `ListSkills` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSkills(): QueryPromise<ListSkillsData, undefined>;

interface ListSkillsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSkillsData, undefined>;
}
export const listSkillsRef: ListSkillsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSkills(dc: DataConnect): QueryPromise<ListSkillsData, undefined>;

interface ListSkillsRef {
  ...
  (dc: DataConnect): QueryRef<ListSkillsData, undefined>;
}
export const listSkillsRef: ListSkillsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSkillsRef:
```typescript
const name = listSkillsRef.operationName;
console.log(name);
```

### Variables
The `ListSkills` query has no variables.
### Return Type
Recall that executing the `ListSkills` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSkillsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSkillsData {
  skills: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    category?: string | null;
  } & Skill_Key)[];
}
```
### Using `ListSkills`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSkills } from '@dataconnect/generated';


// Call the `listSkills()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSkills();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSkills(dataConnect);

console.log(data.skills);

// Or, you can use the `Promise` API.
listSkills().then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

### Using `ListSkills`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSkillsRef } from '@dataconnect/generated';


// Call the `listSkillsRef()` function to get a reference to the query.
const ref = listSkillsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSkillsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.skills);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.skills);
});
```

## ListTasksForUser
You can execute the `ListTasksForUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTasksForUser(vars: ListTasksForUserVariables): QueryPromise<ListTasksForUserData, ListTasksForUserVariables>;

interface ListTasksForUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListTasksForUserVariables): QueryRef<ListTasksForUserData, ListTasksForUserVariables>;
}
export const listTasksForUserRef: ListTasksForUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTasksForUser(dc: DataConnect, vars: ListTasksForUserVariables): QueryPromise<ListTasksForUserData, ListTasksForUserVariables>;

interface ListTasksForUserRef {
  ...
  (dc: DataConnect, vars: ListTasksForUserVariables): QueryRef<ListTasksForUserData, ListTasksForUserVariables>;
}
export const listTasksForUserRef: ListTasksForUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTasksForUserRef:
```typescript
const name = listTasksForUserRef.operationName;
console.log(name);
```

### Variables
The `ListTasksForUser` query requires an argument of type `ListTasksForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListTasksForUserVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `ListTasksForUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTasksForUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTasksForUserData {
  tasks: ({
    id: UUIDString;
    description: string;
    status?: TaskStatus | null;
    dueDate?: TimestampString | null;
  } & Task_Key)[];
}
```
### Using `ListTasksForUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTasksForUser, ListTasksForUserVariables } from '@dataconnect/generated';

// The `ListTasksForUser` query requires an argument of type `ListTasksForUserVariables`:
const listTasksForUserVars: ListTasksForUserVariables = {
  userId: ..., 
};

// Call the `listTasksForUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTasksForUser(listTasksForUserVars);
// Variables can be defined inline as well.
const { data } = await listTasksForUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTasksForUser(dataConnect, listTasksForUserVars);

console.log(data.tasks);

// Or, you can use the `Promise` API.
listTasksForUser(listTasksForUserVars).then((response) => {
  const data = response.data;
  console.log(data.tasks);
});
```

### Using `ListTasksForUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTasksForUserRef, ListTasksForUserVariables } from '@dataconnect/generated';

// The `ListTasksForUser` query requires an argument of type `ListTasksForUserVariables`:
const listTasksForUserVars: ListTasksForUserVariables = {
  userId: ..., 
};

// Call the `listTasksForUserRef()` function to get a reference to the query.
const ref = listTasksForUserRef(listTasksForUserVars);
// Variables can be defined inline as well.
const ref = listTasksForUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTasksForUserRef(dataConnect, listTasksForUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tasks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tasks);
});
```

## ListAgentTasks
You can execute the `ListAgentTasks` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAgentTasks(): QueryPromise<ListAgentTasksData, undefined>;

interface ListAgentTasksRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAgentTasksData, undefined>;
}
export const listAgentTasksRef: ListAgentTasksRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAgentTasks(dc: DataConnect): QueryPromise<ListAgentTasksData, undefined>;

interface ListAgentTasksRef {
  ...
  (dc: DataConnect): QueryRef<ListAgentTasksData, undefined>;
}
export const listAgentTasksRef: ListAgentTasksRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAgentTasksRef:
```typescript
const name = listAgentTasksRef.operationName;
console.log(name);
```

### Variables
The `ListAgentTasks` query has no variables.
### Return Type
Recall that executing the `ListAgentTasks` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAgentTasksData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListAgentTasks`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAgentTasks } from '@dataconnect/generated';


// Call the `listAgentTasks()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAgentTasks();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAgentTasks(dataConnect);

console.log(data.agentTasks);

// Or, you can use the `Promise` API.
listAgentTasks().then((response) => {
  const data = response.data;
  console.log(data.agentTasks);
});
```

### Using `ListAgentTasks`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAgentTasksRef } from '@dataconnect/generated';


// Call the `listAgentTasksRef()` function to get a reference to the query.
const ref = listAgentTasksRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAgentTasksRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.agentTasks);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.agentTasks);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation requires an argument of type `CreateUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserVariables {
  displayName?: string | null;
  email: string;
}
```
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  displayName: ..., // optional
  email: ..., 
};

// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser(createUserVars);
// Variables can be defined inline as well.
const { data } = await createUser({ displayName: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect, createUserVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser(createUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  displayName: ..., // optional
  email: ..., 
};

// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef(createUserVars);
// Variables can be defined inline as well.
const ref = createUserRef({ displayName: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect, createUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## AssignSkillToAiEmployee
You can execute the `AssignSkillToAiEmployee` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
assignSkillToAiEmployee(vars: AssignSkillToAiEmployeeVariables): MutationPromise<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;

interface AssignSkillToAiEmployeeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AssignSkillToAiEmployeeVariables): MutationRef<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
}
export const assignSkillToAiEmployeeRef: AssignSkillToAiEmployeeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
assignSkillToAiEmployee(dc: DataConnect, vars: AssignSkillToAiEmployeeVariables): MutationPromise<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;

interface AssignSkillToAiEmployeeRef {
  ...
  (dc: DataConnect, vars: AssignSkillToAiEmployeeVariables): MutationRef<AssignSkillToAiEmployeeData, AssignSkillToAiEmployeeVariables>;
}
export const assignSkillToAiEmployeeRef: AssignSkillToAiEmployeeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the assignSkillToAiEmployeeRef:
```typescript
const name = assignSkillToAiEmployeeRef.operationName;
console.log(name);
```

### Variables
The `AssignSkillToAiEmployee` mutation requires an argument of type `AssignSkillToAiEmployeeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AssignSkillToAiEmployeeVariables {
  aiEmployeeId: UUIDString;
  skillId: UUIDString;
}
```
### Return Type
Recall that executing the `AssignSkillToAiEmployee` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AssignSkillToAiEmployeeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AssignSkillToAiEmployeeData {
  aiEmployeeSkill_insert: AiEmployeeSkill_Key;
}
```
### Using `AssignSkillToAiEmployee`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, assignSkillToAiEmployee, AssignSkillToAiEmployeeVariables } from '@dataconnect/generated';

// The `AssignSkillToAiEmployee` mutation requires an argument of type `AssignSkillToAiEmployeeVariables`:
const assignSkillToAiEmployeeVars: AssignSkillToAiEmployeeVariables = {
  aiEmployeeId: ..., 
  skillId: ..., 
};

// Call the `assignSkillToAiEmployee()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await assignSkillToAiEmployee(assignSkillToAiEmployeeVars);
// Variables can be defined inline as well.
const { data } = await assignSkillToAiEmployee({ aiEmployeeId: ..., skillId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await assignSkillToAiEmployee(dataConnect, assignSkillToAiEmployeeVars);

console.log(data.aiEmployeeSkill_insert);

// Or, you can use the `Promise` API.
assignSkillToAiEmployee(assignSkillToAiEmployeeVars).then((response) => {
  const data = response.data;
  console.log(data.aiEmployeeSkill_insert);
});
```

### Using `AssignSkillToAiEmployee`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, assignSkillToAiEmployeeRef, AssignSkillToAiEmployeeVariables } from '@dataconnect/generated';

// The `AssignSkillToAiEmployee` mutation requires an argument of type `AssignSkillToAiEmployeeVariables`:
const assignSkillToAiEmployeeVars: AssignSkillToAiEmployeeVariables = {
  aiEmployeeId: ..., 
  skillId: ..., 
};

// Call the `assignSkillToAiEmployeeRef()` function to get a reference to the mutation.
const ref = assignSkillToAiEmployeeRef(assignSkillToAiEmployeeVars);
// Variables can be defined inline as well.
const ref = assignSkillToAiEmployeeRef({ aiEmployeeId: ..., skillId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = assignSkillToAiEmployeeRef(dataConnect, assignSkillToAiEmployeeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.aiEmployeeSkill_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.aiEmployeeSkill_insert);
});
```

## CreateAgentTask
You can execute the `CreateAgentTask` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createAgentTask(vars: CreateAgentTaskVariables): MutationPromise<CreateAgentTaskData, CreateAgentTaskVariables>;

interface CreateAgentTaskRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAgentTaskVariables): MutationRef<CreateAgentTaskData, CreateAgentTaskVariables>;
}
export const createAgentTaskRef: CreateAgentTaskRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createAgentTask(dc: DataConnect, vars: CreateAgentTaskVariables): MutationPromise<CreateAgentTaskData, CreateAgentTaskVariables>;

interface CreateAgentTaskRef {
  ...
  (dc: DataConnect, vars: CreateAgentTaskVariables): MutationRef<CreateAgentTaskData, CreateAgentTaskVariables>;
}
export const createAgentTaskRef: CreateAgentTaskRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createAgentTaskRef:
```typescript
const name = createAgentTaskRef.operationName;
console.log(name);
```

### Variables
The `CreateAgentTask` mutation requires an argument of type `CreateAgentTaskVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateAgentTaskVariables {
  prompt: string;
}
```
### Return Type
Recall that executing the `CreateAgentTask` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateAgentTaskData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateAgentTaskData {
  agentTask_insert: AgentTask_Key;
}
```
### Using `CreateAgentTask`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createAgentTask, CreateAgentTaskVariables } from '@dataconnect/generated';

// The `CreateAgentTask` mutation requires an argument of type `CreateAgentTaskVariables`:
const createAgentTaskVars: CreateAgentTaskVariables = {
  prompt: ..., 
};

// Call the `createAgentTask()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createAgentTask(createAgentTaskVars);
// Variables can be defined inline as well.
const { data } = await createAgentTask({ prompt: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createAgentTask(dataConnect, createAgentTaskVars);

console.log(data.agentTask_insert);

// Or, you can use the `Promise` API.
createAgentTask(createAgentTaskVars).then((response) => {
  const data = response.data;
  console.log(data.agentTask_insert);
});
```

### Using `CreateAgentTask`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createAgentTaskRef, CreateAgentTaskVariables } from '@dataconnect/generated';

// The `CreateAgentTask` mutation requires an argument of type `CreateAgentTaskVariables`:
const createAgentTaskVars: CreateAgentTaskVariables = {
  prompt: ..., 
};

// Call the `createAgentTaskRef()` function to get a reference to the mutation.
const ref = createAgentTaskRef(createAgentTaskVars);
// Variables can be defined inline as well.
const ref = createAgentTaskRef({ prompt: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createAgentTaskRef(dataConnect, createAgentTaskVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.agentTask_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.agentTask_insert);
});
```

