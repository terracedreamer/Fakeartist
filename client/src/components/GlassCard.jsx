import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = false, onClick }) => {
  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      whileHover={
        hover
          ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
