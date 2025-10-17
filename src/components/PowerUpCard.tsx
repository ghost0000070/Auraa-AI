import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface PowerUpCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  tier_requirement: string;
  icon_name: string;
}

export const PowerUpCard = ({ 
  id, 
  name, 
  description, 
  category, 
  tier_requirement,
  icon_name 
}: PowerUpCardProps) => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();

  const hasAccess = user && (
    subscriptionStatus?.subscribed || 
    tier_requirement === 'basic'
  );

  const handleExecute = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!hasAccess) {
      toast({
        title: "Premium Required",
        description: `This power-up requires a ${tier_requirement} subscription.`,
        variant: "destructive"
      });
      return;
    }

    // Navigate to power-up execution page
    navigate(`/power-ups/${id}/execute`);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 hover:border-accent/50 transition-all duration-300 hover-scale">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {category}
              </Badge>
            </div>
          </div>
          {tier_requirement !== 'basic' && (
            <Crown className="h-4 w-4 text-amber-400" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-muted-foreground mb-4 line-clamp-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {tier_requirement} tier
          </div>
          
          <Button 
            size="sm"
            disabled={!hasAccess}
            onClick={handleExecute}
            className="ml-auto"
          >
            {!user ? 'Sign Up' : hasAccess ? 'Use Power-up' : 'Upgrade'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};