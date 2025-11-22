import React, { useState } from 'react';
import { Player } from '../types';
import { Users, Play, Plus, Gift } from 'lucide-react';

interface GameLobbyProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onStartGame: () => void;
  onRemovePlayer: (id: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ players, onAddPlayer, onStartGame, onRemovePlayer }) => {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (newName.trim()) {
      onAddPlayer(newName.trim());
      setNewName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 border-t-8 border-christmas-green">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-christmas text-christmas-red mb-2">Wheel of Holiday Mischief</h1>
        <p className="text-gray-600">Register players to start the festive fun!</p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="relative">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter player name..."
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-christmas-red focus:outline-none transition-colors pl-10"
          />
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-christmas-green text-white p-1.5 rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {players.length > 0 ? (
        <div className="mb-8">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Gift size={16} className="text-christmas-gold" />
            Player List ({players.length})
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-gray-100 animate-fade-in">
                <span className="font-medium text-gray-800">{player.name}</span>
                <button 
                  onClick={() => onRemovePlayer(player.id)}
                  className="text-red-400 hover:text-red-600 text-sm font-semibold px-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg mb-8">
          No elves added yet.
        </div>
      )}

      <button
        onClick={onStartGame}
        disabled={players.length < 2}
        className="w-full bg-christmas-red text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition active:scale-95 flex items-center justify-center gap-2"
      >
        <Play fill="currentColor" />
        Start Game
      </button>
    </div>
  );
};

export default GameLobby;