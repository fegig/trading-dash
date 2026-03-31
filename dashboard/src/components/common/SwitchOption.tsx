import { motion } from "framer-motion";

const Switch = ({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) => {
  return (
    <motion.div
      className="w-9 h-5 bg-neutral-800 rounded-full p-1 cursor-pointer"
      onClick={onToggle}
      initial={false}
      animate={{
        backgroundColor: isOn ? '#22c55e' : '#262626'
      }}
    >
      <motion.div
        className="w-3 h-3 bg-white rounded-full"
        animate={{
          x: isOn ? 16 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </motion.div>
  );
};

export default Switch;
