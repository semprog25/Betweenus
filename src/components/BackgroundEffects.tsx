import { motion } from 'motion/react';
import { useMemo } from 'react';

const VIBRANT_COLORS = [
  'from-orange-500 to-yellow-400',
  'from-pink-500 to-fuchsia-600',
  'from-cyan-500 to-blue-500',
  'from-purple-500 to-indigo-600',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-pink-500',
];

export function BackgroundEffects() {
  // Generate static random values once using useMemo to prevent re-renders
  const orbs = useMemo(() => 
    [...Array(6)].map((_, i) => ({
      width: Math.random() * 300 + 200,
      height: Math.random() * 300 + 200,
      left: Math.random() * 100,
      top: Math.random() * 100,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 15 + 15,
      colorIndex: i % VIBRANT_COLORS.length,
    })), []
  );

  const sparkles = useMemo(() =>
    [...Array(30)].map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      color: i % 2 === 0 ? '#a855f7' : '#ec4899',
    })), []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating gradient orbs */}
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className={`absolute rounded-full blur-3xl opacity-10 dark:opacity-10 bg-gradient-to-br ${
            VIBRANT_COLORS[orb.colorIndex]
          }`}
          style={{
            width: orb.width,
            height: orb.height,
            left: `${orb.left}%`,
            top: `${orb.top}%`,
          }}
          animate={{
            x: [0, orb.x, 0],
            y: [0, orb.y, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Colorful sparkles */}
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            background: sparkle.color,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            y: [0, -30, -60],
          }}
          transition={{
            duration: sparkle.duration,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
      
      {/* Wave effect */}
      <svg className="absolute bottom-0 w-full opacity-30 dark:opacity-20" style={{ height: '300px' }} preserveAspectRatio="none">
        <motion.path
          d="M0,150 Q250,100 500,150 T1000,150 T1500,150 T2000,150 V300 H0 Z"
          fill="url(#wave-gradient)"
          animate={{
            d: [
              "M0,150 Q250,100 500,150 T1000,150 T1500,150 T2000,150 V300 H0 Z",
              "M0,150 Q250,200 500,150 T1000,150 T1500,150 T2000,150 V300 H0 Z",
              "M0,150 Q250,100 500,150 T1000,150 T1500,150 T2000,150 V300 H0 Z",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}