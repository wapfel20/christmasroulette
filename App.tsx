import React, { useState } from 'react';
import { Player, GameState, WheelSegment } from './types';
import GameLobby from './components/GameLobby';
import Wheel from './components/Wheel';
import ResultCard from './components/ResultCard';
import OrderReveal from './components/OrderReveal';
import { Gift, RefreshCw, Trophy, Snowflake } from 'lucide-react';
import { generateCommentary, generateElfSpeech } from './services/geminiService';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [lastResult, setLastResult] = useState<WheelSegment | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Preloaded content state
  const [aiContent, setAiContent] = useState<{ text: string | null; audio: AudioBuffer | null; isLoading: boolean }>({ 
    text: null, 
    audio: null, 
    isLoading: false 
  });

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
    setGameState(GameState.PLAYING);
    setCurrentPlayerIndex(0);
  };

  const handleSpin = () => {
    if (isSpinning || showResult) return;
    setIsSpinning(true);
    setSpinTrigger(prev => prev + 1);
  };

  // Triggered instantly when the wheel calculates where it will land (start of spin)
  const handleDetermineResult = async (segment: WheelSegment) => {
    const player = players[currentPlayerIndex];
    setAiContent({ text: null, audio: null, isLoading: true });
    
    try {
      // 1. Generate Commentary Text
      const text = await generateCommentary(segment, player.name);
      
      // 2. Generate Audio Script & Speech
      const script = `Ho ho ho! ${player.name} landed on ${segment.label}! Here is the rule. ${segment.description}. ${text}`;
      const audio = await generateElfSpeech(script);
      
      setAiContent({ text, audio, isLoading: false });
    } catch (e) {
      console.error("Error pre-fetching content:", e);
      setAiContent({ text: "The elves are having trouble with the connection!", audio: null, isLoading: false });
    }
  };

  const handleSpinComplete = (segment: WheelSegment) => {
    setIsSpinning(false);
    setLastResult(segment);
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setAiContent({ text: null, audio: null, isLoading: false }); // Reset content
    
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
    setGameState(GameState.LOBBY);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setLastResult(null);
    setAiContent({ text: null, audio: null, isLoading: false });
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

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 relative overflow-hidden">
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
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
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

      <main className="flex-grow p-4 md:p-8 flex flex-col items-center justify-center z-10 relative">
        
        {gameState === GameState.LOBBY && (
          <GameLobby 
            players={players} 
            onAddPlayer={handleAddPlayer} 
            onStartGame={handleStartGame}
            onRemovePlayer={handleRemovePlayer}
          />
        )}

        {gameState === GameState.DETERMINING_ORDER && (
          <OrderReveal 
            players={players}
            onConfirm={handleConfirmOrder}
          />
        )}

        {gameState === GameState.PLAYING && (
          <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
             {/* Left Side: The Wheel */}
             <div className="flex-1 w-full flex flex-col items-center">
                <Wheel 
                  isSpinning={isSpinning} 
                  onSpinComplete={handleSpinComplete}
                  spinTrigger={spinTrigger}
                  onDetermineResult={handleDetermineResult}
                />
                
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || showResult}
                  className="mt-12 bg-gradient-to-b from-christmas-red to-red-700 text-white text-2xl md:text-3xl font-christmas font-bold py-4 px-12 md:px-16 rounded-full shadow-xl transform transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ring-4 ring-red-200"
                >
                  {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
                </button>
             </div>

             {/* Right Side: Current Status */}
             <div className="w-full md:w-80 bg-white rounded-xl shadow-lg p-6 border-t-4 border-christmas-gold">
                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-4">Current Turn</h3>
                <div className="text-center mb-8">
                  <div className="text-5xl mb-2">🎅</div>
                  <div className="text-2xl font-bold text-gray-800">{players[currentPlayerIndex].name}</div>
                  <p className="text-christmas-green text-sm">It's your time to shine!</p>
                </div>

                <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-2">Up Next</h3>
                <div className="space-y-2">
                  {players.slice(currentPlayerIndex + 1, currentPlayerIndex + 4).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="text-xs font-mono text-gray-400">{i + 1 + currentPlayerIndex + 1}.</span>
                      {p.name}
                    </div>
                  ))}
                  {players.length - currentPlayerIndex - 1 > 3 && (
                     <div className="text-xs text-gray-400 pl-6">...and {players.length - currentPlayerIndex - 4} more</div>
                  )}
                  {players.length - currentPlayerIndex - 1 === 0 && (
                    <div className="text-sm text-gray-400 italic">Last elf standing!</div>
                  )}
                </div>
             </div>
          </div>
        )}

        {gameState === GameState.FINISHED && (
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
        )}
      </main>

      {/* Modals */}
      {showResult && lastResult && (
        <ResultCard 
          segment={lastResult} 
          player={players[currentPlayerIndex]}
          onClose={handleCloseResult}
          commentary={aiContent.text}
          audioBuffer={aiContent.audio}
          isLoading={aiContent.isLoading}
        />
      )}
    </div>
  );
}

export default App;