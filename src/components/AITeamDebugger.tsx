import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { aiTeamDebugger } from '@/utils/aiTeamDebugger';

const AITeamDebugger = () => {
  const handleRunDiagnostics = async () => {
    const diagnostics = await aiTeamDebugger.runFullDiagnostics();
    const dbSuccess = diagnostics.summary.databaseCollectionsAccessible;
    const dbTotal = diagnostics.summary.totalDatabaseCollections;
    const fnSuccess = diagnostics.summary.cloudFunctionsAccessible;
    const fnTotal = diagnostics.summary.totalCloudFunctions;

    toast('AI Team Diagnostics Complete', {
      description: `Database: ${dbSuccess}/${dbTotal} accessible. Functions: ${fnSuccess}/${fnTotal} accessible.`,
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">AI Team Debugger</h2>
      <Button onClick={handleRunDiagnostics}>Run Full Diagnostics</Button>
    </div>
  );
};

export default AITeamDebugger;