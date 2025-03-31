import React from 'react';
import DAWContainer from './presentation/containers/DAWContainer';

/**
 * 應用程序根組件
 */
const App: React.FC = () => {
  return (
    <div className="app">
      <DAWContainer />
    </div>
  );
};

export default App; 