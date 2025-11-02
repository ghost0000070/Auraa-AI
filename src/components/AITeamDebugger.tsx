import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AITeamDebugger as Debugger } from '@/utils/aiTeamDebugger';

interface TestResults {
  [key: string]: {
    accessible: boolean;
    error: string | null;
    response: string;
  };
}

export const AITeamDebugger: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setResults(null);
    const debuggerInstance = new Debugger();
    const testResults = await debuggerInstance.testCloudFunctions();
    setResults(testResults);
    setIsTesting(false);
  };

  useEffect(() => {
    handleTest();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Team Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleTest} disabled={isTesting}>
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Test Backend Functions
        </Button>

        {results && (
          <div className="mt-4 space-y-2">
            {Object.entries(results).map(([functionName, result]) => (
              <div key={functionName} className="flex items-center justify-between p-2 border rounded">
                <span className="font-mono text-sm">{functionName}</span>
                <div className="flex items-center">
                  {result.accessible ? (
                    <CheckCircle className="text-green-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  {result.error && <span className="ml-2 text-xs text-red-500">{result.error}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
