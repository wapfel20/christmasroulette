
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { WHEEL_SEGMENTS } from '../constants';
import { WheelSegment } from '../types';
import { Gift, Snowflake, Hand, Hammer, Box, ArrowLeftRight, Moon, Target } from 'lucide-react';

interface WheelProps {
  isSpinning: boolean;
  targetSegment: WheelSegment | null;
  onSpinComplete: () => void;
}

const Wheel: React.FC<WheelProps> = ({ isSpinning, targetSegment, onSpinComplete }) => {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(0);
  
  // Audio Refs
  const spinAudioRef = useRef<HTMLAudioElement>(null);
  const winAudioRef = useRef<HTMLAudioElement>(null);

  // Helper to extract current rotation
  const getCurrentRotation = (el: HTMLElement) => {
    const st = window.getComputedStyle(el, null);
    const tm = st.getPropertyValue("transform") || "none";
    if (tm !== "none") {
      const values = tm.split('(')[1].split(')')[0].split(',');
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      let angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
      return (angle < 0 ? angle + 360 : angle);
    }
    return 0;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWheelSize(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const segmentAngle = 360 / WHEEL_SEGMENTS.length; 
  const safeSize = wheelSize || 300; 
  
  // Responsive Config
  const isSmallScreen = safeSize < 500;
  
  // Bezel configuration (Percentages of total width)
  // Mobile: 3% thickness (Thinner, standard)
  // Desktop: 5% thickness (Wider, festive)
  const bezelPct = isSmallScreen ? 3 : 5; 
  
  // Font/Icon Scaling
  const fontSize = Math.max(9, safeSize / 32); 
  const iconSize = Math.max(14, safeSize / 18); 
  const iconPadding = Math.max(4, safeSize / 100);
  const pointerSize = Math.max(24, safeSize / 6); 
  const centerCapSize = safeSize * 0.13;
  const centerBorderWidth = Math.max(2, safeSize / 150);

  // Lights Config
  const numLights = 36;
  const lightSizePct = 3; // Light size as percentage of container

  const lights = useMemo(() => {
    const colors = ['#2F5D35', '#EAB308', '#D42426', '#3b82f6']; 
    return Array.from({ length: numLights }).map((_, i) => ({
      color: colors[i % colors.length],
      animationDuration: 3 + Math.random() * 2 + 's',
      animationDelay: Math.random() * 2 + 's'
    }));
  }, []);

  // Audio Logic
  useEffect(() => {
    if (isSpinning) {
      if (spinAudioRef.current) {
        spinAudioRef.current.currentTime = 0;
        spinAudioRef.current.volume = 0.4;
        spinAudioRef.current.play().catch(() => {});
      }
    } else {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current.currentTime = 0;
      }
    }
  }, [isSpinning]);

  // Spin Logic
  useEffect(() => {
    if (!wheelRef.current) return;

    if (isSpinning && !targetSegment) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.animation = 'spin-clockwise 1s linear infinite';
    } 
    else if (isSpinning && targetSegment) {
        const currentRotation = getCurrentRotation(wheelRef.current);
        wheelRef.current.style.animation = 'none';
        wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
        void wheelRef.current.offsetWidth;

        const targetIndex = WHEEL_SEGMENTS.findIndex(s => s.id === targetSegment.id);
        const targetWedgeAngle = (targetIndex * segmentAngle) + (segmentAngle / 2);
        
        // Align target with Top (0 deg)
        let desiredRotation = 360 - targetWedgeAngle;
        if (desiredRotation >= 360) desiredRotation -= 360;
        if (desiredRotation < 0) desiredRotation += 360;

        const currentMod = currentRotation % 360;
        let adjustment = desiredRotation - currentMod;
        if (adjustment < 0) adjustment += 360;
        
        const extraSpins = 720; 
        const finalRotation = currentRotation + extraSpins + adjustment;

        setRotation(finalRotation);
        wheelRef.current.style.transition = 'transform 5s cubic-bezier(0.25, 1, 0.5, 1)';
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;

        setTimeout(() => {
            if (winAudioRef.current) {
                winAudioRef.current.currentTime = 0;
                winAudioRef.current.play().catch(() => {});
            }
            onSpinComplete();
        }, 5000);
    }
  }, [isSpinning, targetSegment, onSpinComplete, segmentAngle]);

  const pathD = `M50 50 L100 50 A50 50 0 0 1 ${50 + 50 * Math.cos((segmentAngle * Math.PI) / 180)} ${50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)} L50 50`;

  const renderIcon = (iconName: string, color: string, size: number) => {
    const props = { color: color, size: size, className: "drop-shadow-sm" };
    switch (iconName) {
      case 'santa': return <Gift {...props} />;
      case 'snowflake': return <Snowflake {...props} />;
      case 'hand': return <Hand {...props} />;
      case 'hammer': return <Hammer {...props} />;
      case 'box': return <Box {...props} />;
      case 'shuffle': return <ArrowLeftRight {...props} />;
      case 'moon': return <Moon {...props} />;
      case 'radar': return <Target {...props} />;
      default: return null;
    }
  };

  const getTextShadow = (textColor: string) => {
    const isDarkText = textColor === '#422006' || textColor === '#713f12' || textColor === '#14532d';
    if (isDarkText) return '0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.2)';
    return '0 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)';
  };

  return (
    <div ref={containerRef} className="relative w-full h-full aspect-square mx-auto select-none">
      <style>
        {`
          @keyframes spin-clockwise {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes light-twinkle {
            0%, 100% { opacity: 0.3; transform: scale(0.9); }
            15%, 85% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px currentColor; }
          }
        `}
      </style>

      {/* Audio */}
      <audio ref={spinAudioRef} loop preload="auto">
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/3/36/Bicycle_wheel_spinning_freely.ogg/Bicycle_wheel_spinning_freely.ogg.mp3" type="audio/mpeg" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/3/36/Bicycle_wheel_spinning_freely.ogg" type="audio/ogg" />
      </audio>
      <audio ref={winAudioRef} preload="auto">
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/1/15/Sleigh_bells.ogg/Sleigh_bells.ogg.mp3" type="audio/mpeg" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/1/15/Sleigh_bells.ogg" type="audio/ogg" />
      </audio>

      {/* Bezel Layer (SVG Overlay for perfect scaling) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 drop-shadow-xl" viewBox="0 0 100 100">
        <circle 
          cx="50" 
          cy="50" 
          r={50 - (bezelPct / 2)} 
          fill="none" 
          stroke="white" 
          strokeWidth={bezelPct} 
        />
      </svg>

      {/* Lights Overlay - Only Show on Desktop (Wide Screens) */}
      {!isSmallScreen && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {lights.map((light, i) => {
             const angle = (i * (360 / numLights) - 90) * (Math.PI / 180);
             // Position relative to 100% container
             // Radius is from center (50) to middle of bezel
             const r = 50 - (bezelPct / 2);
             const x = 50 + r * Math.cos(angle);
             const y = 50 + r * Math.sin(angle);

             return (
               <div 
                 key={`light-${i}`}
                 className="absolute rounded-full shadow-sm"
                 style={{
                   left: `${x}%`,
                   top: `${y}%`,
                   width: `${lightSizePct}%`,
                   height: `${lightSizePct}%`,
                   marginLeft: `-${lightSizePct/2}%`,
                   marginTop: `-${lightSizePct/2}%`,
                   backgroundColor: light.color,
                   color: light.color,
                   animation: `light-twinkle ${light.animationDuration} infinite ease-in-out`,
                   animationDelay: light.animationDelay,
                 }}
               />
             );
          })}
        </div>
      )}

      {/* Pointer */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%] z-30 pointer-events-none filter drop-shadow-xl"
        style={{ width: pointerSize, height: pointerSize }}
      >
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
           <circle cx="50" cy="50" r="30" fill="black" fillOpacity="0.2" filter="blur(5px)" />
           <path d="M50 20 C30 20 20 50 50 85 C80 50 70 20 50 20 Z" fill="#15803d" stroke="#f0fdf4" strokeWidth="2" />
           <path d="M50 20 C40 10 10 30 30 60 L50 40 L70 60 C90 30 60 10 50 20 Z" fill="#166534" stroke="#f0fdf4" strokeWidth="1" />
           <path d="M50 20 L50 80" stroke="#86efac" strokeWidth="1" opacity="0.5" />
           <circle cx="50" cy="40" r="8" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
           <circle cx="54" cy="35" r="2" fill="white" opacity="0.4" />
           <circle cx="38" cy="35" r="7" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
           <circle cx="41" cy="31" r="2" fill="white" opacity="0.4" />
           <circle cx="62" cy="35" r="7" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
           <circle cx="65" cy="31" r="2" fill="white" opacity="0.4" />
        </svg>
      </div>

      {/* Inner Wheel Container (Padded by Bezel Width to fit perfectly inside) */}
      <div 
        className="w-full h-full"
        style={{ padding: `${bezelPct}%` }}
      >
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <pattern id="pattern-candy-cane" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                <rect width="20" height="20" fill="#FDFBF7" />
                <rect width="10" height="20" fill="#D42426" />
                <rect x="8" width="1" height="20" fill="#991b1b" opacity="0.2" />
              </pattern>
              <pattern id="pattern-snowflake-blue" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#7DD3FC" />
                <circle cx="10" cy="10" r="3" fill="white" opacity="0.9" />
                <path d="M10 2 L10 18 M2 10 L18 10 M4 4 L16 16 M4 16 L16 4" stroke="white" strokeWidth="0.5" opacity="0.6" />
              </pattern>
              <pattern id="pattern-red-dots" patternUnits="userSpaceOnUse" width="15" height="15">
                <rect width="15" height="15" fill="#D42426" />
                <circle cx="7.5" cy="7.5" r="3" fill="#FDFBF7" />
                <circle cx="0" cy="0" r="1.5" fill="#FDFBF7" opacity="0.5" />
                <circle cx="15" cy="0" r="1.5" fill="#FDFBF7" opacity="0.5" />
                <circle cx="0" cy="15" r="1.5" fill="#FDFBF7" opacity="0.5" />
                <circle cx="15" cy="15" r="1.5" fill="#FDFBF7" opacity="0.5" />
              </pattern>
              <pattern id="pattern-plaid" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#166534" />
                <rect width="20" height="10" y="0" fill="#15803d" />
                <rect width="20" height="2" y="4" fill="#b91c1c" />
                <rect width="20" height="2" y="14" fill="#b91c1c" />
                <rect width="2" height="20" x="4" fill="#b91c1c" />
                <rect width="2" height="20" x="14" fill="#b91c1c" />
                <rect width="20" height="0.5" y="9" fill="#EAB308" />
                <rect width="0.5" height="20" x="9" fill="#EAB308" />
              </pattern>
              <pattern id="pattern-gold-foil" patternUnits="userSpaceOnUse" width="10" height="10">
                 <rect width="10" height="10" fill="#EAB308" />
                 <rect width="10" height="10" fill="white" opacity="0.1" />
                 <path d="M0 10 L10 0" stroke="#ca8a04" strokeWidth="1" opacity="0.3" />
                 <circle cx="5" cy="5" r="1" fill="#FDFBF7" opacity="0.6" />
              </pattern>
              <pattern id="pattern-stripes-rg" patternUnits="userSpaceOnUse" width="15" height="15">
                <rect width="15" height="15" fill="#D42426" />
                <rect x="5" width="5" height="15" fill="#166534" />
                <rect x="2" width="1" height="15" fill="#EAB308" />
                <rect x="12" width="1" height="15" fill="#FDFBF7" />
              </pattern>
              <pattern id="pattern-kraft" patternUnits="userSpaceOnUse" width="10" height="10">
                <rect width="10" height="10" fill="#d4b881" />
                <rect x="0" y="0" width="10" height="10" fill="#000" opacity="0.05" />
                <circle cx="3" cy="3" r="0.5" fill="#5c3a18" opacity="0.2" />
                <circle cx="8" cy="7" r="0.5" fill="#5c3a18" opacity="0.2" />
              </pattern>
              <pattern id="pattern-zigzag-red" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(90)">
                <rect width="20" height="20" fill="#D42426" />
                <path d="M0 10 L5 5 L10 10 L15 5 L20 10 L20 15 L15 10 L10 15 L5 10 L0 15 Z" fill="#FDFBF7" />
                <path d="M0 0 L5 5 L10 0" fill="none" stroke="#991b1b" strokeWidth="1" opacity="0.3" />
              </pattern>
               <pattern id="pattern-holly" patternUnits="userSpaceOnUse" width="24" height="24">
                <rect width="24" height="24" fill="#dcfce7" />
                <circle cx="12" cy="12" r="2" fill="#D42426" />
                <circle cx="14" cy="10" r="2" fill="#D42426" />
                <circle cx="10" cy="10" r="2" fill="#D42426" />
                <path d="M6 12 Q2 8 6 4 Q10 8 6 12" fill="#22c55e" opacity="0.6" />
                <path d="M18 12 Q22 8 18 4 Q14 8 18 12" fill="#22c55e" opacity="0.6" />
                <path d="M12 18 Q8 22 12 26 Q16 22 12 18" fill="#22c55e" opacity="0.6" />
              </pattern>
               <pattern id="pattern-midnight" patternUnits="userSpaceOnUse" width="30" height="30">
                <rect width="30" height="30" fill="#1e3a8a" />
                <path d="M15 5 L16 9 L20 9 L17 12 L18 16 L15 13 L12 16 L13 12 L10 9 L14 9 Z" fill="#fbbf24" transform="scale(0.8) translate(10,5)" />
                <circle cx="5" cy="20" r="1" fill="white" opacity="0.8" />
                <circle cx="25" cy="25" r="1.5" fill="white" opacity="0.6" />
              </pattern>
              <pattern id="pattern-snowflake-red" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#ef4444" />
                <path d="M10 2 L10 18 M2 10 L18 10" stroke="white" strokeWidth="1.5" opacity="0.8" />
                <circle cx="10" cy="10" r="2" fill="white" opacity="0.9" />
              </pattern>
              <pattern id="pattern-gingerbread" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#92400e" />
                <circle cx="10" cy="10" r="6" fill="none" stroke="#FDFBF7" strokeWidth={1.5} strokeDasharray="2 2" />
                <circle cx="10" cy="10" r="1" fill="#ef4444" />
                <path d="M5 5 L15 15 M15 5 L5 15" stroke="#16a34a" strokeWidth="0.5" opacity="0.5" />
              </pattern>
            </defs>
            
            {WHEEL_SEGMENTS.map((segment, index) => (
              <path
                key={segment.id}
                d={pathD}
                fill={segment.color}
                stroke="white"
                strokeWidth="0.5"
                transform={`rotate(${index * segmentAngle}, 50, 50)`}
              />
            ))}
          </svg>

          {/* Content Layer */}
          {WHEEL_SEGMENTS.map((segment, index) => {
             const rot = index * segmentAngle + (segmentAngle / 2);
             const textShadow = getTextShadow(segment.textColor);
             
             const isLongText = segment.label.length > 14;
             const isVeryLongText = segment.label.length > 16;
             const trackingClass = isLongText ? 'tracking-normal' : 'tracking-widest';
             const fontScale = isVeryLongText ? 0.85 : (isLongText ? 0.9 : 1);

             return (
              <div
                key={`text-${segment.id}`}
                className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                 <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center justify-start h-full"
                  style={{ paddingTop: `${safeSize * 0.04}px` }}
                 >
                   <div 
                    className="mb-2 transform -rotate-90 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center" 
                    style={{ 
                      transform: 'rotate(0deg)',
                      padding: `${iconPadding}px`,
                    }}
                   >
                     {renderIcon(segment.icon, segment.color.includes('pattern') ? '#D42426' : segment.color, iconSize)}
                   </div>
                   <div 
                    className={`whitespace-nowrap font-bold font-christmas ${trackingClass}`}
                    style={{ 
                      fontSize: `${fontSize * fontScale}px`,
                      color: segment.textColor,
                      writingMode: 'vertical-rl',
                      textOrientation: 'mixed',
                      textShadow: textShadow,
                      height: '65%',
                      textAlign: 'center',
                      lineHeight: '1.2',
                    }}
                   >
                     {segment.label}
                   </div>
                 </div>
              </div>
             )
          })}

          {/* Center Cap */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-christmas-gold to-yellow-600 rounded-full shadow-lg z-10 border-white flex items-center justify-center"
            style={{ width: centerCapSize, height: centerCapSize, borderWidth: centerBorderWidth }}
          >
             <div className="w-[20%] h-[20%] bg-white rounded-full shadow-inner"></div>
          </div>
        </div>
      </div>
      
      {/* Base/Stand Graphic */}
      <div className="absolute -bottom-[10%] left-1/2 -translate-x-1/2 w-[40%] h-[15%] bg-gray-800 rounded-t-full -z-10 opacity-20 blur-sm"></div>
    </div>
  );
};

export default Wheel;
