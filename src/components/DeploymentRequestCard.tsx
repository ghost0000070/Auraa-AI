import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db, functions } from '@/firebase'; // Import db and functions from firebase.ts
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc } from 'firebase/firestore'; // Firestore operations
import { httpsCallable } from 'firebase/functions'; // For calling Firebase Functions
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { AIEmployeeTemplate } from '@/lib/ai-employee-templates'; // Import the unified AIEmployeeTemplate

interface DeploymentRequestCardProps {
  employee: AIEmployeeTemplate; // Use the unified interface
}

export const DeploymentRequestCard: React.FC<DeploymentRequestCardProps> = ({ employee }) => {
  const { user, subscriptionStatus } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentNotes, setDeploymentNotes] = useState('');

  const handleDeploymentRequest = async (): Promise<void> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to deploy AI employees.",
        variant: "destructive"
      });
      return;
    }

    if (!subscriptionStatus?.subscribed) {
      toast({
        title: "Subscription Required",
        description: "Please upgrade to deploy AI employees.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      let businessProfileId: string;

      // 1. Check for existing business profile or create a new one
      const businessProfilesRef = collection(db, 'business_profiles');
      const q = query(businessProfilesRef, where('user_id', '==', user.id), where('is_active', '==', true));
      const existingProfilesSnap = await getDocs(q);

      if (!existingProfilesSnap.empty) {
        businessProfileId = existingProfilesSnap.docs[0].id;
      } else {
        const newProfileData = {
          user_id: user.id,
          name: `${user.email?.split('@')[0] || 'User'}'s Business`,
          is_active: true, // Assuming new profiles are active by default
          created_at: serverTimestamp(),
        };
        const newProfileRef = await addDoc(businessProfilesRef, newProfileData);
        businessProfileId = newProfileRef.id;
      }

      let templateDocId: string;

      // 2. Check for existing AI helper template or create a new one
      const aiHelperTemplatesRef = collection(db, 'ai_helper_templates');
      const templateQ = query(aiHelperTemplatesRef, where('name', '==', employee.name));
      const existingTemplateSnap = await getDocs(templateQ);

      if (!existingTemplateSnap.empty) {
        templateDocId = existingTemplateSnap.docs[0].id;
      } else {
        const newTemplateData = {
          name: employee.name,
          description: employee.description,
          category: employee.category, // Use category from employee template
          color_scheme: employee.color,
          prompt_template: `You are ${employee.name}, a ${employee.category} expert. ${employee.description}`,
          capabilities: employee.skills,
          user_id: user.id,
          model: employee.model, // Store the model type
          deploymentCost: employee.deploymentCost,
          monthlyCost: employee.monthlyCost,
          isPremium: employee.isPremium,
          trainingData: employee.trainingData,
          apiEndpoints: employee.apiEndpoints,
          created_at: serverTimestamp(),
        };
        const newTemplateRef = await addDoc(aiHelperTemplatesRef, newTemplateData);
        templateDocId = newTemplateRef.id;
      }

      // 3. Create a new AI employee deployment request in Firestore
      const deploymentRequestsRef = collection(db, 'aiEmployeeDeploymentRequests');
      const deploymentRequestData = {
        user_id: user.id,
        ai_helper_template_id: templateDocId,
        business_profile_id: businessProfileId,
        deployment_config: {
          notes: deploymentNotes,
        },
        status: 'pending', // Initial status
        created_at: serverTimestamp(),
      };
      const newDeploymentRequestRef = await addDoc(deploymentRequestsRef, deploymentRequestData);
      const deploymentRequestId = newDeploymentRequestRef.id;

      // 4. If Enterprise tier, directly invoke Firebase Function for auto-approval
      if (subscriptionStatus?.subscription_tier === 'Enterprise') {
        const deployAiEmployeeFunction = httpsCallable(functions, 'deployAiEmployee');
        const result = await deployAiEmployeeFunction({ deploymentRequestId: deploymentRequestId });
        
        // The Firebase Function should return success/failure in result.data
        if ((result.data as any)?.success) {
          toast({ title: "Employee Deployed!", description: `${employee.name} is now active.` });
        } else {
          toast({ title: "Deployment Submitted", description: "Auto-approval failed, manual review required." });
        }
      } else {
        toast({ title: "Deployment Requested", description: "Your request has been submitted for review." });
      }

      setIsOpen(false);
      setDeploymentNotes('');

    } catch (error: any) {
      console.error("Deployment Error:", error);
      toast({
        title: "Deployment Failed",
        description: error.message || "An unexpected error occurred during deployment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Using employee.category and employee.model directly from the unified template
  // Note: The 'role' prop in the old interface is replaced by 'category'

  return (
    <Card className="hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer group border-2 border-slate-700/50 hover:border-primary/30 backdrop-blur-sm overflow-hidden bg-slate-800/50">
      <div className="relative">
        <div className="h-[300px] w-full bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden flex items-center justify-center p-4">
          <img 
            src={employee.avatar} // Assuming 'avatar' is still part of the template or can be derived
            alt={`${employee.name} - AI Employee`}
            className="max-w-[80%] max-h-[90%] object-contain group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
          {employee.isPremium && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg animate-pulse">
              <CheckCircle className="w-3 h-3 mr-1 fill-current" />
              Premium
            </Badge>
          )}
          <div className="absolute bottom-3 left-3">
            <div className={`w-12 h-12 ${employee.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
              {/* Assuming employee.icon is a React.ReactNode as before */}
              {employee.icon && React.createElement(employee.icon as React.ElementType, { className: 'w-6 h-6' })}
            </div>
          </div>
        </div>
      </div>
      
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          {employee.name}
        </CardTitle>
        <CardDescription className="font-medium text-primary/80">
          {employee.category} {/* Use category instead of role */}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {employee.description}
        </p>
        
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-primary mb-2">Core Skills:</h4>
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{employee.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all" 
                disabled={!subscriptionStatus?.subscribed}
              >
                <Zap className="w-4 h-4 mr-2" />
                {subscriptionStatus?.subscribed ? 'Deploy Employee' : 'Upgrade Required'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${employee.color} rounded-full flex items-center justify-center text-white`}>
                    {/* Assuming employee.icon is a React.ReactNode as before */}
                    {employee.icon && React.createElement(employee.icon as React.ElementType, { className: 'w-4 h-4' })}
                  </div>
                  Deploy {employee.name}
                </DialogTitle>
                <DialogDescription>
                  Submit a deployment request for {employee.name} to join your AI team.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Deployment Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific requirements or use cases for this employee..."
                    value={deploymentNotes}
                    onChange={(e) => setDeploymentNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    Deployment Details
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Employee will be reviewed within 24 hours</li>
                    <li>• Deployment includes full integration with your business context</li>
                    <li>• Employee can be customized after deployment</li>
                    {subscriptionStatus?.subscription_tier === 'Enterprise' && (
                      <li>• ⚡ Enterprise: Instant deployment available</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeploymentRequest}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Deploy
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};