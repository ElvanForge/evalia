import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationProps {
  visible: boolean;
  onComplete?: () => void;
}

/**
 * A celebratory animation component that shows when a correct answer is selected
 */
export function QuizCelebration({ visible, onComplete }: CelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; color: string; x: number; y: number; size: number }[]>([]);
  
  // Generate celebratory particles when visible
  useEffect(() => {
    if (visible) {
      // Create a bunch of colorful particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: getRandomColor(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 5 + Math.random() * 15
      }));
      
      setParticles(newParticles);
      
      // Hide celebration after 2 seconds
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);
  
  // Generate bright, celebratory colors
  const getRandomColor = () => {
    const colors = [
      '#FF5252', // Red
      '#FFEB3B', // Yellow
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#9C27B0', // Purple
      '#FF9800', // Orange
      '#00BCD4', // Cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  if (!visible) return null;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{ 
                scale: 0,
                opacity: 1,
                x: 0,
                y: 0
              }}
              animate={{ 
                scale: [0, 1, 0.8],
                opacity: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 200],
                y: [0, (Math.random() - 0.5) * 200 - 100]
              }}
              transition={{ 
                duration: 1.5,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Success message */}
          <motion.div
            className="bg-primary/90 text-primary-foreground rounded-full px-8 py-3 shadow-lg"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}