import React from 'react';
import { DAWView } from './presentation/components/DAWView';

/**
 * 應用程序根組件
 */
const App: React.FC = () => {
  const handlePlay = () => {
    console.log('Play');
  };

  const handlePause = () => {
    console.log('Pause');
  };

  const handleStop = () => {
    console.log('Stop');
  };

  const handleBpmChange = (bpm: number) => {
    console.log('BPM changed:', bpm);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DAWView
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onBpmChange={handleBpmChange}
      />
    </div>
  );
};

export default App; 