import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export class AITeamDebugger {
  private static instance: AITeamDebugger;
  
  static getInstance(): AITeamDebugger {
    if (!AITeamDebugger.instance) {
      AITeamDebugger.instance = new AITeamDebugger();
    }
    return AITeamDebugger.instance;
  }

  async testDatabaseConnections() {
    console.log('🔍 Testing database connections...');
    
    const tables = [
      'workflows',
      'ai_team_executions', 
      'ai_team_communications',
      'business_goals',
      'ai_shared_knowledge',
      'external_integrations',
      'business_intelligence'
    ] as const;

    interface TableTestResult {
      accessible: boolean;
      error: string | null;
      recordCount: number;
      sampleData: string;
    }
    const results: Record<string, TableTestResult> = {};

    for (const table of tables) {
      try {
        console.log(`📊 Testing ${table}...`);
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);

        results[table] = {
          accessible: !error,
          error: error?.message || null,
          recordCount: count || 0,
          sampleData: data?.length > 0 ? 'Available' : 'Empty'
        };

        if (error) {
          console.error(`❌ ${table} error:`, error);
        } else {
          console.log(`✅ ${table}: ${count} records`);
        }
      } catch (err) {
        console.error(`💥 ${table} exception:`, err);
        results[table] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          recordCount: 0,
          sampleData: 'Unavailable'
        };
      }
    }

    console.log('📋 Database connection test results:', results);
    return results;
  }

  async testEdgeFunctions() {
    console.log('🔍 Testing edge functions...');
    
    const functions = [
      'workflow-execution',
      'business-sync',
      'ai-chat'
    ];

    interface FunctionTestResult {
      accessible: boolean;
      error: string | null;
      response: string;
    }
    const results: Record<string, FunctionTestResult> = {};

    for (const functionName of functions) {
      try {
        console.log(`🚀 Testing ${functionName}...`);
        
        // Test function availability with minimal payload
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { test: true }
        });

        results[functionName] = {
          accessible: !error,
          error: error?.message || null,
          response: data ? 'Responded' : 'No response'
        };

        if (error) {
          console.error(`❌ ${functionName} error:`, error);
        } else {
          console.log(`✅ ${functionName}: Available`);
        }
      } catch (err) {
        console.error(`💥 ${functionName} exception:`, err);
        results[functionName] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          response: 'Unavailable'
        };
      }
    }

    console.log('📋 Edge function test results:', results);
    return results;
  }

  async testWorkflowExecution(workflowId?: string) {
    if (!workflowId) {
      console.log('⚠️ No workflow ID provided for execution test');
      return { success: false, error: 'No workflow ID provided' };
    }

    try {
      console.log(`🚀 Testing workflow execution: ${workflowId}`);
      
      const { data, error } = await supabase.functions.invoke('workflow-execution', {
        body: {
          workflowId,
          userId: 'test-user-id',
          dryRun: true // Add dry run flag for testing
        }
      });

      console.log('📡 Workflow execution test result:', { data, error });
      
      return {
        success: !error,
        error: error?.message || null,
        data
      };
    } catch (err) {
      console.error('💥 Workflow execution test exception:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async runFullDiagnostics() {
    console.log('🔬 Starting full AI team diagnostics...');
    
    const startTime = Date.now();
    
    // Test database connections first
    console.log('📊 Testing database connections...');
    const dbResults = await this.testDatabaseConnections();
    
    // Test edge functions
    console.log('🚀 Testing edge functions...');
    const functionResults = await this.testEdgeFunctions();
    
    // Test specific API endpoints that are failing
    console.log('🔍 Testing specific API endpoints...');
    const apiTests = await this.testSpecificAPIs();

    const diagnostics = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      database: dbResults,
      edgeFunctions: functionResults,
      apiEndpoints: apiTests,
      summary: {
        databaseTablesAccessible: Object.values(dbResults).filter(r => r.accessible).length,
        totalDatabaseTables: Object.keys(dbResults).length,
        edgeFunctionsAccessible: Object.values(functionResults).filter(r => r.accessible).length,
        totalEdgeFunctions: Object.keys(functionResults).length,
        apiEndpointsWorking: Object.values(apiTests).filter(r => r.working).length,
        totalAPIEndpoints: Object.keys(apiTests).length
      }
    };

    console.log('📊 Full diagnostics completed:', diagnostics);
    
    // Show user-friendly summary
    const dbSuccess = diagnostics.summary.databaseTablesAccessible;
    const dbTotal = diagnostics.summary.totalDatabaseTables;
    const fnSuccess = diagnostics.summary.edgeFunctionsAccessible;
    const fnTotal = diagnostics.summary.totalEdgeFunctions;
    const apiSuccess = diagnostics.summary.apiEndpointsWorking;
    const apiTotal = diagnostics.summary.totalAPIEndpoints;

    toast({
      title: 'AI Team Diagnostics Complete',
      description: `Database: ${dbSuccess}/${dbTotal} accessible. Functions: ${fnSuccess}/${fnTotal} accessible. APIs: ${apiSuccess}/${apiTotal} working.`,
      variant: dbSuccess === dbTotal && fnSuccess === fnTotal && apiSuccess === apiTotal ? 'default' : 'destructive'
    });

    return diagnostics;
  }

  async testSpecificAPIs() {
    console.log('🔍 Testing specific API endpoints...');

    type TableName = 'workflows' | 'ai_team_communications' | 'ai_team_executions' | 'business_goals' | 'subscribers';

    const apis: Array<{ name: string; endpoint: TableName }> = [
      { name: 'workflows', endpoint: 'workflows' },
      { name: 'ai_team_communications', endpoint: 'ai_team_communications' },
      { name: 'ai_team_executions', endpoint: 'ai_team_executions' },
      { name: 'business_goals', endpoint: 'business_goals' },
      { name: 'subscribers', endpoint: 'subscribers' }
    ];

    interface APITestResult {
      working: boolean;
      error: string | null;
      hasData: boolean;
      endpoint: string;
    }
    const results: Record<string, APITestResult> = {};

    for (const api of apis) {
      try {
        console.log(`🧪 Testing ${api.name} API...`);
        const table = api.endpoint as Parameters<typeof supabase.from>[0];
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        results[api.name] = {
          working: !error,
          error: error?.message || null,
          hasData: data && data.length > 0,
          endpoint: api.endpoint
        };

        if (error) {
          console.error(`❌ ${api.name} API error:`, error);
        } else {
          console.log(`✅ ${api.name} API: Working`);
        }
      } catch (err) {
        console.error(`💥 ${api.name} API exception:`, err);
        results[api.name] = {
          working: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          hasData: false,
          endpoint: api.endpoint
        };
      }
    }

    console.log('📋 API test results:', results);
    return results;
  }
}

// Export singleton instance
export const aiTeamDebugger = AITeamDebugger.getInstance();