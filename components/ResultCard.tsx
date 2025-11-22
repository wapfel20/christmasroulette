import React, { useEffect, useState, useRef } from 'react';
import { WheelSegment, Player } from '../types';
import { X, Sparkles, Loader2, Volume2, VolumeX } from 'lucide-react';
import { generateCommentary, generateElfSpeech } from '../services/geminiService';

interface ResultCardProps {
  segment: WheelSegment;
  player: Player;
  onClose: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ segment, player, onClose }) => {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        // 1. Generate Text
        const text = await generateCommentary(segment, player.name);
        setCommentary(text);

        // 2. Generate Audio
        const script = `Ho ho ho! ${player.name} landed on ${segment.label}! Here is the rule. ${segment.description}. ${text}`;
        const buffer = await generateElfSpeech(script);
        setAudioBuffer(buffer);
      } catch (e) {
        console.error("Error generating content:", e);
        setCommentary("The elves are having trouble with the connection!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [segment, player.name]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Auto-play when audioBuffer becomes available
  useEffect(() => {
    if (audioBuffer) {
      playAudio(audioBuffer);
    }
  }, [audioBuffer]);

  const playAudio = async (buffer: AudioBuffer) => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      // Re-create context if closed or not exists
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => setIsPlaying(false);
      
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (e) {
      console.error("Autoplay blocked or failed:", e);
      setIsPlaying(false);
    }
  };

  const handlePlayClick = () => {
    if (isPlaying) {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsPlaying(false);
    } else if (audioBuffer) {
      playAudio(audioBuffer);
    }
  };

  // Helper to determine solid background colors for the header based on patterns
  const getHeaderStyle = () => {
    const c = segment.color;
    
    // Handle Patterns (Map to solid dominant colors)
    if (c.includes('candy-cane')) return { bg: '#D42426', text: '#FFFFFF' };
    if (c.includes('snowflake-blue')) return { bg: '#7DD3FC', text: '#FFFFFF' };
    if (c.includes('red-dots')) return { bg: '#D42426', text: '#FFFFFF' };
    if (c.includes('plaid')) return { bg: '#166534', text: '#FFFFFF' };
    if (c.includes('gold-foil')) return { bg: '#EAB308', text: '#713f12' };
    if (c.includes('stripes-rg')) return { bg: '#D42426', text: '#FFFFFF' };
    if (c.includes('kraft')) return { bg: '#d4b881', text: '#422006' };
    if (c.includes('zigzag-red')) return { bg: '#D42426', text: '#FFFFFF' };
    if (c.includes('holly')) return { bg: '#dcfce7', text: '#14532d' };
    if (c.includes('midnight')) return { bg: '#1E3A8A', text: '#fbbf24' };
    if (c.includes('snowflake-red')) return { bg: '#ef4444', text: '#FFFFFF' };
    if (c.includes('gingerbread')) return { bg: '#92400e', text: '#FFFFFF' };

    // Handle Solid Hex Codes (Non-patterns)
    if (!c.includes('url')) {
       if (c === '#FDFBF7') return { bg: '#2F5D35', text: '#FFFFFF' }; // If cream, use Green bg
       return { bg: c, text: segment.textColor };
    }

    // Fallback
    return { bg: '#D42426', text: '#FFFFFF' };
  };

  const headerStyle = getHeaderStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-christmas-gold transform transition-all scale-100 relative">
        
        {/* Decorative Header */}
        <div 
          className={`p-6 text-center relative overflow-hidden`} 
          style={{ backgroundColor: headerStyle.bg }}
        >
           {/* Pattern overlay */}
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
           
           <h2 className="text-3xl font-christmas relative z-10" style={{ color: headerStyle.text }}>
             {player.name} landed on...
           </h2>
           <div className="mt-2 text-4xl md:text-5xl font-extrabold uppercase tracking-tight relative z-10 drop-shadow-md" style={{ color: headerStyle.text }}>
             {segment.label}
           </div>
        </div>

        <div className="p-8 text-center">
          <div className="mb-6">
             <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">The Rule</h3>
             <p className="text-2xl text-gray-800 font-christmas font-bold leading-relaxed">
               {segment.description}
             </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-christmas-green">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-bold text-xs uppercase">Elf Commentary</span>
              </div>
              
              {/* Audio Controls */}
              {isLoading && !audioBuffer ? (
                 <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : audioBuffer ? (
                 <button 
                   onClick={handlePlayClick}
                   className={`flex items-center gap-1 text-xs font-bold uppercase px-2 py-1 rounded-full transition-all ${isPlaying ? 'bg-christmas-green text-white animate-pulse' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                 >
                   {isPlaying ? <Volume2 size={14} /> : <Volume2 size={14} />}
                   {isPlaying ? 'Speaking...' : 'Replay Elf'}
                 </button>
              ) : null}
            </div>
            
            {isLoading && !commentary ? (
               <div className="flex justify-center py-2 text-gray-400">
                 <Loader2 className="animate-spin" />
               </div>
            ) : (
              <p className="text-gray-600 italic text-sm md:text-base">
                "{commentary}"
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;