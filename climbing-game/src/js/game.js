//@ts-check

/**
 * import all p5.js functions
 * @type {import("p5")}
 */

/**
 * @typedef {'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg'} LimbName
 */

/**
 * @typedef {Object} Hold
 * @property {number} x - X position of the hold
 * @property {number} y - Y position of the hold
 * @property {boolean} [top] - Whether this hold is the top hold
 */

/**
 * @type {Hold[]}
 */
let holds = [];

/**
 * @type {Hold | null}
 */
let topHold = null;
let gameWon = false;
let wallHeight = 3000;
let cameraOffsetY = 0;

// Scrollbar interaction variables
let gameScrollBarDragging = false;
let gameScrollBarStartY = 0;
let gameScrollBarStartCameraY = 0;
let manualCameraControl = false; // Track if player is manually controlling camera

let selectedLimb = "leftArm";
let totalMoves = 0;
let startingHeight = 0;
let currentHeight = 0;
/** @type {any | null} */
let currentCustomLevelData = null; // Store current custom level data for editing
let torsoPushed = false; // Track if torso has been manually pushed

// Animation variables
let animationSpeed = 0.22; // How fast animations complete (0.1 = slower, 0.3 = faster)
let isAnimating = false; // Prevent input during animations

// Victory dance variables
let danceOffset = 0; // For dancing animation
let danceSpeed = 0.05; // Speed of the dance (reduced from 0.1 for slower motion)

/**
 * @type {Partial<Record<LimbName, HTMLButtonElement>>}
 */
let limbButtons = {};

/**
 * @type {HTMLButtonElement | null}
 */
let pushButton = null;

/**
 * @typedef {Object} Climber
 * @property {Object} torso - The climber's torso position
 * @property {number} torso.x - X position of the torso
 * @property {number} torso.y - Y position of the torso
 * @property {Object} torsoTarget - Target position for torso animation
 * @property {number} torsoTarget.x - Target X position of the torso
 * @property {number} torsoTarget.y - Target Y position of the torso
 * @property {Record<LimbName, { hold: Hold | null, reach: number, targetHold: Hold | null }>} limbs - The climber's limbs
 *
 */

/**
 * @type {Climber}
 */
const climber = {
  torso: { x: 0, y: 0 },
  torsoTarget: { x: 0, y: 0 },
  limbs: {
    leftArm: { hold: null, reach: 80, targetHold: null },
    rightArm: { hold: null, reach: 80, targetHold: null },
    leftLeg: { hold: null, reach: 120, targetHold: null },
    rightLeg: { hold: null, reach: 120, targetHold: null },
  },
};

/**
 * @typedef {Object} Level
 * @property {string} name - The name of the level
 * @property {string} author - The author of the level
 * @property {number} wallHeight - The height of the climbing wall
 * @property {Hold[]} holds - The holds available in the level
 * @property {number} order - The order of the level (for sorting)
 * @typedef {Record<string, Level>} Levels
 *
 * @type {Levels}
 */
// Levels are now loaded from levels.js
const levels = gameLevels;

/**
 * Generate holds for the generated level
 * @returns {Hold[]}
 */
function generateLevel() {
  let h = [];
  const holdSize = 20; // Size of each hold
  const minDistance = holdSize * 1.5; // Minimum distance between holds (1.5x hold size)
  const maxReach = 160; // Maximum reach of any limb
  const wallWidth = 400;
  const wallHeight = 3000;

  // Starting holds - manually placed to ensure good starting position
  // Moved up from bottom to give more space below (was 2830, 2850, 2920, 2950)
  h.push({ x: 130, y: 2420 }); // left leg
  h.push({ x: 200, y: 2450 }); // right leg
  h.push({ x: 150, y: 2330 }); // left arm
  h.push({ x: 240, y: 2350 }); // right arm

  // Function to check if a new hold position is valid
  /**
   * @param {number} newX
   * @param {number} newY
   * @param {Hold[]} existingHolds
   * @returns {boolean}
   */
  function isValidPosition(newX, newY, existingHolds) {
    // Check boundaries
    if (newX < holdSize || newX > wallWidth - holdSize) return false;
    if (newY < holdSize || newY > wallHeight - holdSize) return false;

    // Check distance from existing holds
    for (let existingHold of existingHolds) {
      let distance = Math.sqrt(
        (newX - existingHold.x) ** 2 + (newY - existingHold.y) ** 2
      );
      if (distance < minDistance) return false;
    }

    return true;
  }

  // Function to check if a hold is climbable (reachable from nearby holds)
  /**
   * @param {number} newX
   * @param {number} newY
   * @param {Hold[]} existingHolds
   * @returns {boolean}
   */
  function isClimbable(newX, newY, existingHolds) {
    if (existingHolds.length === 0) return true;

    // Use the same reach values as the actual climber
    const armReach = climber.limbs.leftArm.reach;
    const legReach = climber.limbs.leftLeg.reach;
    const maxReach = Math.max(armReach, legReach);

    // Simple but effective approach: ensure the new hold is reachable from existing holds
    // and that there are enough support holds nearby

    let reachableSupports = 0;
    let closestDistance = Infinity;

    for (let hold of existingHolds) {
      const distance = Math.sqrt((newX - hold.x) ** 2 + (newY - hold.y) ** 2);

      if (distance < closestDistance) {
        closestDistance = distance;
      }

      // Count holds that are within reasonable reach
      if (distance <= maxReach * 1.2) {
        // Allow for 20% stretch
        reachableSupports++;
      }
    }

    // A hold is climbable if:
    // 1. The closest existing hold is within maximum stretch reach
    // 2. There are at least 2 holds nearby for support (or 1 if very close)
    const withinReach = closestDistance <= maxReach * 1.4; // 40% stretch for closest hold
    const hasSupport =
      reachableSupports >= 2 ||
      (reachableSupports >= 1 && closestDistance <= maxReach * 0.8);

    return withinReach && hasSupport;
  }

  // Generate holds layer by layer from bottom to top
  const layerHeight = 80; // Reduced layer height for more layers (was 100)
  const holdsPerLayer = 4; // Increased back to 4 holds per layer for better climbability
  const scrollbarAreaWidth = 30; // Area to avoid on the right side for scrollbar
  const availableWidth = wallWidth - scrollbarAreaWidth - 2 * holdSize; // Define outside the loop

  for (
    let layer = 0;
    layer < Math.floor((wallHeight - 700) / layerHeight); // Changed from 200 to 700 to account for more bottom space
    layer++
  ) {
    let layerY = wallHeight - 700 - layer * layerHeight; // Changed from 200 to 700
    let attemptsForLayer = 0;
    let holdsInLayer = 0;

    while (holdsInLayer < holdsPerLayer && attemptsForLayer < 100) {
      // Increased attempts
      // Avoid scrollbar area by reducing available width
      let newX = Math.random() * availableWidth + holdSize;
      let newY = layerY + (Math.random() - 0.5) * layerHeight * 0.6; // Reduced variation for more consistent layers

      if (isValidPosition(newX, newY, h) && isClimbable(newX, newY, h)) {
        h.push({ x: newX, y: newY });
        holdsInLayer++;
      }
      attemptsForLayer++;
    }

    // If we couldn't place enough holds in this layer, try to place at least one
    if (holdsInLayer === 0 && attemptsForLayer >= 100) {
      // Force place at least one hold per layer to ensure progression
      let fallbackX = 100 + Math.random() * (availableWidth - 100);
      let fallbackY = layerY;

      if (isValidPosition(fallbackX, fallbackY, h)) {
        h.push({ x: fallbackX, y: fallbackY });
      }
    }
  }

  // Add some additional random holds to fill gaps and ensure climbability
  let additionalAttempts = 0;
  while (h.length < 90 && additionalAttempts < 200) {
    // Increased from 70 to 90 holds, attempts from 150 to 200
    // Avoid scrollbar area by reducing available width
    let newX = Math.random() * availableWidth + holdSize;
    let newY = Math.random() * (wallHeight - 800) + 100; // Changed from 300 to 800 to account for more bottom space

    if (isValidPosition(newX, newY, h) && isClimbable(newX, newY, h)) {
      h.push({ x: newX, y: newY });
    }
    additionalAttempts++;
  }

  // Top hold - ensure it's climbable and well-positioned
  let topHoldPlaced = false;
  let topAttempts = 0;
  while (!topHoldPlaced && topAttempts < 30) {
    // Increased attempts
    let topX = 120 + Math.random() * 160; // Wider range for better positioning
    let topY = 30 + Math.random() * 20; // Small Y variation

    if (isValidPosition(topX, topY, h) && isClimbable(topX, topY, h)) {
      h.push({ x: topX, y: topY, top: true });
      topHoldPlaced = true;
    }
    topAttempts++;
  }

  // Fallback top hold if placement failed - try multiple positions
  if (!topHoldPlaced) {
    const fallbackPositions = [
      { x: 200, y: 40 },
      { x: 150, y: 50 },
      { x: 250, y: 45 },
      { x: 180, y: 35 },
    ];

    for (let pos of fallbackPositions) {
      if (isValidPosition(pos.x, pos.y, h) && isClimbable(pos.x, pos.y, h)) {
        h.push({ x: pos.x, y: pos.y, top: true });
        topHoldPlaced = true;
        break;
      }
    }

    // Ultimate fallback - place without climbability check
    if (!topHoldPlaced) {
      h.push({ x: 200, y: 40, top: true });
    }
  }

  return h;
}

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

  return JSON.stringify(compressed);
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
  // Create canvas and attach it to the gameContainer div
  let canvas = createCanvas(400, 700);
  canvas.parent("gameContainer");

  // Generate the procedural level now that p5.js is initialized
  levels.generated.holds = generateLevel();

  createLimbButtons();
  populateLevelSelect();

  // Set up edit level link
  const editLevelLink = document.getElementById("editLevel");
  if (editLevelLink) {
    editLevelLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentCustomLevelData) {
        // Compress the level data for the editor URL
        const compressedLevel = compressLevelData(currentCustomLevelData);
        const encodedLevel = encodeURIComponent(compressedLevel);
        const editorUrl = `./level-editor.html?data=${encodedLevel}`;
        window.open(editorUrl, "_blank");
      }
    });
  }

  // Check for custom level parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const customLevel = urlParams.get("level");

  if (customLevel === "custom") {
    // Try to load custom level data from URL parameter
    const customLevelData = urlParams.get("data");
    if (customLevelData) {
      try {
        // Try decompressing first (new format), fallback to old format
        let levelData;
        try {
          levelData = decompressLevelData(decodeURIComponent(customLevelData));
        } catch (error) {
          // Fallback to old uncompressed format
          levelData = JSON.parse(decodeURIComponent(customLevelData));
        }

        if (levelData) {
          loadCustomLevel(levelData);
          return;
        } else {
          throw new Error("Failed to decompress level data");
        }
      } catch (error) {
        console.error("Failed to load custom level from URL:", error);
      }
    }

    // Fallback: try to load from localStorage for backward compatibility
    const storedLevelData = localStorage.getItem("customLevel");
    if (storedLevelData) {
      try {
        const levelData = JSON.parse(storedLevelData);
        loadCustomLevel(levelData);
        return;
      } catch (error) {
        console.error("Failed to load custom level from localStorage:", error);
      }
    }
  }

  loadLevel("default");
}

function draw() {
  background(240);

  push();
  translate(0, cameraOffsetY, 0);

  // Draw climbing wall background
  fill(220, 220, 220); // Light gray wall
  noStroke();
  rect(0, 0, width, wallHeight);

  // Draw floor - position it dynamically based on starting holds
  fill(139, 69, 19); // Brown color for the floor
  noStroke();

  // Find the lowest starting hold position (highest Y value since Y increases downward)
  let lowestStartingY = 0;
  if (holds.length >= 4) {
    // Use the first 4 holds as starting holds
    lowestStartingY = Math.max(holds[0].y, holds[1].y, holds[2].y, holds[3].y);
  } else if (holds.length >= 3) {
    // Use the first 3 holds for shorter levels
    lowestStartingY = Math.max(holds[0].y, holds[1].y, holds[2].y);
  } else if (holds.length > 0) {
    // Fallback: use the lowest hold in the level
    lowestStartingY = Math.max(...holds.map((h) => h.y));
  }

  // Position floor with some distance below the starting holds
  const floorDistance = 100; // Distance between lowest starting hold and floor
  const floorY = lowestStartingY + floorDistance;

  // Ensure floor fits within wall boundaries
  const availableFloorSpace = wallHeight - floorY;
  const floorHeight = Math.min(700, availableFloorSpace); // Cap floor height to fit within wall

  if (floorHeight > 0) {
    rect(0, floorY, width, floorHeight);

    // Add floor texture/pattern
    fill(120, 60, 15); // Darker brown for pattern
    for (let y = floorY; y < floorY + floorHeight; y += 20) {
      rect(0, y, width, 2);
    }
  }

  // Draw holds
  for (let h of holds) {
    if (h === topHold) {
      fill("gold");
    } else if (
      canReach(
        climber.torso,
        h,
        climber.limbs[/** @type {LimbName} */ (selectedLimb)].reach,
        /** @type {LimbName} */ (selectedLimb)
      )
    ) {
      fill("#4CAF50");
    } else {
      fill("#8B4513");
    }
    ellipse(h.x, h.y, 20, 20);
  }

  // Calculate dance offsets for victory animation (moved before limb drawing)
  let torsoXOffset = 0;
  let torsoYOffset = 0;
  let headXOffset = 0;
  let headYOffset = 0;
  let pushRelaxOffset = 0;
  let dancingTorsoY = climber.torso.y; // Default to normal position

  if (gameWon) {
    // Update dance animation
    danceOffset += danceSpeed;

    // Create slower dancing motion with sine waves
    torsoXOffset = sin(danceOffset * 4) * 2; // Slower side to side movement (reduced from 8 to 4)
    torsoYOffset = abs(sin(danceOffset * 6)) * 1; // Slower bouncing (reduced from 12 to 6)
    headXOffset = sin(danceOffset * 5) * 1.5; // Slower head sway (reduced from 10 to 5)
    headYOffset = abs(sin(danceOffset * 8)) * 1; // Slower head bounce (reduced from 15 to 8)

    // Add push/relax motion - slow up and down movement like pressing push button
    pushRelaxOffset = sin(danceOffset * 2) * 8; // Very slow push/relax motion (every 3+ seconds)

    // Apply push/relax offset to the torso position
    dancingTorsoY = climber.torso.y + pushRelaxOffset;
  }

  // Draw limbs
  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    let targetHold = climber.limbs[/** @type {LimbName} */ (limb)].targetHold;

    // Use target hold for drawing if it exists (during animation)
    let currentHold = targetHold || hold;

    if (currentHold) {
      // Set color based on limb type
      if (limb === "leftArm" || limb === "rightArm") {
        stroke("#3264C8");
      } else {
        stroke("#444");
      }

      // Calculate limb attachment point based on limb type
      // Use dancing torso position if game is won
      let baseTorsoX = climber.torso.x;
      let baseTorsoY = climber.torso.y;

      if (gameWon) {
        // Apply dance animation to torso position for limb calculations
        baseTorsoX += torsoXOffset;
        baseTorsoY = dancingTorsoY + torsoYOffset;
      }

      let attachmentX = baseTorsoX;
      let attachmentY = baseTorsoY;
      const torsoWidth = 36;
      const torsoHeight = 74;
      const inset = 9; // Move attachment points 9px towards center

      if (limb === "leftArm") {
        attachmentX = baseTorsoX - torsoWidth / 2 + inset;
        attachmentY = baseTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "rightArm") {
        attachmentX = baseTorsoX + torsoWidth / 2 - inset;
        attachmentY = baseTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "leftLeg") {
        attachmentX = baseTorsoX - torsoWidth / 2 + inset;
        attachmentY = baseTorsoY + torsoHeight / 2 - inset;
      } else if (limb === "rightLeg") {
        attachmentX = baseTorsoX + torsoWidth / 2 - inset;
        attachmentY = baseTorsoY + torsoHeight / 2 - inset;
      }

      // Calculate limb length and direction
      let limbLength = climber.limbs[/** @type {LimbName} */ (limb)].reach;
      let segmentLength = limbLength / 2; // Each segment is half of total reach

      // Calculate distance from attachment point to hold
      let totalDistance = dist(
        attachmentX,
        attachmentY,
        currentHold.x,
        currentHold.y
      );

      // Calculate angle from attachment point to hold
      let angle = atan2(
        currentHold.y - attachmentY,
        currentHold.x - attachmentX
      );

      // Calculate joint position using the limb's actual reach
      // Use law of cosines to find the joint position that makes both segments equal length
      let dx = currentHold.x - attachmentX;
      let dy = currentHold.y - attachmentY;

      // If the hold is within reach, calculate the bent limb position
      if (totalDistance <= limbLength) {
        // Calculate the angle for the joint to create equal segment lengths
        let midX = attachmentX + dx * 0.5;
        let midY = attachmentY + dy * 0.5;

        // Calculate perpendicular offset to create the bend
        let bendHeight = sqrt(
          segmentLength * segmentLength -
            totalDistance * 0.5 * (totalDistance * 0.5)
        );

        // Declare joint position variables
        let jointX, jointY;

        // Handle case when limb is nearly straight (bendHeight is very small)
        if (bendHeight < 1 || isNaN(bendHeight)) {
          // For straight limbs, place joint at midpoint
          jointX = midX;
          jointY = midY;
        } else {
          // Adjust pivot direction based on limb type
          let perpAngle;
          if (limb === "rightLeg" || limb === "leftArm") {
            perpAngle = angle - PI / 2;
          } else {
            perpAngle = angle + PI / 2;
          }

          jointX = midX + cos(perpAngle) * bendHeight;
          jointY = midY + sin(perpAngle) * bendHeight;
        }

        // Draw limb segments as lines with different thicknesses
        // Adjust joint connections to respect stroke width and prevent protrusion
        if (limb === "leftLeg" || limb === "rightLeg") {
          // Thigh (first segment) - thickest (12px)
          strokeWeight(12);
          // Calculate adjusted endpoint for thigh (inset by difference in stroke width)
          let thighAngle = atan2(jointY - attachmentY, jointX - attachmentX);
          let strokeDiff = (12 - 8) / 2; // Difference between thigh and lower leg stroke
          let adjustedJointX = jointX - cos(thighAngle) * strokeDiff;
          let adjustedJointY = jointY - sin(thighAngle) * strokeDiff;
          line(attachmentX, attachmentY, adjustedJointX, adjustedJointY);

          // Lower leg (second segment) - thick (8px)
          strokeWeight(8);
          // Lower leg connects to the actual joint position
          line(jointX, jointY, currentHold.x, currentHold.y);
        } else {
          // Upper arm (first segment) - thick (8px)
          strokeWeight(8);
          // Calculate adjusted endpoint for upper arm (inset by difference in stroke width)
          let upperArmAngle = atan2(jointY - attachmentY, jointX - attachmentX);
          let strokeDiff = (8 - 6) / 2; // Difference between upper arm and forearm stroke
          let adjustedJointX = jointX - cos(upperArmAngle) * strokeDiff;
          let adjustedJointY = jointY - sin(upperArmAngle) * strokeDiff;
          line(attachmentX, attachmentY, adjustedJointX, adjustedJointY);

          // Forearm (second segment) - medium (6px)
          strokeWeight(6);
          // Forearm connects to the actual joint position
          line(jointX, jointY, currentHold.x, currentHold.y);
        }
      } else {
        // If hold is out of reach, draw straight line at maximum reach
        // Use thicker stroke for legs, medium for arms
        if (limb === "leftLeg" || limb === "rightLeg") {
          strokeWeight(10); // Average of thigh and lower leg
        } else {
          strokeWeight(7); // Average of upper arm and forearm
        }

        let endX = attachmentX + cos(angle) * limbLength;
        let endY = attachmentY + sin(angle) * limbLength;
        line(attachmentX, attachmentY, endX, endY);
      }
    }
  }

  // Draw torso as rounded rectangle with dance animation
  fill(50, 100, 200, 255); // #3264C8
  noStroke();
  rectMode(CENTER);
  // rect(x, y, width, height, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius)
  rect(
    climber.torso.x + torsoXOffset,
    dancingTorsoY + torsoYOffset,
    36,
    74,
    18,
    18,
    18,
    18
  );

  // Draw green dot indicator for selected limb attachment point (hidden during victory)
  if (selectedLimb && !gameWon) {
    fill("#6CBF6C"); // Light green matching reachable holds
    noStroke();

    // Calculate attachment point for the selected limb
    let baseTorsoX = climber.torso.x;
    let baseTorsoY = dancingTorsoY;

    if (gameWon) {
      baseTorsoX += torsoXOffset;
      baseTorsoY += torsoYOffset;
    }

    const torsoWidth = 36;
    const torsoHeight = 74;
    const inset = 9; // Same inset as used in limb attachment calculation

    let dotX = baseTorsoX;
    let dotY = baseTorsoY;

    if (selectedLimb === "leftArm") {
      dotX = baseTorsoX - torsoWidth / 2 + inset;
      dotY = baseTorsoY - torsoHeight / 2 + inset;
    } else if (selectedLimb === "rightArm") {
      dotX = baseTorsoX + torsoWidth / 2 - inset;
      dotY = baseTorsoY - torsoHeight / 2 + inset;
    } else if (selectedLimb === "leftLeg") {
      dotX = baseTorsoX - torsoWidth / 2 + inset;
      dotY = baseTorsoY + torsoHeight / 2 - inset;
    } else if (selectedLimb === "rightLeg") {
      dotX = baseTorsoX + torsoWidth / 2 - inset;
      dotY = baseTorsoY + torsoHeight / 2 - inset;
    }

    // Draw the green dot
    ellipse(dotX, dotY, 8, 8);
  }

  // Draw head as a circle above the torso with dance animation
  fill(220, 180, 140, 255); // Skin tone color
  noStroke();
  const torsoHeight = 74;
  const headRadius = 14;
  const headY = dancingTorsoY - torsoHeight / 2 - headRadius - 2; // 2px gap between torso and head
  ellipse(
    climber.torso.x + headXOffset,
    headY + headYOffset + torsoYOffset,
    headRadius * 2,
    headRadius * 2
  );

  pop();

  // Draw scroll bar (after pop so it's not affected by camera transform)
  drawScrollBar();

  updateAnimations();
  updateTorso();
  updateCamera();

  const heightInMeters = Math.round(currentHeight / 10) / 10;

  if (gameWon) {
    // Draw semi-transparent background for victory message
    fill(0, 0, 0, 180); // Darker background for victory
    noStroke();
    rect(width / 2 - 180, 40, 360, 80, 10); // Wider centered rounded rectangle background

    fill(0, 180, 0, 255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Victory!", width / 2, 60);
    text(`${totalMoves} moves, ${heightInMeters}m climbed!`, width / 2, 100);
    // Note: noLoop() removed to allow dancing animation
  } else {
    // Only show game stats when not in victory state
    // Draw semi-transparent background for stats
    fill(0, 0, 0, 150); // Black with 150/255 opacity
    noStroke();
    rect(5, 5, 140, 45, 5); // Rounded rectangle background

    // Display stats (moves and height)
    fill(255); // White text for better contrast
    textSize(16);
    textAlign(LEFT, TOP);
    text(`Moves: ${totalMoves}`, 10, 10);
    text(`Height: ${heightInMeters}m`, 10, 30);
  }
}

function updateAnimations() {
  // Update torso animation
  climber.torso.x = lerp(
    climber.torso.x,
    climber.torsoTarget.x,
    animationSpeed
  );
  climber.torso.y = lerp(
    climber.torso.y,
    climber.torsoTarget.y,
    animationSpeed
  );

  // Check if animations are complete
  let animationComplete = true;
  const threshold = 0.5; // Distance threshold to consider animation complete

  // Check torso animation
  if (
    dist(
      climber.torso.x,
      climber.torso.y,
      climber.torsoTarget.x,
      climber.torsoTarget.y
    ) > threshold
  ) {
    animationComplete = false;
  }

  // Check limb animations
  for (let limb in climber.limbs) {
    let limbData = climber.limbs[/** @type {LimbName} */ (limb)];
    if (limbData.targetHold && limbData.hold !== limbData.targetHold) {
      animationComplete = false;
    }
  }

  // If all animations are complete, finalize the moves
  if (animationComplete && isAnimating) {
    isAnimating = false;

    // Finalize limb positions
    for (let limb in climber.limbs) {
      let limbData = climber.limbs[/** @type {LimbName} */ (limb)];
      if (limbData.targetHold) {
        limbData.hold = limbData.targetHold;
        limbData.targetHold = null;
      }
    }
  }
}

function updateTorso() {
  // Only update torso target position automatically if it hasn't been manually pushed
  // or if we need to recalculate due to a limb move
  if (!torsoPushed) {
    let sumX = 0,
      sumY = 0,
      count = 0;
    for (let limb in climber.limbs) {
      let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
      if (hold) {
        sumX += hold.x;
        sumY += hold.y;
        count++;
      }
    }
    if (count > 0) {
      climber.torsoTarget.x = sumX / count;
      climber.torsoTarget.y = sumY / count;
    }
  }
}

function updateCamera() {
  // Only auto-follow the player if not manually controlling the camera
  if (!manualCameraControl) {
    const targetY = -climber.torso.y + height / 2;
    cameraOffsetY = lerp(cameraOffsetY, targetY, 0.08); // Slower camera movement for smoother feel
  }
  cameraOffsetY = constrain(cameraOffsetY, -wallHeight + height, 0);
}

function drawScrollBar() {
  // Only draw scroll bar if content is larger than viewport
  if (wallHeight <= height) return;

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
  let contentRatio = height / wallHeight; // How much of content fits in viewport
  let thumbHeight = scrollBarHeight * contentRatio;
  thumbHeight = max(thumbHeight, 30); // Increased minimum thumb height for touch

  // Calculate thumb position based on current camera offset
  let scrollProgress = abs(cameraOffsetY) / (wallHeight - height);
  scrollProgress = constrain(scrollProgress, 0, 1);
  let thumbY = scrollBarY + scrollProgress * (scrollBarHeight - thumbHeight);

  // Highlight thumb if being dragged
  if (gameScrollBarDragging) {
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

  // Note: Scroll position indicator text is hidden in game mode (only shown in level editor)
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
  if (wallHeight <= height) return null;

  let scrollBarWidth = 20;
  let scrollBarX = width - scrollBarWidth - 5;
  let scrollBarY = 10;
  let scrollBarHeight = height - 20;

  let contentRatio = height / wallHeight;
  let thumbHeight = max(scrollBarHeight * contentRatio, 30);
  let scrollProgress = abs(cameraOffsetY) / (wallHeight - height);
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
  // Draw indicators for holds and player on the scroll bar

  // Player indicator
  let playerPos = map(
    climber.torso.y,
    0,
    wallHeight,
    scrollBarY,
    scrollBarY + scrollBarHeight
  );
  fill(255, 0, 0); // Red for player
  noStroke();
  ellipse(scrollBarX + scrollBarWidth / 2, playerPos, 6, 6);

  // Hold indicators
  for (let i = 0; i < holds.length; i++) {
    let hold = holds[i];
    let holdPos = map(
      hold.y,
      0,
      wallHeight,
      scrollBarY,
      scrollBarY + scrollBarHeight
    );

    if (hold === topHold) {
      fill(255, 215, 0); // Gold for top hold
    } else if (i < 4) {
      fill(76, 175, 80); // Green for starting holds
    } else {
      fill(139, 69, 19); // Brown for regular holds
    }

    ellipse(scrollBarX + scrollBarWidth / 2, holdPos, 4, 4);
  }
}

function mousePressed() {
  if (gameWon || isAnimating) return; // Prevent input during animations

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
    // Enable manual camera control
    manualCameraControl = true;

    // Check if clicking on thumb for dragging
    if (
      mouseY >= scrollBar.thumbY &&
      mouseY <= scrollBar.thumbY + scrollBar.thumbHeight
    ) {
      gameScrollBarDragging = true;
      gameScrollBarStartY = mouseY;
      scrollBarStartCameraY = cameraOffsetY;
    } else {
      // Click on track - jump to that position
      let clickRatio = (mouseY - scrollBar.y) / scrollBar.height;
      let targetCameraY = -clickRatio * (wallHeight - height);
      cameraOffsetY = constrain(targetCameraY, -wallHeight + height, 0);
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

  const worldMouseY = mouseY - cameraOffsetY;
  let nearest = getNearestHold(mouseX, worldMouseY);
  if (
    nearest &&
    canReach(
      climber.torso,
      nearest,
      climber.limbs[/** @type {LimbName} */ (selectedLimb)].reach,
      /** @type {LimbName} */ (selectedLimb)
    )
  ) {
    // When player makes a move, return camera control to auto-follow
    manualCameraControl = false;

    // Check if this is actually a new move (not grabbing the same hold)
    let currentHold =
      climber.limbs[/** @type {LimbName} */ (selectedLimb)].hold;
    if (currentHold !== nearest) {
      totalMoves++;
    }

    // Start animation by setting target hold
    climber.limbs[/** @type {LimbName} */ (selectedLimb)].targetHold = nearest;
    climber.limbs[/** @type {LimbName} */ (selectedLimb)].hold = nearest; // Set immediately for canReach calculations
    isAnimating = true;

    // If torso was pushed, check if we can safely reset to calculated position
    if (torsoPushed) {
      // Calculate what the new torso position would be based on limb averages
      let sumX = 0,
        sumY = 0,
        count = 0;
      for (let limb in climber.limbs) {
        let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
        if (hold) {
          sumX += hold.x;
          sumY += hold.y;
          count++;
        }
      }

      if (count > 0) {
        let calculatedTorsoX = sumX / count;
        let calculatedTorsoY = sumY / count;

        // Check if all limbs would still be within reach from calculated position
        let allLimbsInReach = true;
        for (let limb in climber.limbs) {
          let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
          if (hold) {
            let limbReach = climber.limbs[/** @type {LimbName} */ (limb)].reach;
            let distance = dist(
              calculatedTorsoX,
              calculatedTorsoY,
              hold.x,
              hold.y
            );
            if (distance > limbReach) {
              allLimbsInReach = false;
              break;
            }
          }
        }

        // Only reset push state if calculated position keeps all limbs in reach
        if (allLimbsInReach) {
          torsoPushed = false;
          updateTorso();
        }
        // If not all limbs would be in reach, keep the pushed torso position
      }
    } else {
      // Normal case - torso wasn't pushed, so update normally
      updateTorso();
    }

    // Update current height (lower Y values mean higher position)
    currentHeight = Math.max(
      0,
      Math.round((startingHeight - climber.torsoTarget.y) / 10) * 10
    );

    // Check for victory - both arms must be on the top hold
    if (checkVictoryCondition()) {
      gameWon = true;
    }
  }
}

function mouseDragged() {
  if (gameScrollBarDragging) {
    // Handle scrollbar dragging
    /** @type {any} */
    let scrollBar = getScrollBarDimensions();
    if (scrollBar) {
      let deltaY = mouseY - gameScrollBarStartY;
      let scrollRatio = deltaY / scrollBar.height;
      let cameraChange = scrollRatio * (wallHeight - height);
      cameraOffsetY = constrain(
        scrollBarStartCameraY - cameraChange,
        -wallHeight + height,
        0
      );
    }
    return;
  }
}

function mouseReleased() {
  if (gameScrollBarDragging) {
    gameScrollBarDragging = false;
    return;
  }
}

/**
 * Add scrolling functionality with mouse wheel
 * @param {any} event
 */
function mouseWheel(event) {
  // Enable manual camera control when scrolling
  manualCameraControl = true;

  // Add scrolling functionality within the fixed viewport
  let scrollSpeed = 20;
  let newCameraY = cameraOffsetY + event.delta * scrollSpeed;
  cameraOffsetY = constrain(newCameraY, -wallHeight + height, 0);
  return false; // Prevent page scrolling
}

/**
 * Get the nearest hold to a given point
 * @param {number} x
 * @param {number} y
 * @returns {Hold | null}
 */
function getNearestHold(x, y) {
  for (let h of holds) {
    if (dist(x, y, h.x, h.y) < 20) return h;
  }
  return null;
}

/**
 * Check if a limb can reach and grab a hold
 * @param {Climber["torso"]} torso
 * @param {Hold} hold
 * @param {number} reach - The reach distance of the specific limb
 * @param {LimbName} selectedLimb - The limb trying to grab the hold
 * @returns {boolean}
 */
function canReach(torso, hold, reach, selectedLimb) {
  // Calculate the attachment point for the selected limb
  let attachmentX = torso.x;
  let attachmentY = torso.y;
  const torsoWidth = 36;
  const torsoHeight = 74;
  const inset = 9; // Use same inset as drawing for consistency

  if (selectedLimb === "leftArm") {
    attachmentX = torso.x - torsoWidth / 2 + inset;
    attachmentY = torso.y - torsoHeight / 2 + inset;
  } else if (selectedLimb === "rightArm") {
    attachmentX = torso.x + torsoWidth / 2 - inset;
    attachmentY = torso.y - torsoHeight / 2 + inset;
  } else if (selectedLimb === "leftLeg") {
    attachmentX = torso.x - torsoWidth / 2 + inset;
    attachmentY = torso.y + torsoHeight / 2 - inset;
  } else if (selectedLimb === "rightLeg") {
    attachmentX = torso.x + torsoWidth / 2 - inset;
    attachmentY = torso.y + torsoHeight / 2 - inset;
  }

  // Use the actual current torso position if it has been pushed
  let currentTorso = torsoPushed ? climber.torso : torso;

  // Recalculate attachment point for current torso position if pushed
  if (torsoPushed) {
    if (selectedLimb === "leftArm") {
      attachmentX = currentTorso.x - torsoWidth / 2 + inset;
      attachmentY = currentTorso.y - torsoHeight / 2 + inset;
    } else if (selectedLimb === "rightArm") {
      attachmentX = currentTorso.x + torsoWidth / 2 - inset;
      attachmentY = currentTorso.y - torsoHeight / 2 + inset;
    } else if (selectedLimb === "leftLeg") {
      attachmentX = currentTorso.x - torsoWidth / 2 + inset;
      attachmentY = currentTorso.y + torsoHeight / 2 - inset;
    } else if (selectedLimb === "rightLeg") {
      attachmentX = currentTorso.x + torsoWidth / 2 - inset;
      attachmentY = currentTorso.y + torsoHeight / 2 - inset;
    }
  }

  // First check if the limb can physically reach the hold from its attachment point
  if (dist(attachmentX, attachmentY, hold.x, hold.y) > reach) {
    return false;
  }

  // If torso has been pushed, check reachability from current pushed position
  // Otherwise, calculate what the new torso position would be after this move
  let newTorsoX, newTorsoY;

  if (torsoPushed) {
    // Use current pushed torso position for validation as well
    newTorsoX = currentTorso.x;
    newTorsoY = currentTorso.y;
  } else {
    // Calculate new torso position based on limb positions
    let sumX = 0,
      sumY = 0,
      count = 0;

    for (let limb in climber.limbs) {
      let limbHold;
      if (limb === selectedLimb) {
        // Use the target hold for the selected limb
        limbHold = hold;
      } else {
        // Use current hold for other limbs
        limbHold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
      }

      if (limbHold) {
        sumX += limbHold.x;
        sumY += limbHold.y;
        count++;
      }
    }

    if (count > 0) {
      newTorsoX = sumX / count;
      newTorsoY = sumY / count;
    } else {
      return false;
    }
  }

  // Check if all limbs would still be within reach from the torso position
  for (let limb in climber.limbs) {
    let limbHold;
    if (limb === selectedLimb) {
      limbHold = hold;
    } else {
      limbHold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    }

    if (limbHold) {
      let limbReach = climber.limbs[/** @type {LimbName} */ (limb)].reach;

      // Calculate attachment point for this limb
      let limbAttachmentX = newTorsoX;
      let limbAttachmentY = newTorsoY;

      if (limb === "leftArm") {
        limbAttachmentX = newTorsoX - torsoWidth / 2 + inset;
        limbAttachmentY = newTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "rightArm") {
        limbAttachmentX = newTorsoX + torsoWidth / 2 - inset;
        limbAttachmentY = newTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "leftLeg") {
        limbAttachmentX = newTorsoX - torsoWidth / 2 + inset;
        limbAttachmentY = newTorsoY + torsoHeight / 2 - inset;
      } else if (limb === "rightLeg") {
        limbAttachmentX = newTorsoX + torsoWidth / 2 - inset;
        limbAttachmentY = newTorsoY + torsoHeight / 2 - inset;
      }

      let distanceToHold = dist(
        limbAttachmentX,
        limbAttachmentY,
        limbHold.x,
        limbHold.y
      );

      if (distanceToHold > limbReach) {
        return false; // This move would stretch a limb beyond its reach
      }
    }
  }

  // Check if legs are trying to reach higher than the topmost arm
  if (selectedLimb === "leftLeg" || selectedLimb === "rightLeg") {
    let topmostArmY = Infinity; // Start with infinity (lower is higher in p5.js coordinates)

    // Find the topmost (lowest Y value) arm hold
    if (climber.limbs.leftArm.hold) {
      topmostArmY = Math.min(topmostArmY, climber.limbs.leftArm.hold.y);
    }
    if (climber.limbs.rightArm.hold) {
      topmostArmY = Math.min(topmostArmY, climber.limbs.rightArm.hold.y);
    }

    // If there are arm holds and the target hold is higher (lower Y) than the topmost arm, prevent leg movement
    if (topmostArmY !== Infinity && hold.y < topmostArmY) {
      return false;
    }
  }

  // Prevent excessive leg crossing - limit how far legs can reach across the torso
  if (selectedLimb === "leftLeg" || selectedLimb === "rightLeg") {
    const torsoWidthForCrossing = 36; // Use actual torso width for crossing calculation
    const maxCrossDistance = torsoWidthForCrossing * 2; // Two torso-widths

    if (selectedLimb === "leftLeg") {
      // Left leg should not reach too far to the right of the torso
      if (hold.x > currentTorso.x + maxCrossDistance) {
        return false;
      }
    } else if (selectedLimb === "rightLeg") {
      // Right leg should not reach too far to the left of the torso
      if (hold.x < currentTorso.x - maxCrossDistance) {
        return false;
      }
    }
  }

  // Ensure at least 3 different holds are occupied at any time
  // Only check this constraint if the selected limb is currently on a different hold
  // (if moving to the same hold, don't apply this constraint)
  let currentLimbHold = climber.limbs[selectedLimb].hold;
  let isMovingToNewHold =
    !currentLimbHold ||
    currentLimbHold.x !== hold.x ||
    currentLimbHold.y !== hold.y;

  if (isMovingToNewHold) {
    // Count how many unique holds would be occupied after this move
    let occupiedHolds = new Set();

    for (let limb in climber.limbs) {
      let limbHold;
      if (limb === selectedLimb) {
        // Use the target hold for the selected limb
        limbHold = hold;
      } else {
        // Use current hold for other limbs
        limbHold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
      }

      if (limbHold) {
        // Create a unique identifier for each hold based on coordinates
        occupiedHolds.add(`${limbHold.x},${limbHold.y}`);
      }
    }

    // Must have at least 3 different holds occupied
    if (occupiedHolds.size < 3) {
      return false;
    }
  }

  // Then check if the hold can accept another limb (max 2 limbs per hold)
  let limbsOnHold = 0;
  let selectedLimbAlreadyOnHold = false;

  for (let limb in climber.limbs) {
    if (climber.limbs[/** @type {LimbName} */ (limb)].hold === hold) {
      limbsOnHold++;
      if (limb === selectedLimb) {
        selectedLimbAlreadyOnHold = true;
      }
    }
  }

  // If the selected limb is already on this hold, allow the move
  if (selectedLimbAlreadyOnHold) {
    return true;
  }

  // Allow grabbing if there are less than 2 limbs on the hold
  return limbsOnHold < 2;
}

function createLimbButtons() {
  const limbIds = ["leftArm", "rightArm", "leftLeg", "rightLeg"];
  limbIds.forEach((limb) => {
    const button = document.getElementById(limb);
    if (!button) {
      console.error(`Button with ID ${limb} not found`);
      return;
    }

    if (!(button instanceof HTMLButtonElement)) {
      console.error(`Element with ID ${limb} is not a button`);
      return;
    }

    button.addEventListener("click", () => {
      selectedLimb = limb;
      updateButtonStyles();
    });
    limbButtons[/** @type {LimbName} */ (limb)] = button;
  });

  // Create push button
  const pushBtn = document.getElementById("push");
  if (pushBtn && pushBtn instanceof HTMLButtonElement) {
    pushBtn.addEventListener("click", () => {
      pushTorso();
    });
    pushButton = pushBtn;
  } else {
    console.error("Push button with ID 'push' not found or is not a button");
  }

  // Create strafe left button
  const strafeLeftBtn = document.getElementById("strafeLeft");
  if (strafeLeftBtn && strafeLeftBtn instanceof HTMLButtonElement) {
    strafeLeftBtn.addEventListener("click", () => {
      strafeLeft();
    });
  } else {
    console.error(
      "Strafe left button with ID 'strafeLeft' not found or is not a button"
    );
  }

  // Create strafe right button
  const strafeRightBtn = document.getElementById("strafeRight");
  if (strafeRightBtn && strafeRightBtn instanceof HTMLButtonElement) {
    strafeRightBtn.addEventListener("click", () => {
      strafeRight();
    });
  } else {
    console.error(
      "Strafe right button with ID 'strafeRight' not found or is not a button"
    );
  }

  // Create relax button
  const relaxBtn = document.getElementById("relax");
  if (relaxBtn && relaxBtn instanceof HTMLButtonElement) {
    relaxBtn.addEventListener("click", () => {
      relaxTorso();
    });
  } else {
    console.error("Relax button with ID 'relax' not found or is not a button");
  }

  updateButtonStyles();
}

function updateButtonStyles() {
  for (let limb in limbButtons) {
    limbButtons[/** @type {LimbName} */ (limb)]?.classList.remove("selected");
  }
  if (limbButtons[/** @type {LimbName} */ (selectedLimb)]) {
    limbButtons[/** @type {LimbName} */ (selectedLimb)]?.classList.add(
      "selected"
    );
  }
}

function keyPressed() {
  if (isAnimating) return; // Prevent input during animations

  if (key === "1") selectedLimb = "leftArm";
  else if (key === "2") selectedLimb = "rightArm";
  else if (key === "3") selectedLimb = "leftLeg";
  else if (key === "4") selectedLimb = "rightLeg";
  else if (key === " " || key === "p" || key === "5") {
    // Space bar or 'P' key for push
    pushTorso();
    return; // Don't update button styles for push action
  } else if (key === "6") {
    // Key '6' for strafe left
    strafeLeft();
    return;
  } else if (key === "7") {
    // Key '7' for strafe right
    strafeRight();
    return;
  } else if (key === "8") {
    // Key '8' for relax
    relaxTorso();
    return;
  }
  updateButtonStyles();
}

function populateLevelSelect() {
  const levelSelect = document.getElementById("levelSelect");
  if (!levelSelect) {
    console.error("Level select element not found");
    return;
  }
  Object.entries(levels)
    .sort((a, b) => {
      return a[1].order - b[1].order;
    })
    .forEach(([key, level]) => {
      const option = document.createElement("option");
      option.value = key;
      option.innerText =
        (level.name || key) +
        ` - by ${level.author}` +
        ` (~${Math.round((level.wallHeight - 850) / 10) / 10}m)`;
      levelSelect.appendChild(option);
    });

  levelSelect.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) {
      console.error("Event target is not a select element");
      return;
    }
    loadLevel(event.target.value);
  });
}

/**
 * Load a custom level from level data
 * @param {any} levelData
 */
function loadCustomLevel(levelData) {
  if (!levelData || !levelData.holds || !Array.isArray(levelData.holds)) {
    console.error("Invalid custom level data");
    loadLevel("default");
    return;
  }

  // Store the level data for editing
  currentCustomLevelData = levelData;

  // Show the edit link and hide the create link
  const editLinkDiv = document.getElementById("editLevelLink");
  const createLinkDiv = document.getElementById("createLevelLink");
  if (editLinkDiv) {
    editLinkDiv.style.display = "block";
  }
  if (createLinkDiv) {
    createLinkDiv.style.display = "none";
  }

  // Hide the level dropdown and show custom level info
  const levelSelect = document.getElementById("levelSelect");
  if (levelSelect) {
    levelSelect.style.display = "none";
  }

  // Create or update custom level info display
  let customLevelInfo = document.getElementById("customLevelInfo");
  if (!customLevelInfo) {
    customLevelInfo = document.createElement("div");
    customLevelInfo.id = "customLevelInfo";
    customLevelInfo.style.cssText =
      "margin-bottom: 10px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 14px; text-align: center;";
    levelSelect?.parentNode?.insertBefore(customLevelInfo, levelSelect);
  }

  const customLevelName = levelData.name || "Custom Level";
  const customAuthorName = levelData.author || "Anonymous";
  customLevelInfo.innerHTML = `<strong>${customLevelName}</strong><br><small>by ${customAuthorName}</small>`;
  customLevelInfo.style.display = "block";

  holds = [];
  topHold = null;
  gameWon = false;
  totalMoves = 0;
  torsoPushed = false; // Reset push state
  wallHeight = levelData.wallHeight || 3000;

  console.log(`Loading custom level with wallHeight: ${wallHeight}`);
  console.log(`Level data wallHeight: ${levelData.wallHeight}`);
  console.log(`Total holds in data: ${levelData.holds.length}`);

  for (let h of levelData.holds) {
    const hold = { x: h.x, y: h.y };
    if (h.top) {
      topHold = hold;
    }
    holds.push(hold);
  }

  // Make sure we have at least 4 starting holds + end hold
  if (holds.length < 5) {
    console.error("Custom level needs at least 4 starting holds + end hold");
    loadLevel("default");
    return;
  }

  // Find the first 4 non-end holds as starting holds
  let startingHolds = [];
  for (let hold of levelData.holds) {
    if (!hold.top && startingHolds.length < 4) {
      startingHolds.push({ x: hold.x, y: hold.y });
    }
  }

  if (startingHolds.length < 4) {
    console.error("Custom level needs at least 4 starting holds");
    loadLevel("default");
    return;
  }

  // Assign starting holds to limbs
  climber.limbs.leftArm.hold = startingHolds[0];
  climber.limbs.rightArm.hold = startingHolds[1];
  climber.limbs.leftLeg.hold = startingHolds[2];
  climber.limbs.rightLeg.hold = startingHolds[3];

  // Initialize target holds to null
  climber.limbs.leftArm.targetHold = null;
  climber.limbs.rightArm.targetHold = null;
  climber.limbs.leftLeg.targetHold = null;
  climber.limbs.rightLeg.targetHold = null;

  updateTorso();

  // Initialize torso position to target
  climber.torso.x = climber.torsoTarget.x;
  climber.torso.y = climber.torsoTarget.y;

  // Initialize starting height and current height
  startingHeight = climber.torso.y;
  currentHeight = 0;

  // Set camera to center on starting position (where climber is)
  cameraOffsetY = -climber.torso.y + height / 2;

  // Ensure camera is properly constrained
  cameraOffsetY = constrain(cameraOffsetY, -wallHeight + height, 0);

  console.log(
    `Custom level loaded. Camera positioned at: ${cameraOffsetY}, Climber at: ${climber.torso.y}`
  );

  // Update HTML title to include level name and author
  document.title = `${customLevelName} by ${customAuthorName} - Climbing Game`;

  isAnimating = false; // Reset animation state
  loop();
}

/**
 * Load a level by name
 * @param {string} levelName
 * @returns
 */
function loadLevel(levelName) {
  let level = levels[levelName];
  if (!level) return;

  // Clear custom level data and show create link, hide edit link
  currentCustomLevelData = null;
  const editLinkDiv = document.getElementById("editLevelLink");
  const createLinkDiv = document.getElementById("createLevelLink");
  if (editLinkDiv) {
    editLinkDiv.style.display = "none";
  }
  if (createLinkDiv) {
    createLinkDiv.style.display = "block";
  }

  // Show the level dropdown and hide custom level info
  const levelSelect = document.getElementById("levelSelect");
  if (levelSelect) {
    levelSelect.style.display = "inline-block";
  }

  const customLevelInfo = document.getElementById("customLevelInfo");
  if (customLevelInfo) {
    customLevelInfo.style.display = "none";
  }

  holds = [];
  topHold = null;
  gameWon = false;
  totalMoves = 0;
  torsoPushed = false; // Reset push state
  wallHeight = level.wallHeight || 3000;

  for (let h of level.holds) {
    const hold = { x: h.x, y: h.y };
    if (h.top) {
      topHold = hold;
    }
    holds.push(hold);
  }

  climber.limbs.leftLeg.hold = holds[0];
  climber.limbs.rightLeg.hold = holds[1];
  climber.limbs.leftArm.hold = holds[2];
  climber.limbs.rightArm.hold = holds[3];

  // Initialize target holds to null
  climber.limbs.leftArm.targetHold = null;
  climber.limbs.rightArm.targetHold = null;
  climber.limbs.leftLeg.targetHold = null;
  climber.limbs.rightLeg.targetHold = null;

  updateTorso();

  // Initialize torso position to target
  climber.torso.x = climber.torsoTarget.x;
  climber.torso.y = climber.torsoTarget.y;

  // Initialize starting height and current height
  startingHeight = climber.torso.y;
  currentHeight = 0;

  cameraOffsetY = -climber.torso.y + height / 2;

  // Reset HTML title to default for built-in levels
  document.title = "Climbing Game";

  isAnimating = false; // Reset animation state
  loop();
}

/**
 * Push the torso to maximum height while keeping all limbs connected
 */
function pushTorso() {
  if (gameWon || isAnimating) return; // Prevent input during animations

  console.log("Push button clicked!"); // Debug log

  // Get all current holds that limbs are connected to
  let connectedHolds = [];
  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    if (hold) {
      connectedHolds.push({
        hold: hold,
        reach: climber.limbs[/** @type {LimbName} */ (limb)].reach,
        limb: limb,
      });
    }
  }

  console.log("Connected holds:", connectedHolds); // Debug log

  if (connectedHolds.length === 0) {
    console.log("No connected holds found");
    return;
  }

  // Calculate the centroid of all holds for X position
  let centerX = 0;
  for (let connected of connectedHolds) {
    centerX += connected.hold.x;
  }
  centerX /= connectedHolds.length;

  // Find the maximum height (minimum Y) by checking what's the highest position
  // where all limbs can still reach their holds
  let bestY = climber.torso.y; // Start with current position

  // Try moving up in small increments to find the highest valid position
  for (let testY = climber.torso.y - 1; testY >= 0; testY -= 1) {
    let canReachAll = true;

    // Check if all limbs can reach from this position using their attachment points
    for (let connected of connectedHolds) {
      // Calculate attachment point for this limb at the test position
      let attachmentX = centerX;
      let attachmentY = testY;
      const torsoWidth = 36;
      const torsoHeight = 74;
      const inset = 5;

      if (connected.limb === "leftArm") {
        attachmentX = centerX - torsoWidth / 2 + inset;
        attachmentY = testY - torsoHeight / 2 + inset;
      } else if (connected.limb === "rightArm") {
        attachmentX = centerX + torsoWidth / 2 - inset;
        attachmentY = testY - torsoHeight / 2 + inset;
      } else if (connected.limb === "leftLeg") {
        attachmentX = centerX - torsoWidth / 2 + inset;
        attachmentY = testY + torsoHeight / 2 - inset;
      } else if (connected.limb === "rightLeg") {
        attachmentX = centerX + torsoWidth / 2 - inset;
        attachmentY = testY + torsoHeight / 2 - inset;
      }

      let distance = dist(
        attachmentX,
        attachmentY,
        connected.hold.x,
        connected.hold.y
      );
      if (distance > connected.reach) {
        canReachAll = false;
        break;
      }
    }

    if (canReachAll) {
      bestY = testY;
    } else {
      break; // Stop when we can't reach anymore
    }
  }

  console.log(`Current torso: ${climber.torso.x}, ${climber.torso.y}`);
  console.log(`Best position: ${centerX}, ${bestY}`);

  // If we found a higher position, move the torso
  // Add a small buffer (5 pixels) so legs aren't fully straight
  const buffer = 10;
  const finalY = bestY + buffer;

  if (finalY < climber.torso.y) {
    console.log("Moving torso up!");
    climber.torsoTarget.x = centerX;
    climber.torsoTarget.y = finalY;

    // Mark that torso has been pushed so it doesn't get recalculated automatically
    torsoPushed = true;
    isAnimating = true;

    // Count this as a move
    totalMoves++;

    // Update current height
    currentHeight = Math.max(
      0,
      Math.round((startingHeight - finalY) / 10) * 10
    );
  } else {
    console.log("Already at maximum height for current holds");
  }
}

/**
 * Strafe the torso to the left while keeping all limbs connected
 */
function strafeLeft() {
  if (gameWon || isAnimating) return; // Prevent input during animations

  console.log("Strafe left button clicked!");

  // Get all current holds that limbs are connected to
  let connectedHolds = [];
  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    if (hold) {
      connectedHolds.push({
        hold: hold,
        reach: climber.limbs[/** @type {LimbName} */ (limb)].reach,
        limb: limb,
      });
    }
  }

  if (connectedHolds.length === 0) {
    console.log("No connected holds found");
    return;
  }

  // Calculate the centroid of all holds for Y position
  let centerY = 0;
  for (let connected of connectedHolds) {
    centerY += connected.hold.y;
  }
  centerY /= connectedHolds.length;

  // Find the leftmost position by checking what's the furthest left position
  // where all limbs can still reach their holds
  let bestX = climber.torso.x; // Start with current position

  // Try moving left in small increments to find the leftmost valid position
  for (let testX = climber.torso.x - 1; testX >= 0; testX -= 1) {
    let canReachAll = true;

    // Check if all limbs can reach from this position using their attachment points
    for (let connected of connectedHolds) {
      // Calculate attachment point for this limb at the test position
      let attachmentX = testX;
      let attachmentY = centerY;
      const torsoWidth = 36;
      const torsoHeight = 74;
      const inset = 5;

      if (connected.limb === "leftArm") {
        attachmentX = testX - torsoWidth / 2 + inset;
        attachmentY = centerY - torsoHeight / 2 + inset;
      } else if (connected.limb === "rightArm") {
        attachmentX = testX + torsoWidth / 2 - inset;
        attachmentY = centerY - torsoHeight / 2 + inset;
      } else if (connected.limb === "leftLeg") {
        attachmentX = testX - torsoWidth / 2 + inset;
        attachmentY = centerY + torsoHeight / 2 - inset;
      } else if (connected.limb === "rightLeg") {
        attachmentX = testX + torsoWidth / 2 - inset;
        attachmentY = centerY + torsoHeight / 2 - inset;
      }

      let distance = dist(
        attachmentX,
        attachmentY,
        connected.hold.x,
        connected.hold.y
      );
      if (distance > connected.reach) {
        canReachAll = false;
        break;
      }
    }

    if (canReachAll) {
      bestX = testX;
    } else {
      break; // Stop when we can't reach anymore
    }
  }

  // Add a small buffer (5 pixels) so limbs aren't fully extended
  const buffer = 5;
  const finalX = bestX + buffer;

  if (finalX < climber.torso.x) {
    console.log("Moving torso left!");
    climber.torsoTarget.x = finalX;
    climber.torsoTarget.y = centerY;

    // Mark that torso has been pushed so it doesn't get recalculated automatically
    torsoPushed = true;
    isAnimating = true;

    // Count this as a move
    totalMoves++;
  } else {
    console.log("Already at leftmost position for current holds");
  }
}

/**
 * Strafe the torso to the right while keeping all limbs connected
 */
function strafeRight() {
  if (gameWon || isAnimating) return; // Prevent input during animations

  console.log("Strafe right button clicked!");

  // Get all current holds that limbs are connected to
  let connectedHolds = [];
  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    if (hold) {
      connectedHolds.push({
        hold: hold,
        reach: climber.limbs[/** @type {LimbName} */ (limb)].reach,
        limb: limb,
      });
    }
  }

  if (connectedHolds.length === 0) {
    console.log("No connected holds found");
    return;
  }

  // Calculate the centroid of all holds for Y position
  let centerY = 0;
  for (let connected of connectedHolds) {
    centerY += connected.hold.y;
  }
  centerY /= connectedHolds.length;

  // Find the rightmost position by checking what's the furthest right position
  // where all limbs can still reach their holds
  let bestX = climber.torso.x; // Start with current position

  // Try moving right in small increments to find the rightmost valid position
  for (let testX = climber.torso.x + 1; testX <= 400; testX += 1) {
    let canReachAll = true;

    // Check if all limbs can reach from this position using their attachment points
    for (let connected of connectedHolds) {
      // Calculate attachment point for this limb at the test position
      let attachmentX = testX;
      let attachmentY = centerY;
      const torsoWidth = 36;
      const torsoHeight = 74;
      const inset = 5;

      if (connected.limb === "leftArm") {
        attachmentX = testX - torsoWidth / 2 + inset;
        attachmentY = centerY - torsoHeight / 2 + inset;
      } else if (connected.limb === "rightArm") {
        attachmentX = testX + torsoWidth / 2 - inset;
        attachmentY = centerY - torsoHeight / 2 + inset;
      } else if (connected.limb === "leftLeg") {
        attachmentX = testX - torsoWidth / 2 + inset;
        attachmentY = centerY + torsoHeight / 2 - inset;
      } else if (connected.limb === "rightLeg") {
        attachmentX = testX + torsoWidth / 2 - inset;
        attachmentY = centerY + torsoHeight / 2 - inset;
      }

      let distance = dist(
        attachmentX,
        attachmentY,
        connected.hold.x,
        connected.hold.y
      );
      if (distance > connected.reach) {
        canReachAll = false;
        break;
      }
    }

    if (canReachAll) {
      bestX = testX;
    } else {
      break; // Stop when we can't reach anymore
    }
  }

  // Add a small buffer (5 pixels) so limbs aren't fully extended
  const buffer = 5;
  const finalX = bestX - buffer;

  if (finalX > climber.torso.x) {
    console.log("Moving torso right!");
    climber.torsoTarget.x = finalX;
    climber.torsoTarget.y = centerY;

    // Mark that torso has been pushed so it doesn't get recalculated automatically
    torsoPushed = true;
    isAnimating = true;

    // Count this as a move
    totalMoves++;
  } else {
    console.log("Already at rightmost position for current holds");
  }
}

/**
 * Relax the torso to its natural position based on limb holds
 * This removes all pushes and strafes, returning to the calculated centroid
 */
function relaxTorso() {
  if (gameWon || isAnimating) return; // Prevent input during animations

  console.log("Relax button clicked!");

  // Check if torso has been pushed/strafed
  if (!torsoPushed) {
    console.log("Torso is already in natural position");
    return;
  }

  // Calculate what the new torso position would be based on limb averages
  let sumX = 0,
    sumY = 0,
    count = 0;
  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    if (hold) {
      sumX += hold.x;
      sumY += hold.y;
      count++;
    }
  }

  if (count === 0) {
    console.log("No limbs connected, cannot relax");
    return;
  }

  let calculatedTorsoX = sumX / count;
  let calculatedTorsoY = sumY / count;

  // Check if all limbs would still be within reach from calculated position
  let allLimbsInReach = true;
  const torsoWidth = 36;
  const torsoHeight = 74;
  const inset = 5;

  for (let limb in climber.limbs) {
    let hold = climber.limbs[/** @type {LimbName} */ (limb)].hold;
    if (hold) {
      let limbReach = climber.limbs[/** @type {LimbName} */ (limb)].reach;

      // Calculate attachment point for this limb at the calculated torso position
      let attachmentX = calculatedTorsoX;
      let attachmentY = calculatedTorsoY;

      if (limb === "leftArm") {
        attachmentX = calculatedTorsoX - torsoWidth / 2 + inset;
        attachmentY = calculatedTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "rightArm") {
        attachmentX = calculatedTorsoX + torsoWidth / 2 - inset;
        attachmentY = calculatedTorsoY - torsoHeight / 2 + inset;
      } else if (limb === "leftLeg") {
        attachmentX = calculatedTorsoX - torsoWidth / 2 + inset;
        attachmentY = calculatedTorsoY + torsoHeight / 2 - inset;
      } else if (limb === "rightLeg") {
        attachmentX = calculatedTorsoX + torsoWidth / 2 - inset;
        attachmentY = calculatedTorsoY + torsoHeight / 2 - inset;
      }

      let distance = dist(attachmentX, attachmentY, hold.x, hold.y);
      if (distance > limbReach) {
        allLimbsInReach = false;
        console.log(
          `Limb ${limb} would be out of reach (${distance} > ${limbReach})`
        );
        break;
      }
    }
  }

  // Only reset push state and update torso if calculated position keeps all limbs in reach
  if (allLimbsInReach) {
    // Reset the push state
    torsoPushed = false;

    // Set target to calculated position and start animation
    climber.torsoTarget.x = calculatedTorsoX;
    climber.torsoTarget.y = calculatedTorsoY;
    isAnimating = true;

    // Count this as a move
    totalMoves++;

    console.log("Torso relaxed to natural position");
  } else {
    console.log(
      "Cannot relax - would disconnect limbs. Keeping current torso position."
    );
  }
}

/**
 * Check if both arms are on the top hold for victory condition
 * @returns {boolean}
 */
function checkVictoryCondition() {
  // Both arms must be on the top hold (legs don't count)
  const leftArmOnTop = climber.limbs.leftArm.hold === topHold;
  const rightArmOnTop = climber.limbs.rightArm.hold === topHold;

  return leftArmOnTop && rightArmOnTop;
}
