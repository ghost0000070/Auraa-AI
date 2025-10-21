import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AIEmployeeCardProps {
  name: string;
  role: string;
  image: string;
  skills: string[];
  variant?: "default" | "featured";
  category?: string;
  clickable?: boolean;
}

export const AIEmployeeCard = ({ 
  name, 
  role, 
  image, 
  skills, 
  variant = "default",
  clickable = false
}: AIEmployeeCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable) {
      navigate(`/ai-employee/${name.toLowerCase()}`);
    }
  };

  return (
    <Card 
      className={`
        transition-all duration-300 hover-scale ${clickable ? 'cursor-pointer' : 'cursor-default'}
        ${variant === "featured" ? "glow-primary border-primary/50" : "hover:border-accent/50"}
      `}
      onClick={handleClick}
    >
      <CardContent className="p-6 text-center">
        <div className="relative mb-6">
          <img 
            src={image} 
            alt={name}
            className="w-48 h-48 mx-auto rounded-full object-cover object-top border-4 border-primary/20"
          />
          {variant === "featured" && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 pulse-glow"
            >
              🔥 Popular
            </Badge>
          )}
        </div>
        
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <p className="text-accent font-semibold mb-4">{role}</p>
        
        <div className="text-left">
          <p className="text-sm text-muted-foreground mb-3 font-medium">What I can do:</p>
          <ul className="space-y-2">
            {skills.map((skill, index) => (
              <li key={index} className="flex items-center text-sm">
                <span className="w-2 h-2 rounded-full bg-accent mr-3 flex-shrink-0"></span>
                {skill}
              </li>
            ))}
          </ul>
          <p className="text-xs text-accent font-medium mt-4">
            and hundreds more skills...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
