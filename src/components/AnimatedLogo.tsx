import { motion } from 'motion/react';

export function AnimatedLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  const dimensions = size === 'large' ? 120 : 40;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: dimensions, height: dimensions }}>
      {/* Outer rotating ring */}
      <motion.div
        className="absolute rounded-full border-2 border-purple-500/30"
        style={{ width: dimensions, height: dimensions }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Middle rotating ring */}
      <motion.div
        className="absolute rounded-full border-2 border-fuchsia-500/40"
        style={{ width: dimensions * 0.75, height: dimensions * 0.75 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Inner pulsing circle */}
      <motion.div
        className="absolute rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600"
        style={{ width: dimensions * 0.5, height: dimensions * 0.5 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Sparkles */}
      {size === 'large' && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                top: `${Math.sin((i / 6) * Math.PI * 2) * 60 + 60}px`,
                left: `${Math.cos((i / 6) * Math.PI * 2) * 60 + 60}px`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
