import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, User, Bot } from 'lucide-react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { TemplateIcon } from './TemplateIcon';
import { AIEngine } from '@/lib/ai-engine'; // Import client-side AI Engine

// Helper function to fetch real context data
const buildContextPayload = async (employeeId: string, userId: string, userInput: string) => {
  // 1. Basic User & Company Info (from business profile)
  let companyContext = {};
  try {
      const profileDoc = await getDoc(doc(db, 'businessProfiles', userId));
      if (profileDoc.exists()) {
          const data = profileDoc.data();
          companyContext = {
              companyName: data.name,
              industry: data.industry,
              audience: data.targetAudience
          };
      }
  } catch (e) {
      console.warn("Could not fetch business profile", e);
  }

  // 2. Dynamic Context based on Employee Role
  const specificContext: Record<string, unknown> = {};

  switch (employeeId) {
    case 'marketing-pro':
      specificContext.marketingGoals = ["increase_engagement", "brand_awareness"];
      break;
    
    case 'sales-sidekick':
      specificContext.leadStats = { recentLeads: 5, conversionRate: "2.4%" }; 
      break;

    case 'support-sentinel':
      specificContext.openTickets = 3; 
      break;

    case 'dev-companion':
        specificContext.userSystem = navigator.userAgent;
        break;
        
    default:
      break;
  }

  return {
    userInput,
    userId,
    timestamp: new Date().toISOString(),
    companyContext,
    ...specificContext
  };
};


interface ChatInterfaceProps {
  employeeType: string;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ employeeType }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const template = aiEmployeeTemplates.find(e => e.id === employeeType);

  useEffect(() => {
    const welcomeMessage = template 
      ? `Hello! I'm ${template.name}, your new ${template.category} expert. How can I assist you with your business goals today?`
      : `Hello! I'm your new AI employee. How can I help you today?`;
    
    setMessages([{ sender: 'ai', text: welcomeMessage }]);
  }, [employeeType, template]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      if (!template) {
        throw new Error("AI Employee template not found.");
      }
      
      // Build context for the AI
      const payload = await buildContextPayload(employeeType, user.uid, currentInput);
      
      // Construct a rich system context string for Puter AI
      const contextString = JSON.stringify({
          role: template.name || "AI Assistant",
          profession: template.category,
          personality: template.personality,
          skills: template.skills,
          businessContext: payload.companyContext,
          specificContext: payload
      }, null, 2);

      // Use client-side AIEngine instead of Cloud Functions
      const result = await AIEngine.generateChatCompletion(
          currentInput, 
          contextString // Passing detailed context as 'personality'
      );

      const aiResponseText = result.completion.text;

      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting to my neural network right now. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-[calc(100vh-100px)] flex flex-col bg-slate-900/70 backdrop-blur-sm border-slate-700/50">
      <CardContent className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
              {message.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  {template ? <TemplateIcon icon={template.icon} className="w-5 h-5" /> : <Bot size={20} />}
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-lg ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-800 text-slate-200'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <div className="p-4 border-t border-slate-700/50">
        <form onSubmit={handleSendMessage} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pr-20 resize-none bg-slate-800 border-slate-600 text-slate-200"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
};