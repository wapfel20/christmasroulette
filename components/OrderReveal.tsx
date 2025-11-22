import React, { useEffect, useState } from 'react';
import { Player } from '../types';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';

interface OrderRevealProps {
  players: Player[];
  onConfirm: () => void;
}

const OrderReveal: React.FC<OrderRevealProps> = ({ players, onConfirm }) => {
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    // Show the "Elf Magic" message for 3 seconds
    const timer = setTimeout(() => {
      setIsCalculating(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isCalculating) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center text-center border-t-8 border-christmas-gold animate-fade-in">
        <div className="mb-6 relative">
          <Wand2 size={64} className="text-christmas-red animate-bounce" />
          <Sparkles size={32} className="absolute -top-2 -right-4 text-christmas-gold animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-christmas font-bold text-gray-800 mb-4">Consulting the North Pole...</h2>
        <p className="text-gray-600 text-lg">We are using our elf magic to determine what order the game will be played</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border-t-8 border-christmas-green animate-fade-in">
       <div className="text-center mb-6">
         <h2 className="text-3xl font-christmas text-christmas-red mb-2">The Official Order</h2>
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
         onClick={onConfirm}
         className="w-full bg-christmas-green text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:bg-green-800 transform transition active:scale-95 flex items-center justify-center gap-2"
       >
         Let's Play! <ArrowRight />
       </button>
    </div>
  );
};

export default OrderReveal;