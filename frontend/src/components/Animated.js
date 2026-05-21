import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const pageTransition = { duration: 0.22, ease: 'easeOut' };

export const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

export const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay }}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({ children, delay = 0, direction = 'left' }) => (
  <motion.div
    initial={{ opacity: 0, x: direction === 'left' ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay }}
  >
    {children}
  </motion.div>
);

export const CardMotion = ({ children, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
    transition={{ duration: 0.2, delay }}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    {children}
  </motion.div>
);

export const ListItem = ({ children, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.18, delay: index * 0.04 }}
  >
    {children}
  </motion.div>
);

export const ModalMotion = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.18 }}
  >
    {children}
  </motion.div>
);
