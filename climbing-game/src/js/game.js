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

let selectedLimb = "leftArm";
let totalMoves = 0;
let startingHeight = 0;
let currentHeight = 0;
let torsoPushed = false; // Track if torso has been manually pushed

// Animation variables
let animationSpeed = 0.22; // How fast animations complete (0.1 = slower, 0.3 = faster)
let isAnimating = false; // Prevent input during animations

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
 * @property {number} wallHeight - The height of the climbing wall
 * @property {Hold[]} holds - The holds available in the level
 * @property {number} order - The order of the level (for sorting)
 * @typedef {Record<string, Level>} Levels
 *
 * @type {Levels}
 */
const levels = {
  generated: {
    order: 1,
    name: "Generated Challenge",
    wallHeight: 3000,
    holds: (() => {
      let h = [];
      const holdSize = 20; // Size of each hold
      const minDistance = holdSize * 1.5; // Minimum distance between holds (1.5x hold size)
      const maxReach = 160; // Maximum reach of any limb
      const wallWidth = 400;
      const wallHeight = 3000;

      // Starting holds - manually placed to ensure good starting position
      // Moved up from bottom to give more space below (was 2830, 2850, 2920, 2950)
      h.push({ x: 150, y: 2330 }); // left arm
      h.push({ x: 280, y: 2350 }); // right arm
      h.push({ x: 130, y: 2420 }); // left leg
      h.push({ x: 200, y: 2450 }); // right leg

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

        // Check if at least one existing hold is within climbing reach
        for (let existingHold of existingHolds) {
          let distance = Math.sqrt(
            (newX - existingHold.x) ** 2 + (newY - existingHold.y) ** 2
          );
          if (distance <= maxReach * 0.8) {
            // Use 80% of max reach for better connectivity
            return true;
          }
        }
        return false;
      }

      // Generate holds layer by layer from bottom to top
      const layerHeight = 100; // Height of each layer
      const holdsPerLayer = 4; // Target number of holds per layer

      for (
        let layer = 0;
        layer < Math.floor((wallHeight - 700) / layerHeight); // Changed from 200 to 700 to account for more bottom space
        layer++
      ) {
        let layerY = wallHeight - 700 - layer * layerHeight; // Changed from 200 to 700
        let attemptsForLayer = 0;
        let holdsInLayer = 0;

        while (holdsInLayer < holdsPerLayer && attemptsForLayer < 50) {
          let newX = Math.random() * (wallWidth - 2 * holdSize) + holdSize;
          let newY = layerY + (Math.random() - 0.5) * layerHeight * 0.8; // Some vertical variation

          if (isValidPosition(newX, newY, h) && isClimbable(newX, newY, h)) {
            h.push({ x: newX, y: newY });
            holdsInLayer++;
          }
          attemptsForLayer++;
        }
      }

      // Add some additional random holds to fill gaps
      let additionalAttempts = 0;
      while (h.length < 100 && additionalAttempts < 200) {
        let newX = Math.random() * (wallWidth - 2 * holdSize) + holdSize;
        let newY = Math.random() * (wallHeight - 800) + 100; // Changed from 300 to 800 to account for more bottom space

        if (isValidPosition(newX, newY, h) && isClimbable(newX, newY, h)) {
          h.push({ x: newX, y: newY });
        }
        additionalAttempts++;
      }

      // Top hold - ensure it's climbable
      let topHoldPlaced = false;
      let topAttempts = 0;
      while (!topHoldPlaced && topAttempts < 20) {
        let topX = 150 + Math.random() * 100; // Near center
        let topY = 40;

        if (isValidPosition(topX, topY, h) && isClimbable(topX, topY, h)) {
          h.push({ x: topX, y: topY, top: true });
          topHoldPlaced = true;
        }
        topAttempts++;
      }

      // Fallback top hold if placement failed
      if (!topHoldPlaced) {
        h.push({ x: 230, y: 40, top: true });
      }

      return h;
    })(),
  },

  default: {
    order: 0,
    name: "Easy Wall",
    wallHeight: 1400,
    holds: [
      // Starting holds repositioned to center the player better with more floor space
      { x: 150, y: 700 }, // left arm
      { x: 190, y: 700 }, // right arm
      { x: 130, y: 850 }, // left leg
      { x: 180, y: 820 }, // right leg

      // Second layer
      { x: 90, y: 700 },
      { x: 230, y: 700 },
      { x: 300, y: 680 },

      // Third layer - getting narrower
      { x: 140, y: 600 },
      { x: 200, y: 590 },
      { x: 260, y: 600 },

      // Fourth layer
      { x: 120, y: 500 },
      { x: 180, y: 490 },
      { x: 240, y: 500 },
      { x: 280, y: 510 },

      // Fifth layer - approaching the top
      { x: 150, y: 400 },
      { x: 210, y: 390 },
      { x: 270, y: 400 },

      // Sixth layer
      { x: 130, y: 300 },
      { x: 200, y: 290 },
      { x: 250, y: 300 },

      // Near top holds
      { x: 160, y: 230 },
      { x: 220, y: 220 },

      // Top hold
      { x: 200, y: 170, top: true },
    ],
  },

  galaxus: {
    order: 2,
    name: "GALAXUS Wall",
    wallHeight: 2500,
    holds: [
      // --- STARTING HOLDS ---
      { x: 180, y: 1650 }, // left arm
      { x: 220, y: 1650 }, // right arm
      { x: 170, y: 1720 }, // left leg
      { x: 230, y: 1720 }, // right leg

      // --- G (y: 1480 - 1600) - Mirrored on X-axis and adjusted
      { x: 240, y: 1480 },
      { x: 210, y: 1480 },
      { x: 180, y: 1480 }, // Bottom bar
      { x: 160, y: 1500 },
      { x: 150, y: 1530 },
      { x: 150, y: 1560 }, // Left side
      { x: 160, y: 1590 },
      { x: 180, y: 1600 },
      { x: 210, y: 1600 }, // Top bar
      { x: 240, y: 1590 }, // Right side upper
      { x: 240, y: 1560 }, // Right side middle
      { x: 210, y: 1560 }, // Inner bar

      // --- A (y: 1300 - 1420) - Closer to G
      { x: 200, y: 1300 }, // Top point
      { x: 180, y: 1330 },
      { x: 160, y: 1360 },
      { x: 140, y: 1390 },
      { x: 120, y: 1420 }, // Left leg
      { x: 220, y: 1330 },
      { x: 240, y: 1360 },
      { x: 260, y: 1390 },
      { x: 280, y: 1420 }, // Right leg
      // Cross-bar adjusted to avoid overlap
      { x: 160, y: 1380 },
      { x: 200, y: 1380 },
      { x: 240, y: 1380 },

      // --- L (y: 1120 - 1210) - Closer to A
      { x: 150, y: 1120 },
      { x: 150, y: 1150 },
      { x: 150, y: 1180 },
      { x: 150, y: 1210 }, // Vertical bar
      { x: 180, y: 1210 },
      { x: 210, y: 1210 },
      { x: 240, y: 1210 }, // Horizontal bar

      // --- A (y: 920 - 1040) - Closer to L
      { x: 200, y: 920 }, // Top point
      { x: 180, y: 950 },
      { x: 160, y: 980 },
      { x: 140, y: 1010 },
      { x: 120, y: 1040 }, // Left leg
      { x: 220, y: 950 },
      { x: 240, y: 980 },
      { x: 260, y: 1010 },
      { x: 280, y: 1040 }, // Right leg
      // Cross-bar adjusted to avoid overlap
      { x: 160, y: 1000 },
      { x: 200, y: 1000 },
      { x: 240, y: 1000 },

      // --- X (y: 720 - 840) - Closer to A
      { x: 150, y: 720 },
      { x: 170, y: 750 },
      { x: 200, y: 780 },
      { x: 230, y: 810 },
      { x: 250, y: 840 }, // Diagonal \
      { x: 250, y: 720 },
      { x: 230, y: 750 },
      { x: 170, y: 810 },
      { x: 150, y: 840 }, // Diagonal /

      // --- U (y: 520 - 640) - Closer to X
      { x: 150, y: 520 },
      { x: 150, y: 550 },
      { x: 150, y: 580 }, // Left side
      { x: 165, y: 610 },
      { x: 180, y: 630 },
      { x: 200, y: 640 },
      { x: 220, y: 630 },
      { x: 235, y: 610 }, // Curve
      { x: 250, y: 580 },
      { x: 250, y: 550 },
      { x: 250, y: 520 }, // Right side

      // --- S (y: 320 - 440) - Closer to U
      { x: 250, y: 320 },
      { x: 220, y: 320 },
      { x: 190, y: 330 },
      { x: 160, y: 350 }, // Top curve
      { x: 180, y: 380 },
      { x: 210, y: 410 },
      { x: 240, y: 430 }, // Middle
      { x: 220, y: 440 },
      { x: 190, y: 440 },
      { x: 160, y: 430 }, // Bottom curve

      // --- TOP HOLD ---
      { x: 200, y: 250, top: true },
    ],
  },
};

async function setup() {
  // Create canvas and attach it to the gameContainer div
  let canvas = createCanvas(400, 700);
  canvas.parent("gameContainer");

  createLimbButtons();
  populateLevelSelect();

  // Check for custom level parameter or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const customLevel = urlParams.get("level");

  if (customLevel === "custom") {
    // Try to load custom level from localStorage
    const customLevelData = localStorage.getItem("customLevel");
    if (customLevelData) {
      try {
        const levelData = JSON.parse(customLevelData);
        loadCustomLevel(levelData);
        return;
      } catch (error) {
        console.error("Failed to load custom level:", error);
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
  const floorHeight = Math.min(200, availableFloorSpace); // Cap floor height to fit within wall

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
      let attachmentX = climber.torso.x;
      let attachmentY = climber.torso.y;
      const torsoWidth = 36;
      const torsoHeight = 74;
      const inset = 9; // Move attachment points 9px towards center

      if (limb === "leftArm") {
        attachmentX = climber.torso.x - torsoWidth / 2 + inset;
        attachmentY = climber.torso.y - torsoHeight / 2 + inset;
      } else if (limb === "rightArm") {
        attachmentX = climber.torso.x + torsoWidth / 2 - inset;
        attachmentY = climber.torso.y - torsoHeight / 2 + inset;
      } else if (limb === "leftLeg") {
        attachmentX = climber.torso.x - torsoWidth / 2 + inset;
        attachmentY = climber.torso.y + torsoHeight / 2 - inset;
      } else if (limb === "rightLeg") {
        attachmentX = climber.torso.x + torsoWidth / 2 - inset;
        attachmentY = climber.torso.y + torsoHeight / 2 - inset;
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

  // Draw torso as rounded rectangle
  fill(50, 100, 200, 255); // #3264C8
  noStroke();
  rectMode(CENTER);
  // rect(x, y, width, height, topLeftRadius, topRightRadius, bottomRightRadius, bottomLeftRadius)
  rect(climber.torso.x, climber.torso.y, 36, 74, 18, 18, 18, 18);

  // Draw head as a circle above the torso
  fill(220, 180, 140, 255); // Skin tone color
  noStroke();
  const torsoHeight = 74;
  const headRadius = 14;
  const headY = climber.torso.y - torsoHeight / 2 - headRadius - 2; // 2px gap between torso and head
  ellipse(climber.torso.x, headY, headRadius * 2, headRadius * 2);

  pop();

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
    noLoop();
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
  const targetY = -climber.torso.y + height / 2;
  cameraOffsetY = lerp(cameraOffsetY, targetY, 0.08); // Slower camera movement for smoother feel
  cameraOffsetY = constrain(cameraOffsetY, -wallHeight + height, 0);
}

function mousePressed() {
  if (gameWon || isAnimating) return; // Prevent input during animations
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

  holds = [];
  topHold = null;
  gameWon = false;
  totalMoves = 0;
  torsoPushed = false; // Reset push state
  wallHeight = levelData.wallHeight || 3000;

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

  // Starting holds are the first 4 holds in the array (not skipping any)
  climber.limbs.leftArm.hold = holds[0];
  climber.limbs.rightArm.hold = holds[1];
  climber.limbs.leftLeg.hold = holds[2];
  climber.limbs.rightLeg.hold = holds[3];

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

  climber.limbs.leftArm.hold = holds[0];
  climber.limbs.rightArm.hold = holds[1];
  climber.limbs.leftLeg.hold = holds[2];
  climber.limbs.rightLeg.hold = holds[3];

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
