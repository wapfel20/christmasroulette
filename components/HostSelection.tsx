
import React, { useState } from 'react';
import { ElfPersona } from '../types';
import { Sparkles, Loader2, User, Coffee, Briefcase } from 'lucide-react';

interface HostSelectionProps {
  hosts: ElfPersona[];
  onSelectHost: (host: ElfPersona) => void;
  isLoading: boolean;
}

const HostSelection: React.FC<HostSelectionProps> = ({ hosts, onSelectHost, isLoading }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 flex flex-col items-center text-center border-t-8 border-christmas-red animate-fade-in">
        <div className="mb-6 relative">
          <div className="relative">
            <User size={64} className="text-gray-300" />
            <Sparkles size={32} className="absolute -top-2 -right-4 text-christmas-gold animate-spin-slow" />
          </div>
        </div>
        <h2 className="text-3xl font-christmas font-bold text-christmas-red mb-4">Summoning The Elves...</h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md">
          We are contacting the North Pole to find the perfect hosts for your game. 
          Generating personalities and portraits...
        </p>
        <Loader2 className="animate-spin text-christmas-green" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl md:text-5xl font-christmas text-white drop-shadow-md mb-2">Pick Your Host!</h2>
        <p className="text-white text-lg drop-shadow-sm font-medium">Who should lead the mischief tonight?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hosts.map((host) => (
          <div 
            key={host.id}
            onClick={() => setSelectedId(host.id)}
            className={`
              bg-white rounded-xl overflow-hidden shadow-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2
              ${selectedId === host.id ? 'ring-4 ring-christmas-gold scale-105' : 'hover:shadow-2xl'}
            `}
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden group">
              {host.avatarUrl ? (
                <img src={host.avatarUrl} alt={host.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-christmas-green/10">
                   <User size={64} className="text-christmas-green opacity-50" />
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
              
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-2xl font-christmas font-bold">{host.name}</h3>
                <div className="text-xs font-bold uppercase tracking-wider opacity-90 bg-christmas-red px-2 py-0.5 rounded inline-block mt-1">
                  {host.personality}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
               <div className="flex items-start gap-2">
                 <Briefcase size={16} className="text-christmas-green shrink-0 mt-1" />
                 <div>
                   <div className="text-xs text-gray-400 font-bold uppercase">Job</div>
                   <div className="text-sm text-gray-800 font-medium leading-tight">{host.job}</div>
                 </div>
               </div>
               
               <div className="flex items-start gap-2">
                 <Coffee size={16} className="text-christmas-gold shrink-0 mt-1" />
                 <div>
                   <div className="text-xs text-gray-400 font-bold uppercase">Favorite Pastime</div>
                   <div className="text-sm text-gray-800 font-medium leading-tight">{host.pastime}</div>
                 </div>
               </div>
            </div>

            {selectedId === host.id && (
              <div className="bg-christmas-green text-white text-center py-2 font-bold text-sm uppercase tracking-wider animate-pulse">
                Selected
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          disabled={!selectedId}
          onClick={() => {
            const host = hosts.find(h => h.id === selectedId);
            if (host) onSelectHost(host);
          }}
          className="bg-christmas-gold text-white font-bold text-2xl py-4 px-12 rounded-full shadow-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform transition hover:scale-105 active:scale-95"
        >
          Confirm Host
        </button>
      </div>
    </div>
  );
};

export default HostSelection;
