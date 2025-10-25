import { collection, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
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

    const collections = [
      'workflows',
      'aiTeamExecutions',
      'aiTeamCommunications',
      'businessGoals',
      'aiSharedKnowledge',
      'externalIntegrations',
      'businessIntelligence'
    ] as const;

    interface CollectionTestResult {
      accessible: boolean;
      error: string | null;
      recordCount: number;
      sampleData: string;
    }
    const results: Record<string, CollectionTestResult> = {};

    for (const coll of collections) {
      try {
        console.log(`📊 Testing ${coll}...`);
        const q = query(collection(db, coll), limit(1));
        const snapshot = await getDocs(q);

        results[coll] = {
          accessible: true,
          error: null,
          recordCount: snapshot.size,
          sampleData: snapshot.docs.length > 0 ? 'Available' : 'Empty'
        };

        console.log(`✅ ${coll}: ${snapshot.size} records (queried 1)`);
      } catch (err:any) {
        console.error(`💥 ${coll} exception:`, err);
        results[coll] = {
          accessible: false,
          error: err.message,
          recordCount: 0,
          sampleData: 'Unavailable'
        };
      }
    }

    console.log('📋 Database connection test results:', results);
    return results;
  }

  async testCloudFunctions() {
    console.log('🔍 Testing cloud functions...');

    const functionNames = [
      'workflowExecution',
      'businessSync',
      'aiChat'
    ];

    interface FunctionTestResult {
      accessible: boolean;
      error: string | null;
      response: string;
    }
    const results: Record<string, FunctionTestResult> = {};

    for (const functionName of functionNames) {
      try {
        console.log(`🚀 Testing ${functionName}...`);

        const cloudFunction = httpsCallable(functions, functionName);
        const result = await cloudFunction({ test: true });

        results[functionName] = {
          accessible: true,
          error: null,
          response: result.data ? 'Responded' : 'No response'
        };

        console.log(`✅ ${functionName}: Available`);
      } catch (err:any) {
        console.error(`💥 ${functionName} exception:`, err);
        results[functionName] = {
          accessible: false,
          error: err.message,
          response: 'Unavailable'
        };
      }
    }

    console.log('📋 Cloud function test results:', results);
    return results;
  }

  async testWorkflowExecution(workflowId?: string) {
    if (!workflowId) {
      console.log('⚠️ No workflow ID provided for execution test');
      return { success: false, error: 'No workflow ID provided' };
    }

    try {
      console.log(`🚀 Testing workflow execution: ${workflowId}`);

      const workflowExecution = httpsCallable(functions, 'workflowExecution');
      const result = await workflowExecution({
        workflowId,
        userId: 'test-user-id',
        dryRun: true // Add dry run flag for testing
      });

      console.log('📡 Workflow execution test result:', { data: result.data });

      return {
        success: true,
        data: result.data
      };
    } catch (err:any) {
      console.error('💥 Workflow execution test exception:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  async runFullDiagnostics() {
    console.log('🔬 Starting full AI team diagnostics...');

    const startTime = Date.now();

    // Test database connections first
    console.log('📊 Testing database connections...');
    const dbResults = await this.testDatabaseConnections();

    // Test cloud functions
    console.log('🚀 Testing cloud functions...');
    const functionResults = await this.testCloudFunctions();

    const diagnostics = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      database: dbResults,
      cloudFunctions: functionResults,
      summary: {
        databaseCollectionsAccessible: Object.values(dbResults).filter(r => r.accessible).length,
        totalDatabaseCollections: Object.keys(dbResults).length,
        cloudFunctionsAccessible: Object.values(functionResults).filter(r => r.accessible).length,
        totalCloudFunctions: Object.keys(functionResults).length
      }
    };

    console.log('📊 Full diagnostics completed:', diagnostics);

    // Show user-friendly summary
    const dbSuccess = diagnostics.summary.databaseCollectionsAccessible;
    const dbTotal = diagnostics.summary.totalDatabaseCollections;
    const fnSuccess = diagnostics.summary.cloudFunctionsAccessible;
    const fnTotal = diagnostics.summary.totalCloudFunctions;

    toast({
      title: 'AI Team Diagnostics Complete',
      description: `Database: ${dbSuccess}/${dbTotal} accessible. Functions: ${fnSuccess}/${fnTotal} accessible.`,
      variant: dbSuccess === dbTotal && fnSuccess === fnTotal ? 'default' : 'destructive'
    });

    return diagnostics;
  }
}

// Export singleton instance
export const aiTeamDebugger = AITeamDebugger.getInstance();