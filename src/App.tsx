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
  Disc,
  Flame
} from "lucide-react";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
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
    } else {
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
            <div className="flex flex-col items-center text-center py-6 select-none bg-[#38BDF8] rounded-2xl border-4 border-black p-6 min-h-[440px] justify-between shadow-[8px_8px_0_#000] text-black">
              
              {/* Title Section */}
              <div className="mt-2">
                <div className="flex justify-center items-center gap-1.5 mb-2">
                  <span className="text-3xl animate-bounce">🐸</span>
                  <span className="px-3 py-1 bg-yellow-300 border-2 border-black text-xs text-black font-pixel rounded shadow-[2px_2px_0_#000]">
                    FROG CHAMPION
                  </span>
                  <span className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🐍</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-extrabold pb-2 text-white font-retro drop-shadow-[4px_4px_0px_#000] glitch-hover cursor-help select-none">
                  ケロケロ大冒険
                </h1>
                <p className="text-xs text-black font-semibold max-w-md mx-auto leading-relaxed mt-2 bg-white/40 p-2 rounded-lg border-2 border-dashed border-black/40">
                  カエルを操り、沼の大迷宮を冒険しよう！<br/>
                  宿敵のヘビを踏みつけ、ベロで捕食しながらゴールを目指すレトロアクションゲーム！
                </p>
              </div>

              {/* Mini Interactive Frog Graphic inside Title Screen */}
              <div className="my-4 p-4 bg-white border-4 border-black rounded-2xl max-w-sm w-full flex items-center justify-between shadow-[4px_4px_0_#000] text-black">
                <div className="text-left pr-2">
                  <div className="text-xs font-pixel text-emerald-600 font-bold mb-1">主人公: カエル</div>
                  <div className="text-[10px] font-semibold text-slate-800 leading-tight">大ジャンプと伸縮自在の舌(ベロ)攻撃が自慢！パワーアップすると泡を発射可能。</div>
                </div>
                <div className="w-16 h-16 bg-yellow-300 rounded-2xl border-4 border-black flex justify-center items-center shadow-[3px_3px_0_#000] relative overflow-hidden shrink-0">
                  <span className="text-3xl animate-bounce bubble-float">🐸</span>
                  <div className="absolute bottom-1 w-10 h-1 bg-black/25 rounded-full blur-xs"></div>
                </div>
              </div>

              {/* Stage select and Play launch */}
              <div className="w-full max-w-md flex flex-col gap-3">
                <div className="text-xs text-black font-pixel font-bold mb-1 uppercase tracking-wider">
                  冒険ステージを選択
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    id="stage_1_btn"
                    onClick={() => handleStartGame(1)}
                    className="flex flex-col items-center py-2 px-1 bg-[#71BC2E] hover:bg-[#8ade37] border-4 border-black text-black rounded-xl shadow-[4px_4px_0_#000] transition active:scale-95 text-center font-bold"
                  >
                    <span className="text-xs font-pixel">第1章</span>
                    <span className="text-[9px] text-black mt-1 font-semibold leading-none">スイレン沼</span>
                  </button>
                  <button 
                    id="stage_2_btn"
                    onClick={() => handleStartGame(2)}
                    className="flex flex-col items-center py-2 px-1 bg-[#FF7C33] hover:bg-[#ff9454] border-4 border-black text-black rounded-xl shadow-[4px_4px_0_#000] transition active:scale-95 text-center font-bold"
                  >
                    <span className="text-xs font-pixel">第2章</span>
                    <span className="text-[9px] text-black mt-1 font-semibold leading-none">棘バラの森</span>
                  </button>
                  <button 
                    id="stage_3_btn"
                    onClick={() => handleStartGame(3)}
                    className="flex flex-col items-center py-2 px-1 bg-[#FF2E93] hover:bg-[#ff5ca6] border-4 border-black text-white rounded-xl shadow-[4px_4px_0_#000] transition active:scale-95 text-center font-bold"
                  >
                    <span className="text-xs font-pixel">第3章</span>
                    <span className="text-[9px] text-white mt-1 font-semibold leading-none">ヘビの魔宮</span>
                  </button>
                </div>

                <button 
                  id="start_adventure_btn"
                  onClick={() => handleStartGame(1)}
                  className="mt-2 py-3.5 px-6 bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-pixel font-bold text-xs tracking-widest rounded-2xl transition shadow-[5px_5px_0px_0px_#000] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  冒険をはじめる！ (STAGE 1)
                </button>
              </div>

              {/* Instructions and Controls overview */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-left border-4 border-black bg-[#FFB240] p-4 rounded-xl w-full text-black shadow-[4px_4px_0_#000]">
                <div className="text-[10px] text-black leading-normal font-sans font-semibold">
                  <div className="text-black font-pixel text-[10px] mb-1">🎮 操作:</div>
                  ・[A] [D] もしくは [←] [→] : 左右移動<br/>
                  ・[スペース] もしくは [W] [↑] : ジャンプ<br/>
                  ・[F] もしくは [X] : 攻撃/ショット
                </div>
                <div className="text-[10px] text-black leading-normal font-sans font-semibold">
                  <div className="text-black font-pixel text-[10px] mb-1">💡 ヒント:</div>
                  ・ヘビは上から<span className="text-emerald-700 font-bold">踏みつける</span>と倒せます。<br/>
                  ・ハテナブロックの黄金虫で巨大化！<br/>
                  ・泡虫を食べると泡ショット発射！
                </div>
              </div>
            </div>
          )}

          {gameState === GameState.PLAYING && (
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
            <div className="flex flex-col items-center justify-center text-center py-10 min-h-[440px] bg-emerald-100 rounded-2xl border-4 border-black p-6 select-none shadow-[8px_8px_0_#000] text-black">
              
              <div className="w-24 h-24 bg-yellow-300 border-4 border-black rounded-full flex justify-center items-center text-6xl mb-6 relative animate-bounce shadow-[4px_4px_0_#000]">
                🐸👑
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
