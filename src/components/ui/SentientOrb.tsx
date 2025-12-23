import React from 'react';
import { motion } from 'framer-motion';

type SentientOrbProps = {
  className?: string;
  isThinking?: boolean;
};

export default function SentientOrb({ className = 'w-16 h-16', isThinking = false }: SentientOrbProps) {
  const rot1 = isThinking ? 1 : 10;
  const rot2 = isThinking ? 1 : 7;
  const moveDur = isThinking ? 1 : 5;

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      aria-hidden
      style={{ willChange: 'transform' }}
      whileHover={{ scale: 1.03 }}
    >
      {/* Outer atmospheric glow */}
      <div
        className="absolute rounded-full inset-0 pointer-events-none"
        style={{
          boxShadow: '0 0 50px rgba(57,224,121,0.5)',
          zIndex: 0,
        }}
      />

      {/* Liquid core engine with heavy contrast to create gooey merges */}
      <div
        className="relative rounded-full overflow-hidden bg-black"
        style={{
          width: '100%',
          height: '100%',
          filter: 'contrast(200%) brightness(150%)',
          mixBlendMode: 'screen',
        }}
      >
        {/* Blob 1 - deep energy (gradient) */}
        <motion.div
          className="absolute rounded-full blur-[20px] opacity-90"
          style={{
            width: '140%',
            height: '140%',
            left: '-20%',
            top: '-20%',
            background: 'linear-gradient(90deg, #39E079 0%, #06b6d4 100%)',
            zIndex: 2,
            transformOrigin: '50% 50%',
            mixBlendMode: 'screen',
          }}
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{
            rotate: { duration: rot1, repeat: Infinity, ease: 'linear' },
            scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Blob 2 - high energy (solid) */}
        <motion.div
          className="absolute rounded-full blur-[24px] bg-[#39E079]"
          style={{
            width: '48%',
            height: '48%',
            left: '26%',
            top: '18%',
            zIndex: 3,
            mixBlendMode: 'screen',
          }}
          animate={{
            rotate: -360,
            x: [0, 20, -20, 0],
            y: [0, -12, 12, 0],
          }}
          transition={{
            rotate: { duration: rot2, repeat: Infinity, ease: 'linear' },
            x: { duration: moveDur, repeat: Infinity, ease: 'easeInOut' },
            y: { duration: moveDur, repeat: Infinity, ease: 'easeInOut' },
          }}
        />

        {/* Blob 3 - specular white glow */}
        <motion.div
          className="absolute rounded-full blur-[28px]"
          style={{
            width: '60%',
            height: '60%',
            left: '10%',
            top: '40%',
            background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.14) 25%, transparent 60%)',
            zIndex: 4,
            mixBlendMode: 'screen',
          }}
          animate={{ opacity: [0.9, 0.6, 0.9] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Central anchor core (dark) to give the orb depth */}
        <div
          className="absolute rounded-full"
          style={{
            width: '44%',
            height: '44%',
            left: '28%',
            top: '28%',
            background: 'rgba(0,0,0,0.9)',
            zIndex: 6,
            boxShadow: 'inset 0 6px 18px rgba(0,0,0,0.7)',
          }}
        />
      </div>
    </motion.div>
  );
}
