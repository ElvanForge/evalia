import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  visible: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  color: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  delay: number;
  shape: 'circle' | 'square' | 'triangle'; // Add various shapes for a confetti-like effect
}

/**
 * A celebratory animation component that shows when a correct answer is selected
 * Enhanced with better positioning, more variety in particles, and better performance
 */
export function QuizCelebration({ visible, onComplete }: CelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate celebratory particles when visible
  useEffect(() => {
    if (visible) {
      // Create a bunch of colorful particles with more variety
      const newParticles = Array.from({ length: 75 }, (_, i) => {
        // Randomize particle properties for more interesting visuals
        const shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle';
        const delay = Math.random() * 0.3; // Stagger the animation start times
        const speed = 0.8 + Math.random() * 1.2; // Vary the animation speed
        
        return {
          id: i,
          color: getRandomColor(),
          // Center particles more in the question area (40-60% horizontally, 30-60% vertically)
          x: 40 + Math.random() * 20,
          y: 30 + Math.random() * 30,
          size: 4 + Math.random() * 12,
          rotation: Math.random() * 360,
          speed,
          delay,
          shape
        };
      });
      
      setParticles(newParticles);
      
      // Hide celebration after animation completes (slightly longer for better effect)
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);
  
  // Generate bright, celebratory colors with more variety
  const getRandomColor = () => {
    const colors = [
      '#FF5252', // Red
      '#FFEB3B', // Yellow
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#00BCD4', // Cyan
      '#FF4081', // Pink
      '#7C4DFF', // Deep Purple
      '#FFAB40', // Amber
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={containerRef}
          className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute ${
                particle.shape === 'circle' 
                  ? 'rounded-full' 
                  : particle.shape === 'square' 
                    ? 'rounded-sm' 
                    : 'triangle' // CSS triangle created with border trick
              }`}
              style={{
                backgroundColor: particle.shape !== 'triangle' ? particle.color : 'transparent',
                borderBottom: particle.shape === 'triangle' ? `${particle.size}px solid ${particle.color}` : 'none',
                borderLeft: particle.shape === 'triangle' ? `${particle.size/2}px solid transparent` : 'none',
                borderRight: particle.shape === 'triangle' ? `${particle.size/2}px solid transparent` : 'none',
                width: particle.shape !== 'triangle' ? particle.size : 0,
                height: particle.shape !== 'triangle' ? particle.size : 0,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: `rotate(${particle.rotation}deg)`,
              }}
              initial={{ 
                scale: 0,
                opacity: 1,
                x: 0,
                y: 0,
                rotate: 0
              }}
              animate={{ 
                scale: [0, 1, 0.8],
                opacity: [0, 1, 0],
                // More random and varied movement patterns
                x: [0, (Math.random() - 0.5) * 300 * particle.speed],
                y: [0, (Math.random() - 0.5) * 300 * particle.speed - 150 * particle.speed],
                // Add rotation for a more dynamic feel
                rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)]
              }}
              transition={{ 
                duration: 1.5 * particle.speed,
                ease: "easeOut",
                delay: particle.delay
              }}
            />
          ))}
          
          {/* Success message - fixed in the middle of the screen with better positioning */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="bg-primary/90 text-primary-foreground rounded-full px-8 py-3 shadow-lg z-50"
              initial={{ scale: 0, y: 20 }}
              animate={{ 
                scale: [0, 1.2, 1],
                y: [20, -20, 0]
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeOut" 
              }}
            >
              <motion.h3 
                className="text-2xl font-bold"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  repeat: 3,
                  duration: 0.4
                }}
              >
                Correct! 🎉
              </motion.h3>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}