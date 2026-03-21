import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';

const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Card */}
          <motion.div
            className="glass-card relative z-10 p-6 w-full max-w-sm text-center"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h3 className="text-xl font-bold text-canvas-text mb-2">{title}</h3>
            <p className="text-canvas-text/60 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <AnimatedButton variant="secondary" onClick={onCancel}>
                {cancelText}
              </AnimatedButton>
              <AnimatedButton variant="primary" onClick={onConfirm}>
                {confirmText}
              </AnimatedButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
