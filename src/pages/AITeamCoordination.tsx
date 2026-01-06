import React from 'react';
import { Header } from '@/components/Header';
import { AITeamCoordinationPanel } from '@/components/AITeamCoordinationPanel';

const AITeamCoordination = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 pt-24">
        <AITeamCoordinationPanel variant="page" />
      </div>
    </div>
  );
};

export default AITeamCoordination;
