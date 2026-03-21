import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

const AnimatedCounter = ({ value, prefix = '', suffix = '', className = '' }) => {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(value);
  const [delta, setDelta] = useState(null);
  const prevValue = useRef(value);
  const deltaKey = useRef(0);

  useEffect(() => {
    if (prevValue.current !== value) {
      const diff = value - prevValue.current;
      deltaKey.current += 1;
      setDelta({ value: diff, key: deltaKey.current });
      prevValue.current = value;
    }

    const controls = animate(motionValue, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });

    return controls.stop;
  }, [value, motionValue]);

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <span>
        {prefix}
        {displayValue}
        {suffix}
      </span>
      <AnimatePresence>
        {delta && (
          <motion.span
            key={delta.key}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -16 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute -top-4 right-0 text-xs font-bold ${
              delta.value >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {delta.value >= 0 ? '+' : ''}
            {delta.value}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};

export default AnimatedCounter;
