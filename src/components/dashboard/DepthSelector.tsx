import { useState } from 'react';
import { motion } from 'framer-motion';
import Dropdown from '../common/Dropdown';

interface DepthSelectorProps {
    currentDepth: number;
    onDepthChange: (depth: number) => void;
}

const DepthSelector = ({ currentDepth, onDepthChange }: DepthSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const depths = [10, 25, 50, 100];

    const trigger = (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-neutral-300 focus:outline-none"
            aria-label="Select order book depth"
        >
            <span>{currentDepth}</span>
            <i className={`fi fi-rr-angle-small-down transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );

    const renderDepthItem = (depth: number) => (
        <motion.button
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            onClick={() => {
                onDepthChange(depth);
                setIsOpen(false);
            }}
            className={`w-full px-4 py-2 text-left text-xs ${
                depth === currentDepth ? 'text-green-400' : 'text-neutral-200'
            }`}
        >
            {depth}
        </motion.button>
    );

    return (
        <Dropdown
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            trigger={trigger}
            items={depths}
            renderItem={renderDepthItem}
            selectedItem={currentDepth}
        />
    );
};

export default DepthSelector; 