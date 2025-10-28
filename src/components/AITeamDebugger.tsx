import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { aiTeamDebugger } from '@/utils/aiTeamDebugger';

const AITeamDebugger = () => {
    const handleTestCommunications = async () => {
        toast({ title: "Testing Communications", description: "Dispatching a test message..." });
        try {
            const result = await aiTeamDebugger.testCommunications();
            if (result.success) {
                toast({ title: "Test Successful", description: `Test message dispatched with ID: ${result.communicationId}` });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Test Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleTestTasking = async () => {
        toast({ title: "Testing Tasking System", description: "Creating a test task..." });
        try {
            const result = await aiTeamDebugger.testTaskingSystem();
            if (result.success) {
                toast({ title: "Test Successful", description: `Test task created with ID: ${result.taskId}` });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Test Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleTestDeployment = async () => {
        toast({ title: "Testing Deployment", description: "Simulating an AI employee deployment..." });
        try {
            const result = await aiTeamDebugger.testDeployment();
            if (result.success) {
                toast({ title: "Test Successful", description: `Simulated deployment for user: ${result.userId}` });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Test Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    const handleTestVertexAI = async () => {
        toast({ title: "Testing Vertex AI", description: "Sending a test prompt..." });
        try {
            const result = await aiTeamDebugger.testVertexAI();
            if (result.success) {
                toast({ title: "Test Successful", description: `Received response from Vertex AI.` });
                console.log("Vertex AI Response:", result.response);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                title: "Test Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-4">AI Team Debugger</h2>
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleTestCommunications}>Test Communications</Button>
                <Button onClick={handleTestTasking}>Test Tasking</Button>
                <Button onClick={handleTestDeployment}>Test Deployment</Button>
                <Button onClick={handleTestVertexAI}>Test Vertex AI</Button>
            </div>
        </div>
    );
};

export default AITeamDebugger;
