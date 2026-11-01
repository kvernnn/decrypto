export const KEYWORD_POOL = [
  'ASTRONAUT', 'VOLCANO', 'PYRAMID', 'SYMPHONY', 'CLOCKWORK',
  'LABYRINTH', 'SHADOW', 'DIAMOND', 'LIBRARY', 'ISLAND',
  'FALCON', 'CASTLE', 'THUNDER', 'RADAR', 'POISON',
  'VELVET', 'GLACIER', 'LANTERN', 'COMPASS', 'TELESCOPE',
  'SATELLITE', 'SUBMARINE', 'AVALANCHE', 'METEOR', 'TREASURE',
  'CATHEDRAL', 'PHANTOM', 'MIRAGE', 'WHISPER', 'TEMPLE',
  'OCEAN', 'DESERT', 'VOLTAGE', 'ECLIPSE', 'ANCHOR',
  'GRAVITY', 'PARACHUTE', 'CRYSTAL', 'DRAGON', 'HARBOR',
  'CAVERN', 'HORIZON', 'LIGHTHOUSE', 'VORTEX', 'BLIZZARD',
  'EMERALD', 'MONUMENT', 'MATRIX', 'GALAXY', 'CIRCUIT',
  'SPECTER', 'COMPACT', 'SANCTUARY', 'BEACON', 'TITAN',
  'MIRROR', 'FURNACE', 'SCROLL', 'CHASM', 'DAGGER',
  'PHOENIX', 'CANYON', 'BALLOON', 'CITADEL', 'ORIGAMI',
  'SPHINX', 'OASIS', 'ORBIT', 'TORNADO', 'CHRONOMETER',
  'PRISM', 'KINETIC', 'SPECTRUM', 'QUARRY', 'GULLY',
  'FORTRESS', 'HELIX', 'LABORATORY', 'OBSERVATORY', 'CYLINDER',
  'QUARTZ', 'PERISCOPE', 'DYNAMO', 'NEEDLE', 'MAGNET',
  'VAMPIRE', 'GHOST', 'ARCHITECT', 'NAVIGATOR', 'PIRATE',
  'COLOSSUS', 'CHAMELEON', 'PENDULUM', 'CRUCIBLE', 'METEORITE',
  'ZEPPELIN', 'CHRONICLE', 'ARCHIVE', 'ALCHEMIST', 'TAPESTRY',
  'AURORA', 'TUNDRA', 'CORAL', 'COSMOS', 'FOSSIL',
  'AMULET', 'SIREN', 'MONOLITH', 'MEDALLION', 'ASTEROID',
  'GLADIATOR', 'EQUATOR', 'SOLARIS', 'NEBULA', 'HARPOON',
  'BASTION', 'LABOR', 'VANGUARD', 'HOROLOGY', 'CENTAUR'
];

export function getRandomKeywords(): { blue: { 1: string; 2: string; 3: string; 4: string }; red: { 1: string; 2: string; 3: string; 4: string } } {
  const shuffled = [...KEYWORD_POOL].sort(() => Math.random() - 0.5);
  return {
    blue: {
      1: shuffled[0],
      2: shuffled[1],
      3: shuffled[2],
      4: shuffled[3],
    },
    red: {
      1: shuffled[4],
      2: shuffled[5],
      3: shuffled[6],
      4: shuffled[7],
    },
  };
}

// Generate all valid Decrypto codes: 3 distinct digits from 1, 2, 3, 4
// 4 * 3 * 2 = 24 permutations
export const ALL_VALID_CODES: [number, number, number][] = [
  [1, 2, 3], [1, 2, 4], [1, 3, 2], [1, 3, 4], [1, 4, 2], [1, 4, 3],
  [2, 1, 3], [2, 1, 4], [2, 3, 1], [2, 3, 4], [2, 4, 1], [2, 4, 3],
  [3, 1, 2], [3, 1, 4], [3, 2, 1], [3, 2, 4], [3, 4, 1], [3, 4, 2],
  [4, 1, 2], [4, 1, 3], [4, 2, 1], [4, 2, 3], [4, 3, 1], [4, 3, 2],
];

export function generateCode(mode: 'traditional' | 'no-repeat', usedCodes: string[]): [number, number, number] {
  if (mode === 'no-repeat') {
    const available = ALL_VALID_CODES.filter(code => !usedCodes.includes(code.join('-')));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }
  // Traditional: draw independently each round; repeated sequences allowed
  return ALL_VALID_CODES[Math.floor(Math.random() * ALL_VALID_CODES.length)];
}
