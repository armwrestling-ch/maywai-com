//@ts-check

/**
 * Level definitions for the climbing game
 *
 * This file contains all the predefined levels that can be loaded in the game.
 * Each level defines the wall height, holds positions, and metadata.
 *
 * @type {Record<string, any>}
 */
const gameLevels = {
  generated: {
    order: 1,
    name: "Challenge",
    author: "Generator",
    wallHeight: 3000,
    holds: [], // Will be populated by generateLevel() function
  },

  default: {
    order: 0,
    name: "Easy Wall",
    author: "Mättu",
    wallHeight: 1400,
    holds: [
      // Starting holds repositioned to center the player better with more floor space
      { x: 130, y: 850 }, // left leg
      { x: 180, y: 820 }, // right leg
      { x: 150, y: 700 }, // left arm
      { x: 190, y: 700 }, // right arm

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
    author: "Mättu",
    wallHeight: 2500,
    holds: [
      // --- STARTING HOLDS ---
      { x: 170, y: 1720 }, // left leg
      { x: 230, y: 1720 }, // right leg
      { x: 180, y: 1650 }, // left arm
      { x: 220, y: 1650 }, // right arm

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

  touchingTheSky: {
    name: "Touching the Sky",
    author: "Chrigu",
    wallHeight: 2452.94921875,
    holds: [
      {
        x: 225,
        y: 2103,
        top: false,
      },
      {
        x: 267,
        y: 2103,
        top: false,
      },
      {
        x: 229,
        y: 2173,
        top: false,
      },
      {
        x: 270,
        y: 2172,
        top: false,
      },
      {
        x: 267,
        y: 2137,
        top: false,
      },
      {
        x: 227,
        y: 2135,
        top: false,
      },
      {
        x: 229,
        y: 2204,
        top: false,
      },
      {
        x: 229,
        y: 2270,
        top: false,
      },
      {
        x: 271,
        y: 2203,
        top: false,
      },
      {
        x: 271,
        y: 2237,
        top: false,
      },
      {
        x: 265,
        y: 2069,
        top: false,
      },
      {
        x: 224,
        y: 2064,
        top: false,
      },
      {
        x: 223,
        y: 2028,
        top: false,
      },
      {
        x: 263,
        y: 2030,
        top: false,
      },
      {
        x: 260,
        y: 1996,
        top: false,
      },
      {
        x: 219,
        y: 1995,
        top: false,
      },
      {
        x: 286,
        y: 2006,
        top: false,
      },
      {
        x: 308,
        y: 2025,
        top: false,
      },
      {
        x: 340,
        y: 2033,
        top: false,
      },
      {
        x: 344,
        y: 2003,
        top: false,
      },
      {
        x: 326,
        y: 1970,
        top: false,
      },
      {
        x: 304,
        y: 1949,
        top: false,
      },
      {
        x: 139,
        y: 2030,
        top: false,
      },
      {
        x: 278,
        y: 1960,
        top: false,
      },
      {
        x: 285,
        y: 1502,
        top: false,
      },
      {
        x: 188,
        y: 2009,
        top: false,
      },
      {
        x: 165,
        y: 2023,
        top: false,
      },
      {
        x: 140,
        y: 1995,
        top: false,
      },
      {
        x: 153,
        y: 1964,
        top: false,
      },
      {
        x: 168,
        y: 1935,
        top: false,
      },
      {
        x: 196,
        y: 1947,
        top: false,
      },
      {
        x: 145,
        y: 1908,
        top: false,
      },
      {
        x: 137,
        y: 1873,
        top: false,
      },
      {
        x: 172,
        y: 1876,
        top: false,
      },
      {
        x: 211,
        y: 1891,
        top: false,
      },
      {
        x: 241,
        y: 1909,
        top: false,
      },
      {
        x: 309,
        y: 1913,
        top: false,
      },
      {
        x: 317,
        y: 1842,
        top: false,
      },
      {
        x: 268,
        y: 1882,
        top: false,
      },
      {
        x: 258,
        y: 1521,
        top: false,
      },
      {
        x: 266,
        y: 1550,
        top: false,
      },
      {
        x: 296,
        y: 1567,
        top: false,
      },
      {
        x: 335,
        y: 1514,
        top: false,
      },
      {
        x: 240,
        y: 1591,
        top: false,
      },
      {
        x: 218,
        y: 1614,
        top: false,
      },
      {
        x: 314,
        y: 1501,
        top: false,
      },
      {
        x: 324,
        y: 1563,
        top: false,
      },
      {
        x: 338,
        y: 1543,
        top: false,
      },
      {
        x: 228,
        y: 1505,
        top: false,
      },
      {
        x: 203,
        y: 1491,
        top: false,
      },
      {
        x: 177,
        y: 1473,
        top: false,
      },
      {
        x: 296,
        y: 1461,
        top: false,
      },
      {
        x: 295,
        y: 1426,
        top: false,
      },
      {
        x: 294,
        y: 1393,
        top: false,
      },
      {
        x: 195,
        y: 1639,
        top: false,
      },
      {
        x: 345,
        y: 1598,
        top: false,
      },
      {
        x: 362,
        y: 1620,
        top: false,
      },
      {
        x: 363,
        y: 1493,
        top: false,
      },
      {
        x: 290,
        y: 1631,
        top: false,
      },
      {
        x: 286,
        y: 1661,
        top: false,
      },
      {
        x: 280,
        y: 1691,
        top: false,
      },
      {
        x: 274,
        y: 1722,
        top: false,
      },
      {
        x: 284,
        y: 1855,
        top: false,
      },
      {
        x: 311,
        y: 1878,
        top: false,
      },
      {
        x: 273,
        y: 2270,
        top: false,
      },
      {
        x: 230,
        y: 2238,
        top: false,
      },
      {
        x: 295,
        y: 1604,
        top: false,
      },
      {
        x: 170,
        y: 1657,
        top: false,
      },
      {
        x: 146,
        y: 1455,
        top: false,
      },
      {
        x: 294,
        y: 1360,
        top: false,
      },
      {
        x: 61,
        y: 1774,
        top: false,
      },
      {
        x: 15,
        y: 1803,
        top: false,
      },
      {
        x: 20,
        y: 1739,
        top: false,
      },
      {
        x: 90,
        y: 1248,
        top: false,
      },
      {
        x: 116,
        y: 1258,
        top: false,
      },
      {
        x: 142,
        y: 1253,
        top: false,
      },
      {
        x: 158,
        y: 1232,
        top: false,
      },
      {
        x: 155,
        y: 1205,
        top: false,
      },
      {
        x: 131,
        y: 1191,
        top: false,
      },
      {
        x: 132,
        y: 1163,
        top: false,
      },
      {
        x: 111,
        y: 1147,
        top: false,
      },
      {
        x: 83,
        y: 1139,
        top: false,
      },
      {
        x: 60,
        y: 1151,
        top: false,
      },
      {
        x: 42,
        y: 1170,
        top: false,
      },
      {
        x: 63,
        y: 1261,
        top: false,
      },
      {
        x: 34,
        y: 1261,
        top: false,
      },
      {
        x: 10,
        y: 1241,
        top: false,
      },
      {
        x: 18,
        y: 1152,
        top: false,
      },
      {
        x: 358,
        y: 1144,
        top: false,
      },
      {
        x: 330,
        y: 1145,
        top: false,
      },
      {
        x: 305,
        y: 1160,
        top: false,
      },
      {
        x: 274,
        y: 1174,
        top: false,
      },
      {
        x: 253,
        y: 1202,
        top: false,
      },
      {
        x: 266,
        y: 1229,
        top: false,
      },
      {
        x: 295,
        y: 1248,
        top: false,
      },
      {
        x: 326,
        y: 1251,
        top: false,
      },
      {
        x: 353,
        y: 1243,
        top: false,
      },
      {
        x: 82,
        y: 1024,
        top: false,
      },
      {
        x: 171,
        y: 1065,
        top: false,
      },
      {
        x: 304,
        y: 1034,
        top: false,
      },
      {
        x: 205,
        y: 967,
        top: false,
      },
      {
        x: 85,
        y: 874,
        top: false,
      },
      {
        x: 323,
        y: 855,
        top: false,
      },
      {
        x: 159,
        y: 822,
        top: false,
      },
      {
        x: 120,
        y: 731,
        top: false,
      },
      {
        x: 200,
        y: 680,
        top: true,
      },
      {
        x: 73,
        y: 1360,
        top: false,
      },
      {
        x: 99,
        y: 1557,
        top: false,
      },
      {
        x: 34,
        y: 950,
        top: false,
      },
      {
        x: 308,
        y: 724,
        top: false,
      },
      {
        x: 226,
        y: 746,
        top: false,
      },
    ],
  },
  hangInThere: {
    name: "Hang in there",
    author: "Martin",
    wallHeight: 1554,
    holds: [
      {
        x: 97,
        y: 1374,
        top: false,
      },
      {
        x: 152,
        y: 1373,
        top: false,
      },
      {
        x: 96,
        y: 1404,
        top: false,
      },
      {
        x: 150,
        y: 1400,
        top: false,
      },
      {
        x: 89,
        y: 1301,
        top: false,
      },
      {
        x: 148,
        y: 1267,
        top: false,
      },
      {
        x: 209,
        y: 1241,
        top: false,
      },
      {
        x: 281,
        y: 1230,
        top: false,
      },
      {
        x: 350,
        y: 1225,
        top: false,
      },
      {
        x: 353,
        y: 1163,
        top: false,
      },
      {
        x: 356,
        y: 1108,
        top: false,
      },
      {
        x: 356,
        y: 1048,
        top: false,
      },
      {
        x: 356,
        y: 979,
        top: false,
      },
      {
        x: 297,
        y: 939,
        top: false,
      },
      {
        x: 248,
        y: 905,
        top: false,
      },
      {
        x: 189,
        y: 870,
        top: false,
      },
      {
        x: 132,
        y: 836,
        top: false,
      },
      {
        x: 84,
        y: 810,
        top: false,
      },
      {
        x: 260,
        y: 1325,
        top: false,
      },
      {
        x: 244,
        y: 981,
        top: false,
      },
      {
        x: 87,
        y: 740,
        top: false,
      },
      {
        x: 170,
        y: 1086,
        top: false,
      },
      {
        x: 303,
        y: 1127,
        top: false,
      },
      {
        x: 200,
        y: 690,
        top: true,
      },
    ],
  },
};
