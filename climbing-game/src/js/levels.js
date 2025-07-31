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
  default: {
    order: 0,
    name: "Easy Wall",
    author: "Mättu",
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

  generated: {
    order: 1,
    name: "Challenge",
    author: "Generator",
    wallHeight: 3000,
    holds: [], // Will be populated by generateLevel() function
  },

  touchingTheSky: {
    order: 2,
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
    order: 3,
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

  v17: {
    order: 4,
    name: "V17 Boulder",
    author: "Mättu",
    wallHeight: 1700,
    holds: [
      {
        x: 168,
        y: 1373,
        top: false,
      },
      {
        x: 232,
        y: 1381,
        top: false,
      },
      {
        x: 84,
        y: 1479,
        top: false,
      },
      {
        x: 306,
        y: 1468,
        top: false,
      },
      {
        x: 184,
        y: 1271,
        top: false,
      },
      {
        x: 109,
        y: 955,
        top: false,
      },
      {
        x: 159,
        y: 750,
        top: false,
      },
      {
        x: 204,
        y: 312,
        top: false,
      },
      {
        x: 178,
        y: 169,
        top: false,
      },
      {
        x: 114,
        y: 432,
        top: false,
      },
      {
        x: 160,
        y: 624,
        top: false,
      },
      {
        x: 160,
        y: 687,
        top: false,
      },
      {
        x: 157,
        y: 811,
        top: false,
      },
      {
        x: 200,
        y: 119,
        top: true,
      },
      {
        x: 288,
        y: 1253,
        top: false,
      },
      {
        x: 338,
        y: 1189,
        top: false,
      },
      {
        x: 175,
        y: 1041,
        top: false,
      },
      {
        x: 285,
        y: 1086,
        top: false,
      },
      {
        x: 237,
        y: 1056,
        top: false,
      },
      {
        x: 222,
        y: 925,
        top: false,
      },
      {
        x: 176,
        y: 517,
        top: false,
      },
      {
        x: 51,
        y: 897,
        top: false,
      },
      {
        x: 93,
        y: 517,
        top: false,
      },
      {
        x: 117,
        y: 308,
        top: false,
      },
      {
        x: 203,
        y: 265,
        top: false,
      },
    ],
  },
  zigZag: {
    name: "Zigzag Boulder",
    author: "Mättu",
    wallHeight: 1031,
    holds: [
      {
        x: 20,
        y: 721,
        top: false,
      },
      {
        x: 55,
        y: 718,
        top: false,
      },
      {
        x: 16,
        y: 796,
        top: false,
      },
      {
        x: 172,
        y: 796,
        top: false,
      },
      {
        x: 145,
        y: 704,
        top: false,
      },
      {
        x: 226,
        y: 708,
        top: false,
      },
      {
        x: 358,
        y: 783,
        top: false,
      },
      {
        x: 307,
        y: 664,
        top: false,
      },
      {
        x: 331,
        y: 572,
        top: false,
      },
      {
        x: 307,
        y: 503,
        top: false,
      },
      {
        x: 346,
        y: 444,
        top: false,
      },
      {
        x: 185,
        y: 363,
        top: false,
      },
      {
        x: 129,
        y: 453,
        top: false,
      },
      {
        x: 284,
        y: 389,
        top: false,
      },
      {
        x: 14,
        y: 291,
        top: false,
      },
      {
        x: 200,
        y: 241,
        top: true,
      },
    ],
  },
  esSibni: {
    name: "Sehr wohrschinli es 7i",
    author: "Luca",
    wallHeight: 1058,
    holds: [
      {
        x: 333,
        y: 728,
        top: false,
      },
      {
        x: 273,
        y: 782,
        top: false,
      },
      {
        x: 257,
        y: 669,
        top: false,
      },
      {
        x: 206,
        y: 732,
        top: false,
      },
      {
        x: 294,
        y: 817,
        top: false,
      },
      {
        x: 215,
        y: 561,
        top: false,
      },
      {
        x: 292,
        y: 550,
        top: false,
      },
      {
        x: 247,
        y: 499,
        top: false,
      },
      {
        x: 79,
        y: 615,
        top: false,
      },
      {
        x: 317,
        y: 491,
        top: false,
      },
      {
        x: 335,
        y: 776,
        top: false,
      },
      {
        x: 238,
        y: 823,
        top: false,
      },
      {
        x: 318,
        y: 635,
        top: false,
      },
      {
        x: 262,
        y: 615,
        top: false,
      },
      {
        x: 138,
        y: 540,
        top: false,
      },
      {
        x: 124,
        y: 583,
        top: false,
      },
      {
        x: 62,
        y: 506,
        top: false,
      },
      {
        x: 34,
        y: 565,
        top: false,
      },
      {
        x: 86,
        y: 440,
        top: false,
      },
      {
        x: 25,
        y: 432,
        top: false,
      },
      {
        x: 79,
        y: 361,
        top: false,
      },
      {
        x: 44,
        y: 335,
        top: false,
      },
      {
        x: 159,
        y: 320,
        top: false,
      },
      {
        x: 200,
        y: 285,
        top: true,
      },
      {
        x: 158,
        y: 354,
        top: false,
      },
    ],
  },
  keiAhnig: {
    name: "Kei Ahnig vo Chlätere",
    author: "Jasmin",
    wallHeight: 1494,
    holds: [
      {
        x: 135,
        y: 1343,
        top: false,
      },
      {
        x: 196,
        y: 1344,
        top: false,
      },
      {
        x: 80,
        y: 1323,
        top: false,
      },
      {
        x: 254,
        y: 1317,
        top: false,
      },
      {
        x: 206,
        y: 1263,
        top: false,
      },
      {
        x: 114,
        y: 1245,
        top: false,
      },
      {
        x: 257,
        y: 1137,
        top: false,
      },
      {
        x: 187,
        y: 1163,
        top: false,
      },
      {
        x: 72,
        y: 1156,
        top: false,
      },
      {
        x: 111,
        y: 1053,
        top: false,
      },
      {
        x: 212,
        y: 1055,
        top: false,
      },
      {
        x: 178,
        y: 937,
        top: false,
      },
      {
        x: 205,
        y: 936,
        top: false,
      },
      {
        x: 93,
        y: 909,
        top: false,
      },
      {
        x: 303,
        y: 905,
        top: false,
      },
      {
        x: 185,
        y: 818,
        top: false,
      },
      {
        x: 345,
        y: 1015,
        top: false,
      },
      {
        x: 352,
        y: 1230,
        top: false,
      },
      {
        x: 185,
        y: 716,
        top: false,
      },
      {
        x: 183,
        y: 660,
        top: false,
      },
      {
        x: 179,
        y: 603,
        top: false,
      },
      {
        x: 177,
        y: 548,
        top: false,
      },
      {
        x: 200,
        y: 498,
        top: true,
      },
      {
        x: 87,
        y: 747,
        top: false,
      },
      {
        x: 220,
        y: 762,
        top: false,
      },
      {
        x: 85,
        y: 608,
        top: false,
      },
      {
        x: 257,
        y: 564,
        top: false,
      },
    ],
  },
  neunC: {
    name: "9C",
    author: "Sany",
    wallHeight: 1700,
    holds: [
      {
        x: 190,
        y: 1388,
        top: false,
      },
      {
        x: 255,
        y: 1412,
        top: false,
      },
      {
        x: 123,
        y: 1490,
        top: false,
      },
      {
        x: 157,
        y: 1503,
        top: false,
      },
      {
        x: 192,
        y: 1128,
        top: false,
      },
      {
        x: 136,
        y: 1228,
        top: false,
      },
      {
        x: 78,
        y: 1110,
        top: false,
      },
      {
        x: 49,
        y: 1128,
        top: false,
      },
      {
        x: 76,
        y: 1008,
        top: false,
      },
      {
        x: 122,
        y: 899,
        top: false,
      },
      {
        x: 160,
        y: 980,
        top: false,
      },
      {
        x: 96,
        y: 1339,
        top: false,
      },
      {
        x: 199,
        y: 1286,
        top: false,
      },
      {
        x: 204,
        y: 835,
        top: false,
      },
      {
        x: 282,
        y: 988,
        top: false,
      },
      {
        x: 306,
        y: 989,
        top: false,
      },
      {
        x: 309,
        y: 856,
        top: false,
      },
      {
        x: 322,
        y: 638,
        top: false,
      },
      {
        x: 288,
        y: 632,
        top: false,
      },
      {
        x: 242,
        y: 539,
        top: false,
      },
      {
        x: 203,
        y: 502,
        top: false,
      },
      {
        x: 98,
        y: 505,
        top: false,
      },
      {
        x: 201,
        y: 631,
        top: false,
      },
      {
        x: 61,
        y: 433,
        top: false,
      },
      {
        x: 87,
        y: 417,
        top: false,
      },
      {
        x: 101,
        y: 321,
        top: false,
      },
      {
        x: 133,
        y: 329,
        top: false,
      },
      {
        x: 309,
        y: 758,
        top: false,
      },
      {
        x: 339,
        y: 855,
        top: false,
      },
      {
        x: 200,
        y: 271,
        top: true,
      },
    ],
  },
  miguel: {
    name: "Miguel",
    author: "Miguel",
    wallHeight: 1547.47265625,
    holds: [
      {
        x: 138,
        y: 1320,
        top: false,
      },
      {
        x: 192,
        y: 1317,
        top: false,
      },
      {
        x: 185,
        y: 1367,
        top: false,
      },
      {
        x: 172,
        y: 1397,
        top: false,
      },
      {
        x: 189,
        y: 1253,
        top: false,
      },
      {
        x: 152,
        y: 1235,
        top: false,
      },
      {
        x: 219,
        y: 1235,
        top: false,
      },
      {
        x: 220,
        y: 1291,
        top: false,
      },
      {
        x: 151,
        y: 1287,
        top: false,
      },
      {
        x: 181,
        y: 1136,
        top: false,
      },
      {
        x: 181,
        y: 1165,
        top: false,
      },
      {
        x: 183,
        y: 1196,
        top: false,
      },
      {
        x: 180,
        y: 1105,
        top: false,
      },
      {
        x: 203,
        y: 981,
        top: false,
      },
      {
        x: 172,
        y: 978,
        top: false,
      },
      {
        x: 140,
        y: 977,
        top: false,
      },
      {
        x: 139,
        y: 1007,
        top: false,
      },
      {
        x: 139,
        y: 1036,
        top: false,
      },
      {
        x: 142,
        y: 1064,
        top: false,
      },
      {
        x: 180,
        y: 1062,
        top: false,
      },
      {
        x: 205,
        y: 1057,
        top: false,
      },
      {
        x: 202,
        y: 1025,
        top: false,
      },
      {
        x: 176,
        y: 1021,
        top: false,
      },
      {
        x: 135,
        y: 705,
        top: false,
      },
      {
        x: 133,
        y: 736,
        top: false,
      },
      {
        x: 133,
        y: 770,
        top: false,
      },
      {
        x: 133,
        y: 801,
        top: false,
      },
      {
        x: 165,
        y: 708,
        top: false,
      },
      {
        x: 198,
        y: 711,
        top: false,
      },
      {
        x: 161,
        y: 754,
        top: false,
      },
      {
        x: 193,
        y: 755,
        top: false,
      },
      {
        x: 162,
        y: 806,
        top: false,
      },
      {
        x: 191,
        y: 804,
        top: false,
      },
      {
        x: 141,
        y: 585,
        top: false,
      },
      {
        x: 141,
        y: 613,
        top: false,
      },
      {
        x: 137,
        y: 642,
        top: false,
      },
      {
        x: 139,
        y: 668,
        top: false,
      },
      {
        x: 166,
        y: 671,
        top: false,
      },
      {
        x: 194,
        y: 667,
        top: false,
      },
      {
        x: 125,
        y: 851,
        top: false,
      },
      {
        x: 125,
        y: 877,
        top: false,
      },
      {
        x: 123,
        y: 909,
        top: false,
      },
      {
        x: 122,
        y: 934,
        top: false,
      },
      {
        x: 152,
        y: 937,
        top: false,
      },
      {
        x: 187,
        y: 939,
        top: false,
      },
      {
        x: 187,
        y: 908,
        top: false,
      },
      {
        x: 186,
        y: 880,
        top: false,
      },
      {
        x: 186,
        y: 854,
        top: false,
      },
      {
        x: 200,
        y: 535,
        top: true,
      },
    ],
  },
  davos: {
    name: "DAVOS",
    author: "Hitsch Heldstab",
    wallHeight: 2262.12109375,
    holds: [
      {
        x: 151,
        y: 1989,
        top: false,
      },
      {
        x: 222,
        y: 1991,
        top: false,
      },
      {
        x: 150,
        y: 2112,
        top: false,
      },
      {
        x: 228,
        y: 2112,
        top: false,
      },
      {
        x: 71,
        y: 1993,
        top: false,
      },
      {
        x: 312,
        y: 1989,
        top: false,
      },
      {
        x: 86,
        y: 1920,
        top: false,
      },
      {
        x: 165,
        y: 1881,
        top: false,
      },
      {
        x: 236,
        y: 1885,
        top: false,
      },
      {
        x: 292,
        y: 1931,
        top: false,
      },
      {
        x: 52,
        y: 1698,
        top: false,
      },
      {
        x: 134,
        y: 1746,
        top: false,
      },
      {
        x: 233,
        y: 1789,
        top: false,
      },
      {
        x: 322,
        y: 1815,
        top: false,
      },
      {
        x: 139,
        y: 1640,
        top: false,
      },
      {
        x: 231,
        y: 1614,
        top: false,
      },
      {
        x: 328,
        y: 1590,
        top: false,
      },
      {
        x: 228,
        y: 1692,
        top: false,
      },
      {
        x: 26,
        y: 1574,
        top: false,
      },
      {
        x: 136,
        y: 1530,
        top: false,
      },
      {
        x: 230,
        y: 1508,
        top: false,
      },
      {
        x: 340,
        y: 1477,
        top: false,
      },
      {
        x: 230,
        y: 1412,
        top: false,
      },
      {
        x: 133,
        y: 1372,
        top: false,
      },
      {
        x: 31,
        y: 1329,
        top: false,
      },
      {
        x: 316,
        y: 1261,
        top: false,
      },
      {
        x: 232,
        y: 1317,
        top: false,
      },
      {
        x: 130,
        y: 1315,
        top: false,
      },
      {
        x: 35,
        y: 1229,
        top: false,
      },
      {
        x: 74,
        y: 1129,
        top: false,
      },
      {
        x: 175,
        y: 1108,
        top: false,
      },
      {
        x: 283,
        y: 1124,
        top: false,
      },
      {
        x: 325,
        y: 1195,
        top: false,
      },
      {
        x: 67,
        y: 1273,
        top: false,
      },
      {
        x: 74,
        y: 914,
        top: false,
      },
      {
        x: 30,
        y: 975,
        top: false,
      },
      {
        x: 86,
        y: 1052,
        top: false,
      },
      {
        x: 174,
        y: 1027,
        top: false,
      },
      {
        x: 202,
        y: 948,
        top: false,
      },
      {
        x: 289,
        y: 911,
        top: false,
      },
      {
        x: 344,
        y: 973,
        top: false,
      },
      {
        x: 322,
        y: 1044,
        top: false,
      },
      {
        x: 194,
        y: 834,
        top: false,
      },
      {
        x: 192,
        y: 764,
        top: false,
      },
      {
        x: 184,
        y: 709,
        top: false,
      },
      {
        x: 193,
        y: 587,
        top: false,
      },
      {
        x: 224,
        y: 661,
        top: false,
      },
      {
        x: 249,
        y: 607,
        top: false,
      },
      {
        x: 282,
        y: 564,
        top: false,
      },
      {
        x: 200,
        y: 502,
        top: true,
      },
      {
        x: 145,
        y: 795,
        top: false,
      },
      {
        x: 232,
        y: 721,
        top: false,
      },
    ],
  },
};
