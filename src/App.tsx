import React, { useState, useEffect } from "react";
import { GameState, PlayerSize } from "./types";
import GameCanvas from "./components/GameCanvas";
import { sound } from "./utils/sound";
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  Skull, 
  Heart, 
  Trees, 
  Crown, 
  Target,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  X,
  Disc,
  Flame
} from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [levelIndex, setLevelIndex] = useState<number>(1);
  const [consecutiveCount, setConsecutiveCount] = useState<number>(0);
  
  // Game statistics linked to Canvas HUD
  const [hudScore, setHudScore] = useState<number>(0);
  const [hudBugs, setHudBugs] = useState<number>(0);
  const [hudLives, setHudLives] = useState<number>(3);
  const [hudSize, setHudSize] = useState<PlayerSize>(PlayerSize.NORMAL);

  // Time remaining (Classic Mario style)
  const [timeLeft, setTimeLeft] = useState<number>(400);

  // Auto-reset consecutive clear counter on Game Over
  useEffect(() => {
    if (gameState === GameState.GAMEOVER) {
      setConsecutiveCount(0);
    }
  }, [gameState]);

  // Countdown timer when playing
  useEffect(() => {
    let timerId: any;
    if (gameState === GameState.PLAYING) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time Out - Die
            setHudLives(l => {
              if (l <= 1) {
                setGameState(GameState.GAMEOVER);
                sound.playGameOver();
                return 0;
              } else {
                // Trigger reload in canvas (handled via life change / reset)
                sound.playHurt();
                return l - 1;
              }
            });
            return 400; // Reset
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gameState !== GameState.PAUSED) {
      setTimeLeft(400);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameState]);

  const handleUpdateHUD = (score: number, bugs: number, lives: number, size: PlayerSize) => {
    setHudScore(score);
    setHudBugs(bugs);
    setHudLives(lives);
    setHudSize(size);
  };

  const initTutorial = () => {
    sound.init(); // Setup AudioContext
    sound.playPowerUp();
    setShowTutorial(true);
    setCurrentSlide(0);
  };

  const handleStartActualGame = () => {
    setShowTutorial(false);
    handleStartGame(1);
  };

  const handleStartGame = (stageIdx: number = 1) => {
    sound.init(); // Setup AudioContext
    setLevelIndex(stageIdx);
    setHudLives(3);
    setHudScore(0);
    setHudBugs(0);
    setHudSize(PlayerSize.NORMAL);
    setTimeLeft(400);
    setGameState(GameState.PLAYING);
    sound.playPowerUp();
    if (stageIdx === 1) {
      setConsecutiveCount(1);
    } else {
      setConsecutiveCount(0);
    }
  };

  const handleNextStage = () => {
    if (levelIndex < 3) {
      if (consecutiveCount === levelIndex) {
        setConsecutiveCount(prev => prev + 1);
      } else {
        setConsecutiveCount(0);
      }
      const nextLvl = levelIndex + 1;
      setLevelIndex(nextLvl);
      setTimeLeft(400);
      setGameState(GameState.PLAYING);
      sound.playPowerUp();
    } else if (levelIndex === 3 && consecutiveCount === 3) {
      // Transition to Boss battle Stage 4!
      setLevelIndex(4);
      setTimeLeft(400);
      setGameState(GameState.PLAYING);
      sound.playPowerUp();
    } else {
      // Game fully completed! Show special clear screen
      setGameState(GameState.CLEAR);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans flex flex-col items-center justify-between pb-8 pt-4 relative bg-[#4F46E5] bg-[linear-gradient(45deg,#3c35b8_25%,transparent_25%),linear-gradient(-45deg,#3c35b8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#3c35b8_75%),linear-gradient(-45deg,transparent_75%,#3c35b8_75%)] bg-[size:40px_40px] bg-[position:0_0,0_20px,20px_-20px,-20px_0px] selection:bg-yellow-400 selection:text-black">
      
      {/* Decorative ambient background swamp lights (fireflies) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute top-[20%] left-[10%] w-3.5 h-3.5 bg-yellow-300 rounded-full animate-pulse bubble-float"></div>
        <div className="absolute top-[60%] left-[80%] w-4 h-4 bg-yellow-200 rounded-full animate-pulse"></div>
        <div className="absolute top-[40%] left-[85%] w-3 h-3 bg-white rounded-full animate-pulse bubble-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[80%] left-[25%] w-3.5 h-3.5 bg-yellow-300 rounded-full animate-pulse bubble-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      {/* Retro Arcade Machine Top Signboard */}
      <header className="text-center mb-4 z-10">
        <div className="inline-flex items-center gap-2 bg-[#FF2E93] border-4 border-black px-5 py-2 font-pixel text-xs text-white shadow-[4px_4px_0px_0px_#000] rotate-[-1deg]">
          <Trees className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span className="tracking-widest font-black">
            RETRO KELO-KELO ARCADE SYSTEM
          </span>
        </div>
      </header>

      {/* Main CRT Television Cabinet Frame wrapper */}
      <main className="w-full max-w-[840px] px-4 flex flex-col justify-center items-center z-10">
        <div className="w-full bg-[#FFDE4D] border-[8px] border-black rounded-3xl shadow-[12px_12px_0px_0px_#000000] p-4 md:p-6 relative crt-overlay overflow-hidden">
          
          {/* Inner bezel decoration */}
          <div className="absolute inset-x-0 top-0 h-2 bg-[#FFB240]/40"></div>

          {/* GAME HEADER (Traditional NES Platformer HUD) */}
          {gameState === GameState.PLAYING && (
            <div className="grid grid-cols-4 gap-2 mb-4 px-3 py-3 bg-[#4F46E5] border-4 border-black rounded-none text-center select-none font-mono tracking-wider text-white shadow-[4px_4px_0_#000]">
              {/* Score section */}
              <div>
                <div className="text-[10px] text-yellow-300 font-pixel">SCORE</div>
                <div id="hud_score_value" className="text-xs md:text-sm font-black mt-1">
                  {String(hudScore).padStart(6, "0")}
                </div>
              </div>

              {/* Bugs gathered (Fly equivalents of coins) */}
              <div>
                <div className="text-[10px] text-yellow-300 font-pixel">BUGS</div>
                <div id="hud_bugs_value" className="text-xs md:text-sm font-black mt-1 flex justify-center items-center gap-1">
                  <span>🦟</span>
                  <span>x{String(hudBugs).padStart(2, "0")}</span>
                </div>
              </div>

              {/* World Stage index */}
              <div>
                <div className="text-[10px] text-yellow-300 font-pixel">STAGE</div>
                <div id="hud_stage_value" className="text-xs md:text-sm font-black mt-1">
                  {levelIndex}-3
                </div>
              </div>

              {/* Lives and Size State */}
              <div>
                <div className="text-[10px] text-yellow-300 font-pixel">TIME</div>
                <div id="hud_timer_value" className="text-xs md:text-sm font-black mt-1 text-red-350">
                  {timeLeft}
                </div>
              </div>
            </div>
          )}

          {/* SCENE MAIN DISPATCHER */}
          {gameState === GameState.TITLE && (
            showTutorial ? (
              /* ADVENTURE INSTRUCTIONS SLIDESHOW SCREEN */
              <div 
                className="flex flex-col items-center justify-between py-6 select-none bg-[#38BDF8] bg-cover bg-center bg-no-repeat rounded-2xl border-4 border-black p-4 md:p-6 min-h-[460px] shadow-[8px_8px_0_#000] text-black w-full relative overflow-hidden"
                style={{ backgroundImage: "url('/ChatGPT Image 2026年6月17日 16_18_18.png')" }}
              >
                {/* Semi-transparent overlay to ensure legibility */}
                <div className="absolute inset-0 bg-white/50 pointer-events-none z-0" />
                
                {/* Header / Skip */}
                <div className="flex justify-between items-center w-full mb-2 pb-2 border-b-2 border-black/20 z-10 relative">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5 text-indigo-900 animate-pulse" />
                    <span className="font-pixel text-[11px] text-indigo-950 font-bold">ADVENTURE TUTORIAL</span>
                  </div>
                  <button
                    onClick={handleStartActualGame}
                    className="px-2.5 py-1 bg-red-400 hover:bg-red-300 text-black border-2 border-black font-pixel text-[9px] rounded-lg shadow-[2px_2px_0_#000] active:scale-95 transition"
                  >
                    スキップ ➔
                  </button>
                </div>

                {/* Slides Array content */}
                {(() => {
                  const slides = [
                    {
                      title: "【STEP 1／4】 大地を走り、空を舞え！",
                      subtitle: "基本となる動作：左右移動 ＆ 大ジャンプ",
                      details: [
                        "・[A] [D] もしくは [←] [→] キーで、泥沼の戦場をダッシュ！",
                        "・[スペース] [W] もしくは [↑] キーで、障害物を飛び越える大ジャンプ！",
                        "・ジャンプキーを長く押すことで、より高くジャンプができるぞ！"
                      ],
                      color: "border-[#10B981] bg-[#ECFDF5]",
                      icon: (
                        <svg className="w-20 h-20 select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Jump trajectory arcs */}
                          <path d="M10 48 Q 28 15 46 22" stroke="#10B981" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
                          <path d="M46 22 L 40 18 M 46 22 L 48 28" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                          
                          {/* Jumping frog */}
                          <g transform="translate(12, -6) rotate(-15)">
                            <circle cx="16" cy="46" r="5" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
                            <circle cx="42" cy="46" r="5" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
                            <circle cx="29" cy="38" r="12" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
                            <circle cx="19" cy="24" r="5" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
                            <circle cx="39" cy="24" r="5" fill="#22C55E" stroke="#14532D" strokeWidth="2" />
                            <circle cx="19" cy="24" r="2.5" fill="white" />
                            <circle cx="39" cy="24" r="2.5" fill="white" />
                            <circle cx="20" cy="23" r="1" fill="black" />
                            <circle cx="40" cy="23" r="1" fill="black" />
                            <path d="M 25 35 Q 29 39 33 35" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
                          </g>

                          {/* Quick running dust effect */}
                          <circle cx="8" cy="50" r="3" fill="#94A3B8" />
                          <circle cx="12" cy="52" r="2" fill="#CBD5E1" />
                        </svg>
                      )
                    },
                    {
                      title: "【STEP 2／4】 獲物を喰らう最強の舌！",
                      subtitle: "攻撃アクション：ロングベロ ＆ 泡ショット",
                      details: [
                        "・[F] もしくは [X] キーで、伸縮自在のロングベロを突き出す！",
                        "・目の前のヘビをペチッと攻撃してノックバック＆ダメージ！",
                        "・少し離れた場所にある「バグ（虫）」も舌ならパクッと長距離捕食できる！",
                        "・泡虫を食べると一定時間「水泡（バブル）弾」を発射可能になるぞ！"
                      ],
                      color: "border-[#EC4899] bg-[#FDF2F8]",
                      icon: (
                        <svg className="w-20 h-20 select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Pink Sticky Tongue */}
                          <path d="M 12 36 Q 32 18 52 24" stroke="#F472B6" strokeWidth="6" strokeLinecap="round" />
                          <circle cx="52" cy="24" r="7" fill="#EC4899" />
                          <circle cx="49" cy="21" r="2" fill="#FFE4E6" />
                          
                          {/* Target Bug being eaten */}
                          <g transform="translate(48, 16) scale(0.6)">
                            <ellipse cx="6" cy="12" rx="4" ry="6" fill="#1E293B" />
                            <line x1="6" y1="6" x2="2" y2="2" stroke="#000" strokeWidth="1.5" />
                            <line x1="6" y1="6" x2="10" y2="2" stroke="#000" strokeWidth="1.5" />
                            <ellipse cx="2" cy="12" rx="4" ry="2" fill="#E0F2FE" />
                            <ellipse cx="10" cy="12" rx="4" ry="2" fill="#E0F2FE" />
                          </g>
                          
                          {/* Frog face */}
                          <circle cx="12" cy="40" r="10" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                          <circle cx="6" cy="30" r="4" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
                          <circle cx="18" cy="30" r="4" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
                          <circle cx="6" cy="30" r="2" fill="white" />
                          <circle cx="18" cy="30" r="2" fill="white" />
                          <circle cx="6" cy="30" r="0.8" fill="black" />
                          <circle cx="18" cy="30" r="0.8" fill="black" />
                        </svg>
                      )
                    },
                    {
                      title: "【STEP 3／4】 ヘビを踏み潰せ！ 巨大化せよ！",
                      subtitle: "攻略テクニック ＆ 危険な泥沼ギミック",
                      details: [
                        "・ヘビは上から「ジャンプで踏みつける」ことで一撃でペチャンコに！",
                        "・『黄金虫』を手に入れてスーパー化（巨大ブルー形態）になろう！",
                        "・巨大化すると、頭突きでレンガブロックを破壊可能に。盾としても機能！",
                        "・※超重要：危険な「泥沼」の上は、連続で合計2秒しか立っていられない！溺れる前にピョンピョン飛び跳ねて陸地に逃げろ！"
                      ],
                      color: "border-[#3B82F6] bg-[#EFF6FF]",
                      icon: (
                        <svg className="w-20 h-20 select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Giant Crown-wearing Blue Frog */}
                          <circle cx="32" cy="38" r="15" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="2.5" />
                          <circle cx="21" cy="24" r="6" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="2" />
                          <circle cx="43" cy="24" r="6" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="2" />
                          <circle cx="21" cy="24" r="3.5" fill="white" />
                          <circle cx="43" cy="24" r="3.5" fill="white" />
                          <circle cx="22" cy="24" r="1.5" fill="black" />
                          <circle cx="44" cy="24" r="1.5" fill="black" />
                          {/* Crown */}
                          <path d="M 23 15 L 20 8 L 27 11 L 32 5 L 37 11 L 44 8 L 41 15 Z" fill="#FBBF24" stroke="#000" strokeWidth="1.5" />
                          {/* Sad flattened snake head below */}
                          <path d="M 16 52 L 48 52" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                      )
                    },
                    {
                      title: "【FINAL STEP】 諦めない心が、最大の武器！",
                      subtitle: "難易度への警告 ＆ コンティニュー",
                      details: [
                        "・この泥沼に待ち受けるのは、数々の理不尽な罠と凶悪なヘビ軍団！",
                        "・「何度もやられて覚える」死にゲー仕様の、ちょっぴり骨太な難易度！",
                        "・しかし大丈夫！やられてもその場（もしくは中間地点）から何度でもコンティニュー可能！",
                        "・極限の操作テクニックを身に付けて、ステージの最奥を目指せ！"
                      ],
                      color: "border-[#F59E0B] bg-[#FFFBEB]",
                      icon: (
                        <svg className="w-20 h-20 select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#EF4444" />
                              <stop offset="50%" stopColor="#F59E0B" />
                              <stop offset="100%" stopColor="#FBBF24" />
                            </linearGradient>
                          </defs>
                          <path d="M 32 8 Q 12 36 24 54 Q 32 60 40 54 Q 52 36 32 8 Z" fill="url(#fireGrad)" stroke="#78350F" strokeWidth="2" />
                          
                          {/* Angry Frog face inside flame */}
                          <circle cx="32" cy="42" r="8" fill="#22C55E" stroke="#14532D" strokeWidth="1.5" />
                          <circle cx="28" cy="35" r="3" fill="#22C55E" />
                          <circle cx="36" cy="35" r="3" fill="#22C55E" />
                          <circle cx="28" cy="35" r="1.5" fill="white" />
                          <circle cx="36" cy="35" r="1.5" fill="white" />
                          <path d="M 29 45 L 35 45" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )
                    }
                  ];

                  const activeSlide = slides[currentSlide];

                  return (
                    <div className="w-full flex flex-col items-center flex-1 justify-between z-10 relative">
                      {/* Slide Title */}
                      <h2 className="text-[13px] md:text-sm font-retro text-indigo-950 text-center tracking-wide mb-2 drop-shadow-[1px_1px_0_rgba(255,255,255,0.7)]">
                        {activeSlide.title}
                      </h2>

                      {/* Graphic Showcase Icon Box */}
                      <div className="w-full flex justify-center py-1 mb-2">
                        <div className="p-3 bg-white border-4 border-black rounded-3xl shadow-[4px_4px_0_#000] flex justify-center items-center w-24 h-24 relative">
                          {activeSlide.icon}
                        </div>
                      </div>

                      {/* Slide Details Card */}
                      <div className={`p-4 border-4 border-black rounded-2xl w-full max-w-md ${activeSlide.color} shadow-[4px_4px_0_#000] transition-colors duration-200 mb-4`}>
                        <h3 className="font-bold text-[11px] font-pixel text-black mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-current animate-pulse" />
                          {activeSlide.subtitle}
                        </h3>
                        <div className="space-y-1 text-left text-[10.5px] md:text-[11px] text-black/90 font-semibold leading-relaxed">
                          {activeSlide.details.map((detail, index) => (
                             <p key={index}>{detail}</p>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Controls / Indicator Pagination */}
                      <div className="w-full max-w-sm flex items-center justify-between gap-4 mt-2">
                        <button
                          disabled={currentSlide === 0}
                          onClick={() => {
                            sound.playHurt();
                            setCurrentSlide(prev => Math.max(0, prev - 1));
                          }}
                          className={`px-3 py-1.5 border-2 border-black text-black font-pixel text-[9px] rounded-xl flex items-center gap-1 transition ${
                            currentSlide === 0 
                            ? "opacity-30 cursor-not-allowed bg-slate-300 shadow-[#1px_1px_0_#000]" 
                            : "bg-white hover:bg-slate-100 shadow-[2.5px_2.5px_0_#000] active:scale-95"
                          }`}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          もどる
                        </button>

                        {/* Dot Indicators */}
                        <div className="flex gap-2.5">
                          {slides.map((_, idx) => (
                            <div 
                              key={idx}
                              onClick={() => {
                                sound.playHurt();
                                setCurrentSlide(idx);
                              }}
                              className={`w-3 h-3 rounded-full border-2 border-black cursor-pointer transition ${
                                idx === currentSlide ? "bg-yellow-400 scale-125 shadow-[1.5px_1.5px_0_#000]" : "bg-white"
                              }`}
                            />
                          ))}
                        </div>

                        {currentSlide < slides.length - 1 ? (
                          <button
                            onClick={() => {
                              sound.playPowerUp();
                              setCurrentSlide(prev => prev + 1);
                            }}
                            className="px-3 py-1.5 bg-[#10B981] hover:bg-[#34D399] text-black border-2 border-black font-pixel text-[9px] rounded-xl flex items-center gap-1 shadow-[2.5px_2.5px_0_#000] active:scale-95 transition"
                          >
                            つぎへ
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={handleStartActualGame}
                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-pixel font-bold text-[10px] rounded-xl flex items-center gap-1 shadow-[3px_3px_0_#000] active:scale-95 animate-bounce"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            冒険スタート！
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              /* CLEAN ARCHADE SIGN-IN TITLE SCREEN (Without cluttered bottom info) */
              <div 
                className="flex flex-col items-center text-center py-6 select-none bg-[#38BDF8] bg-cover bg-center bg-no-repeat rounded-2xl border-4 border-black p-6 min-h-[440px] justify-between shadow-[8px_8px_0_#000] text-black home-title-container relative overflow-hidden"
                style={{ backgroundImage: "url('/ChatGPT Image 2026年6月17日 16_18_18.png')" }}
              >
                {/* Semi-transparent overlay to ensure legibility */}
                <div className="absolute inset-0 bg-white/50 pointer-events-none z-0" />
                
                {/* Title Section */}
                <div className="mt-2 w-full z-10 relative">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold pb-2 font-retro drop-shadow-[4px_4px_0px_#000] glitch-hover cursor-help select-none flex items-center justify-center gap-1.5 flex-wrap tracking-wide">
                    <span className="text-[#FACC15] animate-bounce text-2xl md:text-4xl">⚡️</span>
                    <span className="text-[#22C55E] drop-shadow-[2px_2px_0px_#000]">ゲロゲロ</span>
                    <span className="text-[#F59E0B] drop-shadow-[2px_2px_0px_#000]">フロッピー</span>
                    <span className="text-[#FACC15] animate-bounce text-2xl md:text-4xl" style={{ animationDelay: '0.2s' }}>⚡️</span>
                  </h1>
                  <p className="text-xs text-black font-semibold max-w-md mx-auto leading-relaxed mt-2 bg-white/50 p-2.5 rounded-xl border-2 border-dashed border-black/40 shadow-inner">
                    極限の泥沼に挑め！伸縮自在の最強ロングベロを武器にする、熱い冒険アドベンチャー！<br/>
                    迫り来る凶悪なヘビどもを踏みつぶし、おいしい獲物（バグ）を喰らい尽くして、大冒険を成し遂げろ！🐸🔥
                  </p>
                </div>

                {/* Mini Interactive Frog Graphic inside Title Screen */}
                <div className="my-4 p-4 bg-white border-4 border-black rounded-2xl max-w-sm w-full flex items-center justify-between shadow-[4px_4px_0_#000] text-black z-10 relative">
                  <div className="text-left pr-2">
                    <div className="text-xs font-pixel text-emerald-600 font-bold mb-1">主人公: フロッピー</div>
                    <div className="text-[10px] font-semibold text-slate-800 leading-tight">大ジャンプと伸縮自在の舌(ベロ)攻撃が自慢！パワーアップすると泡を発射可能。</div>
                  </div>
                  <div className="w-16 h-16 bg-yellow-300 rounded-2xl border-4 border-black flex justify-center items-center shadow-[3px_3px_0_#000] relative overflow-hidden shrink-0">
                    <svg className="w-14 h-14 animate-bounce bubble-float select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Crouched legs */}
                      <circle cx="16" cy="46" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                      <circle cx="48" cy="46" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                      {/* Body */}
                      <circle cx="32" cy="38" r="15" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                      {/* Soft belly */}
                      <circle cx="32" cy="42" r="9" fill="#BBF7D0" />
                      {/* Left Eye */}
                      <circle cx="21" cy="24" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                      {/* Right Eye */}
                      <circle cx="43" cy="24" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                      {/* Eye Whites */}
                      <circle cx="21" cy="24" r="3.5" fill="white" />
                      <circle cx="43" cy="24" r="3.5" fill="white" />
                      {/* Pupils looking forward */}
                      <circle cx="22" cy="24" r="1.5" fill="black" />
                      <circle cx="44" cy="24" r="1.5" fill="black" />
                      {/* Smiley mouth */}
                      <path d="M 27 36 Q 32 41 37 36" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Cute cheeks */}
                      <circle cx="23" cy="33" r="2" fill="#F472B6" fillOpacity="0.75" />
                      <circle cx="41" cy="33" r="2" fill="#F472B6" fillOpacity="0.75" />
                    </svg>
                    <div className="absolute bottom-1 w-10 h-1 bg-black/25 rounded-full blur-xs"></div>
                  </div>
                </div>

                {/* Play launch triggers slideshow intro first */}
                <div className="w-full max-w-xs flex flex-col gap-3 z-10 relative">
                  <button 
                    id="start_adventure_btn"
                    onClick={initTutorial}
                    className="py-4 px-6 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-pixel font-bold text-sm tracking-widest rounded-2xl transition shadow-[6px_6px_0px_0px_#000] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current animate-pulse" />
                    冒険をはじめる！
                  </button>
                </div>

              </div>
            )
          )}

          {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
            <div className="flex flex-col items-center relative rounded-2xl border-4 border-black overflow-hidden bg-slate-950 shadow-[6px_6px_0_#000]">
              {/* HUD lives / size display left-top inside Canvas container */}
              <div className="absolute top-3 left-4 flex items-center gap-4 text-xs font-pixel bg-white border-2 border-black text-black px-3 py-1.5 rounded-xl z-20 pointer-events-none select-none shadow-[2px_2px_0_#000]">
                <div className="flex items-center gap-1 text-rose-500 font-bold">
                  <Heart className="w-4 h-4 fill-current animate-pulse text-rose-500" />
                  <span>x {hudLives}</span>
                </div>
                <div className="h-4 w-0.5 bg-black"></div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="text-[9px]">
                    {hudSize === PlayerSize.NORMAL && "ノーマル"}
                    {hudSize === PlayerSize.SUPER && "スーパー"}
                    {hudSize === PlayerSize.FIRE && "ファイヤ"}
                  </span>
                </div>
              </div>

              <GameCanvas 
                levelIndex={levelIndex}
                onUpdateHUD={handleUpdateHUD}
                gameState={gameState}
                setGameState={setGameState}
                onNextLevel={handleNextStage}
                onRestartGame={() => handleStartGame(1)}
                initialScore={hudScore}
                initialBugs={hudBugs}
                initialLives={hudLives}
                initialSize={hudSize}
              />
            </div>
          )}

          {gameState === GameState.GAMEOVER && (
            <div className="flex flex-col items-center justify-center text-center py-10 min-h-[440px] bg-rose-100 rounded-2xl border-4 border-black p-6 select-none shadow-[8px_8px_0_#000] text-black">
              
              <div className="w-20 h-20 bg-rose-400 border-4 border-black rounded-full flex justify-center items-center text-5xl mb-4 text-black shadow-[4px_4px_0_#000] animate-bounce">
                💀
              </div>

              <h2 className="text-3xl md:text-5xl font-pixel text-rose-600 tracking-wider mb-2 uppercase drop-shadow">
                GAME OVER
              </h2>
              
              <p className="text-xs leading-relaxed font-semibold max-w-sm mb-6 text-black/80">
                カエルは力尽きてしまった...！<br/>
                宿敵のヘビに勝利し、沼地の平和を取り戻すために再挑戦しよう！
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button 
                  id="retry_stage_btn"
                  onClick={() => handleStartGame(levelIndex)}
                  className="flex-1 py-3 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-pixel text-xs transition shadow-[4px_4px_0_#000] active:scale-95 flex items-center justify-center gap-2 border-4 border-black"
                >
                  <RotateCcw className="w-4 h-4" />
                  リトライ！
                </button>
                <button 
                  id="go_title_from_game_over"
                  onClick={() => setGameState(GameState.TITLE)}
                  className="flex-1 py-3 px-5 bg-white hover:bg-slate-100 text-black rounded-2xl font-pixel text-xs transition active:scale-95 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0_#000]"
                >
                  タイトルへ
                </button>
              </div>
            </div>
          )}

          {gameState === GameState.CLEAR && (
            <div 
              className="flex flex-col items-center justify-center text-center py-10 min-h-[440px] bg-emerald-100 bg-cover bg-center bg-no-repeat rounded-2xl border-4 border-black p-6 select-none shadow-[8px_8px_0_#000] text-black relative overflow-hidden"
              style={{ backgroundImage: "url('/ChatGPT Image 2026年6月17日 16_18_18.png')" }}
            >
              {/* Semi-transparent overlay to ensure legibility */}
              <div className="absolute inset-0 bg-white/50 pointer-events-none z-0" />
              
              <div className="w-full flex flex-col items-center justify-center z-10 relative">
                <div className="w-24 h-24 bg-yellow-300 border-4 border-black rounded-full flex justify-center items-center mb-6 relative animate-bounce shadow-[4px_4px_0_#000]">
                <svg className="w-20 h-20 select-none pointer-events-none" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Crouched legs */}
                  <circle cx="16" cy="46" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                  <circle cx="48" cy="46" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                  {/* Body */}
                  <circle cx="32" cy="38" r="15" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                  {/* Soft belly */}
                  <circle cx="32" cy="42" r="9" fill="#BBF7D0" />
                  {/* Left Eye */}
                  <circle cx="21" cy="24" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                  {/* Right Eye */}
                  <circle cx="43" cy="24" r="6" fill="#22C55E" stroke="#14532D" strokeWidth="2.5" />
                  {/* Eye Whites */}
                  <circle cx="21" cy="24" r="3.5" fill="white" />
                  <circle cx="43" cy="24" r="3.5" fill="white" />
                  {/* Pupils looking forward */}
                  <circle cx="22" cy="24" r="1.5" fill="black" />
                  <circle cx="44" cy="24" r="1.5" fill="black" />
                  {/* Smiley mouth */}
                  <path d="M 27 36 Q 32 41 37 36" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Cute cheeks */}
                  <circle cx="23" cy="33" r="2" fill="#F472B6" fillOpacity="0.75" />
                  <circle cx="41" cy="33" r="2" fill="#F472B6" fillOpacity="0.75" />
                  {/* Royal Golden Crown - only show on hidden stage's ending screen */}
                  {levelIndex === 4 && (
                    <>
                      <path d="M 23 19 L 16 9 L 25 14 L 32 5 L 39 14 L 48 9 L 41 19 Z" fill="#FBBF24" stroke="#1E293B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Jewels on crown tips */}
                      <circle cx="16" cy="9" r="1.5" fill="#EF4444" />
                      <circle cx="32" cy="5" r="1.5" fill="#3B82F6" />
                      <circle cx="48" cy="9" r="1.5" fill="#EC4899" />
                    </>
                  )}
                </svg>
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center text-xl shadow">✨</div>
              </div>

              {levelIndex < 3 ? (
                <>
                  <h2 className="text-2xl md:text-4xl font-pixel font-bold text-emerald-600 mb-2 tracking-wide leading-tight">
                    STAGE {levelIndex} CLEAR!
                  </h2>
                  <p className="text-xs font-semibold text-black/80 max-w-md mb-6 leading-relaxed">
                    ハエをたくさん食べ、見事にヘビたちの猛攻をくぐり抜けました！<br/>
                    この勢いで次の沼地へ進みましょう。
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <button 
                      id="next_level_btn"
                      onClick={handleNextStage}
                      className="flex-1 py-3.5 px-6 bg-[#71BC2E] hover:bg-[#8ade37] text-black rounded-2xl font-pixel font-bold text-xs tracking-wider transition shadow-[4px_4px_0_#000] active:scale-95 flex items-center justify-center gap-2 border-4 border-black"
                    >
                      次のステージへ進む
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                  </div>
                </>
              ) : levelIndex === 3 && consecutiveCount === 3 ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-pixel font-bold text-rose-600 mb-2 tracking-wide leading-tight animate-pulse">
                    🚨 隠しステージ解放 🚨
                  </h2>
                  <p className="text-xs font-semibold text-black/80 max-w-md mb-6 leading-relaxed">
                    おめでとうございます！3ステージを一度もゲームオーバーにならず、見事連続でクリアしました！<br/>
                    隠しステージとして、沼地を支配する真の巨悪<strong>『ヘビの大王 (King Swamp Snake)』</strong>へ挑戦が可能です！
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <button 
                      id="next_level_boss_btn"
                      onClick={handleNextStage}
                      className="flex-1 py-3.5 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-pixel font-bold text-xs tracking-wider transition shadow-[4px_4px_0_#000] active:scale-95 flex items-center justify-center gap-2 border-4 border-black animate-bounce bg-gradient-to-r from-red-650 via-rose-600 to-red-650"
                    >
                      真のボス戦へ進む 🔥
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-5xl font-pixel font-extrabold text-[#D86800] mb-2 tracking-wide text-center uppercase animate-pulse">
                    {levelIndex === 4 ? "👑 真の完全制覇 👑" : "👑 完全制覇 👑"}
                  </h2>
                  <p className="text-xs font-semibold text-black/85 max-w-md mb-2 leading-relaxed">
                    {levelIndex === 4 
                      ? "おめでとうございます！3ステージ連続クリアの偉業を達成し、さらに隠しボス『ヘビの大王』をも完全に倒しました！あなたは真の「沼地の神王 (Swamp Emperor)」です！"
                      : "おめでとうございます！すべてのマシンのヘビたちを打ち倒し、伝説の「沼地の王 (Swamp King)」となりました！"}
                  </p>

                  <div className="p-3 bg-white border-4 border-black rounded-2xl mb-6 font-pixel text-[10px] text-black max-w-xs shadow-[3px_3px_0_#000]">
                    🏆 RESULT SCORE: <span className="font-bold text-emerald-600 text-sm">{hudScore}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button 
                      id="remake_game_btn"
                      onClick={() => handleStartGame(1)}
                      className="flex-1 py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-pixel text-xs transition shadow-[4px_4px_0_#000] active:scale-95 flex items-center justify-center gap-2 border-4 border-black"
                    >
                      最初から冒険！
                    </button>
                    <button 
                      id="go_to_title_finished"
                      onClick={() => setGameState(GameState.TITLE)}
                      className="flex-1 py-3 px-5 bg-white hover:bg-slate-100 text-black rounded-2xl font-pixel text-xs transition active:scale-95 flex items-center justify-center gap-2 border-4 border-black shadow-[4px_4px_0_#000]"
                    >
                      タイトルへ
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Retro cabinet decorations */}
      <footer className="mt-6 text-center select-none z-10 max-w-[800px] w-full px-4">
        <div className="text-[11px] font-mono text-black flex flex-col md:flex-row gap-2 justify-between items-center bg-[#FFDE4D] p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0_#000]">
          <span className="font-bold">🐸 © 2026 Kelo Kelo Soft, All Rights Reserved.</span>
          <div className="flex gap-4 font-bold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-ping"></span>SYSTEM WORKING</span>
            <span>PORT: 3000 ACCESSED</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
