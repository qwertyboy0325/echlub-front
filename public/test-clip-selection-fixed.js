// Fixed Clip Selection Test Script
// Run this after the SimpleDAWRenderer fix

console.log('🔧 Fixed Clip Selection Test Starting...');

function testClipSelectionAfterFix() {
  console.log('\n🎯 Testing Clip Selection with Fixed Renderer...');
  
  // Step 1: Check if clips exist
  setTimeout(() => {
    console.log('\n📊 Checking current state:');
    console.log('• Refreshing page to apply renderer fix...');
    
    // Force reload to apply the SimpleDAWRenderer fixes
    window.location.reload();
  }, 1000);
}

// Check if we need to reload for the fix
function checkForRendererFix() {
  console.log('\n🔍 Checking for renderer fix...');
  
  // Try to find renderer instance
  const canvas = document.querySelector('canvas');
  if (canvas) {
    console.log('✅ Canvas found');
    
    // Wait a bit for renderer to initialize
    setTimeout(() => {
      console.log('\n📋 Instructions for testing fixed clip selection:');
      console.log('1. 🎵 Click "Create Test Clip" button');
      console.log('2. 👀 Look for "with interaction enabled" message');
      console.log('3. 🖱️ Click directly on the colored clip rectangle');
      console.log('4. 📝 You should see these messages:');
      console.log('   • "🖱️ Clip clicked: clip-X"');
      console.log('   • "🎯 DAWInterface: Interaction received: clip-select"');
      console.log('   • "📎 Selecting clip: clip-X"');
      console.log('   • "✅ Clip selection triggered"');
      console.log('\n🎉 If you see these messages, clip selection is working!');
      
      // Auto-create a test clip
      createTestClipFixed();
    }, 2000);
  } else {
    console.log('❌ Canvas not found, waiting...');
    setTimeout(checkForRendererFix, 1000);
  }
}

function createTestClipFixed() {
  console.log('\n🎵 Creating test clip with fixed renderer...');
  
  const createButton = document.querySelector('[title="Create a test clip for selection"]');
  if (createButton) {
    console.log('✅ Found create button, clicking...');
    createButton.click();
    
    setTimeout(() => {
      console.log('\n🎯 Clip created! Now try clicking on it.');
      console.log('💡 Look for a colored rectangle on the timeline');
      console.log('💡 Click directly on the clip rectangle');
      console.log('💡 The cursor should change to pointer when hovering');
    }, 1000);
  } else {
    console.log('❌ Create button not found');
  }
}

// Advanced debugging function
function debugClipInteraction() {
  console.log('\n🔧 Advanced Clip Interaction Debug:');
  
  const canvas = document.querySelector('canvas');
  if (canvas) {
    console.log('✅ Canvas found');
    
    // Add a global click listener to see all clicks
    canvas.addEventListener('click', (event) => {
      console.log('🖱️ Canvas clicked at:', {
        x: event.clientX,
        y: event.clientY,
        offsetX: event.offsetX,
        offsetY: event.offsetY
      });
    });
    
    // Add mousemove to see cursor changes
    canvas.addEventListener('mousemove', (event) => {
      const style = window.getComputedStyle(canvas);
      if (style.cursor === 'pointer') {
        console.log('👆 Cursor is pointer - over interactive element');
      }
    });
    
    console.log('✅ Debug listeners added');
    console.log('💡 Now create a clip and watch for cursor changes');
  }
}

// Check the state of clips and selection
function checkClipState() {
  console.log('\n📊 Checking clip state in debug panel...');
  
  const debugPanel = document.querySelector('[title="Create a test clip for selection"]')?.parentElement;
  if (debugPanel) {
    const text = debugPanel.textContent;
    console.log('Debug panel content:', text);
    
    // Extract clip and selection counts
    const clipMatch = text.match(/Clips: (\d+)/);
    const selectedMatch = text.match(/Selected: (\d+)/);
    
    if (clipMatch) {
      console.log(`📎 Clips found: ${clipMatch[1]}`);
    }
    if (selectedMatch) {
      console.log(`✅ Selected clips: ${selectedMatch[1]}`);
    }
  }
}

// Monitor selection changes
function monitorSelectionChanges() {
  console.log('\n👀 Monitoring selection changes...');
  
  let lastClipCount = 0;
  let lastSelectedCount = 0;
  
  const checkInterval = setInterval(() => {
    const debugPanel = document.querySelector('[title="Create a test clip for selection"]')?.parentElement;
    if (debugPanel) {
      const text = debugPanel.textContent;
      const clipMatch = text.match(/Clips: (\d+)/);
      const selectedMatch = text.match(/Selected: (\d+)/);
      
      const clipCount = clipMatch ? parseInt(clipMatch[1]) : 0;
      const selectedCount = selectedMatch ? parseInt(selectedMatch[1]) : 0;
      
      if (clipCount !== lastClipCount) {
        console.log(`📎 Clip count changed: ${lastClipCount} → ${clipCount}`);
        lastClipCount = clipCount;
      }
      
      if (selectedCount !== lastSelectedCount) {
        console.log(`✅ Selection count changed: ${lastSelectedCount} → ${selectedCount}`);
        if (selectedCount > 0) {
          console.log('🎉 CLIP SELECTION WORKING! 🎉');
        }
        lastSelectedCount = selectedCount;
      }
    }
  }, 500);
  
  // Stop monitoring after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('👀 Stopped monitoring selection changes');
  }, 30000);
  
  return checkInterval;
}

// Main test function
function runFixedClipSelectionTest() {
  console.log('🚀 Running Fixed Clip Selection Test\n');
  
  // Check for canvas and setup
  checkForRendererFix();
  
  // Start monitoring
  setTimeout(() => {
    monitorSelectionChanges();
  }, 3000);
  
  // Advanced debug
  setTimeout(() => {
    debugClipInteraction();
  }, 4000);
  
  console.log('\n📝 What to expect:');
  console.log('1. Clip creation with "interaction enabled" message');
  console.log('2. Cursor changes to pointer when hovering over clips');
  console.log('3. Click events logged when clicking clips');
  console.log('4. Selection count increases in debug panel');
  console.log('5. Console messages confirming selection');
}

// Export for manual use
window.FixedClipSelectionTest = {
  runFixedClipSelectionTest,
  createTestClipFixed,
  debugClipInteraction,
  checkClipState,
  monitorSelectionChanges
};

// Auto-run
runFixedClipSelectionTest();

console.log('\n💡 Manual testing functions:');
console.log('• FixedClipSelectionTest.createTestClipFixed() - Create test clip');
console.log('• FixedClipSelectionTest.debugClipInteraction() - Advanced debug');
console.log('• FixedClipSelectionTest.checkClipState() - Check current state');
console.log('• FixedClipSelectionTest.monitorSelectionChanges() - Watch for changes');

console.log('\n🎯 The key fix:');
console.log('• Added clipBg.interactive = true');
console.log('• Added clipBg.cursor = "pointer"');
console.log('• Added pointerdown event listener');
console.log('• Clips should now be clickable!'); 