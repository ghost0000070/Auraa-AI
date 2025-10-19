import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Send, CornerDownLeft, User, Bot } from 'lucide-react';
import { aiEmployeeTemplates } from '@/lib/ai-employee-templates';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { generativeModel } from '@/firebase'; // Import generativeModel

interface ChatInterfaceProps {
  employeeType: string;
  employeeName: string;
  businessContext: string;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ employeeType, employeeName, businessContext }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const template = aiEmployeeTemplates.find(e => e.id === employeeType);
    const welcomeMessage = template 
      ? `Hello! I'm ${template.name}, your new ${template.category} expert. How can I assist you with your business goals today?`
      : `Hello! I'm your new AI employee. How can I help you today?`;
    
    setMessages([{ sender: 'ai', text: welcomeMessage }]);
  }, [employeeType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const template = aiEmployeeTemplates.find(e => e.id === employeeType);

      let aiResponseText = "Sorry, I'm having trouble connecting. Please try again later.";

      if (template?.model === "Gemini-Pro") {
        // Use client-side Gemini API
        const chat = generativeModel.startChat({
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          })),
        });

        const result = await chat.sendMessage(input);
        aiResponseText = result.response.text();

      } else {
        // Fallback to Firebase Function for other models (now all Gemini via backend)
        const functions = getFunctions();
        const generateChatCompletion = httpsCallable(functions, 'generateChatCompletion');
        const result = await generateChatCompletion({
            employeeType,
            employeeName,
            businessContext,
            prompt: input,
            history: messages,
            model: template?.model || 'gemini-1.5-flash-001', // Pass the model to the backend
        });
        aiResponseText = (result.data as any).response;
      }

      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble processing your request. Please try again later." };
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
                  <Bot size={20} />
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
