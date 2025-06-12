import React from 'react';
import DAWInterface from '../ui/components/DAWInterface';
import { DAWErrorBoundary } from '../ui/components/DAWErrorBoundary';

const DAWPage: React.FC = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: '#1a1a1a'
    }}>
      <DAWErrorBoundary>
        <DAWInterface />
      </DAWErrorBoundary>
    </div>
  );
};

export default DAWPage; 