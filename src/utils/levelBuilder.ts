import { Block, BlockType, Enemy, EnemyType, Item, ItemType, LevelConfig } from "../types";

const BLOCK_SIZE = 40; // 40px grid
const CANVAS_HEIGHT = 480;

// Helper to generate unique IDs
function uuid() {
  return Math.random().toString(36).substring(2, 9);
}

// Visual map templates for the levels
// Height is 12 rows (480px / 40px)
// Length:
// Level 1: Sunlit Lilypad Swamp
const LEVEL_1_MAP = [
  "                                                                                ",
  "                                                                                ",
  "                                                                                ",
  "                                        ?                                       ",
  "                                                                                ",
  "              ?   B?B                                   B?B                     ",
  "                                 S   S                                          ",
  "                                S S S S                     KK                  ",
  "         ?    BB  G             S S S S                     kk     B?B          ",
  "             BBBB             S S S S S S                   kk                  ",
  "#################^^######################~~~~~~~~~~~~~~~~~~~##^^^^^#############",
  "#########################################~~~~~~~~~~~~~~~~~~~####################"
];

// Let's programmatically define rich, exciting stages with specific entities.
export function generateLevel(levelIndex: number): LevelConfig {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: Item[] = [];

  // Default parameters
  let levelWidth = 3200; // 80 grids
  let startX = 100;
  let startY = 300;
  let goalX = 3000;

  if (levelIndex === 1) {
    // Stage 1: The Pond Journey
    levelWidth = 3200;
    goalX = 3000;
    
    // Base floor layout
    for (let x = 0; x < 85; x++) {
      const px = x * BLOCK_SIZE;
      
      // Let's design pit holes, spikes, stumps, and platforms
      if (x > 18 && x < 23) {
        // Water Pit! (Water Hazard)
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.WATER));
        continue;
      }
      if (x > 40 && x < 45) {
        // Mud Trap with Spikes
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.SPIKES));
        continue;
      }

      // Normal Ground
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.GROUND)); // Double layer
    }

    // Interactive blocks, item boxes and pipes
    // Initial blocks
    blocks.push(createBlock(350, 320, BlockType.BRICK)); // Changed from QUESTION "fly" to plain BRICK
    blocks.push(createBlock(450, 320, BlockType.BRICK));
    blocks.push(createBlock(490, 320, BlockType.QUESTION, "golden_bug")); // Power up! (Keep to allow player to grow)
    blocks.push(createBlock(530, 320, BlockType.BRICK));
    
    // A tree trunk pipe
    blocks.push(createBlock(750, 360, BlockType.TRUNK_TOP));
    blocks.push(createBlock(750, 400, BlockType.TRUNK));
    
    // Nested blocks
    blocks.push(createBlock(950, 240, BlockType.BRICK)); // Changed from QUESTION "fly" to plain BRICK
    blocks.push(createBlock(1100, 320, BlockType.BRICK));
    blocks.push(createBlock(1140, 320, BlockType.BRICK)); // Changed from QUESTION "fly" to plain BRICK
    blocks.push(createBlock(1180, 320, BlockType.BRICK));
    blocks.push(createBlock(1220, 220, BlockType.BRICK)); // Changed from QUESTION "one_up" to plain BRICK (removes extra life item)
    
    // Floating lilypad platforms (represented as SOLID or bricks)
    blocks.push(createBlock(1450, 340, BlockType.BRICK));
    blocks.push(createBlock(1550, 280, BlockType.BRICK));
    blocks.push(createBlock(1650, 340, BlockType.BRICK));
    
    // Tall tree trunk
    blocks.push(createBlock(1900, 320, BlockType.TRUNK_TOP));
    blocks.push(createBlock(1900, 360, BlockType.TRUNK));
    blocks.push(createBlock(1900, 400, BlockType.TRUNK));
    
    // Pyramid steps
    const stepX = 2200;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row <= col; row++) {
        blocks.push(createBlock(stepX + col * BLOCK_SIZE, CANVAS_HEIGHT - BLOCK_SIZE * 3 - row * BLOCK_SIZE, BlockType.SOLID));
      }
    }
    // Reverse pyramid steps
    const revStepX = 2500;
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < (4 - col); row++) {
        blocks.push(createBlock(revStepX + col * BLOCK_SIZE, CANVAS_HEIGHT - BLOCK_SIZE * 3 - row * BLOCK_SIZE, BlockType.SOLID));
      }
    }
    
    // Final stretch questions
    blocks.push(createBlock(2800, 320, BlockType.BRICK)); // Changed from QUESTION "fly" to plain BRICK
    blocks.push(createBlock(2840, 320, BlockType.QUESTION, "bubble_power")); // Bubble fire frog! (Keep as rare fire upgrade)

    // Spawn green snakes (ground)
    enemies.push(createEnemy(500, 360, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(1000, 360, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(1300, 360, EnemyType.SNAKE_RED)); // Red is faster
    enemies.push(createEnemy(1700, 360, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(2050, 360, EnemyType.SNAKE_WINGED)); // Winged snake jumps!
    enemies.push(createEnemy(2110, 360, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(2750, 360, EnemyType.SNAKE_RED));

  } else if (levelIndex === 2) {
    // Stage 2: Deep Thorny Forest
    levelWidth = 3600;
    goalX = 3400;

    // Lots of Spikes and Trunks
    for (let x = 0; x < 95; x++) {
      const px = x * BLOCK_SIZE;
      if ((x > 12 && x < 16) || (x > 32 && x < 35) || (x > 55 && x < 59) || (x > 75 && x < 79)) {
        // Dangerous spiked bogs
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.SPIKES));
        continue;
      }
      if (x > 42 && x < 48) {
        // Clear Water Gap requiring jump
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.WATER));
        continue;
      }
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.GROUND));
    }

    // Blocks
    blocks.push(createBlock(300, 320, BlockType.QUESTION, "golden_bug")); // Keep golden bug powerup
    blocks.push(createBlock(450, 240, BlockType.BRICK));
    blocks.push(createBlock(490, 240, BlockType.BRICK)); // Changed from QUESTION "fly" to BRICK
    blocks.push(createBlock(530, 240, BlockType.BRICK));
 
    // Trunk gates
    blocks.push(createBlock(800, 320, BlockType.TRUNK_TOP));
    blocks.push(createBlock(800, 360, BlockType.TRUNK));
    blocks.push(createBlock(800, 400, BlockType.TRUNK));
 
    blocks.push(createBlock(960, 280, BlockType.TRUNK_TOP));
    blocks.push(createBlock(960, 320, BlockType.TRUNK));
    blocks.push(createBlock(960, 360, BlockType.TRUNK));
    blocks.push(createBlock(960, 400, BlockType.TRUNK));
 
    // Secret high path
    for (let i = 0; i < 6; i++) {
      blocks.push(createBlock(1150 + i * BLOCK_SIZE, 200, BlockType.BRICK));
    }
    blocks.push(createBlock(1230, 200, BlockType.BRICK)); // Changed from QUESTION "fly" to BRICK
    blocks.push(createBlock(1270, 200, BlockType.QUESTION, "bubble_power")); // Keep bubble power
 
    // Harder enemies
    enemies.push(createEnemy(520, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(750, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(1100, 300, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(1400, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(1700, 360, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(1900, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(2300, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(2400, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(2900, 360, EnemyType.SNAKE_WINGED));
 
    // Middle floating platforms above the water gap (Lilypads)
    blocks.push(createBlock(1720, 320, BlockType.BRICK));
    blocks.push(createBlock(1840, 240, BlockType.BRICK)); // Changed from QUESTION "fly" to BRICK
    blocks.push(createBlock(1960, 320, BlockType.BRICK));

    // Ending Fort steps
    const stepX = 3100;
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row <= col; row++) {
        blocks.push(createBlock(stepX + col * BLOCK_SIZE, CANVAS_HEIGHT - BLOCK_SIZE * 3 - row * BLOCK_SIZE, BlockType.SOLID));
      }
    }

  } else if (levelIndex === 3) {
    // Stage 3: Snakes' Swamp Castle
    levelWidth = 4000;
    goalX = 3800;

    // Intricate maze with spikes and very few safe ground tiles
    for (let x = 0; x < 105; x++) {
      const px = x * BLOCK_SIZE;
      
      // Lots of gaps and water hazard
      if (
        (x > 15 && x < 20) || 
        (x > 35 && x < 40) || 
        (x > 50 && x < 57) || 
        (x > 75 && x < 83)
      ) {
        blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.WATER)); // Deep water pit
        continue;
      }

      // Safe parts
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.GROUND));
    }

    // High brick ceilings to jump on
    for (let i = 0; i < 15; i++) {
      const bx = 700 + i * BLOCK_SIZE;
      if (i === 7) {
        blocks.push(createBlock(bx, 280, BlockType.QUESTION, "golden_bug"));
      } else {
        blocks.push(createBlock(bx, 280, BlockType.BRICK));
      }
    }

    // Tight spaces over toxic spike pits
    blocks.push(createBlock(1500, 320, BlockType.BRICK));
    blocks.push(createBlock(1620, 260, BlockType.QUESTION, "bubble_power"));
    blocks.push(createBlock(1740, 320, BlockType.BRICK));
    blocks.push(createBlock(1860, 260, BlockType.BRICK));

    // Massive Trunk wall
    for (let h = 0; h < 5; h++) {
      blocks.push(createBlock(2200, CANVAS_HEIGHT - BLOCK_SIZE * 3 - h * BLOCK_SIZE, h === 4 ? BlockType.TRUNK_TOP : BlockType.TRUNK));
    }

    // Floating safe blocks in deep water (Lilypads)
    blocks.push(createBlock(2400, 340, BlockType.SOLID));
    blocks.push(createBlock(2480, 260, BlockType.SOLID));
    blocks.push(createBlock(2560, 340, BlockType.SOLID));
    blocks.push(createBlock(2640, 260, BlockType.SOLID));
    blocks.push(createBlock(2720, 220, BlockType.SOLID));

    // Spikes scattered on normal ground
    blocks.push(createBlock(1100, CANVAS_HEIGHT - BLOCK_SIZE * 3, BlockType.SPIKES));
    blocks.push(createBlock(1200, CANVAS_HEIGHT - BLOCK_SIZE * 3, BlockType.SPIKES));
    blocks.push(createBlock(3100, CANVAS_HEIGHT - BLOCK_SIZE * 3, BlockType.SPIKES));
    blocks.push(createBlock(3200, CANVAS_HEIGHT - BLOCK_SIZE * 3, BlockType.SPIKES));

    // Double step walls
    const stepX = 3400;
    for (let col = 0; col < 6; col++) {
      for (let row = 0; row <= col; row++) {
        blocks.push(createBlock(stepX + col * BLOCK_SIZE, CANVAS_HEIGHT - BLOCK_SIZE * 3 - row * BLOCK_SIZE, BlockType.SOLID));
      }
    }

    // Heavy guards
    enemies.push(createEnemy(450, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(650, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(900, 200, EnemyType.SNAKE_GREEN));
    enemies.push(createEnemy(1150, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(1350, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(2000, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(2100, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(2300, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(2900, 360, EnemyType.SNAKE_RED));
    enemies.push(createEnemy(3000, 360, EnemyType.SNAKE_WINGED));
    enemies.push(createEnemy(3300, 360, EnemyType.SNAKE_RED));
  } else {
    // Stage 4 (Hidden Boss Arena): King Swamp Snake's Throne Room!
    levelWidth = 1200;
    startX = 100;
    startY = 300;
    goalX = 1150;

    // Solid floor
    for (let x = 0; x < 35; x++) {
      const px = x * BLOCK_SIZE;
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE, BlockType.GROUND));
      blocks.push(createBlock(px, CANVAS_HEIGHT - BLOCK_SIZE * 2, BlockType.GROUND));
    }

    // Blocks: Floating item boxes so player can power up inside the fight
    blocks.push(createBlock(400, 280, BlockType.BRICK));
    blocks.push(createBlock(440, 280, BlockType.QUESTION, "golden_bug")); // Turn SUPER
    blocks.push(createBlock(480, 280, BlockType.BRICK));

    blocks.push(createBlock(720, 240, BlockType.BRICK));
    blocks.push(createBlock(760, 240, BlockType.QUESTION, "bubble_power")); // Turn FIRE
    blocks.push(createBlock(800, 240, BlockType.BRICK));

    // Giant Boss Snake!
    const bossEnemy: Enemy = {
      id: "king_swamp_snake_boss",
      type: EnemyType.SNAKE_BOSS,
      x: 850,
      y: 320,
      vx: -1.3,
      vy: 0,
      width: 90,
      height: 60,
      isDead: false,
      deadTimer: 0,
      deathType: "squished",
      facing: "left",
      animFrame: 0,
      animTimer: 0,
      health: 5,
      maxHealth: 5,
    };
    enemies.push(bossEnemy);
  }

  // Create Goal Pole structure (A Giant Lotus Flower flag-like pole)
  // Generates vertical poles of SOLID blocks and a floating special goal trigger
  const goalStepY = CANVAS_HEIGHT - BLOCK_SIZE * 3;
  for (let h = 0; h < 6; h++) {
    // Create goal pole using custom design in drawing
  }

  return {
    width: levelWidth,
    height: CANVAS_HEIGHT,
    blocks,
    enemies,
    items,
    startX,
    startY,
    goalX
  };
}

function createBlock(
  x: number,
  y: number,
  type: BlockType,
  itemInside: "none" | "fly" | "golden_bug" | "bubble_power" | "one_up" = "none"
): Block {
  return {
    id: uuid(),
    type,
    x,
    y,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    itemInside,
    bounceY: 0,
    bounceSpeed: 0
  };
}

function createEnemy(x: number, y: number, type: EnemyType): Enemy {
  const vx = type === EnemyType.SNAKE_RED ? -1.8 : -1.0;
  return {
    id: uuid(),
    type,
    x,
    y,
    vx,
    vy: 0,
    width: 34,
    height: 24,
    isDead: false,
    deadTimer: 0,
    deathType: "squished",
    facing: "left",
    animFrame: 0,
    animTimer: 0
  };
}
