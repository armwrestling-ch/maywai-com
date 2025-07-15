//@ts-check

/**
 * import all p5.js functions
 * @type {import("p5")}
 */

/**
 * @typedef {Object} EditorHold
 * @property {number} x - X position of the hold
 * @property {number} y - Y position of the hold
 * @property {boolean} [top] - Whether this hold is the top hold
 * @property {boolean} [start] - Whether this hold is a starting hold
 */

/**
 * @typedef {Object} EditorLevel
 * @property {string} name - The name of the level
 * @property {number} wallHeight - The height of the climbing wall
 * @property {EditorHold[]} holds - The holds available in the level
 */

// Editor state
let editorMode = 'add'; // 'add', 'remove', 'move'
/** @type {EditorHold[]} */
let editorHolds = [];
let editorWallHeight = 1400; // Start with double game size
let editorCameraOffsetY = -700; // Start viewing the bottom area
/** @type {EditorHold | null} */
let selectedHold = null;
let isDragging = false;
let hasEndHold = false; // Track if end hold has been placed

// Fixed top hold coordinates - not placed by default
const TOP_HOLD_COORDS = { x: 200, y: 170, top: true };

// Floor parameters
const FLOOR_DISTANCE = 100; // Distance from lowest hold to floor
let floorY = 1200; // Initial floor position

// UI elements
/** @type {HTMLInputElement | null} */
let levelNameInput = null;
/** @type {HTMLButtonElement | null} */
let addHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let removeHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let moveHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let testBtn = null;
/** @type {HTMLButtonElement | null} */
let exportBtn = null;
/** @type {HTMLButtonElement | null} */
let importBtn = null;
/** @type {HTMLButtonElement | null} */
let clearBtn = null;
/** @type {HTMLButtonElement | null} */
let placeEndHoldBtn = null;
/** @type {HTMLInputElement | null} */
let fileInput = null;
/** @type {HTMLDivElement | null} */
let statusDiv = null;
/** @type {HTMLDivElement | null} */
let holdInfoDiv = null;

// Starting hold validation parameters
const MAX_ARM_REACH = 80;
const MAX_LEG_REACH = 120;

async function setup() {
  // Create canvas with fixed game dimensions and attach it to the gameContainer div
  let canvas = createCanvas(400, 700);
  canvas.parent("gameContainer");

  // Initialize with empty holds array (no default top hold)
  editorHolds = [];
  
  initializeUI();
  updateWallHeight();
  updateFloorPosition();
  updateStatus("Ready to create level. Add starting holds at the bottom.", "info");
}

function draw() {
  background(240);

  push();
  translate(0, editorCameraOffsetY);

  // Draw climbing wall background
  fill(220, 220, 220); // Light gray wall
  noStroke();
  rect(0, 0, width, editorWallHeight);

  // Draw floor
  drawFloor();

  // Draw grid for easier placement
  drawGrid();

  // Draw holds
  drawHolds();

  // Draw validation indicators for starting holds
  drawStartingHoldValidation();

  // Draw end hold placement preview if in place end hold mode
  if (editorMode === 'placeEnd') {
    drawEndHoldPreview();
  }

  pop();

  // Draw scroll bar (after pop so it's not affected by camera transform)
  drawScrollBar();

  // Draw UI info
  updateHoldInfo();
}

function updateFloorPosition() {
  if (editorHolds.length === 0) {
    floorY = editorWallHeight - 200; // Default floor position
  } else {
    let lowestY = getLowestHoldY();
    floorY = lowestY + FLOOR_DISTANCE;
  }
}

function drawEndHoldPreview() {
  // Draw a preview of where the end hold will be placed
  fill(255, 215, 0, 150); // Semi-transparent gold
  stroke(255, 215, 0);
  strokeWeight(2);
  ellipse(TOP_HOLD_COORDS.x, TOP_HOLD_COORDS.y, 25, 25);
  
  // Draw text
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10);
  text("END", TOP_HOLD_COORDS.x, TOP_HOLD_COORDS.y);
}

function drawScrollBar() {
  // Only draw scroll bar if content is larger than viewport
  if (editorWallHeight <= height) return;
  
  // Scroll bar dimensions and position
  let scrollBarWidth = 12;
  let scrollBarX = width - scrollBarWidth - 5;
  let scrollBarY = 10;
  let scrollBarHeight = height - 20; // Leave margins top and bottom
  
  // Calculate scroll bar track
  fill(200, 200, 200, 150); // Semi-transparent gray track
  noStroke();
  rect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, 6);
  
  // Calculate thumb position and size
  let contentRatio = height / editorWallHeight; // How much of content fits in viewport
  let thumbHeight = scrollBarHeight * contentRatio;
  thumbHeight = max(thumbHeight, 20); // Minimum thumb height for visibility
  
  // Calculate thumb position based on current camera offset
  let scrollProgress = abs(editorCameraOffsetY) / (editorWallHeight - height);
  scrollProgress = constrain(scrollProgress, 0, 1);
  let thumbY = scrollBarY + scrollProgress * (scrollBarHeight - thumbHeight);
  
  // Draw scroll thumb
  fill(100, 100, 100, 180); // Semi-transparent dark gray thumb
  rect(scrollBarX + 1, thumbY, scrollBarWidth - 2, thumbHeight, 5);
  
  // Add subtle highlight to thumb
  fill(120, 120, 120, 100);
  rect(scrollBarX + 2, thumbY + 1, scrollBarWidth - 4, 2, 2);
  
  // Draw level content indicators on scroll bar
  drawScrollBarIndicators(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
  
  // Draw scroll position indicator text
  fill(80, 80, 80);
  noStroke();
  textAlign(RIGHT, TOP);
  textSize(10);
  let currentY = Math.abs(editorCameraOffsetY);
  let totalY = editorWallHeight;
  text(`${Math.round(currentY)}/${Math.round(totalY)}`, width - scrollBarWidth - 8, 5);
}

/**
 * @param {number} scrollBarX
 * @param {number} scrollBarY  
 * @param {number} scrollBarWidth
 * @param {number} scrollBarHeight
 */
function drawScrollBarIndicators(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight) {
  // Draw indicators for holds and floor on the scroll bar
  
  // Floor indicator
  let floorPos = map(floorY, 0, editorWallHeight, scrollBarY, scrollBarY + scrollBarHeight);
  stroke(139, 69, 19); // Brown floor color
  strokeWeight(2);
  line(scrollBarX - 2, floorPos, scrollBarX + scrollBarWidth + 2, floorPos);
  
  // Hold indicators
  noStroke();
  for (let i = 0; i < editorHolds.length; i++) {
    let hold = editorHolds[i];
    let holdPos = map(hold.y, 0, editorWallHeight, scrollBarY, scrollBarY + scrollBarHeight);
    
    if (hold.top) {
      fill(255, 215, 0); // Gold for end hold
    } else if (i < 4) {
      fill(76, 175, 80); // Green for starting holds
    } else {
      fill(139, 69, 19); // Brown for regular holds
    }
    
    ellipse(scrollBarX + scrollBarWidth/2, holdPos, 4, 4);
  }
}

function drawFloor() {
  fill(139, 69, 19); // Brown color for the floor
  noStroke();
  
  // Draw floor from floorY to bottom of wall
  if (floorY < editorWallHeight) {
    let floorHeight = editorWallHeight - floorY;
    rect(0, floorY, width, floorHeight);
    
    // Add floor texture/pattern
    fill(120, 60, 15); // Darker brown for pattern
    for (let y = floorY; y < editorWallHeight; y += 20) {
      rect(0, y, width, 2);
    }
  }
  
  // Draw floor line as visual boundary
  stroke(100, 50, 10);
  strokeWeight(3);
  line(0, floorY, width, floorY);
}

function drawGrid() {
  stroke(200, 200, 200, 100);
  strokeWeight(1);
  
  // Vertical lines every 50px
  for (let x = 0; x <= width; x += 50) {
    line(x, 0, x, editorWallHeight);
  }
  
  // Horizontal lines every 50px
  for (let y = 0; y <= editorWallHeight; y += 50) {
    line(0, y, width, y);
  }
}

function drawHolds() {
  for (let i = 0; i < editorHolds.length; i++) {
    let hold = editorHolds[i];
    
    // Set hold color based on type and selection
    if (hold === selectedHold) {
      fill(255, 100, 100); // Red for selected
    } else if (hold.top) {
      fill("gold"); // Gold for top hold
    } else if (i < 4) { // First 4 holds are starting holds
      fill("#4CAF50"); // Green for starting holds
    } else {
      fill("#8B4513"); // Brown for regular holds
    }
    
    // Draw hold
    stroke(0);
    strokeWeight(2);
    ellipse(hold.x, hold.y, 20, 20);
    
    // Draw hold number for starting holds
    if (i < 4 && !hold.top) {
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(12);
      text(i + 1, hold.x, hold.y); // 1-based numbering
    }
  }
}

function drawStartingHoldValidation() {
  if (editorHolds.length < 4) return; // Need at least 4 starting holds
  
  let startingHolds = editorHolds.slice(0, 4); // Get first 4 holds as starting holds
  
  // Check if starting holds are valid (reachable from each other)
  let isValid = validateStartingHolds(startingHolds);
  
  if (!isValid) {
    // Draw warning indicators
    stroke(255, 0, 0);
    strokeWeight(3);
    noFill();
    
    for (let hold of startingHolds) {
      ellipse(hold.x, hold.y, 30, 30);
    }
  }
}

/**
 * @param {EditorHold[]} startingHolds
 * @returns {boolean}
 */
function validateStartingHolds(startingHolds) {
  if (startingHolds.length < 4) return false;
  
  // Calculate centroid of starting holds
  let centerX = 0, centerY = 0;
  for (let hold of startingHolds) {
    centerX += hold.x;
    centerY += hold.y;
  }
  centerX /= startingHolds.length;
  centerY /= startingHolds.length;
  
  // Check if all starting holds are reachable from the center position
  // Assume arms reach from shoulder level and legs from hip level
  let shoulderX = centerX;
  let shoulderY = centerY - 20; // Shoulder level
  let hipX = centerX;
  let hipY = centerY + 20; // Hip level
  
  // Check arm reaches (first 2 holds should be reachable by arms)
  for (let i = 0; i < 2; i++) {
    let distance = dist(shoulderX, shoulderY, startingHolds[i].x, startingHolds[i].y);
    if (distance > MAX_ARM_REACH) return false;
  }
  
  // Check leg reaches (last 2 holds should be reachable by legs)
  for (let i = 2; i < 4; i++) {
    let distance = dist(hipX, hipY, startingHolds[i].x, startingHolds[i].y);
    if (distance > MAX_LEG_REACH) return false;
  }
  
  return true;
}

function getLowestHoldY() {
  if (editorHolds.length === 0) return 1000;
  return Math.max(...editorHolds.map(h => h.y));
}

function updateWallHeight() {
  if (editorHolds.length === 0) {
    // No holds placed yet - use minimum size
    editorWallHeight = 1000; // Smaller minimum when empty
    updateFloorPosition();
    updateCamera();
    return;
  }
  
  // Calculate required height based on actual holds
  let highestY = getHighestHoldY();
  let lowestY = getLowestHoldY();
  
  // Smart padding that adjusts based on level content
  let paddingTop = 100; // Reasonable space above highest hold
  let paddingBottom = 150; // Space below lowest hold for floor visibility
  
  // Calculate the actual span of holds
  let holdSpan = lowestY - highestY;
  
  // Minimum height should accommodate viewport plus buffer
  let minHeight = height + 300; // 700 + 300 = 1000px minimum
  
  // Required height based on content with smart padding
  let contentHeight = holdSpan + paddingTop + paddingBottom;
  let requiredHeight = Math.max(minHeight, contentHeight);
  
  // Be more aggressive about shrinking - smaller threshold for downward changes
  let heightDifference = Math.abs(editorWallHeight - requiredHeight);
  let shouldUpdate = false;
  
  if (requiredHeight > editorWallHeight) {
    // Growing: update immediately for better UX when placing holds near top
    shouldUpdate = true;
  } else if (requiredHeight < editorWallHeight && heightDifference > 100) {
    // Shrinking: require bigger difference to avoid constant adjustments
    shouldUpdate = true;
  }
  
  if (shouldUpdate) {
    let oldHeight = editorWallHeight;
    editorWallHeight = requiredHeight;
    
    // Adjust camera if we're shrinking and camera is now out of bounds
    let maxCameraOffsetY = -(editorWallHeight - height);
    if (editorCameraOffsetY < maxCameraOffsetY) {
      editorCameraOffsetY = maxCameraOffsetY;
    }
    
    // Provide feedback when significant changes occur
    if (Math.abs(oldHeight - editorWallHeight) > 200) {
      if (editorWallHeight > oldHeight) {
        console.log("Level expanded to accommodate holds near top");
      } else {
        console.log("Level contracted to optimize size");
      }
    }
  }
  
  updateFloorPosition();
  updateCamera();
}

function getHighestHoldY() {
  if (editorHolds.length === 0) return 400; // Default high position
  return Math.min(...editorHolds.map(h => h.y));
}

function getHighestNonEndHoldY() {
  let nonEndHolds = editorHolds.filter(hold => !hold.top);
  if (nonEndHolds.length === 0) return 600; // Default position if no non-end holds
  return Math.min(...nonEndHolds.map(h => h.y));
}

function updateCamera() {
  // Smooth camera movement within the fixed viewport
  editorCameraOffsetY = constrain(editorCameraOffsetY, -editorWallHeight + height, 0);
}

function initializeUI() {
  // Get UI elements
  levelNameInput = /** @type {HTMLInputElement} */ (document.getElementById('levelName'));
  addHoldBtn = /** @type {HTMLButtonElement} */ (document.getElementById('addHoldMode'));
  removeHoldBtn = /** @type {HTMLButtonElement} */ (document.getElementById('removeHoldMode'));
  moveHoldBtn = /** @type {HTMLButtonElement} */ (document.getElementById('moveHoldMode'));
  placeEndHoldBtn = /** @type {HTMLButtonElement} */ (document.getElementById('placeEndHold'));
  testBtn = /** @type {HTMLButtonElement} */ (document.getElementById('testLevel'));
  exportBtn = /** @type {HTMLButtonElement} */ (document.getElementById('exportLevel'));
  importBtn = /** @type {HTMLButtonElement} */ (document.getElementById('importLevel'));
  clearBtn = /** @type {HTMLButtonElement} */ (document.getElementById('clearLevel'));
  fileInput = /** @type {HTMLInputElement} */ (document.getElementById('fileInput'));
  statusDiv = /** @type {HTMLDivElement} */ (document.getElementById('status'));
  holdInfoDiv = /** @type {HTMLDivElement} */ (document.getElementById('holdInfo'));
  
  // Set up event listeners
  addHoldBtn?.addEventListener('click', () => setEditorMode('add'));
  removeHoldBtn?.addEventListener('click', () => setEditorMode('remove'));
  moveHoldBtn?.addEventListener('click', () => setEditorMode('move'));
  placeEndHoldBtn?.addEventListener('click', () => setEditorMode('placeEnd'));
  testBtn?.addEventListener('click', testLevel);
  exportBtn?.addEventListener('click', exportLevel);
  importBtn?.addEventListener('click', () => fileInput?.click());
  clearBtn?.addEventListener('click', clearLevel);
  fileInput?.addEventListener('change', importLevel);
  
  // Set initial mode
  setEditorMode('add');
}

/**
 * @param {string} mode
 */
function setEditorMode(mode) {
  editorMode = mode;
  selectedHold = null;
  
  // Update button styles
  document.querySelectorAll('.editor-button').forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'add') {
    addHoldBtn?.classList.add('active');
    if (editorHolds.length < 4) {
      updateStatus(`Click on the wall to add starting hold ${editorHolds.length + 1}/4.`, "info");
    } else {
      updateStatus("Click on the wall to add holds. Holds cannot be placed below the floor.", "info");
    }
  } else if (mode === 'remove') {
    removeHoldBtn?.classList.add('active');
    updateStatus("Click on holds to remove them. Cannot remove end hold once placed.", "info");
  } else if (mode === 'move') {
    moveHoldBtn?.classList.add('active');
    updateStatus("Click and drag holds to move them. Cannot move end hold once placed.", "info");
  } else if (mode === 'placeEnd') {
    placeEndHoldBtn?.classList.add('active');
    if (hasEndHold) {
      updateStatus("End hold already placed!", "error");
      setEditorMode('add');
    } else if (editorHolds.length < 4) {
      updateStatus("Need at least 4 starting holds before placing end hold.", "error");
      setEditorMode('add');
    } else {
      updateStatus("Click to place the end hold at the top.", "info");
    }
  }
}

/**
 * @param {string} message
 * @param {string} type
 */
function updateStatus(message, type = "info") {
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status-${type}`;
  }
}

function updateHoldInfo() {
  let info = `Holds: ${editorHolds.length} | Wall Height: ${editorWallHeight}px\n`;
  
  if (editorHolds.length > 0) {
    let startingHolds = editorHolds.slice(0, Math.min(4, editorHolds.length));
    let isValid = startingHolds.length === 4 ? validateStartingHolds(startingHolds) : false;
    info += `Starting holds: ${startingHolds.length}/4 (${isValid ? 'Valid' : 'Invalid'})\n`;
  }
  
  info += `End hold: ${hasEndHold ? 'Placed' : 'Not placed'}\n`;
  info += `Floor Y: ${Math.round(floorY)}px`;
  
  if (holdInfoDiv) {
    holdInfoDiv.textContent = info;
  }
}

function mousePressed() {
  let worldMouseX = mouseX;
  let worldMouseY = mouseY - editorCameraOffsetY;
  
  if (editorMode === 'add') {
    addHold(worldMouseX, worldMouseY);
  } else if (editorMode === 'remove') {
    removeHold(worldMouseX, worldMouseY);
  } else if (editorMode === 'move') {
    selectHold(worldMouseX, worldMouseY);
  } else if (editorMode === 'placeEnd') {
    placeEndHold();
  }
}

/**
 * @param {any} event
 */
function mouseWheel(event) {
  // Add scrolling functionality within the fixed viewport
  let scrollSpeed = 20;
  let newCameraY = editorCameraOffsetY + event.delta * scrollSpeed;
  editorCameraOffsetY = constrain(newCameraY, -editorWallHeight + height, 0);
  return false; // Prevent page scrolling
}

function placeEndHold() {
  if (hasEndHold) {
    updateStatus("End hold already placed!", "error");
    return;
  }
  
  if (editorHolds.length < 4) {
    updateStatus("Need at least 4 starting holds before placing end hold.", "error");
    return;
  }
  
  // Calculate the topmost position (ensure it's above all existing holds)
  let highestExistingY = editorHolds.length > 0 ? getHighestNonEndHoldY() : 400;
  let endHoldY = Math.min(TOP_HOLD_COORDS.y, highestExistingY - 50); // At least 50px above highest hold
  
  // Place the end hold at the calculated position
  let endHold = { 
    x: TOP_HOLD_COORDS.x, 
    y: endHoldY, 
    top: true 
  };
  editorHolds.push(endHold);
  hasEndHold = true;
  
  updateWallHeight();
  updateFloorPosition();
  updateStatus(`End hold placed at (${TOP_HOLD_COORDS.x}, ${Math.round(endHoldY)})! Level is now complete.`, "success");
  setEditorMode('add'); // Return to add mode
}

function mouseDragged() {
  if (editorMode === 'move' && selectedHold && !selectedHold.top) { // Can't move end hold
    let worldMouseX = mouseX;
    let worldMouseY = mouseY - editorCameraOffsetY;
    
    selectedHold.x = constrain(worldMouseX, 10, width - 10);
    selectedHold.y = constrain(worldMouseY, 10, editorWallHeight - 10);
    
    // Check floor collision during drag
    if (selectedHold.y > floorY - 15) {
      selectedHold.y = floorY - 15; // Snap to floor boundary
    }
    
    updateWallHeight();
    updateFloorPosition();
    isDragging = true;
  }
}

function mouseReleased() {
  if (isDragging) {
    isDragging = false;
    updateStatus("Hold moved successfully.", "success");
  }
}

/**
 * @param {number} x
 * @param {number} y
 */
function addHold(x, y) {
  // Check if placing near the top - grow level by 700px if within 150px of top
  if (y < 150) { // Within 150px of the top (y=0)
    let growthAmount = 700;
    
    // Grow the level
    editorWallHeight += growthAmount;
    
    // Adjust y position of the new hold
    y += growthAmount;
    
    // Adjust positions of all existing holds
    for (let hold of editorHolds) {
      hold.y += growthAmount;
    }
    
    // Adjust camera position to maintain view
    editorCameraOffsetY -= growthAmount;
    
    updateStatus(`Level expanded by 700px to accommodate top placement!`, "info");
  }
  
  // Constrain to canvas bounds
  x = constrain(x, 10, width - 10);
  y = constrain(y, 10, editorWallHeight - 10);
  
  // Check if hold would be below floor
  if (y > floorY - 15) { // 15px buffer above floor
    updateStatus("Cannot place holds below the floor!", "error");
    return;
  }
  
  // Check if hold would be too close to end hold (if placed)
  if (hasEndHold) {
    let endHold = editorHolds.find(h => h.top);
    if (endHold && y < endHold.y + 20) {
      updateStatus("Cannot place holds within 20px above the end hold!", "error");
      return;
    }
  }
  
  // Check if too close to existing holds
  for (let hold of editorHolds) {
    if (dist(x, y, hold.x, hold.y) < 25) {
      updateStatus("Too close to existing hold. Place holds at least 25px apart.", "error");
      return;
    }
  }
  
  // Add the hold
  let newHold = { x: x, y: y };
  editorHolds.push(newHold);
  
  updateFloorPosition();
  
  if (editorHolds.length <= 4 && !hasEndHold) {
    updateStatus(`Starting hold ${editorHolds.length}/4 added at (${Math.round(x)}, ${Math.round(y)})`, "success");
  } else {
    updateStatus(`Hold added at (${Math.round(x)}, ${Math.round(y)})`, "success");
  }
  
  // Update mode status if we just finished placing starting holds
  if (editorHolds.length === 4 && !hasEndHold) {
    updateStatus("All starting holds placed! You can now add more holds or place the end hold.", "success");
  }
}

/**
 * @param {number} x
 * @param {number} y
 */
function removeHold(x, y) {
  for (let i = 0; i < editorHolds.length; i++) {
    let hold = editorHolds[i];
    if (dist(x, y, hold.x, hold.y) < 15) {
      if (hold.top) {
        updateStatus("Cannot remove the end hold! Use clear to reset.", "error");
        return;
      }
      
      editorHolds.splice(i, 1);
      
      // Optimize level size after removal
      updateWallHeight();
      updateFloorPosition();
      
      updateStatus("Hold removed.", "success");
      return;
    }
  }
  updateStatus("No hold found at click location.", "error");
}

/**
 * @param {number} x
 * @param {number} y
 */
function selectHold(x, y) {
  selectedHold = null;
  
  for (let hold of editorHolds) {
    if (dist(x, y, hold.x, hold.y) < 15) {
      if (hold.top) {
        updateStatus("Cannot move the end hold!", "error");
        return;
      }
      selectedHold = hold;
      updateStatus("Hold selected. Drag to move.", "info");
      return;
    }
  }
  updateStatus("No hold found at click location.", "error");
}

function testLevel() {
  // Check if we have starting holds
  let startingHolds = editorHolds.filter(hold => !hold.top);
  if (startingHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to test the level.", "error");
    return;
  }
  
  // Check if end hold is placed
  if (!hasEndHold) {
    updateStatus("Need to place an end hold before testing. Click 'Place End Hold' button.", "error");
    return;
  }
  
  // Verify the end hold is the topmost hold
  let endHold = editorHolds.find(hold => hold.top);
  let highestOtherY = getHighestNonEndHoldY();
  
  if (endHold && endHold.y >= highestOtherY - 20) {
    updateStatus("End hold must be at least 20px above all other holds.", "error");
    return;
  }
  
  // Validate starting holds positioning
  let firstFourHolds = startingHolds.slice(0, 4);
  if (!validateStartingHolds(firstFourHolds)) {
    updateStatus("Starting holds are invalid - they're too far apart. Fix positioning first.", "error");
    return;
  }
  
  // All validation passed - test the level
  updateStatus("Testing level...", "info");
  
  // Save level data to localStorage for testing
  let levelData = createLevelData();
  localStorage.setItem('customLevel', JSON.stringify(levelData));
  
  // Open game with custom level
  setTimeout(() => {
    window.open('./index.html?level=custom', '_blank');
    updateStatus("Level opened in new tab for testing!", "success");
  }, 500);
}

function exportLevel() {
  // Check if we have starting holds
  let startingHolds = editorHolds.filter(hold => !hold.top);
  if (startingHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to export.", "error");
    return;
  }
  
  // Check if end hold is placed
  if (!hasEndHold) {
    updateStatus("Need to place an end hold before exporting. Click 'Place End Hold' button.", "error");
    return;
  }
  
  // Verify the end hold is the topmost hold
  let endHold = editorHolds.find(hold => hold.top);
  let highestOtherY = getHighestNonEndHoldY();
  
  if (endHold && endHold.y >= highestOtherY - 20) {
    updateStatus("End hold must be at least 20px above all other holds.", "error");
    return;
  }
  
  // Validate starting holds positioning
  let firstFourHolds = startingHolds.slice(0, 4);
  if (!validateStartingHolds(firstFourHolds)) {
    updateStatus("Starting holds are invalid - they're too far apart. Fix positioning first.", "error");
    return;
  }
  
  let levelData = createLevelData();
  
  // Create and download JSON file
  let dataStr = JSON.stringify(levelData, null, 2);
  let dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  let link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${levelData.name.replace(/\s+/g, '_').toLowerCase()}.json`;
  link.click();
  
  updateStatus("Level exported successfully!", "success");
}

function importLevel() {
  let file = fileInput?.files?.[0];
  if (!file) return;
  
  let reader = new FileReader();
  reader.onload = function(e) {
    try {
      let result = e.target?.result;
      if (typeof result !== 'string') {
        throw new Error("Could not read file");
      }
      
      let levelData = JSON.parse(result);
      
      // Validate level data structure
      if (!levelData.holds || !Array.isArray(levelData.holds)) {
        throw new Error("Invalid level format - missing holds array");
      }
      
      // Clear current level and load new one
      editorHolds = [...levelData.holds];
      
      // Check if end hold exists
      hasEndHold = editorHolds.some(hold => hold.top);
      
      // Update UI
      if (levelData.name && levelNameInput) {
        levelNameInput.value = levelData.name;
      }
      
      updateWallHeight();
      updateStatus("Level imported successfully!", "success");
      
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      updateStatus(`Import failed: ${errorMessage}`, "error");
    }
  };
  
  reader.readAsText(file);
  if (fileInput) fileInput.value = ''; // Reset file input
}

function clearLevel() {
  if (confirm("Are you sure you want to clear all holds? This cannot be undone.")) {
    editorHolds = []; // Clear all holds
    selectedHold = null;
    hasEndHold = false;
    updateWallHeight();
    updateFloorPosition();
    updateStatus("Level cleared. Start by adding starting holds at the bottom.", "info");
  }
}

function createLevelData() {
  let levelName = (levelNameInput?.value.trim()) || "Custom Level";
  
  return {
    name: levelName,
    wallHeight: editorWallHeight,
    holds: editorHolds.map(hold => ({ ...hold })) // Deep copy holds
  };
}

// Keyboard shortcuts
function keyPressed() {
  if (key === '1') setEditorMode('add');
  else if (key === '2') setEditorMode('remove');
  else if (key === '3') setEditorMode('move');
  else if (key === '4') setEditorMode('placeEnd');
  else if (key === 't' || key === 'T') testLevel();
  else if (key === 'e' || key === 'E') exportLevel();
  else if (key === 'c' || key === 'C') clearLevel();
  else if (keyCode === UP_ARROW || key === 'w' || key === 'W') {
    // Scroll up
    let newCameraY = editorCameraOffsetY - 50;
    editorCameraOffsetY = constrain(newCameraY, -editorWallHeight + height, 0);
  }
  else if (keyCode === DOWN_ARROW || key === 's' || key === 'S') {
    // Scroll down
    let newCameraY = editorCameraOffsetY + 50;
    editorCameraOffsetY = constrain(newCameraY, -editorWallHeight + height, 0);
  }
}
