import { motion } from 'framer-motion';

const CountdownRing = ({
  seconds,
  remaining,
  size = 120,
  strokeWidth = 4,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds > 0 ? remaining / seconds : 0;
  const offset = circumference * (1 - progress);
  const isUrgent = remaining <= 3 && remaining > 0;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--canvas-border)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Animated foreground ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? '#ef4444' : 'var(--canvas-accent)'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      {/* Center text */}
      <span
        className={`absolute text-2xl font-bold ${
          isUrgent ? 'text-red-500' : 'text-canvas-text'
        }`}
      >
        {Math.ceil(remaining)}
      </span>
    </div>
  );
};

export default CountdownRing;
