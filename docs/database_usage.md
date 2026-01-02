# Supabase Database Usage Guide

This document provides a comprehensive guide to how this project uses Supabase for data storage and management. It covers the main data models, common operations, and security policies.

## Data Models

Our Supabase database is organized into several key tables:

- **`users`**: Stores user-specific information, including authentication details and links to other data, like their Stripe customer ID.
  - *Fields*: `id`, `email`, `stripe_customer_id`, etc.

- **`ai_employees`**: Contains the records of all deployed AI employees. Each row represents a unique, active AI agent.
  - *Fields*: `user_id`, `name`, `deployment_config`, `status`, `created_at`.

- **`deployment_requests`**: Tracks requests to deploy new AI employees. This table serves as a log and a queue for the deployment process.
  - *Fields*: `user_id`, `template_id`, `status` ('pending', 'approved', 'failed'), `created_at`.

- **`ai_employee_templates`**: Stores the templates for the different types of AI employees that can be deployed.
  - *Fields*: `id`, `name`, `department`, `description`, `cost`.

## Common Operations

The codebase demonstrates several common Supabase operations using the Supabase JavaScript client.

### 1. Creating Records

New records are added to a table using the `.insert()` method.

**Example: Creating a new AI Employee**
When a deployment is approved, a new record is created in the `ai_employees` table.

```typescript
const { data, error } = await supabase
  .from('ai_employees')
  .insert({
    user_id: user.id,
    deployment_request_id: requestId,
    name: template.name || 'AI Employee',
    status: 'active',
    created_at: new Date().toISOString(),
  });
```

### 2. Updating Records

The `.update()` method is used to modify specific fields on existing records.

**Example: Updating a Deployment Request Status**
After an AI employee is successfully created, the original request's status is updated to 'approved'.

```typescript
const { error } = await supabase
  .from('deployment_requests')
  .update({ status: 'approved' })
  .eq('id', requestId);
```

### 3. Querying Records

Supabase provides a powerful query interface for filtering and sorting data.

**Example: Fetching User's AI Employees**
```typescript
const { data, error } = await supabase
  .from('ai_employees')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

## Security Policies

Supabase uses Row Level Security (RLS) policies to protect data from unauthorized access. Policies are defined at the database level and enforce access control for each table.

A common pattern is to allow users to only read and write their own data.

**Example: Restricting Access to User Data**

```sql
-- Users can only access their own user record
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can only manage their own AI employees
CREATE POLICY "Users can manage own AI employees"
ON ai_employees FOR ALL
USING (auth.uid() = user_id);
```

*Note: RLS policies are configured in the Supabase dashboard or via SQL migrations.*
