import React, { useRef, useEffect, useState } from "react";
import { 
  GameState, 
  Player, 
  PlayerSize, 
  Enemy, 
  EnemyType, 
  Block, 
  BlockType, 
  Item, 
  ItemType, 
  Projectile, 
  GameEffect, 
  LevelConfig 
} from "../types";
import { generateLevel } from "../utils/levelBuilder";
import { sound } from "../utils/sound";
import { 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  Flame, 
  Disc 
} from "lucide-react";

const BLOCK_SIZE = 40;
const CANVAS_HEIGHT = 480;

interface GameCanvasProps {
  levelIndex: number;
  onUpdateHUD: (score: number, bugs: number, lives: number, size: PlayerSize) => void;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onNextLevel: () => void;
  onRestartGame: () => void;
  initialScore: number;
  initialBugs: number;
  initialLives: number;
  initialSize: PlayerSize;
}

export default function GameCanvas({
  levelIndex,
  onUpdateHUD,
  gameState,
  setGameState,
  onNextLevel,
  onRestartGame,
  initialScore,
  initialBugs,
  initialLives,
  initialSize
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard input states
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Game Engine Entities State
  const [level, setLevel] = useState<LevelConfig | null>(null);
  const playerRef = useRef<Player>({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    width: initialSize === PlayerSize.NORMAL ? 30 : 32,
    height: 30,
    size: initialSize,
    facing: "right",
    isGrounded: false,
    jumpTicks: 0,
    jumpCount: 0,
    invulnerableFrames: 0,
    lives: initialLives,
    tongueState: "idle",
    tongueLength: 0,
    maxTongueLength: initialSize === PlayerSize.SUPER ? 150 : 120,
    tongueCooldown: 0,
    stretchX: 1,
    stretchY: 1,
    score: initialScore,
    bugs: initialBugs
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const effectsRef = useRef<GameEffect[]>([]);
  const cameraXRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  // Touch Controls visual overlays (mobile friendly)
  const isPressingLeft = useRef(false);
  const isPressingRight = useRef(false);
  const isPressingJump = useRef(false);
  const isPressingAction = useRef(false);
  const prevWantsJumpRef = useRef(false);
  const isDyingRef = useRef(false);

  // Audio mute helper
  const [isMuted, setIsMuted] = useState(false);

  // Physics constraints
  const GRAVITY = 0.55;
  const FALL_LIMIT = 10;
  const RUN_SPEED = 3.5;
  const ACCELERATION = 0.22;
  const DECELERATION = 0.16;
  const JUMP_FORCE = -8.5;

  // Initialize level
  useEffect(() => {
    loadLevel(levelIndex);
  }, [levelIndex]);

  const loadLevel = (idx: number) => {
    isDyingRef.current = false;
    const lvl = generateLevel(idx);
    setLevel(lvl);

    // Setup player
    playerRef.current = {
      ...playerRef.current,
      x: lvl.startX,
      y: lvl.startY,
      vx: 0,
      vy: 0,
      size: playerRef.current.size, // Retain power-up across levels
      isGrounded: false,
      tongueState: "idle",
      tongueLength: 0,
      jumpTicks: 0,
      jumpCount: 0,
      invulnerableFrames: 0,
      hasJumpedOnWater: false,
      isOnWater: false
    };

    enemiesRef.current = lvl.enemies;
    blocksRef.current = lvl.blocks;
    itemsRef.current = lvl.items;
    projectilesRef.current = [];
    effectsRef.current = [];
    cameraXRef.current = 0;
    screenShakeRef.current = 0;

    // Trigger UI updates
    onUpdateHUD(
      playerRef.current.score,
      playerRef.current.bugs,
      playerRef.current.lives,
      playerRef.current.size
    );

    if (gameState === GameState.PLAYING) {
      sound.startBGM();
    }
  };

  const handleMuteToggle = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMute(nextMute);
  };

  // Setup Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      
      // Stop space bar scrolling the page
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
      }

      keysRef.current[k] = true;

      // Handle Instant Action on pressing F or X (Action/Shoot key)
      if (k === "f" || k === "x") {
        triggerAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState]);

  // Handle game state transition: music control
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      sound.startBGM();
    } else {
      sound.stopBGM();
    }
  }, [gameState]);

  // Action (Tongue or Bubble bullet)
  const triggerAction = () => {
    if (gameState !== GameState.PLAYING) return;
    const player = playerRef.current;

    // Bubble fire mode (FIRE size)
    if (player.size === PlayerSize.FIRE) {
      if (player.tongueCooldown <= 0) {
        player.tongueCooldown = 18; // bubble shooting cooldown
        sound.playShoot();
        const bvx = player.facing === "right" ? 5.5 : -5.5;
        projectilesRef.current.push({
          id: Math.random().toString(),
          x: player.x + (player.facing === "right" ? player.width - 5 : -5),
          y: player.y + player.height / 2 - 6,
          vx: bvx,
          vy: -2, // slight upwards hop initially
          width: 12,
          height: 12,
          bounceCount: 0
        });

        // Effect
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "smoke",
          x: player.x + (player.facing === "right" ? player.width : -10),
          y: player.y + player.height / 2,
          life: 10,
          maxLife: 10,
          color: "rgba(100, 220, 255, 0.6)"
        });
      }
    } else {
      // Normal / Super sizes: Tongue whip!
      if (player.tongueState === "idle" && player.tongueCooldown <= 0) {
        player.tongueState = "extending";
        player.tongueLength = 0;
        player.maxTongueLength = player.size === PlayerSize.SUPER ? 150 : 100;
        sound.playJump(); // Quick whip sound (re-use jump low sweeps)
      }
    }
  };

  const shrinkPlayer = () => {
    const player = playerRef.current;
    if (player.size === PlayerSize.FIRE) {
      player.size = PlayerSize.SUPER;
      sound.playPowerDown();
    } else if (player.size === PlayerSize.SUPER) {
      player.size = PlayerSize.NORMAL;
      sound.playPowerDown();
    } else {
      // Die!
      player.lives--;
      sound.playHurt();
      triggerDeath();
      return;
    }
    player.invulnerableFrames = 90; // 1.5 seconds of invuln
    screenShakeRef.current = 15;
    onUpdateHUD(player.score, player.bugs, player.lives, player.size);
  };

  const triggerDeath = () => {
    isDyingRef.current = true;
    const player = playerRef.current;
    player.tongueState = "idle";
    player.tongueLength = 0;
    sound.playGameOver();
    playerRef.current.vy = -10; // pop upwards
    playerRef.current.vx = 0;
    playerRef.current.isGrounded = false;
    
    // Smoke dust
    effectsRef.current.push({
      id: Math.random().toString(),
      type: "smoke",
      x: player.x + player.width/2,
      y: player.y + player.height/2,
      life: 25,
      maxLife: 25,
      color: "rgba(255,100,100,0.5)"
    });

    setTimeout(() => {
      if (player.lives <= 0) {
        setGameState(GameState.GAMEOVER);
      } else {
        // Respawn
        playerRef.current.size = PlayerSize.NORMAL; // 一回死んだらカエルの状態を初期状態に戻す
        loadLevel(levelIndex);
      }
    }, 1800);
  };

  // Main game ticks & physics
  useEffect(() => {
    let animId: number;
    let lastTime = 0;

    const gameLoop = (time: number) => {
      updatePhysics();
      render();
      animId = requestAnimationFrame(gameLoop);
    };

    if (gameState === GameState.PLAYING && level) {
      animId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, level]);

  const updatePhysics = () => {
    const player = playerRef.current;
    if (!level) return;

    if (isDyingRef.current) {
      // Non-interactive dying animation & gravity
      player.vy += GRAVITY;
      if (player.vy > FALL_LIMIT) player.vy = FALL_LIMIT;
      player.x += player.vx;
      player.y += player.vy;

      // Tick screen shake
      if (screenShakeRef.current > 0) {
        screenShakeRef.current *= 0.9;
        if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
      }

      // Tick blocks bouncing behavior during death
      blocksRef.current.forEach(b => {
        if (b.bounceSpeed !== 0 || b.bounceY !== 0) {
          b.bounceY += b.bounceSpeed;
          b.bounceSpeed += 0.8;
          if (b.bounceY > 0) {
            b.bounceY = 0;
            b.bounceSpeed = 0;
          }
        }
      });

      // Tick effects/particles
      effectsRef.current = effectsRef.current.filter(fx => {
        fx.life--;
        if (fx.vx !== undefined) fx.x += fx.vx;
        if (fx.vy !== undefined) fx.y += fx.vy;
        return fx.life > 0;
      });
      return;
    }

    // Check if player fell out of screen
    if (player.y > CANVAS_HEIGHT + 100) {
      player.lives--;
      player.size = PlayerSize.NORMAL; // 一回死んだらカエルの状態を初期状態に戻す
      onUpdateHUD(player.score, player.bugs, player.lives, player.size);
      if (player.lives <= 0) {
        setGameState(GameState.GAMEOVER);
      } else {
        loadLevel(levelIndex);
      }
      return;
    }

    // Tick invun
    if (player.invulnerableFrames > 0) {
      player.invulnerableFrames--;
    }
    if (player.tongueCooldown > 0) {
      player.tongueCooldown--;
    }

    // Tick screen shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
    }

    // 1. HORIZONTAL CONTROLS & FORCES
    const goLeft = keysRef.current["a"] || keysRef.current["arrowleft"] || isPressingLeft.current;
    const goRight = keysRef.current["d"] || keysRef.current["arrowright"] || isPressingRight.current;
    
    // Jump buttons
    const wantsJump = keysRef.current["w"] || keysRef.current["arrowup"] || keysRef.current[" "] || isPressingJump.current;
    const jumpJustPressed = wantsJump && !prevWantsJumpRef.current;
    prevWantsJumpRef.current = wantsJump;

    if (goLeft) {
      player.vx -= ACCELERATION;
      if (player.vx < -RUN_SPEED) player.vx = -RUN_SPEED;
      player.facing = "left";
      player.stretchX = 0.95;
      player.stretchY = 1.05;
    } else if (goRight) {
      player.vx += ACCELERATION;
      if (player.vx > RUN_SPEED) player.vx = RUN_SPEED;
      player.facing = "right";
      player.stretchX = 0.95;
      player.stretchY = 1.05;
    } else {
      // Natural Deceleration / Friction
      if (player.vx > 0) {
        player.vx -= DECELERATION;
        if (player.vx < 0) player.vx = 0;
      } else if (player.vx < 0) {
        player.vx += DECELERATION;
        if (player.vx > 0) player.vx = 0;
      }
      player.stretchX = 1.0;
      player.stretchY = 1.0;
    }

    // 2. JUMPING CONTROL (Mario high-jump mechanics & high double jump)
    if (player.isGrounded) {
      player.jumpCount = 0;
    }

    if (wantsJump) {
      if (player.isGrounded && jumpJustPressed) {
        player.vy = JUMP_FORCE;
        player.isGrounded = false;
        player.jumpTicks = 15; // allow extra hold boost
        player.jumpCount = 1;
        sound.playJump();
        player.stretchX = 0.8;
        player.stretchY = 1.3;

        if (player.isOnWater) {
          player.hasJumpedOnWater = true;
          player.isOnWater = false;
        }
      } else if (!player.isGrounded && jumpJustPressed && player.jumpCount === 1) {
        // High double jump! "２回連続飛んだら２回目のジャンプは高くして"
        player.vy = JUMP_FORCE * 1.35; // boost jump height (typically JUMP_FORCE = -8.5 * 1.35 = -11.47)
        player.jumpTicks = 15; // allow extra hold boost
        player.isGrounded = false;
        player.jumpCount = 2; // prevent further mid-air jumps
        sound.playJump();

        player.stretchX = 0.7; // extra squish/stretch for super jump
        player.stretchY = 1.45;

        // Spawn beautiful ring-cloud double jump effect
        for (let i = 0; i < 5; i++) {
          effectsRef.current.push({
            id: Math.random().toString(),
            type: "smoke",
            x: player.x + (i - 2) * 8 + player.width / 2 - 4,
            y: player.y + player.height - 2,
            life: 14 + i,
            maxLife: 20,
            color: "rgba(255, 235, 100, 0.85)" // bright gold spark cloud
          });
        }
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "score",
          x: player.x + player.width / 2 - 20,
          y: player.y - 12,
          text: "DOUBLE JUMP!! 🐸⚡",
          color: "#facc15",
          life: 30,
          maxLife: 30
        });
      } else if (player.jumpTicks > 0) {
        // Holding down the jump button carries upwards momentum slightly longer
        player.vy -= 0.16;
        player.jumpTicks--;
      }
    } else {
      player.jumpTicks = 0;
    }

    // Apply gravity
    player.vy += GRAVITY;
    if (player.vy > FALL_LIMIT) player.vy = FALL_LIMIT;

    // Save old position for resolution
    const oldX = player.x;
    const oldY = player.y;

    // Move player in stages to solve collision cleanly
    player.x += player.vx;
    resolveHorizontalCollisions(oldX);

    player.y += player.vy;
    resolveVerticalCollisions(oldY);

    // Keep within world bounds
    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x > level.width - player.width) {
      player.x = level.width - player.width;
      player.vx = 0;
    }

    // Update dimensions dynamically based on power up size
    if (player.size === PlayerSize.NORMAL) {
      player.width = 30;
      player.height = 30;
    } else {
      player.width = 32; // Slightly wider but fits in tunnels
      player.height = 30; // Matches Normal height physically so the player can fit under all blocks!
    }

    // 3. HORIZONTAL STREAMING / CAMERA
    // Camera centers around frog, but has left-locking boundaries
    const targetCamX = player.x - 300;
    cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
    if (cameraXRef.current < 0) cameraXRef.current = 0;
    if (cameraXRef.current > level.width - 800) cameraXRef.current = level.width - 800;

    // Ensure camera doesn't scroll backwards beyond player boundary (optional retro style)
    // We let the player wander backwards slightly, but camera limits itself.
    
    // 4. GOAL POLE CHECK (Lotus Flower)
    // If player touches goal line triggers stage victory!
    if (levelIndex !== 4 && player.x >= level.goalX) {
      sound.playClear();
      setGameState(GameState.CLEAR);
      return;
    }

    // 5. PROJECTILES PHYSICS (Water Bubbles)
    projectilesRef.current = projectilesRef.current.filter(p => {
      p.x += p.vx;
      p.vy += 0.3; // low gravity for bubbles
      p.y += p.vy;

      // Handle ground bounces
      let popped = false;
      blocksRef.current.forEach(b => {
        if (b.type !== BlockType.WATER && checkAABB(p, b)) {
          // Bouncy resolution
          p.y = b.y - p.height;
          p.vy = -3.5; // bounce up
          p.bounceCount++;
          if (p.bounceCount > 4) popped = true;
          sound.playBump();
        }
      });

      // Kill if out of screen
      if (p.x < cameraXRef.current - 100 || p.x > cameraXRef.current + 900 || p.y > CANVAS_HEIGHT) {
        popped = true;
      }

      if (popped) {
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "bubble_pop",
          x: p.x + p.width/2,
          y: p.y + p.height/2,
          life: 8,
          maxLife: 8,
          color: "rgba(120, 240, 255, 0.8)"
        });
        return false;
      }
      return true;
    });

    // 6. POWER UP ITEMS UPDATE & PHYSICS
    itemsRef.current = itemsRef.current.filter(item => {
      if (item.isCollected) return false;

      // Apply low gravity and drift
      if (!item.isGrounded) {
        item.vy += 0.25;
        if (item.vy > 6) item.vy = 6;
      }
      
      item.x += item.vx;
      
      // Horizontal brick collide
      blocksRef.current.forEach(b => {
        if (b.type !== BlockType.WATER && checkAABB(item, b)) {
          if (item.vx > 0) {
            item.x = b.x - item.width;
            item.vx = -item.vx; // bounce reverse
          } else if (item.vx < 0) {
            item.x = b.x + b.width;
            item.vx = -item.vx;
          }
        }
      });

      item.y += item.vy;
      
      // Vertical brick collide
      item.isGrounded = false;
      blocksRef.current.forEach(b => {
        if (b.type !== BlockType.WATER && checkAABB(item, b)) {
          if (item.vy > 0) {
            item.y = b.y - item.height;
            item.vy = 0;
            item.isGrounded = true;
          }
        }
      });

      // Collect item check
      if (checkAABB(player, item)) {
        item.isCollected = true;
        sound.playPowerUp();
        
        let scoreReward = 1000;
        let textReward = "+1000";

        if (item.type === ItemType.GOLDEN_BUG) {
          player.size = player.size === PlayerSize.NORMAL ? PlayerSize.SUPER : player.size;
          textReward = "SUPER FROG!";
        } else if (item.type === ItemType.BUBBLE_POWER) {
          player.size = PlayerSize.FIRE;
          textReward = "BUBBLE POWER!";
        } else if (item.type === ItemType.ONE_UP) {
          player.lives++;
          textReward = "1-UP!";
        }

        player.score += scoreReward;
        onUpdateHUD(player.score, player.bugs, player.lives, player.size);

        // Visual score text
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "score",
          x: item.x,
          y: item.y - 10,
          text: textReward,
          color: "#ffd700",
          life: 40,
          maxLife: 40
        });

        // Burst magic dust
        for (let i = 0; i < 8; i++) {
          effectsRef.current.push({
            id: Math.random().toString(),
            type: "smoke",
            x: item.x + Math.random() * item.width,
            y: item.y + Math.random() * item.height,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            life: 15,
            maxLife: 15,
            color: "rgba(255, 230, 100, 0.8)"
          });
        }
        return false;
      }

      // Despawn if fall off screen
      if (item.y > CANVAS_HEIGHT) return false;
      return true;
    });

    // 7. ENEMIES PHYSICS (Wriggling Snakes!)
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      // Manage dead timers
      if (enemy.isDead) {
        enemy.deadTimer--;
        if (enemy.deathType === "flipped") {
          // drop out visually
          enemy.y += enemy.vy;
          enemy.vy += 0.4;
        }
        return enemy.deadTimer > 0;
      }

      // Anim timer tick
      enemy.animTimer++;
      if (enemy.animTimer > 10) {
        enemy.animFrame = (enemy.animFrame + 1) % 4; // crawl frame
        enemy.animTimer = 0;
      }

      // General horizontal walk
      enemy.x += enemy.vx;

      // Handle edge cliffs for RED snakes (red snakes don't fall off blocks)
      if (enemy.type === EnemyType.SNAKE_RED) {
        // Look ahead
        const checkAheadX = enemy.vx > 0 ? enemy.x + enemy.width + 5 : enemy.x - 5;
        const checkAheadY = enemy.y + enemy.height + 5;
        let groundOnAhead = false;
        blocksRef.current.forEach(b => {
          if (b.type !== BlockType.WATER && 
              checkAheadX >= b.x && checkAheadX <= b.x + b.width && 
              checkAheadY >= b.y && checkAheadY <= b.y + b.height) {
            groundOnAhead = true;
          }
        });
        if (!groundOnAhead) {
          enemy.vx = -enemy.vx; // turn back
        }
      }

      // Walk collide into solid blocks
      blocksRef.current.forEach(b => {
        if (b.type !== BlockType.WATER && checkAABB(enemy, b)) {
          if (enemy.vx > 0) {
            enemy.x = b.x - enemy.width;
            enemy.vx = -enemy.vx;
          } else if (enemy.vx < 0) {
            enemy.x = b.x + b.width;
            enemy.vx = -enemy.vx;
          }
        }
      });

      // Winged jumpers
      if (enemy.type === EnemyType.SNAKE_WINGED) {
        enemy.vy += 0.22; // low gravity for winged
        if (enemy.vy > 4) enemy.vy = 4;
        
        enemy.y += enemy.vy;

        // Land on blocks
        blocksRef.current.forEach(b => {
          if (b.type !== BlockType.WATER && checkAABB(enemy, b)) {
            if (enemy.vy > 0) {
              enemy.y = b.y - enemy.height;
              enemy.vy = -5.8; // jump right back up! High hop
              sound.playBump();
            }
          }
        });
      }

      // Check bullet/projectile collision
      projectilesRef.current.forEach(p => {
        if (checkAABB(p, enemy)) {
          // Hurt snake!
          killEnemy(enemy, "flipped");
          // Pop bubble
          p.bounceCount = 99; // trigger pop
        }
      });

      // Check player stomping on snake
      if (!player.isGrounded && player.vy > 0.1 && checkAABB(player, enemy)) {
        // Vertical landing check - forgiving threshold
        const footing = player.y + player.height - player.vy;
        const isAbove = footing <= enemy.y + enemy.height * 0.75;
        if (isAbove) {
          // Stomp solid!
          sound.playStomp();
          killEnemy(enemy, "squished");
          
          player.vy = JUMP_FORCE * 0.85; // hop up high!
          player.isGrounded = false;
          player.jumpTicks = 5; // tiny glide
          
          player.score += 500;
          onUpdateHUD(player.score, player.bugs, player.lives, player.size);
          
          effectsRef.current.push({
            id: Math.random().toString(),
            type: "score",
            x: enemy.x,
            y: enemy.y - 12,
            text: "+500",
            color: "#60a5fa",
            life: 30,
            maxLife: 30
          });
        }
      } else if (checkAABB(player, enemy) && player.invulnerableFrames <= 0) {
        // Lateral collide, player gets hit!
        shrinkPlayer();
      }

      return true;
    });

    // 8. TONGUE EXTENSION PHYSICS (FROG MELEE ATTACK)
    if (player.tongueState === "extending") {
      player.tongueLength += 12; // extend speed
      if (player.tongueLength >= player.maxTongueLength) {
        player.tongueState = "retracting";
      }
    } else if (player.tongueState === "retracting") {
      player.tongueLength -= 12;
      if (player.tongueLength <= 0) {
        player.tongueLength = 0;
        player.tongueState = "idle";
        player.tongueCooldown = 15; // sweet brief cooldown
      }
    }

    if (player.tongueState !== "idle") {
      // Check snake snagged by the entire length of the tongue (extending or retracting)
      const tongueStartX = player.x + player.width / 2;
      const tongueEndX = player.facing === "right" 
        ? player.x + player.width + player.tongueLength 
        : player.x - player.tongueLength;
      
      const minTongueX = Math.min(tongueStartX, tongueEndX);
      const maxTongueX = Math.max(tongueStartX, tongueEndX);
      // Tongue vertical center line
      const tongueCenterY = player.y + player.height / 2;

      enemiesRef.current.forEach(enemy => {
        if (!enemy.isDead) {
          const horizontalOverlap = (minTongueX <= enemy.x + enemy.width) && (maxTongueX >= enemy.x);
          // Very generous vertical overlapping envelope (gives beautiful, easy, fair-feeling sweeps)
          const verticalOverlap = (tongueCenterY >= enemy.y - 12) && (tongueCenterY <= enemy.y + enemy.height + 12);

          if (horizontalOverlap && verticalOverlap) {
            // Snagged!
            killEnemy(enemy, "flipped"); // tongue-flip
            player.tongueState = "retracting";
            
            player.score += 300;
            onUpdateHUD(player.score, player.bugs, player.lives, player.size);

            effectsRef.current.push({
              id: Math.random().toString(),
              type: "score",
              x: enemy.x,
              y: enemy.y - 12,
              text: "+300 👅",
              color: "#f472b6",
              life: 30,
              maxLife: 30
            });

            // Burst tongue sparkles
            for (let i = 0; i < 4; i++) {
              effectsRef.current.push({
                id: Math.random().toString(),
                type: "smoke",
                x: enemy.x + enemy.width/2,
                y: enemy.y + enemy.height/2,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 12,
                maxLife: 12,
                color: "#f472b6"
              });
            }
          }
        }
      });
    }

    // 9. ANIMATIONS / STATIC BLOCKS BOUNCE
    blocksRef.current.forEach(b => {
      if (b.bounceSpeed !== 0 || b.bounceY !== 0) {
        b.bounceY += b.bounceSpeed;
        b.bounceSpeed += 0.8; // reverse fall
        if (b.bounceY > 0) {
          b.bounceY = 0;
          b.bounceSpeed = 0;
        }
      }
    });

    // 10. EFFECTS/PARTICLES TICK
    effectsRef.current = effectsRef.current.filter(fx => {
      fx.life--;
      if (fx.vx !== undefined) fx.x += fx.vx;
      if (fx.vy !== undefined) fx.y += fx.vy;
      return fx.life > 0;
    });
  };

  const killEnemy = (enemy: Enemy, type: "squished" | "flipped") => {
    if (enemy.type === EnemyType.SNAKE_BOSS) {
      if (enemy.health === undefined) {
        enemy.health = 5;
        enemy.maxHealth = 5;
      }
      
      // Reduce HP
      enemy.health--;
      
      // Play bump / hit sound
      sound.playBump();
      
      // Add floating text
      effectsRef.current.push({
        id: Math.random().toString(),
        type: "score",
        x: enemy.x + enemy.width / 4,
        y: enemy.y,
        text: `BOSS HP: ${enemy.health}/5 💥`,
        color: "#fbbf24",
        life: 40,
        maxLife: 40
      });

      // Explosion sparks
      for (let i = 0; i < 8; i++) {
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "smoke",
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 20,
          maxLife: 20,
          color: "#f59e0b"
        });
      }

      if (enemy.health > 0) {
        // Fast reaction movement
        enemy.vx = (enemy.facing === "right" ? -1.8 : 1.8) * 1.5;
        enemy.facing = enemy.vx > 0 ? "right" : "left";
        return; // Boss is still alive!
      }
    }

    // Standard death of standard enemies OR Final Boss blow
    enemy.isDead = true;
    enemy.deathType = type;
    enemy.deadTimer = type === "squished" ? 35 : 60;
    if (type === "flipped") {
      enemy.vy = -6; // upward spin fling
      enemy.vx = (Math.random() - 0.5) * 4; // scattered drift
    } else {
      enemy.vy = 0;
      enemy.vx = 0;
    }

    if (enemy.type === EnemyType.SNAKE_BOSS) {
      // BOSS DEFEAT GRAND EXPLOSION
      sound.playPowerUp();
      playerRef.current.score += 5000;
      onUpdateHUD(playerRef.current.score, playerRef.current.bugs, playerRef.current.lives, playerRef.current.size);

      effectsRef.current.push({
        id: Math.random().toString(),
        type: "score",
        x: enemy.x,
        y: enemy.y - 12,
        text: "+5000 VICTORY ROYAL! 👑",
        color: "#10b981",
        life: 80,
        maxLife: 80
      });

      for (let i = 0; i < 25; i++) {
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "smoke",
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 45,
          maxLife: 45,
          color: `hsl(${Math.random() * 360}, 95%, 60%)`
        });
      }

      // Automatically trigger Level Clear victory screen!
      setTimeout(() => {
        sound.playClear();
        setGameState(GameState.CLEAR);
      }, 2000);
    } else {
      sound.playStomp();
    }
  };

  // BLOCK COLLISION RESOLUTIONS
  const resolveHorizontalCollisions = (oldX: number) => {
    const player = playerRef.current;
    blocksRef.current.forEach(b => {
      if (b.type === BlockType.WATER) return; // Swim/slip, no rigid wall

      if (checkAABB(player, b)) {
        if (b.type === BlockType.SPIKES) {
          if (player.invulnerableFrames <= 0) {
            player.lives--;
            player.size = PlayerSize.NORMAL;
            onUpdateHUD(player.score, player.bugs, player.lives, player.size);
            sound.playHurt();
            triggerDeath();
          }
          return;
        }

        if (player.vx > 0) {
          player.x = b.x - player.width;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = b.x + b.width;
          player.vx = 0;
        }
      }
    });
  };

  const resolveVerticalCollisions = (oldY: number) => {
    const player = playerRef.current;
    player.isGrounded = false;
    player.isOnWater = false;

    blocksRef.current.forEach(b => {
      if (checkAABB(player, b)) {
        // Special: Spikes Hazard
        if (b.type === BlockType.SPIKES) {
          if (player.invulnerableFrames <= 0) {
            player.lives--;
            player.size = PlayerSize.NORMAL; // 一回死んだらカエルの状態を初期状態に戻す
            onUpdateHUD(player.score, player.bugs, player.lives, player.size);
            sound.playHurt();
            triggerDeath();
          }
          return;
        }

        // Special: Water Hazard
        if (b.type === BlockType.WATER) {
          if (player.hasJumpedOnWater) {
            // Melt/Drown!
            player.lives--;
            player.size = PlayerSize.NORMAL; // 一回死んだらカエルの状態を初期状態に戻す
            onUpdateHUD(player.score, player.bugs, player.lives, player.size);
            sound.playHurt();
            triggerDeath();
            return;
          }

          if (player.vy >= 0) {
            // Standing on top of water
            player.y = b.y - player.height;
            player.vy = 0;
            player.isGrounded = true;
            player.jumpTicks = 0;
            player.isOnWater = true;
          }
          return;
        }

        if (player.vy > 0) {
          // Standing on top of block
          player.y = b.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.jumpTicks = 0;
          player.hasJumpedOnWater = false;
        } else if (player.vy < 0) {
          // Hit head underneath block (Mario smash brick!)
          player.y = b.y + b.height;
          player.vy = 0;
          hitBlock(b);
        }
      }
    });
  };

  // Hit block from bottom
  const hitBlock = (block: Block) => {
    const player = playerRef.current;
    if (block.type === BlockType.GROUND || block.type === BlockType.SOLID || block.type === BlockType.USED || block.type === BlockType.TRUNK || block.type === BlockType.TRUNK_TOP) {
      sound.playBump();
      return;
    }

    // Question block or brick hit animation
    block.bounceY = -12;
    block.bounceSpeed = -4;

    if (block.type === BlockType.QUESTION) {
      block.type = BlockType.USED;
      sound.playBugCollect();

      // Spawn reward item
      if (block.itemInside === "fly") {
        player.bugs++;
        player.score += 200;
        onUpdateHUD(player.score, player.bugs, player.lives, player.size);

        // Fly sprite float up
        effectsRef.current.push({
          id: Math.random().toString(),
          type: "score",
          x: block.x + 10,
          y: block.y - 15,
          text: "🦟 +200",
          color: "#4ade80",
          life: 25,
          maxLife: 25
        });
      } else {
        // Power up bug emerges
        let iType = ItemType.GOLDEN_BUG;
        if (block.itemInside === "bubble_power") iType = ItemType.BUBBLE_POWER;
        if (block.itemInside === "one_up") iType = ItemType.ONE_UP;

        itemsRef.current.push({
          id: Math.random().toString(),
          type: iType,
          x: block.x + 2,
          y: block.y - BLOCK_SIZE,
          vx: Math.random() > 0.5 ? 1.5 : -1.5,
          vy: -3.5, // jump out of block
          width: 32,
          height: 32,
          isGrounded: false,
          isCollected: false
        });
      }
    } else if (block.type === BlockType.BRICK) {
      if (player.size !== PlayerSize.NORMAL) {
        // Destroy brick!
        sound.playBreak();
        blocksRef.current = blocksRef.current.filter(b => b.id !== block.id);
        screenShakeRef.current = 6;

        // Spread brick pieces
        for (let i = 0; i < 4; i++) {
          effectsRef.current.push({
            id: Math.random().toString(),
            type: "block_shard",
            x: block.x + 16,
            y: block.y + 16,
            vx: (i % 2 === 0 ? -2 : 2) * (0.8 + Math.random() * 0.4),
            vy: -4 - Math.random() * 3,
            life: 20,
            maxLife: 20
          });
        }
      } else {
        sound.playBump();
      }
    }
  };

  // AABB collision detection helper
  const checkAABB = (rect1: { x: number; y: number; width: number; height: number }, rect2: { x: number; y: number; width: number; height: number }) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Rendering graphics on HTML5 Canvas
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !level) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply Screen Shake
    ctx.save();
    if (screenShakeRef.current > 0) {
      const shakeAmt = screenShakeRef.current;
      const dx = (Math.random() - 0.5) * shakeAmt;
      const dy = (Math.random() - 0.5) * shakeAmt;
      ctx.translate(dx, dy);
    }

    // Screen dimension constants
    const w = canvas.width;
    const h = canvas.height;
    const camX = cameraXRef.current;

    // 1. DRAW BACKGROUND PARALLAX
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "#87CEEB"); // Light sky blue
    skyGrad.addColorStop(0.4, "#5C94FC"); // Beautiful Vibrant Sky Blue
    skyGrad.addColorStop(1, "#A0C3FF"); // Rich bright bottom blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw cartoon white clouds from Vibrant theme
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 350) - (camX * 0.1) + 1200) % 1200 - 200;
      const cy = 40 + (i % 3) * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 8, 22, 0, Math.PI * 2);
      ctx.arc(cx + 34, cy, 18, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy + 8, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw parallax mounds (Hills) from Vibrant theme
    for (let i = 0; i < 12; i++) {
      const px = ((i * 240) - (camX * 0.25) + 1600) % 1600 - 200;
      ctx.fillStyle = i % 2 === 0 ? "#48D14C" : "#38B03D"; // Vibrant cartoon greens
      ctx.beginPath();
      ctx.arc(px + 100, h - 32, 90, Math.PI, 0);
      ctx.fill();
      // Draw a subtle dark outline for hills so they pop!
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Secondary foreground trees / bush arches
    ctx.fillStyle = "rgba(113, 188, 46, 0.4)";
    for (let i = 0; i < 10; i++) {
      const px = ((i * 380) - (camX * 0.45) + 1600) % 1600 - 150;
      ctx.beginPath();
      ctx.ellipse(px + 40, h - 32, 45, 60, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. DRAW BLOCKS
    blocksRef.current.forEach(b => {
      // Cull out of bounds block
      if (b.x + b.width < camX - 100 || b.x > camX + 900) return;

      const drawX = b.x - camX;
      const drawY = b.y + b.bounceY;

      ctx.save();
      ctx.translate(drawX, drawY);

      if (b.type === BlockType.GROUND) {
        // Vibrant Palette Ground
        ctx.fillStyle = "#71BC2E"; // Vibrant Light Grass Green top
        ctx.fillRect(0, 0, b.width, 12);
        ctx.fillStyle = "#944D20"; // Vibrant Reddish Ground Brown mud/dirt
        ctx.fillRect(0, 12, b.width, b.height - 12);

        // Ground texture roots / shadow divider
        ctx.fillStyle = "#7A3F1A";
        for (let i = 0; i < b.width; i += 8) {
          ctx.fillRect(i, 12, 4, 6);
        }

        // Thick black outline
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);
      } else if (b.type === BlockType.BRICK) {
        // Vibrant Brick
        ctx.fillStyle = "#944D20"; // Vibrant brick base
        ctx.fillRect(0, 0, b.width, b.height);
        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, b.width, b.height);

        // Brick lines
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, b.height/2, b.width, 3);
        ctx.fillRect(b.width/2, 0, 3, b.height/2);
        ctx.fillRect(b.width/4, b.height/2, 3, b.height/2);
        ctx.fillRect(3 * b.width/4, b.height/2, 3, b.height/2);

        // Brick highlights for shiny retro feel
        ctx.fillStyle = "#FF7C33";
        ctx.fillRect(2, 2, b.width/2 - 4, b.height/2 - 4);
        ctx.fillRect(b.width/2 + 2, b.height/2 + 2, b.width/2 - 4, b.height/2 - 4);
      } else if (b.type === BlockType.QUESTION) {
        // Gold/Orange shiny Box
        ctx.fillStyle = "#D86800"; // Rich orange
        ctx.fillRect(0, 0, b.width, b.height);

        // Outer borders & inner shadow effect
        ctx.fillStyle = "#B05000"; // Dark shading
        ctx.fillRect(b.width - 6, 0, 6, b.height);
        ctx.fillRect(0, b.height - 6, b.width, 6);

        // Bright gold top-left highlights
        ctx.fillStyle = "#FFB240";
        ctx.fillRect(0, 0, b.width - 6, 4);
        ctx.fillRect(0, 0, 4, b.height - 6);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);

        // ? Text graphic centering with deep black shadow outline
        ctx.fillStyle = "#000";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", b.width / 2 + 1.5, b.height / 2 + 1.5);

        ctx.fillStyle = "#FFF";
        ctx.fillText("?", b.width / 2, b.height / 2);

        // Four small black corner rivets
        ctx.fillStyle = "#000000";
        ctx.fillRect(4, 4, 3, 3);
        ctx.fillRect(b.width - 7, 4, 3, 3);
        ctx.fillRect(4, b.height - 7, 3, 3);
        ctx.fillRect(b.width - 7, b.height - 7, 3, 3);
      } else if (b.type === BlockType.USED) {
        // Dead block
        ctx.fillStyle = "#8D99AE"; // Lighter stone gray
        ctx.fillRect(0, 0, b.width, b.height);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);

        // Inner shadow
        ctx.fillStyle = "#4A5568";
        ctx.fillRect(b.width - 6, 0, 6, b.height);
        ctx.fillRect(0, b.height - 6, b.width, 6);

        // Four small grey corner rivets
        ctx.fillStyle = "#2D3748";
        ctx.fillRect(5, 5, 4, 4);
        ctx.fillRect(b.width - 9, 5, 4, 4);
        ctx.fillRect(5, b.height - 9, 4, 4);
        ctx.fillRect(b.width - 9, b.height - 9, 4, 4);
      } else if (b.type === BlockType.SOLID) {
        // Brown/Grey dark stone block block
        ctx.fillStyle = "#5E412F"; // Soft solid brown
        ctx.fillRect(0, 0, b.width, b.height);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);

        // Inner frame line
        ctx.strokeStyle = "#2D1D13";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(6, 6, b.width - 12, b.height - 12);
      } else if (b.type === BlockType.TRUNK_TOP) {
        // Tree trunk/Log style pipe from Vibrant Palette (#72481A and #8B5E3C)
        ctx.fillStyle = "#72481A"; // Warp pipe log body
        ctx.fillRect(0, 0, b.width, b.height);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);

        // Rim top
        ctx.fillStyle = "#8B5E3C";
        ctx.fillRect(4, 4, b.width - 8, b.height - 8);

        // Inner rings
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(b.width/2, b.height/2, b.width/3, 0, Math.PI*2);
        ctx.stroke();
      } else if (b.type === BlockType.TRUNK) {
        // Trunk body columns
        ctx.fillStyle = "#72481A";
        ctx.fillRect(0, 0, b.width, b.height);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, 0, b.width, b.height);

        // Texture marks
        ctx.fillStyle = "#000000";
        ctx.fillRect(10, 0, 3, b.height);
        ctx.fillRect(b.width - 13, 0, 3, b.height);

        ctx.fillStyle = "#8B5E3C"; // Inner bark highlights
        ctx.fillRect(13, 0, b.width - 26, b.height);
      } else if (b.type === BlockType.SPIKES) {
        // Bramble green thorns base
        ctx.fillStyle = "#944D20"; // Mud/branch base
        ctx.fillRect(0, b.height - 8, b.width, 8);

        // Spikes with thick outlines
        ctx.fillStyle = "#EF4444"; // Vivid blood red spike body
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const sx = (i * b.width) / 3;
          ctx.beginPath();
          ctx.moveTo(sx, b.height);
          ctx.lineTo(sx + b.width / 6, 4); // Tip
          ctx.lineTo(sx + b.width / 3, b.height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      } else if (b.type === BlockType.WATER) {
        // Dynamic vibrant blue water!
        const wave = Math.sin((Date.now() / 220) + b.x * 0.05) * 6;
        ctx.fillStyle = "#2563EB"; // Vibrant Royal blue water
        ctx.fillRect(0, wave, b.width, b.height - wave);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(0, wave, b.width, b.height - wave);

        // Shiny wave accents
        ctx.fillStyle = "#60A5FA";
        ctx.fillRect(0, wave, b.width, 4);
      }

      ctx.restore();
    });

    // 3. DRAW POWER UP ITEMS
    itemsRef.current.forEach(item => {
      const drawX = item.x - camX;
      const drawY = item.y;

      ctx.save();
      ctx.translate(drawX, drawY);

      if (item.type === ItemType.GOLDEN_BUG) {
        // Golden sparkling beetle (Mushroom power-up)
        ctx.fillStyle = "#eab308";
        // Wings
        ctx.beginPath();
        ctx.ellipse(16, 16, 12, 10, Math.sin(Date.now() / 100) * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Beetle cap
        ctx.fillStyle = "#a16207";
        ctx.beginPath();
        ctx.arc(16, 14, 8, 0, Math.PI, true);
        ctx.fill();
        // Shiny glow
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(12, 11, 2, 0, Math.PI*2);
        ctx.fill();
      } else if (item.type === ItemType.BUBBLE_POWER) {
        // Translucent magic bubble moth (Fire Flower)
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(186, 230, 253, 0.5)";
        ctx.beginPath();
        ctx.arc(16, 16, 11, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        // Core bug
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(16, 16, 5, 0, Math.PI*2);
        ctx.fill();
      } else if (item.type === ItemType.ONE_UP) {
        // Green 1-Up Cicada
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.ellipse(16, 16, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.arc(16, 14, 7, 0, Math.PI, true);
        ctx.fill();
      }

      ctx.restore();
    });

    // 4. DRAW ENEMIES (Wriggling crawling Green, Red, Winged Snakes!)
    enemiesRef.current.forEach(enemy => {
      const drawX = enemy.x - camX;
      const drawY = enemy.y;

      ctx.save();
      ctx.translate(drawX, drawY);

      // Squished Stomped state
      if (enemy.isDead && enemy.deathType === "squished") {
        let deadColor = enemy.type === EnemyType.SNAKE_RED ? "#ef4444" : "#4ade80";
        if (enemy.type === EnemyType.SNAKE_BOSS) deadColor = "#8b5cf6";
        ctx.fillStyle = deadColor;
        // Flattened puddle
        ctx.beginPath();
        ctx.ellipse(enemy.width/2, enemy.height - 4, enemy.width * 0.8, 4, 0, 0, Math.PI*2);
        ctx.fill();
        // Squiggles
        ctx.fillStyle = "#1e293b";
        ctx.fillText("x_x", enemy.width/2 - 10, enemy.height - 10);
        ctx.restore();
        return;
      }

      // Live Snake Render!
      let snakeColor = "#22c55e"; // Green snake
      let eyeColor = "#fca5a5";
      if (enemy.type === EnemyType.SNAKE_RED) {
        snakeColor = "#ef4444"; // Red swamp snake
        eyeColor = "#fef08a";
      } else if (enemy.type === EnemyType.SNAKE_WINGED) {
        snakeColor = "#ec4899"; // Pink winged jumper
      } else if (enemy.type === EnemyType.SNAKE_BOSS) {
        snakeColor = "#8b5cf6"; // Royal purple boss snake
        eyeColor = "#fcd34d"; // Gold shiny eyes
      }

      // Draw Crawling Sinus Body
      ctx.lineWidth = enemy.type === EnemyType.SNAKE_BOSS ? 18 : 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = snakeColor;

      ctx.beginPath();
      const timeScale = Date.now() / 150;
      const centerH = enemy.height / 2;
      
      for (let i = 0; i <= enemy.width; i += 4) {
        const sx = enemy.facing === "right" ? i : enemy.width - i;
        const waveAmp = enemy.type === EnemyType.SNAKE_BOSS ? 12 : 6;
        const sy = centerH + Math.sin(timeScale + (sx * (enemy.type === EnemyType.SNAKE_BOSS ? 0.08 : 0.15))) * waveAmp;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();

      // Snake head
      const hx = enemy.facing === "right" 
        ? enemy.width - (enemy.type === EnemyType.SNAKE_BOSS ? 12 : 5) 
        : (enemy.type === EnemyType.SNAKE_BOSS ? 12 : 5);
      const waveAmp = enemy.type === EnemyType.SNAKE_BOSS ? 12 : 6;
      const hy = centerH + Math.sin(timeScale + (hx * (enemy.type === EnemyType.SNAKE_BOSS ? 0.08 : 0.15))) * waveAmp;
      
      ctx.fillStyle = snakeColor;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const headRad = enemy.type === EnemyType.SNAKE_BOSS ? 16 : 8;
      ctx.arc(hx, hy, headRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Enemy eyes
      ctx.fillStyle = eyeColor;
      const ex = enemy.facing === "right" 
        ? hx + (enemy.type === EnemyType.SNAKE_BOSS ? 4 : 2) 
        : hx - (enemy.type === EnemyType.SNAKE_BOSS ? 6 : 4);
      const eyeRad = enemy.type === EnemyType.SNAKE_BOSS ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(ex, hy - (enemy.type === EnemyType.SNAKE_BOSS ? 4 : 2), eyeRad, 0, Math.PI*2);
      ctx.fill();

      // Golden Crown above Boss
      if (enemy.type === EnemyType.SNAKE_BOSS) {
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const cx = hx;
        const cy = hy - 14;
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx - 13, cy - 12);
        ctx.lineTo(cx - 5, cy - 5);
        ctx.lineTo(cx, cy - 15);
        ctx.lineTo(cx + 5, cy - 5);
        ctx.lineTo(cx + 13, cy - 12);
        ctx.lineTo(cx + 10, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // HP bar render
        const hp = enemy.health !== undefined ? enemy.health : 5;
        const maxHp = enemy.maxHealth !== undefined ? enemy.maxHealth : 5;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(enemy.width/2 - 25, -20, 50, 6);
        
        const hpColor = hp > 2 ? "#10b981" : hp === 2 ? "#f59e0b" : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.fillRect(enemy.width/2 - 25, -20, (hp / maxHp) * 50, 6);
        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.width/2 - 25, -20, 50, 6);
      }

      // Snake tongue (flashes red/pink)
      if (Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.strokeStyle = "pink";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const txLen = enemy.type === EnemyType.SNAKE_BOSS ? 14 : 8;
        const txStart = enemy.facing === "right" ? hx + txLen : hx - txLen;
        ctx.moveTo(hx, hy + 2);
        ctx.lineTo(txStart, hy + 3);
        ctx.stroke();
      }

      // Draw wings on winged snakes
      if (enemy.type === EnemyType.SNAKE_WINGED) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.strokeStyle = "#db2777";
        ctx.lineWidth = 1.5;
        
        const wingYOffset = Math.sin(Date.now() / 60) * 8; // wing flap
        ctx.save();
        ctx.translate(enemy.width/2, hy - 4);
        
        ctx.beginPath();
        ctx.ellipse(-4, wingYOffset, 6, 12, Math.PI / 4, 0, Math.PI*2);
        ctx.ellipse(4, wingYOffset, 6, 12, -Math.PI / 4, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
      }

      ctx.restore();
    });

    // 5. DRAW PROJECTILES (Bubbles)
    projectilesRef.current.forEach(p => {
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = "rgba(224, 242, 254, 0.6)";
      ctx.beginPath();
      ctx.arc(p.x - camX, p.y, p.width/2, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      
      // Shiny reflection dot
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc((p.x - camX) - p.width/4, p.y - p.height/4, 2, 0, Math.PI*2);
      ctx.fill();
    });

    // 6. DRAW THE GOAL LOTUS FLOWER (Flag Structure)
    if (levelIndex !== 4) {
      const drawGoalX = level.goalX - camX;
      
      // Flag pole
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(drawGoalX, CANVAS_HEIGHT - BLOCK_SIZE * 2);
      ctx.lineTo(drawGoalX, 100);
      ctx.stroke();

      // Giant Glowing Lotus Flower on top
      ctx.save();
      ctx.translate(drawGoalX, 100);
      const pulseLotus = 1 + Math.sin(Date.now() / 150) * 0.08;
      ctx.scale(pulseLotus, pulseLotus);
      
      // Petals pink
      ctx.fillStyle = "#ec4899";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 8, (i * Math.PI) / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Inner yellow pistil
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    // 7. DRAW THE CUTE PLAYER FROG!
    const player = playerRef.current;
    
    // Blinking / invulnerable flashing
    let drawFrog = true;
    if (player.invulnerableFrames > 0 && Math.floor(player.invulnerableFrames / 4) % 2 === 0) {
      drawFrog = false;
    }

    if (drawFrog) {
      const pX = player.x - camX;
      const pY = player.y;

      ctx.save();
      // Decouple drawing sizes from physical hitbox width/height
      const visualWidth = player.size === PlayerSize.NORMAL ? 30 : 38;
      const visualHeight = player.size === PlayerSize.NORMAL ? 30 : 42;

      // Center pivot at base of feet for jumping-stretch
      ctx.translate(pX + player.width/2, pY + player.height);
      ctx.scale(player.stretchX, player.stretchY);

      // Colors based on size / power
      let frogSkin = "#22c55e"; // Normal green frog
      let bellySkin = "#bbf7d0";
      let eyeColor = "#ffffff";

      if (player.size === PlayerSize.SUPER) {
        frogSkin = "#3b82f6"; // Super blue poison dart frog
        bellySkin = "#93c5fd";
      } else if (player.size === PlayerSize.FIRE) {
        frogSkin = "#ef4444"; // Fire red frog
        bellySkin = "#fca5a5";
      }

      // Draw Back Foot/Legs (crunched/jumping)
      ctx.fillStyle = frogSkin;
      ctx.strokeStyle = "#14532d";
      ctx.lineWidth = 2;
      
      const isJumping = !player.isGrounded;
      if (isJumping) {
        // Legs standard dangling
        ctx.fillRect(-visualWidth/2 - 2, -10, 6, 12);
        ctx.fillRect(visualWidth/2 - 4, -10, 6, 12);
      } else {
        // Crouched ready to spring
        ctx.beginPath();
        ctx.arc(-visualWidth/2, -6, 8, 0, Math.PI*2);
        ctx.arc(visualWidth/2, -6, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw Main Round Body
      ctx.fillStyle = frogSkin;
      ctx.beginPath();
      ctx.arc(0, -visualHeight/2, visualHeight/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Soft white belly circle
      ctx.fillStyle = bellySkin;
      ctx.beginPath();
      ctx.arc(0, -visualHeight/3, visualHeight/3.5, 0, Math.PI * 2);
      ctx.fill();

      // Large Cartoon Bulging Frog Eyes
      ctx.fillStyle = frogSkin;
      
      const eyeL_X = -visualWidth/3;
      const eyeR_X = visualWidth/3;
      const eyeY = -visualHeight * 0.9;
      const eyeRad = player.size === PlayerSize.NORMAL ? 6 : 8;

      ctx.beginPath();
      ctx.arc(eyeL_X, eyeY, eyeRad, 0, Math.PI*2);
      ctx.arc(eyeR_X, eyeY, eyeRad, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Eye Whites
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(eyeL_X, eyeY, eyeRad - 2.5, 0, Math.PI*2);
      ctx.arc(eyeR_X, eyeY, eyeRad - 2.5, 0, Math.PI*2);
      ctx.fill();

      // Pupil Dots looking forward
      ctx.fillStyle = "black";
      const lookOffset = player.facing === "right" ? 1.5 : -1.5;
      ctx.beginPath();
      ctx.arc(eyeL_X + lookOffset, eyeY, 2, 0, Math.PI*2);
      ctx.arc(eyeR_X + lookOffset, eyeY, 2, 0, Math.PI*2);
      ctx.fill();

      // Mouth line & cute rosy cheeks
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (player.tongueState !== "idle") {
        // wide open O mouth!
        ctx.fillStyle = "rgba(100,20,20,1)";
        ctx.arc(0, -visualHeight/2.2, 5, 0, Math.PI*2);
        ctx.fill();
      } else {
        // smiling line
        ctx.arc(0, -visualHeight/2, 6, 0.1, Math.PI - 0.1);
        ctx.stroke();
      }

      // Rosy blush pink cheeks
      ctx.fillStyle = "rgba(244,114,182, 0.5)";
      ctx.beginPath();
      ctx.arc(-8, -visualHeight/2.2, 3, 0, Math.PI*2);
      ctx.arc(8, -visualHeight/2.2, 3, 0, Math.PI*2);
      ctx.fill();

      // Draw Crown / Water bubble headwear if power size
      if (player.size === PlayerSize.FIRE) {
        // Red flaming halo
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(0, eyeY - 6, 4, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();

      // 8. TONGUE EXTENSION RENDER (👅 MELEE WHIP)
      if (player.tongueState !== "idle") {
        const visualWidth = player.size === PlayerSize.NORMAL ? 30 : 38;
        const visualHeight = player.size === PlayerSize.NORMAL ? 30 : 42;
        const tongueStartX = pX + player.width/2;
        const tongueStartY = pY + player.height - visualHeight/2;

        const tongueEndX = player.facing === "right" 
          ? tongueStartX + player.tongueLength 
          : tongueStartX - player.tongueLength;
        const tongueEndY = tongueStartY;

        // Draw thick elastic tongue line
        ctx.strokeStyle = "#f472b6"; // Hot pink sticky tongue
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tongueStartX, tongueStartY);
        
        // Slight sine sag wave to make it look organic
        const midX = (tongueStartX + tongueEndX)/2;
        const midY = (tongueStartY + tongueEndY)/2 + 4;
        ctx.quadraticCurveTo(midX, midY, tongueEndX, tongueEndY);
        ctx.stroke();

        // Tip round sticky knob
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.arc(tongueEndX, tongueEndY, 8, 0, Math.PI*2);
        ctx.fill();

        // Saliva bubble shining sparkle
        ctx.fillStyle = "#ffe4e6";
        ctx.beginPath();
        ctx.arc(tongueEndX - 2, tongueEndY - 2, 2.5, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // 9. DRAW GAME FX PARTICLES
    effectsRef.current.forEach(fx => {
      ctx.save();
      if (fx.type === "score") {
        ctx.fillStyle = fx.color || "#fff";
        ctx.font = "bold 13px 'JetBrains Mono', Courier, monospace";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(fx.text || "", fx.x - camX, fx.y);
        ctx.fillText(fx.text || "", fx.x - camX, fx.y);
      } else if (fx.type === "smoke") {
        const rad = 8 * (fx.life / fx.maxLife);
        ctx.fillStyle = fx.color || "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(fx.x - camX, fx.y, rad, 0, Math.PI*2);
        ctx.fill();
      } else if (fx.type === "block_shard") {
        // Red rotating debris
        const size = 8 * (fx.life / fx.maxLife);
        ctx.fillStyle = "#8a5137";
        ctx.fillRect((fx.x - camX) - size/2, fx.y - size/2, size, size);
      } else if (fx.type === "bubble_pop") {
        // Rapid splash ring
        const rad = 14 * (1 - fx.life / fx.maxLife);
        ctx.strokeStyle = fx.color || "skyblue";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(fx.x - camX, fx.y, rad, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    });

    ctx.restore(); // Restore camera shake translate
  };

  return (
    <div className="relative select-none outline-none flex flex-col justify-center items-center w-full" ref={containerRef}>
      
      {/* Top action bars: instructions / mute toggle */}
      <div className="w-full max-w-[800px] flex justify-between items-center bg-[#4F46E5] text-white px-4 py-3 text-xs font-mono border-4 border-black rounded-t-2xl shadow-[4px_4px_0_#000] mb-[-4px] relative z-15">
        <div className="flex gap-4 font-sans font-bold text-[10px] text-white">
          <span>🎮 操作: WASD / [←][→]移動</span>
          <span>⬆️ [スペース / W]ジャンプ</span>
          <span>👅 [F / X]ベロ/ショット</span>
        </div>
        <button 
          id="sound_toggle_btn"
          onClick={handleMuteToggle}
          className="flex items-center gap-1.5 focus:outline-none bg-[#FF2E93] hover:bg-[#ff5ca6] text-white font-pixel px-2.5 py-1 rounded-xl transition border-2 border-black shadow-[2px_2px_0_#000] cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-yellow-300" />}
          <span>{isMuted ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Main retro gaming canvas frame */}
      <div className="relative border-[6px] border-black bg-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-b-2xl overflow-hidden">
        <canvas 
          id="game_rendering_viewport"
          ref={canvasRef} 
          width={800} 
          height={480} 
          className="block bg-[#5C94FC] max-w-full aspect-[5/3]"
        />

        {/* Level Banner Trigger (When clear / play start) */}
        {gameState === GameState.PLAYING && playerRef.current.score === 0 && (
          <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/60 animate-fade-out pointer-events-none z-10">
            <h2 id="stage_title" className="text-4xl text-yellow-300 font-pixel mb-2 tracking-widest uppercase filter drop-shadow-[3px_3px_0px_#000]">
              STAGE {levelIndex}
            </h2>
            <p className="text-xs font-pixel text-white bg-black/50 px-3 py-1 border-2 border-white rounded-lg">
              {levelIndex === 1 ? "スイレンの沼地" : levelIndex === 2 ? "棘バラの魔境" : "ヘビの魔宮砦"}
            </p>
          </div>
        )}
      </div>

      {/* MOBILE FRIENDLY HUD CONTROL OVERLAYS (Shown for convenience / touch) */}
      <div className="w-full max-w-[800px] grid grid-cols-2 mt-4 px-4 gap-6 select-none md:hidden pt-2">
        {/* Left Direction D-PAD */}
        <div className="flex gap-4 items-center">
          <button 
            id="mobile_dpad_left"
            onTouchStart={() => { isPressingLeft.current = true; }}
            onTouchEnd={() => { isPressingLeft.current = false; }}
            onMouseDown={() => { isPressingLeft.current = true; }}
            onMouseUp={() => { isPressingLeft.current = false; }}
            className="w-16 h-16 flex justify-center items-center bg-white hover:bg-yellow-105 border-4 border-black rounded-2xl active:bg-yellow-200 shadow-[4px_4px_0_rgba(0,0,0,1)] text-black transition-all cursor-pointer"
          >
            <ArrowLeft className="w-8 h-8 pointer-events-none text-black stroke-[3]" />
          </button>
          <button 
            id="mobile_dpad_right"
            onTouchStart={() => { isPressingRight.current = true; }}
            onTouchEnd={() => { isPressingRight.current = false; }}
            onMouseDown={() => { isPressingRight.current = true; }}
            onMouseUp={() => { isPressingRight.current = false; }}
            className="w-16 h-16 flex justify-center items-center bg-white hover:bg-yellow-105 border-4 border-black rounded-2xl active:bg-yellow-200 shadow-[4px_4px_0_rgba(0,0,0,1)] text-black transition-all cursor-pointer"
          >
            <ArrowRight className="w-8 h-8 pointer-events-none text-black stroke-[3]" />
          </button>
        </div>

        {/* Right Action buttons (A: Jump, B: Action) */}
        <div className="flex justify-end gap-4 items-center">
          <button 
            id="mobile_action_tongue"
            onTouchStart={() => { triggerAction(); }}
            onMouseDown={() => { triggerAction(); }}
            className="w-16 h-16 flex flex-col justify-center items-center bg-[#FF2E93] hover:bg-[#ff5ca6] border-4 border-black rounded-full shadow-[4px_4px_0_rgba(0,0,0,1)] text-white text-xs font-pixel cursor-pointer"
          >
            {playerRef.current.size === PlayerSize.FIRE ? <Flame className="w-6 h-6 animate-pulse" /> : <span className="font-black text-white">ベロ</span>}
          </button>
          
          <button 
            id="mobile_action_jump"
            onTouchStart={() => { isPressingJump.current = true; }}
            onTouchEnd={() => { isPressingJump.current = false; }}
            onMouseDown={() => { isPressingJump.current = true; }}
            onMouseUp={() => { isPressingJump.current = false; }}
            className="w-16 h-16 flex justify-center items-center bg-[#71BC2E] hover:bg-[#8ade37] border-4 border-black rounded-full shadow-[4px_4px_0_rgba(0,0,0,1)] text-black cursor-pointer"
          >
            <ArrowUp className="w-8 h-8 pointer-events-none text-black stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
