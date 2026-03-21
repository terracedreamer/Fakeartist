import { motion } from 'framer-motion';

const variants = {
  primary:
    'bg-canvas-accent text-white font-semibold rounded-xl py-3 px-6 hover:opacity-90',
  secondary:
    'border-2 border-canvas-accent text-canvas-accent font-semibold rounded-xl py-3 px-6 hover:bg-canvas-accent/10',
  danger:
    'bg-red-500 text-white font-semibold rounded-xl py-3 px-6 hover:bg-red-600',
  small:
    'bg-canvas-accent text-white font-medium rounded-lg py-1.5 px-3 text-sm hover:opacity-90',
  'small-danger':
    'bg-red-500/10 text-red-400 font-medium rounded-lg py-1.5 px-3 text-sm hover:bg-red-500/20',
};

const AnimatedButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant] || variants.primary} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;
