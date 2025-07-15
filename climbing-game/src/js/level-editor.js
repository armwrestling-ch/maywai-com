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
  // Auto-grow wall if holds are near the top
  let highestY = getHighestHoldY();
  let requiredHeight = Math.max(1400, highestY + 400); // Ensure 400px above highest hold
  
  if (requiredHeight > editorWallHeight) {
    editorWallHeight = requiredHeight;
    // No need to resize canvas - we keep it at 400x700 and scroll within it
  }
  
  updateFloorPosition();
  updateCamera();
}

function getHighestHoldY() {
  if (editorHolds.length === 0) return 1000;
  return Math.min(...editorHolds.map(h => h.y));
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
  
  // Place the end hold at the fixed position
  let endHold = { ...TOP_HOLD_COORDS };
  editorHolds.push(endHold);
  hasEndHold = true;
  
  updateWallHeight();
  updateStatus("End hold placed! Level is now complete.", "success");
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
  // Constrain to canvas bounds
  x = constrain(x, 10, width - 10);
  y = constrain(y, 10, editorWallHeight - 10);
  
  // Check if hold would be below floor
  if (y > floorY - 15) { // 15px buffer above floor
    updateStatus("Cannot place holds below the floor!", "error");
    return;
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
  
  updateWallHeight();
  updateFloorPosition();
  
  if (editorHolds.length <= 4) {
    updateStatus(`Starting hold ${editorHolds.length}/4 added at (${Math.round(x)}, ${Math.round(y)})`, "success");
  } else {
    updateStatus(`Hold added at (${Math.round(x)}, ${Math.round(y)})`, "success");
  }
  
  // Update mode status if we just finished placing starting holds
  if (editorHolds.length === 4) {
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
  // Validate level before testing
  if (editorHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to test level.", "error");
    return;
  }
  
  if (!hasEndHold) {
    updateStatus("Need to place end hold before testing level.", "error");
    return;
  }
  
  let startingHolds = editorHolds.slice(0, 4);
  if (!validateStartingHolds(startingHolds)) {
    updateStatus("Starting holds are invalid - they're too far apart. Fix positioning first.", "error");
    return;
  }
  
  // Save level data to localStorage for testing
  let levelData = createLevelData();
  localStorage.setItem('customLevel', JSON.stringify(levelData));
  
  // Open game with custom level
  updateStatus("Opening game to test level...", "success");
  setTimeout(() => {
    window.open('./index.html?level=custom', '_blank');
  }, 500);
}

function exportLevel() {
  if (editorHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to export.", "error");
    return;
  }
  
  if (!hasEndHold) {
    updateStatus("Need to place end hold before exporting level.", "error");
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
