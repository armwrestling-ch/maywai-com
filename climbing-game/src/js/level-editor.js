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
 * @property {string} author - The author of the level
 * @property {number} wallHeight - The height of the climbing wall
 * @property {EditorHold[]} holds - The holds available in the level
 */

// Scrollbar interaction variables
let scrollBarDragging = false;
let scrollBarStartY = 0;
let scrollBarStartCameraY = 0;

// Editor state
let editorMode = "add"; // 'add', 'remove', 'move'
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
/** @type {HTMLInputElement | null} */
let authorNameInput = null;
/** @type {HTMLButtonElement | null} */
let addHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let removeHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let moveHoldBtn = null;
/** @type {HTMLButtonElement | null} */
let shareBtn = null;
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

/**
 * Compress level data for URL sharing
 * @param {any} levelData
 * @returns {string}
 */
function compressLevelData(levelData) {
  // Create a compressed format with shorter property names
  const compressed = {
    n: levelData.name || "Custom Level",
    a: levelData.author || "Anonymous",
    h: levelData.wallHeight || 1400,
    d: levelData.holds.map(
      /** @param {any} hold */ (hold) => [
        Math.round(hold.x),
        Math.round(hold.y),
        hold.top ? 1 : 0,
      ]
    ),
  };

  const compressedStr = JSON.stringify(compressed);
  const originalStr = JSON.stringify(levelData);
  console.log(
    `Compression: ${originalStr.length} → ${
      compressedStr.length
    } chars (${Math.round(
      100 - (compressedStr.length / originalStr.length) * 100
    )}% smaller)`
  );

  return compressedStr;
}

/**
 * Decompress level data from URL
 * @param {string} compressedData
 * @returns {any}
 */
function decompressLevelData(compressedData) {
  try {
    const compressed = JSON.parse(compressedData);

    // Convert back to full format
    return {
      name: compressed.n || "Custom Level",
      author: compressed.a || "Anonymous",
      wallHeight: compressed.h || 1400,
      holds: compressed.d.map(
        /** @param {any} holdArray */ (holdArray) => ({
          x: holdArray[0],
          y: holdArray[1],
          top: holdArray[2] === 1,
        })
      ),
    };
  } catch (error) {
    console.error("Failed to decompress level data:", error);
    return null;
  }
}

async function setup() {
  // Create canvas with fixed game dimensions and attach it to the gameContainer div
  let canvas = createCanvas(400, 700);
  canvas.parent("gameContainer");

  // Initialize with empty holds array (no default top hold)
  editorHolds = [];

  initializeUI();
  updateWallHeight();
  updateFloorPosition();

  // Check if level data is provided in URL (from "Edit this level" link)
  const urlParams = new URLSearchParams(window.location.search);
  const levelData = urlParams.get("data");

  if (levelData) {
    try {
      // Try decompressing first (new format), fallback to old format
      let decodedData;
      try {
        decodedData = decompressLevelData(decodeURIComponent(levelData));
      } catch (error) {
        // Fallback to old uncompressed format
        decodedData = JSON.parse(decodeURIComponent(levelData));
      }

      if (decodedData) {
        loadLevelIntoEditor(decodedData);
        updateStatus("Level loaded for editing!", "success");
      } else {
        throw new Error("Failed to decompress level data");
      }
    } catch (error) {
      console.error("Failed to load level from URL:", error);
      updateStatus("Failed to load level from URL.", "error");
    }
  } else {
    updateStatus(
      "Ready to create level. Place starting holds in order: 1=Left Arm, 2=Right Arm, 3=Left Leg, 4=Right Leg.",
      "info"
    );
  }
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
  // Calculate where the end hold will actually be placed (50px above highest hold)
  let highestExistingY = editorHolds.length > 0 ? getHighestNonEndHoldY() : 400;
  let previewY = highestExistingY - 50;

  // Draw a preview of where the end hold will be placed
  fill(255, 215, 0, 150); // Semi-transparent gold
  stroke(255, 215, 0);
  strokeWeight(2);
  ellipse(TOP_HOLD_COORDS.x, previewY, 25, 25);

  // Draw text
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(10);
  text("END", TOP_HOLD_COORDS.x, previewY);
}

function drawScrollBar() {
  // Only draw scroll bar if content is larger than viewport
  if (editorWallHeight <= height) return;

  // Scroll bar dimensions and position (wider for touch)
  let scrollBarWidth = 20; // Increased from 12 to 20
  let scrollBarX = width - scrollBarWidth - 5;
  let scrollBarY = 10;
  let scrollBarHeight = height - 20; // Leave margins top and bottom

  // Calculate scroll bar track
  fill(200, 200, 200, 180); // More opaque for better visibility
  noStroke();
  rect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, 8);

  // Calculate thumb position and size
  let contentRatio = height / editorWallHeight; // How much of content fits in viewport
  let thumbHeight = scrollBarHeight * contentRatio;
  thumbHeight = max(thumbHeight, 30); // Increased minimum thumb height for touch

  // Calculate thumb position based on current camera offset
  let scrollProgress = abs(editorCameraOffsetY) / (editorWallHeight - height);
  scrollProgress = constrain(scrollProgress, 0, 1);
  let thumbY = scrollBarY + scrollProgress * (scrollBarHeight - thumbHeight);

  // Highlight thumb if being dragged
  if (scrollBarDragging) {
    fill(80, 80, 80, 220); // Darker when dragging
  } else if (
    isMouseOverScrollBarArea(
      scrollBarX,
      scrollBarY,
      scrollBarWidth,
      scrollBarHeight
    )
  ) {
    fill(120, 120, 120, 200); // Lighter when hovered
  } else {
    fill(100, 100, 100, 180); // Normal state
  }
  rect(scrollBarX + 2, thumbY, scrollBarWidth - 4, thumbHeight, 6);

  // Add subtle highlight to thumb for better visual feedback
  fill(140, 140, 140, 120);
  rect(scrollBarX + 3, thumbY + 2, scrollBarWidth - 6, 3, 3);

  // Draw level content indicators on scroll bar
  drawScrollBarIndicators(
    scrollBarX,
    scrollBarY,
    scrollBarWidth,
    scrollBarHeight
  );

  // Draw scroll position indicator text
  fill(80, 80, 80);
  noStroke();
  textAlign(RIGHT, TOP);
  textSize(10);
  let currentY = Math.abs(editorCameraOffsetY);
  let totalY = editorWallHeight;
  text(
    `${Math.round(currentY)}/${Math.round(totalY)}`,
    width - scrollBarWidth - 8,
    5
  );
}

/**
 * Check if mouse is over the scrollbar area
 * @param {number} scrollBarX
 * @param {number} scrollBarY
 * @param {number} scrollBarWidth
 * @param {number} scrollBarHeight
 * @returns {boolean}
 */
function isMouseOverScrollBarArea(
  scrollBarX,
  scrollBarY,
  scrollBarWidth,
  scrollBarHeight
) {
  return (
    mouseX >= scrollBarX &&
    mouseX <= scrollBarX + scrollBarWidth &&
    mouseY >= scrollBarY &&
    mouseY <= scrollBarY + scrollBarHeight
  );
}

/**
 * Get scrollbar dimensions for interaction
 * @returns {Object | null}
 */
function getScrollBarDimensions() {
  if (editorWallHeight <= height) return null;

  let scrollBarWidth = 20;
  let scrollBarX = width - scrollBarWidth - 5;
  let scrollBarY = 10;
  let scrollBarHeight = height - 20;

  let contentRatio = height / editorWallHeight;
  let thumbHeight = max(scrollBarHeight * contentRatio, 30);
  let scrollProgress = abs(editorCameraOffsetY) / (editorWallHeight - height);
  scrollProgress = constrain(scrollProgress, 0, 1);
  let thumbY = scrollBarY + scrollProgress * (scrollBarHeight - thumbHeight);

  return {
    x: scrollBarX,
    y: scrollBarY,
    width: scrollBarWidth,
    height: scrollBarHeight,
    thumbY: thumbY,
    thumbHeight: thumbHeight,
  };
}

/**
 * @param {number} scrollBarX
 * @param {number} scrollBarY
 * @param {number} scrollBarWidth
 * @param {number} scrollBarHeight
 */
function drawScrollBarIndicators(
  scrollBarX,
  scrollBarY,
  scrollBarWidth,
  scrollBarHeight
) {
  // Draw indicators for holds and floor on the scroll bar

  // Floor indicator
  let floorPos = map(
    floorY,
    0,
    editorWallHeight,
    scrollBarY,
    scrollBarY + scrollBarHeight
  );
  stroke(139, 69, 19); // Brown floor color
  strokeWeight(2);
  line(scrollBarX - 2, floorPos, scrollBarX + scrollBarWidth + 2, floorPos);

  // Hold indicators
  noStroke();
  for (let i = 0; i < editorHolds.length; i++) {
    let hold = editorHolds[i];
    let holdPos = map(
      hold.y,
      0,
      editorWallHeight,
      scrollBarY,
      scrollBarY + scrollBarHeight
    );

    if (hold.top) {
      fill(255, 215, 0); // Gold for end hold
    } else if (i < 4) {
      fill(76, 175, 80); // Green for starting holds
    } else {
      fill(139, 69, 19); // Brown for regular holds
    }

    ellipse(scrollBarX + scrollBarWidth / 2, holdPos, 4, 4);
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
    } else if (i < 4) {
      // First 4 holds are starting holds
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
  // Get the first 4 non-end holds from the original array
  let firstFourHolds = [];
  let count = 0;
  for (let hold of editorHolds) {
    if (!hold.top && count < 4) {
      firstFourHolds.push(hold);
      count++;
    }
  }

  if (firstFourHolds.length < 4) return; // Need at least 4 starting holds

  // Check if starting holds are valid (reachable from each other)
  let isValid = validateStartingHolds(firstFourHolds);

  if (!isValid) {
    // Draw warning indicators
    stroke(255, 0, 0);
    strokeWeight(3);
    noFill();

    for (let hold of firstFourHolds) {
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
  let centerX = 0,
    centerY = 0;
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
    let distance = dist(
      shoulderX,
      shoulderY,
      startingHolds[i].x,
      startingHolds[i].y
    );
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
  return Math.max(...editorHolds.map((h) => h.y));
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
  let highestY = getHighestHoldY(); // Smallest Y value (top of screen)
  let lowestY = getLowestHoldY(); // Largest Y value (bottom of screen)

  // Smart padding
  let paddingTop = 100; // Space above highest hold
  let paddingBottom = 150; // Space below lowest hold for floor visibility

  // Wall height should be: from top (Y=0) to lowest hold + bottom padding
  // But we also need space above the highest hold (paddingTop)
  let requiredHeightFromHolds = lowestY + paddingBottom;
  let requiredHeightFromTop = Math.max(0, highestY - paddingTop);

  // The wall needs to accommodate both constraints
  let requiredHeight = Math.max(requiredHeightFromHolds, height + 300); // Minimum 1000px

  console.log(`Wall height calculation:
    highestY: ${highestY}, lowestY: ${lowestY}
    requiredHeightFromHolds: ${requiredHeightFromHolds}
    current editorWallHeight: ${editorWallHeight}
    new requiredHeight: ${requiredHeight}`);

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
        console.log(`Level expanded from ${oldHeight} to ${editorWallHeight}`);
      } else {
        console.log(
          `Level contracted from ${oldHeight} to ${editorWallHeight}`
        );
      }
    }
  }

  updateFloorPosition();
  updateCamera();
}

function getHighestHoldY() {
  if (editorHolds.length === 0) return 400; // Default high position
  return Math.min(...editorHolds.map((h) => h.y));
}

function getHighestNonEndHoldY() {
  let nonEndHolds = editorHolds.filter((hold) => !hold.top);
  if (nonEndHolds.length === 0) return 600; // Default position if no non-end holds
  return Math.min(...nonEndHolds.map((h) => h.y));
}

function updateCamera() {
  // Smooth camera movement within the fixed viewport
  editorCameraOffsetY = constrain(
    editorCameraOffsetY,
    -editorWallHeight + height,
    0
  );
}

/**
 * Load level data into the editor (used when editing existing levels)
 * @param {any} levelData
 */
function loadLevelIntoEditor(levelData) {
  if (!levelData || !levelData.holds || !Array.isArray(levelData.holds)) {
    updateStatus("Invalid level data!", "error");
    return;
  }

  // Clear current level
  editorHolds = [];
  hasEndHold = false;

  // Load level data
  editorHolds = [...levelData.holds];
  hasEndHold = editorHolds.some((hold) => hold.top);

  // Set level name and author
  if (levelData.name && levelNameInput) {
    levelNameInput.value = levelData.name;
  }
  if (levelData.author && authorNameInput) {
    authorNameInput.value = levelData.author;
  }

  // Set wall height if provided
  if (levelData.wallHeight) {
    editorWallHeight = levelData.wallHeight;
  }

  updateWallHeight();
  updateFloorPosition();
  updateCamera();
}

function initializeUI() {
  // Get UI elements
  levelNameInput = /** @type {HTMLInputElement} */ (
    document.getElementById("levelName")
  );
  authorNameInput = /** @type {HTMLInputElement} */ (
    document.getElementById("authorName")
  );
  addHoldBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("addHoldMode")
  );
  removeHoldBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("removeHoldMode")
  );
  moveHoldBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("moveHoldMode")
  );
  placeEndHoldBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("placeEndHold")
  );
  shareBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("shareLevel")
  );
  testBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("testLevel")
  );
  exportBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("exportLevel")
  );
  importBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("importLevel")
  );
  clearBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById("clearLevel")
  );
  fileInput = /** @type {HTMLInputElement} */ (
    document.getElementById("fileInput")
  );
  statusDiv = /** @type {HTMLDivElement} */ (document.getElementById("status"));
  holdInfoDiv = /** @type {HTMLDivElement} */ (
    document.getElementById("holdInfo")
  );

  // Stop event propagation for all clicks within the editor UI
  const editorUI = document.getElementById("editorUI");
  editorUI?.addEventListener("click", (e) => e.stopPropagation());
  editorUI?.addEventListener("mousedown", (e) => e.stopPropagation());
  editorUI?.addEventListener("mouseup", (e) => e.stopPropagation());

  // Set up event listeners
  addHoldBtn?.addEventListener("click", () => setEditorMode("add"));
  removeHoldBtn?.addEventListener("click", () => setEditorMode("remove"));
  moveHoldBtn?.addEventListener("click", () => setEditorMode("move"));
  placeEndHoldBtn?.addEventListener("click", () => placeEndHold());
  shareBtn?.addEventListener("click", shareLevel);
  testBtn?.addEventListener("click", testLevel);
  exportBtn?.addEventListener("click", exportLevel);
  importBtn?.addEventListener("click", () => fileInput?.click());
  clearBtn?.addEventListener("click", clearLevel);
  fileInput?.addEventListener("change", importLevel);

  // Set initial mode
  setEditorMode("add");
}

/**
 * @param {string} mode
 */
function setEditorMode(mode) {
  editorMode = mode;
  selectedHold = null;

  // Update button styles
  document
    .querySelectorAll(".editor-button")
    .forEach((btn) => btn.classList.remove("active"));

  if (mode === "add") {
    addHoldBtn?.classList.add("active");
    if (editorHolds.length < 4) {
      const limbNames = ["Left Arm", "Right Arm", "Left Leg", "Right Leg"];
      updateStatus(
        `Click to place starting hold ${editorHolds.length + 1}/4 (${
          limbNames[editorHolds.length]
        }).`,
        "info"
      );
    } else {
      updateStatus(
        "Click on the wall to add holds. Holds cannot be placed below the floor.",
        "info"
      );
    }
  } else if (mode === "remove") {
    removeHoldBtn?.classList.add("active");
    updateStatus("Click on holds to remove them.", "info");
  } else if (mode === "move") {
    moveHoldBtn?.classList.add("active");
    updateStatus(
      "Click and drag holds to move them. Cannot move end hold once placed.",
      "info"
    );
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
    // Get the first 4 non-end holds from the original array
    let startingHolds = [];
    let count = 0;
    for (let hold of editorHolds) {
      if (!hold.top && count < 4) {
        startingHolds.push(hold);
        count++;
      }
    }

    let isValid =
      startingHolds.length === 4 ? validateStartingHolds(startingHolds) : false;

    const limbNames = ["L.Arm", "R.Arm", "L.Leg", "R.Leg"];
    let holdList = "";
    for (let i = 0; i < startingHolds.length; i++) {
      holdList += `${i + 1}=${limbNames[i]} `;
    }

    info += `Starting holds: ${startingHolds.length}/4 (${
      isValid ? "Valid" : "Invalid"
    })\n`;
    if (startingHolds.length > 0) {
      info += `Order: ${holdList.trim()}\n`;
    }
  }

  info += `End hold: ${
    editorHolds.some((hold) => hold.top) ? "Placed" : "Not placed"
  }\n`;
  info += `Floor Y: ${Math.round(floorY)}px`;

  if (holdInfoDiv) {
    holdInfoDiv.textContent = info;
  }
}

function mousePressed() {
  // Check if clicking on scrollbar first
  /** @type {any} */
  let scrollBar = getScrollBarDimensions();
  if (
    scrollBar &&
    isMouseOverScrollBarArea(
      scrollBar.x,
      scrollBar.y,
      scrollBar.width,
      scrollBar.height
    )
  ) {
    // Check if clicking on thumb for dragging
    if (
      mouseY >= scrollBar.thumbY &&
      mouseY <= scrollBar.thumbY + scrollBar.thumbHeight
    ) {
      scrollBarDragging = true;
      scrollBarStartY = mouseY;
      scrollBarStartCameraY = editorCameraOffsetY;
    } else {
      // Click on track - jump to that position
      let clickRatio = (mouseY - scrollBar.y) / scrollBar.height;
      let targetCameraY = -clickRatio * (editorWallHeight - height);
      editorCameraOffsetY = constrain(
        targetCameraY,
        -editorWallHeight + height,
        0
      );
    }
    return; // Don't process as canvas click
  }

  // Only process mouse clicks that are within the canvas bounds (excluding scrollbar area)
  /** @type {any} */
  let scrollBarArea = getScrollBarDimensions();
  let maxClickX = scrollBarArea ? scrollBarArea.x : width; // Exclude scrollbar area from clickable region

  if (mouseX < 0 || mouseX > maxClickX || mouseY < 0 || mouseY > height) {
    return; // Click is outside valid canvas area, ignore it
  }

  let worldMouseX = mouseX;
  let worldMouseY = mouseY - editorCameraOffsetY;

  if (editorMode === "add") {
    addHold(worldMouseX, worldMouseY);
  } else if (editorMode === "remove") {
    removeHold(worldMouseX, worldMouseY);
  } else if (editorMode === "move") {
    selectHold(worldMouseX, worldMouseY);
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
  let hasEndHoldPlaced = editorHolds.some((hold) => hold.top);
  if (hasEndHoldPlaced) {
    updateStatus("End hold already placed!", "error");
    return;
  }

  if (editorHolds.length < 4) {
    updateStatus(
      "Need at least 4 starting holds before placing end hold.",
      "error"
    );
    return;
  }

  // Calculate the topmost position (ensure it's 50px above all existing holds)
  let highestExistingY = editorHolds.length > 0 ? getHighestNonEndHoldY() : 400;
  let endHoldY = highestExistingY - 50; // Exactly 50px above highest hold

  // Place the end hold at the calculated position
  let endHold = {
    x: TOP_HOLD_COORDS.x,
    y: endHoldY,
    top: true,
  };
  editorHolds.push(endHold);
  hasEndHold = true;

  updateWallHeight();
  updateFloorPosition();
  updateStatus(
    `End hold placed 50px above topmost hold at (${
      TOP_HOLD_COORDS.x
    }, ${Math.round(endHoldY)})! Level is now complete.`,
    "success"
  );
  setEditorMode("add"); // Return to add mode
}

function mouseDragged() {
  if (scrollBarDragging) {
    // Handle scrollbar dragging
    /** @type {any} */
    let scrollBar = getScrollBarDimensions();
    if (scrollBar) {
      let deltaY = mouseY - scrollBarStartY;
      let scrollRatio = deltaY / scrollBar.height;
      let cameraChange = scrollRatio * (editorWallHeight - height);
      editorCameraOffsetY = constrain(
        scrollBarStartCameraY - cameraChange,
        -editorWallHeight + height,
        0
      );
    }
    return;
  }

  if (editorMode === "move" && selectedHold && !selectedHold.top) {
    // Can't move end hold
    let worldMouseX = mouseX;
    let worldMouseY = mouseY - editorCameraOffsetY;

    // Get scrollbar area to avoid placing holds behind it
    /** @type {any} */
    let scrollBarArea = getScrollBarDimensions();
    let maxDragX = scrollBarArea ? scrollBarArea.x - 10 : width - 10; // Keep holds away from scrollbar

    selectedHold.x = constrain(worldMouseX, 10, maxDragX);
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
  if (scrollBarDragging) {
    scrollBarDragging = false;
    return;
  }

  if (isDragging) {
    isDragging = false;
    updateStatus("Hold moved successfully.", "success");
  }
}

// Touch support for mobile devices
function touchStarted() {
  return mousePressed(); // Reuse mouse logic
}

function touchMoved() {
  return mouseDragged(); // Reuse mouse logic
}

function touchEnded() {
  return mouseReleased(); // Reuse mouse logic
}

/**
 * @param {number} x
 * @param {number} y
 */
function addHold(x, y) {
  // Check if placing near the top - grow level by 700px if within 150px of top
  if (y < 150) {
    // Within 150px of the top (y=0)
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

    // Update floor position immediately after growth
    updateFloorPosition();

    updateStatus(
      `Level expanded by 700px to accommodate top placement!`,
      "info"
    );
  }

  // Constrain to canvas bounds (excluding scrollbar area)
  /** @type {any} */
  let scrollBarArea = getScrollBarDimensions();
  let maxX = scrollBarArea ? scrollBarArea.x - 10 : width - 10; // Keep holds away from scrollbar

  x = constrain(x, 10, maxX);
  y = constrain(y, 10, editorWallHeight - 10);

  // Check if hold would be below floor
  if (y > floorY - 15) {
    // 15px buffer above floor
    updateStatus("Cannot place holds below the floor!", "error");
    return;
  }

  // Check if hold would be too close to end hold (if placed)
  if (hasEndHold) {
    let endHold = editorHolds.find((h) => h.top);
    if (endHold && y < endHold.y + 20) {
      updateStatus(
        "Cannot place holds within 20px above the end hold!",
        "error"
      );
      return;
    }
  }

  // Check if too close to existing holds
  for (let hold of editorHolds) {
    if (dist(x, y, hold.x, hold.y) < 25) {
      updateStatus(
        "Too close to existing hold. Place holds at least 25px apart.",
        "error"
      );
      return;
    }
  }

  // Add the hold
  let newHold = { x: x, y: y };
  editorHolds.push(newHold);

  updateFloorPosition();

  if (editorHolds.length <= 4 && !hasEndHold) {
    const limbNames = ["Left Arm", "Right Arm", "Left Leg", "Right Leg"];
    updateStatus(
      `${limbNames[editorHolds.length - 1]} starting hold (${
        editorHolds.length
      }/4) placed at (${Math.round(x)}, ${Math.round(y)})`,
      "success"
    );
  } else {
    updateStatus(
      `Hold added at (${Math.round(x)}, ${Math.round(y)})`,
      "success"
    );
  }

  // Update mode status if we just finished placing starting holds
  if (editorHolds.length === 4 && !hasEndHold) {
    updateStatus(
      "All starting holds placed! You can now add more holds or place the end hold.",
      "success"
    );
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
      editorHolds.splice(i, 1);

      // Update hasEndHold flag if we removed the end hold
      if (hold.top) {
        hasEndHold = false;
        updateStatus("End hold removed.", "success");
      } else {
        updateStatus("Hold removed.", "success");
      }

      // Optimize level size after removal
      updateWallHeight();
      updateFloorPosition();
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
  // Check if we have enough holds (excluding end hold)
  let startingHolds = editorHolds.filter((hold) => !hold.top);
  if (startingHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to test the level.", "error");
    return;
  }

  // Check if end hold is placed by looking for actual hold with top property
  let endHold = editorHolds.find((hold) => hold.top);
  if (!endHold) {
    updateStatus(
      "Need to place an end hold before testing. Click 'Place End Hold' button.",
      "error"
    );
    return;
  }

  // Verify the end hold is the topmost hold
  let highestOtherY = getHighestNonEndHoldY();

  if (endHold.y >= highestOtherY - 20) {
    updateStatus(
      "End hold must be at least 20px above all other holds.",
      "error"
    );
    return;
  }

  // Validate starting holds positioning - get the first 4 non-end holds from the original array
  let firstFourHolds = [];
  let count = 0;
  for (let hold of editorHolds) {
    if (!hold.top && count < 4) {
      firstFourHolds.push(hold);
      count++;
    }
  }

  if (firstFourHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to test the level.", "error");
    return;
  }

  if (!validateStartingHolds(firstFourHolds)) {
    updateStatus(
      "Starting holds are invalid - they're too far apart. Fix positioning first.",
      "error"
    );
    return;
  }

  // All validation passed - test the level
  updateStatus("Testing level...", "info");

  // Create level data and compress it for the URL
  let levelData = createLevelData();
  let compressedLevel = compressLevelData(levelData);
  let encodedLevel = encodeURIComponent(compressedLevel);

  // Open game with level data in URL
  setTimeout(() => {
    window.open(`./index.html?level=custom&data=${encodedLevel}`, "_blank");
    updateStatus("Level opened in new tab for testing!", "success");
  }, 500);
}

function exportLevel() {
  // Check if we have starting holds
  let startingHolds = editorHolds.filter((hold) => !hold.top);
  if (startingHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to export.", "error");
    return;
  }

  // Check if end hold is placed by looking for actual hold with top property
  let endHold = editorHolds.find((hold) => hold.top);
  if (!endHold) {
    updateStatus(
      "Need to place an end hold before exporting. Click 'Place End Hold' button.",
      "error"
    );
    return;
  }

  // Verify the end hold is the topmost hold
  let highestOtherY = getHighestNonEndHoldY();

  if (endHold.y >= highestOtherY - 20) {
    updateStatus(
      "End hold must be at least 20px above all other holds.",
      "error"
    );
    return;
  }

  // Validate starting holds positioning
  let firstFourHolds = startingHolds.slice(0, 4);
  if (!validateStartingHolds(firstFourHolds)) {
    updateStatus(
      "Starting holds are invalid - they're too far apart. Fix positioning first.",
      "error"
    );
    return;
  }

  let levelData = createLevelData();

  // Create and download JSON file
  let dataStr = JSON.stringify(levelData, null, 2);
  let dataBlob = new Blob([dataStr], { type: "application/json" });

  let link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `${levelData.name.replace(/\s+/g, "_").toLowerCase()}.json`;
  link.click();

  updateStatus("Level exported successfully!", "success");
}

function shareLevel() {
  // Check if we have starting holds
  let startingHolds = editorHolds.filter((hold) => !hold.top);
  if (startingHolds.length < 4) {
    updateStatus("Need at least 4 starting holds to share.", "error");
    return;
  }

  // Check if end hold is placed by looking for actual hold with top property
  let endHold = editorHolds.find((hold) => hold.top);
  if (!endHold) {
    updateStatus(
      "Need to place an end hold before sharing. Click 'Place End Hold' button.",
      "error"
    );
    return;
  }

  // Verify the end hold is the topmost hold
  let highestOtherY = getHighestNonEndHoldY();

  if (endHold.y >= highestOtherY - 20) {
    updateStatus(
      "End hold must be at least 20px above all other holds.",
      "error"
    );
    return;
  }

  // Validate starting holds positioning
  let firstFourHolds = startingHolds.slice(0, 4);
  if (!validateStartingHolds(firstFourHolds)) {
    updateStatus(
      "Starting holds are invalid - they're too far apart. Fix positioning first.",
      "error"
    );
    return;
  }

  let levelData = createLevelData();
  let compressedLevel = compressLevelData(levelData);
  let encodedLevel = encodeURIComponent(compressedLevel);
  let shareUrl = `${window.location.origin}${window.location.pathname.replace(
    "level-editor.html",
    "index.html"
  )}?level=custom&data=${encodedLevel}`;

  // Copy to clipboard
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      updateStatus("Shareable URL copied to clipboard!", "success");
    })
    .catch(() => {
      // Fallback: show the URL in a prompt for manual copying
      prompt(
        "Share this URL with others to let them play your level:",
        shareUrl
      );
      updateStatus("Shareable URL generated!", "success");
    });
}

function importLevel() {
  let file = fileInput?.files?.[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (e) {
    try {
      let result = e.target?.result;
      if (typeof result !== "string") {
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
      hasEndHold = editorHolds.some((hold) => hold.top);

      // Update UI
      if (levelData.name && levelNameInput) {
        levelNameInput.value = levelData.name;
      }
      if (levelData.author && authorNameInput) {
        authorNameInput.value = levelData.author;
      }

      updateWallHeight();
      updateStatus("Level imported successfully!", "success");
    } catch (error) {
      let errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      updateStatus(`Import failed: ${errorMessage}`, "error");
    }
  };

  reader.readAsText(file);
  if (fileInput) fileInput.value = ""; // Reset file input
}

function clearLevel() {
  if (
    confirm("Are you sure you want to clear all holds? This cannot be undone.")
  ) {
    editorHolds = []; // Clear all holds
    selectedHold = null;
    hasEndHold = false;

    // Clear the URL parameters to start fresh
    const url = new URL(window.location.href);
    url.searchParams.delete("data");
    window.history.replaceState({}, document.title, url.pathname);

    // Clear input fields
    if (levelNameInput) levelNameInput.value = "Custom Level";
    if (authorNameInput) authorNameInput.value = "";

    updateWallHeight();
    updateFloorPosition();
    updateStatus(
      "Level cleared. Start by adding starting holds at the bottom.",
      "info"
    );
  }
}

function createLevelData() {
  let levelName = levelNameInput?.value.trim() || "Custom Level";
  let authorName = authorNameInput?.value.trim() || "Anonymous";

  console.log(`Creating level data with wallHeight: ${editorWallHeight}`);
  console.log(`Total holds: ${editorHolds.length}`);
  console.log(
    `Hold positions:`,
    editorHolds.map((h) => `(${h.x}, ${h.y}) ${h.top ? "END" : ""}`)
  );

  return {
    name: levelName,
    author: authorName,
    wallHeight: editorWallHeight,
    holds: editorHolds.map((hold) => ({ ...hold })), // Deep copy holds
  };
}

// Keyboard shortcuts
function keyPressed() {
  // Check if user is typing in an input field
  const activeElement = document.activeElement;
  if (
    activeElement &&
    (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
  ) {
    return; // Don't process keyboard shortcuts while typing in input fields
  }

  if (key === "1") setEditorMode("add");
  else if (key === "2") setEditorMode("remove");
  else if (key === "3") setEditorMode("move");
  else if (key === "4") placeEndHold();
  else if (key === "t" || key === "T") testLevel();
  else if (key === "s" || key === "S") shareLevel();
  else if (key === "e" || key === "E") exportLevel();
  else if (key === "c" || key === "C") clearLevel();
  else if (keyCode === UP_ARROW || key === "w" || key === "W") {
    // Scroll up
    let newCameraY = editorCameraOffsetY - 50;
    editorCameraOffsetY = constrain(newCameraY, -editorWallHeight + height, 0);
  } else if (keyCode === DOWN_ARROW || key === "s" || key === "S") {
    // Scroll down
    let newCameraY = editorCameraOffsetY + 50;
    editorCameraOffsetY = constrain(newCameraY, -editorWallHeight + height, 0);
  }
}
