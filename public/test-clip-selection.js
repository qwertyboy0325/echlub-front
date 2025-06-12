// Clip Selection Test Script
// Run this in browser console to test clip selection

console.log('🎵 Clip Selection Test Starting...');

// Helper function to check current DAW state
function checkDAWState() {
  const tracks = document.querySelector('canvas');
  const debugPanel = document.querySelector('[title="Create a test clip for selection"]');
  
  console.log('\n📊 Current DAW State:');
  console.log('• Canvas element:', tracks ? '✅ Found' : '❌ Not found');
  console.log('• Debug panel:', debugPanel ? '✅ Found' : '❌ Not found');
  
  // Try to get renderer info from window
  if (window.rendererInfo) {
    console.log('• Renderer:', window.rendererInfo);
  }
  
  return { tracks, debugPanel };
}

// Function to create test clips for selection
function createTestClips() {
  console.log('\n🎯 Creating Test Clips...');
  
  const createButton = document.querySelector('[title="Create a test clip for selection"]');
  if (createButton) {
    console.log('✅ Found "Create Test Clip" button');
    createButton.click();
    console.log('🎵 Clicked create test clip button');
    console.log('💡 Watch the console for clip creation messages');
    console.log('💡 After clip is created, try clicking on the timeline to select it');
  } else {
    console.log('❌ Create Test Clip button not found');
    console.log('💡 Make sure the DAW interface is loaded');
  }
}

// Function to simulate clip selection
function simulateClipSelection() {
  console.log('\n🖱️ Simulating Clip Selection...');
  
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.log('❌ Canvas not found');
    return;
  }
  
  console.log('✅ Canvas found, simulating click...');
  
  // Get canvas dimensions
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width * 0.3; // Click towards left side where clips might be
  const centerY = rect.top + rect.height * 0.3; // Click in upper area
  
  // Create and dispatch mouse events
  const mouseDown = new MouseEvent('mousedown', {
    clientX: centerX,
    clientY: centerY,
    bubbles: true
  });
  
  const mouseUp = new MouseEvent('mouseup', {
    clientX: centerX,
    clientY: centerY,
    bubbles: true
  });
  
  const click = new MouseEvent('click', {
    clientX: centerX,
    clientY: centerY,
    bubbles: true
  });
  
  console.log(`📍 Clicking at position: (${Math.round(centerX)}, ${Math.round(centerY)})`);
  
  canvas.dispatchEvent(mouseDown);
  canvas.dispatchEvent(mouseUp);
  canvas.dispatchEvent(click);
  
  console.log('🖱️ Mouse events dispatched');
  console.log('👀 Check console for interaction messages');
}

// Function to check console for selection messages
function monitorSelection() {
  console.log('\n👀 Monitoring Selection...');
  console.log('💡 Watch for these messages in console:');
  console.log('  • "🎯 DAWInterface: Interaction received: clip-select"');
  console.log('  • "📎 Selecting clip: [clip-id]"');
  console.log('  • "✅ Clip selection triggered"');
  console.log('\n🔍 If you don\'t see these messages:');
  console.log('  1. Make sure you have created clips first');
  console.log('  2. Try clicking directly on visible clip rectangles');
  console.log('  3. Check if PIXI.js renderer is properly initialized');
}

// Main test sequence
function runClipSelectionTest() {
  console.log('🚀 Running Complete Clip Selection Test\n');
  
  // Step 1: Check DAW state
  const state = checkDAWState();
  
  // Step 2: Create test clips if possible
  setTimeout(() => {
    createTestClips();
  }, 1000);
  
  // Step 3: Try to simulate selection after clips are created
  setTimeout(() => {
    simulateClipSelection();
  }, 3000);
  
  // Step 4: Show monitoring info
  setTimeout(() => {
    monitorSelection();
  }, 5000);
  
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. 🎵 Click "Create Test Clip" button in debug panel');
  console.log('2. 👀 Wait for clip creation confirmation in console');
  console.log('3. 🖱️ Click on the timeline where clips should appear');
  console.log('4. 📊 Check debug panel for "Selected: X clips"');
  console.log('5. 🔍 Look for selection messages in console');
}

// Quick debug info
function showQuickDebug() {
  console.log('\n🔧 Quick Debug Info:');
  console.log('• Browser:', navigator.userAgent.split(' ').slice(-2).join(' '));
  console.log('• Screen:', `${window.screen.width}x${window.screen.height}`);
  console.log('• Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('• URL:', window.location.href);
  
  // Check for common DAW elements
  const elements = {
    'Canvas': document.querySelector('canvas'),
    'Transport Controls': document.querySelector('[title="Play"]'),
    'Create Track Button': document.querySelector('button:contains("Audio"), button:contains("MIDI")'),
    'Debug Panel': document.querySelector('[title="Create a test clip for selection"]')
  };
  
  console.log('• Elements found:');
  Object.entries(elements).forEach(([name, element]) => {
    console.log(`  - ${name}: ${element ? '✅' : '❌'}`);
  });
}

// Export functions for manual use
window.ClipSelectionTest = {
  runClipSelectionTest,
  checkDAWState,
  createTestClips,
  simulateClipSelection,
  monitorSelection,
  showQuickDebug
};

// Auto-run the test
runClipSelectionTest();

console.log('\n💡 Available functions:');
console.log('• ClipSelectionTest.runClipSelectionTest() - Full test');
console.log('• ClipSelectionTest.createTestClips() - Create clips only');
console.log('• ClipSelectionTest.simulateClipSelection() - Simulate selection');
console.log('• ClipSelectionTest.showQuickDebug() - Show debug info');

console.log('\n🎯 Next Steps:');
console.log('1. Look for the "Create Test Clip" button in the bottom-right debug panel');
console.log('2. Click it to create a test clip');
console.log('3. Try clicking on the timeline to select the clip');
console.log('4. Watch the console for selection events'); 