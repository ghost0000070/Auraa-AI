import { collection, getDocs, limit, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { HttpsCallableResult } from 'firebase/functions';

export class AITeamDebugger {
  private static instance: AITeamDebugger;

  static getInstance(): AITeamDebugger {
    if (!AITeamDebugger.instance) {
      AITeamDebugger.instance = new AITeamDebugger();
    }
    return AITeamDebugger.instance;
  }

  async testCommunications() {
      console.log("💬 Testing AI Communication System...");
      try {
          const q = query(collection(db, 'ai_team_communications'), limit(5));
          const snap = await getDocs(q);
          console.log(`✅ Found ${snap.size} communication logs.`);
          return { success: true, count: snap.size };
      } catch (e) {
          console.error("💥 Communication System Error:", e);
          return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
  }

  async testTaskingSystem() {
      console.log("⚡ Testing Tasking System (via analyzeMarketingData)...");
      try {
          const fn = httpsCallable(functions, 'analyzeMarketingData');
          // Sending a valid mock payload to ensure the AI has something to process
          const result = await fn({ 
              test: true, 
              metrics: { spend: 1000, revenue: 5000 },
              channel: "Social Media" 
          });
          console.log("✅ Task System Response:", result.data);
          return { success: true, result: result.data };
      } catch (e) {
          console.error("💥 Task System Error:", e);
          return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
  }

  async testDeployment() {
      console.log("🚀 Testing Deployment Records...");
      try {
          const q = query(collection(db, 'aiEmployees'), limit(5));
          const snap = await getDocs(q);
          console.log(`✅ Found ${snap.size} deployed agents.`);
          return { success: true, count: snap.size };
      } catch (e) {
           console.error("💥 Deployment Record Error:", e);
           return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
  }
  
  async testVertexAI() {
      console.log("🧠 Testing AI Model Availability (Claude/Gemini)...");
      try {
          const fn = httpsCallable(functions, 'aiChat');
          const result = await fn({ prompt: "System Status Check", personality: "System Admin" });
          console.log("✅ AI Model Response:", result.data);
          return { success: true, result: result.data };
      } catch (e) {
          console.error("💥 AI Model Error:", e);
          return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
  }

  async testDatabaseConnections() {
    console.log('🔍 Testing database connections...');

    const collections = [
      'workflows',
      'aiTeamExecutions',
      'ai_team_communications',
      'businessGoals',
      'aiSharedKnowledge',
      'externalIntegrations',
      'businessIntelligence',
      'agent_tasks',
      'agent_metrics',
      'aiEmployees'
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

        // UPDATED: Use Firebase Functions callable instead of fetch API
        const generateChat = httpsCallable(functions, 'generateChatCompletion');
        const result = await generateChat({ 
            prompt: testPrompt, 
            personality: employee.personality 
        });

        const data = result.data as { completion: { text: string } };
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
    
    // Test Specific Subsystems
    await this.testCommunications();
    await this.testTaskingSystem();
    await this.testDeployment();
    await this.testVertexAI();

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
