import React, { useState, useEffect, useRef } from 'react';
import { Player, GameState, WheelSegment } from './types';
import GameLobby from './components/GameLobby';
import Wheel from './components/Wheel';
import ResultCard from './components/ResultCard';
import OrderReveal from './components/OrderReveal';
import { Gift, RefreshCw, Trophy, Snowflake, Volume2 } from 'lucide-react';
import { generatePlayerAnnouncement, generateElfSpeech, generateOrderAnnouncement } from './services/geminiService';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [lastResult, setLastResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [firstPlayerReady, setFirstPlayerReady] = useState(false);
  const [orderAudioBuffer, setOrderAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Audio Refs for announcements
  const announcementAudioCtx = useRef<AudioContext | null>(null);
  const announcementSource = useRef<AudioBufferSourceNode | null>(null);
  const lastAnnouncedPlayerId = useRef<string | null>(null);
  
  // Cache for pre-generated audio announcements
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());

  const handleAddPlayer = (name: string) => {
    setPlayers([...players, { id: crypto.randomUUID(), name, hasGone: false }]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleStartGame = () => {
    // Fisher-Yates Shuffle
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    setPlayers(shuffledPlayers);
    setGameState(GameState.DETERMINING_ORDER);
  };

  const handleConfirmOrder = () => {
    // Stop order announcement if still playing
    if (announcementSource.current) {
       try { announcementSource.current.stop(); } catch (e) { /* ignore */ }
    }
    setGameState(GameState.PLAYING);
    setCurrentPlayerIndex(0);
  };

  // Pre-warm audio when order is determined
  useEffect(() => {
    if (gameState === GameState.DETERMINING_ORDER) {
      setFirstPlayerReady(false); // Reset
      setOrderAudioBuffer(null); // Reset order audio
      audioCache.current.clear();

      const prewarmContent = async () => {
        // 1. Generate Order Commentary Audio
        try {
          const names = players.map(p => p.name);
          const text = await generateOrderAnnouncement(names);
          const buffer = await generateElfSpeech(text);
          setOrderAudioBuffer(buffer);
        } catch (e) {
          console.error("Failed to generate order commentary", e);
          // Create empty buffer as fallback to unblock UI if needed, or handle in UI
        }

        // 2. Process sequentially to avoid rate limits, starting with the first player
        for (let i = 0; i < players.length; i++) {
          const player = players[i];
          
          // If we already have it, just check flag and continue
          if (audioCache.current.has(player.id)) {
            if (i === 0) setFirstPlayerReady(true);
            continue;
          }

          try {
            const text = await generatePlayerAnnouncement(player.name);
            const buffer = await generateElfSpeech(text);
            if (buffer) {
              audioCache.current.set(player.id, buffer);
            }
          } catch (e) {
            console.warn(`Failed to prewarm audio for ${player.name}`, e);
          } finally {
            // Always set ready after first attempt (success or fail) so game doesn't hang
            if (i === 0) {
                setFirstPlayerReady(true);
            }
          }
        }
      };

      prewarmContent();
    }
  }, [gameState, players]);

  // Effect to handle Player Turn Announcements
  useEffect(() => {
    if (gameState === GameState.PLAYING && players[currentPlayerIndex]) {
      const player = players[currentPlayerIndex];
      
      // Prevent duplicate announcements if component re-renders but player hasn't changed
      if (lastAnnouncedPlayerId.current === player.id) return;
      lastAnnouncedPlayerId.current = player.id;

      const playAnnouncement = async () => {
        setIsAnnouncing(true);
        try {
          let buffer = audioCache.current.get(player.id);

          // If not in cache, generate it now (fallback)
          if (!buffer) {
             const text = await generatePlayerAnnouncement(player.name);
             buffer = await generateElfSpeech(text);
          }
          
          if (buffer) {
            // Stop any playing audio
            if (announcementSource.current) {
              announcementSource.current.stop();
            }

            // Init context
            if (!announcementAudioCtx.current || announcementAudioCtx.current.state === 'closed') {
              announcementAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            const source = announcementAudioCtx.current.createBufferSource();
            source.buffer = buffer;
            source.connect(announcementAudioCtx.current.destination);
            source.onended = () => setIsAnnouncing(false);
            
            announcementSource.current = source;
            source.start();
          } else {
            setIsAnnouncing(false);
          }
        } catch (e) {
          console.error("Announcement failed", e);
          setIsAnnouncing(false);
        }
      };

      playAnnouncement();
    } else if (gameState !== GameState.PLAYING) {
      lastAnnouncedPlayerId.current = null;
    }
  }, [gameState, currentPlayerIndex, players]);

  const handleSpin = () => {
    if (isSpinning || showResult) return;
    
    // Stop announcement audio if user spins immediately
    if (announcementSource.current) {
      try {
        announcementSource.current.stop();
      } catch(e) { /* ignore */ }
    }
    setIsAnnouncing(false);

    setIsSpinning(true);
    setSpinTrigger(prev => prev + 1);
  };

  const handleSpinComplete = (segment: WheelSegment) => {
    setIsSpinning(false);
    setLastResult(segment);
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    
    // Update current player status
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].hasGone = true;
    setPlayers(updatedPlayers);

    // Check for game over or next player
    if (currentPlayerIndex >= players.length - 1) {
      setGameState(GameState.FINISHED);
    } else {
      setCurrentPlayerIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    if (announcementSource.current) {
      try { announcementSource.current.stop(); } catch(e) { /* ignore */ }
    }
    audioCache.current.clear();
    setGameState(GameState.LOBBY);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setLastResult(null);
    setFirstPlayerReady(false);
    setOrderAudioBuffer(null);
  };

  // Snow animation background component
  const SnowBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden" aria-hidden="true">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute text-gray-200 animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4
          }}
        >
          <Snowflake size={Math.random() * 20 + 10} />
        </div>
      ))}
    </div>
  );

  const currentPlayer = players[currentPlayerIndex];
  const nextPlayer = players[(currentPlayerIndex + 1) % players.length];

  return (
    <div className="h-screen flex flex-col font-sans text-gray-900 relative overflow-hidden">
      {/* Immersive Background Image */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2787&auto=format&fit=crop"
          alt="Cozy Christmas Living Room" 
          className="w-full h-full object-cover blur-[2px] brightness-[0.65] scale-105"
        />
      </div>

      <SnowBackground />
      
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shrink-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-christmas-red">
             <Gift size={24} />
             <span className="font-christmas text-2xl font-bold hidden md:inline">Wheel of Holiday Mischief</span>
             <span className="font-christmas text-xl font-bold md:hidden">Holiday Mischief</span>
          </div>
          
          <div className="flex items-center gap-3">
            {gameState !== GameState.LOBBY && (
              <button 
                onClick={handleReset}
                className="text-sm text-gray-500 hover:text-christmas-red flex items-center gap-1"
              >
                <RefreshCw size={14} /> <span className="hidden sm:inline">Restart</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center z-10 relative overflow-hidden w-full">
        
        {gameState === GameState.LOBBY && (
          <div className="p-4 w-full h-full overflow-y-auto flex items-center justify-center">
            <GameLobby 
              players={players} 
              onAddPlayer={handleAddPlayer} 
              onStartGame={handleStartGame}
              onRemovePlayer={handleRemovePlayer}
            />
          </div>
        )}

        {gameState === GameState.DETERMINING_ORDER && (
          <div className="p-4 w-full h-full overflow-y-auto flex items-center justify-center">
            <OrderReveal 
              players={players}
              onConfirm={handleConfirmOrder}
              firstPlayerReady={firstPlayerReady}
              orderAudioBuffer={orderAudioBuffer}
            />
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 p-2 md:p-6">
             
             {/* Mobile Status Bar */}
             <div className="md:hidden w-full bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border-l-4 border-christmas-red shrink-0 flex justify-between items-center z-20 mx-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl relative">
                    🎅
                    {isAnnouncing && (
                      <Volume2 size={14} className="absolute -top-1 -right-1 text-christmas-green animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col">
                     <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Current Turn</div>
                     <div className="font-bold text-gray-800 text-lg leading-none truncate max-w-[120px]">{currentPlayer?.name}</div>
                  </div>
                </div>
                <div className="text-right border-l pl-3 border-gray-200">
                   <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Up Next</div>
                   <div className="text-sm text-gray-600 font-medium truncate max-w-[100px]">{nextPlayer?.name}</div>
                </div>
             </div>

             {/* Left Side: The Wheel */}
             <div className="flex-1 w-full h-full flex flex-col items-center justify-center min-h-0 relative">
                
                {/* Wheel Constraint Container */}
                <div className="relative w-full h-full flex items-center justify-center min-h-0 py-6 px-2">
                    <div className="aspect-square h-full max-h-full w-auto max-w-full relative object-contain">
                        <Wheel 
                          isSpinning={isSpinning} 
                          onSpinComplete={handleSpinComplete}
                          spinTrigger={spinTrigger}
                        />
                    </div>
                </div>
                
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || showResult}
                  className="shrink-0 mb-2 md:mb-4 bg-gradient-to-b from-christmas-red to-red-700 text-white text-xl md:text-3xl font-christmas font-bold py-3 md:py-4 px-12 md:px-16 rounded-full shadow-xl transform transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ring-4 ring-red-200 z-30"
                >
                  {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                </button>
             </div>

             {/* Desktop Status Panel (Right Side) */}
             <div className="hidden md:flex w-96 flex-col shrink-0 h-auto bg-white/95 backdrop-blur rounded-2xl shadow-2xl border-t-8 border-christmas-gold overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-100">
                  <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-4">Current Turn</h3>
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce relative inline-block">
                      🎅
                      {isAnnouncing && (
                        <div className="absolute -top-2 -right-4 bg-white rounded-full p-1 shadow-sm animate-pulse">
                           <Volume2 size={20} className="text-christmas-green" />
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-gray-800 font-christmas mb-2">{currentPlayer?.name}</div>
                    <p className="text-christmas-green text-sm font-medium bg-green-50 inline-block px-3 py-1 rounded-full border border-green-100">It's your time to shine!</p>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                  <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-4">Coming Up Next</h3>
                  <div className="space-y-3">
                    {players.slice(currentPlayerIndex + 1, currentPlayerIndex + 6).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-500">{i + 1 + currentPlayerIndex + 1}</span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    ))}
                    {players.length - currentPlayerIndex - 1 > 5 && (
                       <div className="text-xs text-gray-400 text-center mt-4">...and {players.length - currentPlayerIndex - 6} more elves</div>
                    )}
                    {players.length - currentPlayerIndex - 1 === 0 && (
                      <div className="text-center py-4 text-gray-400 italic">Last elf standing!</div>
                    )}
                  </div>
                </div>
             </div>
          </div>
        )}

        {gameState === GameState.FINISHED && (
          <div className="p-4 w-full h-full overflow-y-auto flex items-center justify-center">
            <div className="text-center animate-fade-in bg-white p-8 rounded-2xl shadow-xl max-w-md">
              <Trophy size={64} className="mx-auto text-christmas-gold mb-4" />
              <h2 className="text-4xl font-christmas text-christmas-red mb-4">Merry Christmas!</h2>
              <p className="text-gray-600 mb-8 text-lg">The game has ended. We hope everyone loves their gifts (or at least tolerates them)!</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    const shuffledPlayers = [...players];
                    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
                    }
                    setPlayers(shuffledPlayers);
                    setGameState(GameState.DETERMINING_ORDER);
                  }}
                  className="w-full bg-christmas-green text-white py-3 rounded-lg font-bold hover:bg-green-800 transition"
                >
                  Play Again (Reshuffle & Play)
                </button>
                <button 
                  onClick={handleReset}
                  className="w-full bg-white border-2 border-gray-200 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  New Game
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showResult && lastResult && players[currentPlayerIndex] && (
        <ResultCard 
          segment={lastResult} 
          player={players[currentPlayerIndex]}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}

export default App;
