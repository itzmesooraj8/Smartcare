import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full w-12 h-12 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 shadow-xl border-primary/20">
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-primary/5">
            <CardTitle className="text-sm font-medium">SmartCare Assistant</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0" 
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 h-64 overflow-y-auto flex items-center justify-center text-muted-foreground text-sm">
            Chat feature coming soon...
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Chatbot;
