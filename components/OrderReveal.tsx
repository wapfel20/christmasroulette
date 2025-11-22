import React, { useEffect, useState, useRef } from 'react';
import { Player } from '../types';
import { Sparkles, Wand2, ArrowRight, Coffee, Volume2 } from 'lucide-react';

interface OrderRevealProps {
  players: Player[];
  onConfirm: () => void;
  firstPlayerReady: boolean;
  orderAudioBuffer: AudioBuffer | null;
}

const OrderReveal: React.FC<OrderRevealProps> = ({ players, onConfirm, firstPlayerReady, orderAudioBuffer }) => {
  const [isWaitingForElf, setIsWaitingForElf] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasAutoPlayedRef = useRef(false);

  // Automatically proceed if we were waiting and the elf became ready for the next step
  useEffect(() => {
    if (isWaitingForElf && firstPlayerReady) {
      // Slight delay to let them read the message
      const timer = setTimeout(() => {
        onConfirm();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isWaitingForElf, firstPlayerReady, onConfirm]);

  // Play order commentary once buffer is available
  useEffect(() => {
    if (orderAudioBuffer && !hasAutoPlayedRef.current) {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
           audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = orderAudioBuffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsPlaying(false);
        
        sourceRef.current = source;
        source.start();
        setIsPlaying(true);
        hasAutoPlayedRef.current = true;
      } catch (e) {
        console.error("Failed to play order audio", e);
      }
    }
    
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
      }
    };
  }, [orderAudioBuffer]);

  const handleConfirmClick = () => {
    // Stop order commentary if still playing
    if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e) {}
    }

    if (firstPlayerReady) {
      onConfirm();
    } else {
      setIsWaitingForElf(true);
    }
  };

  // 1. Loading State (Waiting for Gemini Audio for Order)
  if (!orderAudioBuffer) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center text-center border-t-8 border-christmas-gold animate-fade-in">
        <div className="mb-6 relative">
          <Wand2 size={64} className="text-christmas-red animate-bounce" />
          <Sparkles size={32} className="absolute -top-2 -right-4 text-christmas-gold animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-christmas font-bold text-gray-800 mb-4">Consulting the North Pole...</h2>
        <p className="text-gray-600 text-lg">The elves are sorting the list (and checking it twice)!</p>
      </div>
    );
  }

  // 2. Waiting for Turn 1 Audio (Hot Cocoa Screen)
  if (isWaitingForElf) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center text-center border-t-8 border-christmas-red animate-fade-in">
        <div className="mb-6 relative">
          <Coffee size={64} className="text-christmas-red animate-bounce" />
          <Sparkles size={32} className="absolute -top-2 -right-4 text-christmas-gold animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-christmas font-bold text-gray-800 mb-4">Elves on Coffee Break...</h2>
        <p className="text-gray-600 text-lg">Our elf host is currently making hot cocoa... kindly wait in the lobby until he's ready to lead our game.</p>
      </div>
    );
  }

  // 3. Ready State (Show List)
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border-t-8 border-christmas-green animate-fade-in">
       <div className="text-center mb-6">
         <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-3xl font-christmas text-christmas-red">The Official Order</h2>
            {isPlaying && <Volume2 size={24} className="text-christmas-green animate-pulse" />}
         </div>
         <p className="text-gray-600">Here is how the night will unfold!</p>
       </div>

       <div className="space-y-3 mb-8 max-h-[60vh] overflow-y-auto pr-2">
         {players.map((player, index) => (
           <div key={player.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100 transform transition hover:scale-102">
             <div className="w-8 h-8 bg-christmas-red text-white rounded-full flex items-center justify-center font-bold font-christmas text-lg shadow-sm mr-4 shrink-0">
               {index + 1}
             </div>
             <span className="font-medium text-gray-800 text-lg">{player.name}</span>
           </div>
         ))}
       </div>

       <button
         onClick={handleConfirmClick}
         className="w-full bg-christmas-green text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:bg-green-800 transform transition active:scale-95 flex items-center justify-center gap-2"
       >
         Let's Play! <ArrowRight />
       </button>
    </div>
  );
};

export default OrderReveal;
