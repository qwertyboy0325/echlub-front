import React, { useState, useEffect, useCallback } from 'react';
import { useMusicArrangement } from '../hooks/useMusicArrangement';

interface BPMTestResult {
  testName: string;
  expected: any;
  actual: any;
  passed: boolean;
  timestamp: string;
}

export const BPMTestPage: React.FC = () => {
  const { adapter, sceneState } = useMusicArrangement();
  const [currentUIBPM, setCurrentUIBPM] = useState(120);
  const [testResults, setTestResults] = useState<BPMTestResult[]>([]);
  const [isAutoTesting, setIsAutoTesting] = useState(false);
  const [playbackStartTime, setPlaybackStartTime] = useState<number | null>(null);

  // Real-time monitoring
  const [adapterBPM, setAdapterBPM] = useState<number | null>(null);
  const [secondsPerBeat, setSecondsPerBeat] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update real-time values
  useEffect(() => {
    if (adapter) {
      setAdapterBPM(adapter.getBPM());
      setSecondsPerBeat(60 / adapter.getBPM());
      setIsPlaying(adapter.isPlaying());
    }
  }, [adapter, sceneState.lastUpdateTimestamp]);

  // Test Functions
  const addTestResult = useCallback((testName: string, expected: any, actual: any) => {
    const result: BPMTestResult = {
      testName,
      expected,
      actual,
      passed: JSON.stringify(expected) === JSON.stringify(actual),
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    return result.passed;
  }, []);

  // Test 1: BPM Synchronization
  const testBPMSynchronization = useCallback(async () => {
    console.log('🧪 Testing BPM Synchronization...');
    
    if (!adapter) {
      addTestResult('BPM Sync', 'Adapter Available', 'No Adapter');
      return false;
    }

    const testBPM = 140;
    
    // Set BPM via adapter
    adapter.setBPM(testBPM);
    const actualBPM = adapter.getBPM();
    
    return addTestResult('BPM Sync (setBPM)', testBPM, actualBPM);
  }, [adapter, addTestResult]);

  // Test 2: UI BPM Integration
  const testUIBPMIntegration = useCallback(async () => {
    console.log('🧪 Testing UI BPM Integration...');
    
    if (!adapter) {
      addTestResult('UI Integration', 'Adapter Available', 'No Adapter');
      return false;
    }

    // Simulate UI BPM change
    const testBPM = 90;
    setCurrentUIBPM(testBPM);
    
    // Manually trigger the same logic as DAWInterface
    adapter.setBPM(testBPM);
    
    const actualBPM = adapter.getBPM();
    
    return addTestResult('UI Integration', testBPM, actualBPM);
  }, [adapter, addTestResult]);

  // Test 3: Timing Calculation
  const testTimingCalculation = useCallback(() => {
    console.log('🧪 Testing Timing Calculation...');
    
    if (!adapter) {
      addTestResult('Timing Calc', 'Adapter Available', 'No Adapter');
      return false;
    }

    const testBPM = 120;
    adapter.setBPM(testBPM);
    
    const expectedSecondsPerBeat = 60 / testBPM; // 0.5 seconds at 120 BPM
    const actualSecondsPerBeat = 60 / adapter.getBPM();
    
    return addTestResult('Timing Calculation', expectedSecondsPerBeat, actualSecondsPerBeat);
  }, [adapter, addTestResult]);

  // Test 4: BPM Range Validation
  const testBPMRangeValidation = useCallback(() => {
    console.log('🧪 Testing BPM Range Validation...');
    
    if (!adapter) {
      addTestResult('Range Validation', 'Adapter Available', 'No Adapter');
      return false;
    }

    // Test minimum BPM (should be clamped to 60)
    adapter.setBPM(30);
    const minBPM = adapter.getBPM();
    const minPassed = addTestResult('Min BPM Clamp', 60, minBPM);
    
    // Test maximum BPM (should be clamped to 200)
    adapter.setBPM(250);
    const maxBPM = adapter.getBPM();
    const maxPassed = addTestResult('Max BPM Clamp', 200, maxBPM);
    
    // Reset to normal
    adapter.setBPM(120);
    
    return minPassed && maxPassed;
  }, [adapter, addTestResult]);

  // Test 5: Playback Engine BPM Integration
  const testPlaybackBPMIntegration = useCallback(async () => {
    console.log('🧪 Testing Playback BPM Integration...');
    
    if (!adapter) {
      addTestResult('Playback BPM', 'Adapter Available', 'No Adapter');
      return false;
    }

    // Set specific BPM
    const testBPM = 100;
    adapter.setBPM(testBPM);
    
    // Start playback and record time
    setPlaybackStartTime(Date.now());
    
    // Check if playhead is moving at correct speed
    // This is a simplified test - in real scenario we'd measure over time
    const currentTime = adapter.getCurrentTime();
    const bpmFromAdapter = adapter.getBPM();
    
    return addTestResult('Playback BPM Integration', testBPM, bpmFromAdapter);
  }, [adapter, addTestResult]);

  // Run All Tests
  const runAllTests = useCallback(async () => {
    console.log('🧪 Running All BPM Tests...');
    setTestResults([]);
    setIsAutoTesting(true);
    
    // Run tests sequentially with delays
    await new Promise(resolve => setTimeout(resolve, 100));
    await testBPMSynchronization();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    await testUIBPMIntegration();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    testTimingCalculation();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    testBPMRangeValidation();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    await testPlaybackBPMIntegration();
    
    setIsAutoTesting(false);
    console.log('🧪 All BPM Tests Completed');
  }, [testBPMSynchronization, testUIBPMIntegration, testTimingCalculation, testBPMRangeValidation, testPlaybackBPMIntegration]);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#e2e8f0'
        }}>
          🎵 BPM Function Test Panel
        </h1>
        
        {/* Real-time Status */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>UI BPM</h3>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
              {currentUIBPM}
            </div>
          </div>
          
          <div style={{
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Adapter BPM</h3>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: adapterBPM === currentUIBPM ? '#22c55e' : '#ef4444'
            }}>
              {adapterBPM || 'N/A'}
            </div>
          </div>
          
          <div style={{
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Seconds/Beat</h3>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {secondsPerBeat?.toFixed(3) || 'N/A'}s
            </div>
          </div>
          
          <div style={{
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #334155'
          }}>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>Playback Status</h3>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: isPlaying ? '#22c55e' : '#64748b'
            }}>
              {isPlaying ? '▶️ Playing' : '⏸️ Stopped'}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Test Controls
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={testBPMSynchronization}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test BPM Sync
            </button>
            
            <button
              onClick={testUIBPMIntegration}
              style={{
                padding: '8px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test UI Integration
            </button>
            
            <button
              onClick={testTimingCalculation}
              style={{
                padding: '8px 16px',
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Timing Calc
            </button>
            
            <button
              onClick={testBPMRangeValidation}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Range Validation
            </button>
            
            <button
              onClick={testPlaybackBPMIntegration}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Playback Integration
            </button>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isAutoTesting}
            style={{
              padding: '12px 24px',
              background: isAutoTesting ? '#64748b' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isAutoTesting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isAutoTesting ? 'Running Tests...' : '🧪 Run All Tests'}
          </button>
        </div>

        {/* Manual BPM Testing */}
        <div style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Manual BPM Testing
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="range"
              min="60"
              max="200"
              value={currentUIBPM}
              onChange={(e) => {
                const newBPM = parseInt(e.target.value);
                setCurrentUIBPM(newBPM);
                if (adapter) {
                  adapter.setBPM(newBPM);
                }
              }}
              style={{
                width: '200px',
                cursor: 'pointer'
              }}
            />
            
            <input
              type="number"
              min="60"
              max="200"
              value={currentUIBPM}
              onChange={(e) => {
                const newBPM = parseInt(e.target.value) || 120;
                setCurrentUIBPM(newBPM);
                if (adapter) {
                  adapter.setBPM(newBPM);
                }
              }}
              style={{
                padding: '8px',
                background: '#334155',
                border: '1px solid #475569',
                borderRadius: '4px',
                color: '#f1f5f9',
                width: '80px'
              }}
            />
            
            <span style={{ color: '#94a3b8' }}>BPM</span>
            
            {/* Quick preset buttons */}
            {[80, 120, 140, 180].map(bpm => (
              <button
                key={bpm}
                onClick={() => {
                  setCurrentUIBPM(bpm);
                  if (adapter) {
                    adapter.setBPM(bpm);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  background: currentUIBPM === bpm ? '#3b82f6' : '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {bpm}
              </button>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Test Results
          </h2>
          
          {testResults.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
              No test results yet. Run some tests to see results here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: result.passed ? '#064e3b' : '#7f1d1d',
                    borderRadius: '6px',
                    border: result.passed ? '1px solid #059669' : '1px solid #dc2626'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: result.passed ? '#10b981' : '#ef4444' }}>
                      {result.passed ? '✅' : '❌'} {result.testName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Expected: {JSON.stringify(result.expected)} | 
                      Actual: {JSON.stringify(result.actual)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {result.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: '#1e293b',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #334155',
          marginTop: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            📋 Instructions
          </h2>
          <ul style={{ color: '#94a3b8', lineHeight: '1.6' }}>
            <li>Monitor the real-time status to see if UI BPM matches Adapter BPM</li>
            <li>Use manual BPM testing to change BPM and verify synchronization</li>
            <li>Run individual tests to check specific functionality</li>
            <li>Run all tests to get a comprehensive BPM functionality report</li>
            <li>Green results (✅) indicate passing tests, red (❌) indicate failures</li>
            <li>Check console logs for detailed debugging information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 