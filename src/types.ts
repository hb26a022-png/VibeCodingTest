export enum GameState {
  TITLE = "TITLE",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAMEOVER = "GAMEOVER",
  CLEAR = "CLEAR",
}

export enum PlayerSize {
  NORMAL = "NORMAL", // Small frog
  SUPER = "SUPER",   // Big blue frog (can take optional extra hit, tongue reaches further)
  FIRE = "FIRE",     // Fiery red frog (can shoot bubble shots / water bubbles)
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  size: PlayerSize;
  facing: "left" | "right";
  isGrounded: boolean;
  jumpTicks: number; // For button-held higher jumps
  jumpCount: number; // Tracks current jump iteration for high consecutive or double jumping
  invulnerableFrames: number;
  lives: number;

  // Frog specific action: tongue (舌を伸ばす攻撃)
  tongueState: "idle" | "extending" | "retracting";
  tongueLength: number;
  maxTongueLength: number;
  tongueCooldown: number;

  // Frog stretch visual helper
  stretchX: number;
  stretchY: number;

  score: number;
  bugs: number; // Coin equivalent
  hasJumpedOnWater?: boolean;
  isOnWater?: boolean;
  waterTimer?: number;
}

export enum EnemyType {
  SNAKE_GREEN = "SNAKE_GREEN", // Ground walker
  SNAKE_RED = "SNAKE_RED",     // Fast ground walker
  SNAKE_WINGED = "SNAKE_WINGED", // Jumps around (Koopa Paratroopa equivalent)
  SNAKE_BOSS = "SNAKE_BOSS",   // Giant Swamp Snake Boss
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isDead: boolean;
  deadTimer: number; // For squish or flip animation
  deathType: "squished" | "flipped";
  facing: "left" | "right";
  animFrame: number;
  animTimer: number;
  health?: number;
  maxHealth?: number;
}

export enum BlockType {
  GROUND = "GROUND",           // Regular marsh mud / turf
  BRICK = "BRICK",             // Brick that can be smashed by SUPER frog or bumped
  QUESTION = "QUESTION",       // Item brick (fly, golden bug, bubble power)
  USED = "USED",               // Question block after hit
  SOLID = "SOLID",             // Unbreakable block
  TRUNK = "TRUNK",             // Hollow tree trunk (pipe analog)
  TRUNK_TOP = "TRUNK_TOP",     // Top of hollow trunk
  WATER = "WATER",             // Marsh hazard (instant lose / high fluid friction)
  SPIKES = "SPIKES",           // Hazard spike thorn
}

export interface Block {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  itemInside: "none" | "fly" | "golden_bug" | "bubble_power" | "one_up";
  bounceY: number; // For hit animation displacement
  bounceSpeed: number;
}

export enum ItemType {
  FLY = "FLY",                 // Coin equivalent
  GOLDEN_BUG = "GOLDEN_BUG",   // Power-ups normal frog to SUPER frog
  BUBBLE_POWER = "BUBBLE_POWER", // Power-ups to FIRE frog
  ONE_UP = "ONE_UP",           // Extra life green moth
}

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  isCollected: boolean;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  bounceCount: number; // Water bubbles bounce off ground
}

export interface GameEffect {
  id: string;
  type: "score" | "smoke" | "block_shard" | "bubble_pop";
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  text?: string;
  color?: string;
  life: number;
  maxLife: number;
}

export interface LevelConfig {
  width: number; // Total level width in pixels
  height: number; // Total level height (usually fixed, e.g. 480 or 640)
  blocks: Block[];
  enemies: Enemy[];
  items: Item[];
  startX: number;
  startY: number;
  goalX: number;
}
