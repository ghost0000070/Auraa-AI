import { collection, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { HttpsCallableResult } from 'firebase/functions';

export class AITeamDebugger {
  testCommunications() {
      throw new Error('Method not implemented.');
  }
  testTaskingSystem() {
      throw new Error('Method not implemented.');
  }
  testDeployment() {
      throw new Error('Method not implemented.');
  }
  testVertexAI() {
      throw new Error('Method not implemented.');
  }
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
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`💥 ${coll} exception:`, error);
        results[coll] = {
          accessible: false,
          error: error.message,
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
        const result: HttpsCallableResult<unknown> = await cloudFunction({ test: true });

        results[functionName] = {
          accessible: true,
          error: null,
          response: result.data ? 'Responded' : 'No response'
        };

        console.log(`✅ ${functionName}: Available`);
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`💥 ${functionName} exception:`, error);
        results[functionName] = {
          accessible: false,
          error: error.message,
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
      const result: HttpsCallableResult<unknown> = await workflowExecution({
        workflowId,
        userId: 'test-user-id',
        dryRun: true // Add dry run flag for testing
      });

      console.log('📡 Workflow execution test result:', { data: result.data });

      return {
        success: true,
        data: result.data
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('💥 Workflow execution test exception:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testAIPersonalities() {
    console.log('🤖 Testing AI personalities...');

    const testPrompt = 'What is the meaning of life?';

    for (const employee of aiEmployeeTemplates.slice(0, 3)) {
      try {
        console.log(`🧪 Testing personality: ${employee.personality}`);

        const response = await fetch('/api/generate-chat-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: testPrompt, personality: employee.personality })
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`🎨 ${employee.name} responded:`, data.completion.text);

      } catch (err: unknown) {
        const error = err as Error;
        console.error(`💥 Error testing ${employee.name}:`, error);
      }
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

    // Test AI personalities
    await this.testAIPersonalities();

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

    return diagnostics;
  }
}

// Export singleton instance
export const aiTeamDebugger = AITeamDebugger.getInstance();
