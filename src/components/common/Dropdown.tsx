import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownProps<T> {
    isOpen: boolean;
    onClose: () => void;
    trigger: ReactNode;
    items: T[];
    renderItem: (item: T) => ReactNode;
    selectedItem?: T;
    className?: string;
}

const Dropdown = <T,>({
    isOpen,
    onClose,
    trigger,
    items,
    renderItem,
    className = '',
}: DropdownProps<T>) => {
    return (
        <div className={`relative ${className}`}>
            {trigger}

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="gradient-background bg-neutral-950 !absolute  right-0 mt-2 z-50  !p-2 min-w-[80px]"
                        >
                            {items.map((item, index) => (
                                <div key={index} className='w-full'>{renderItem(item)}</div>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dropdown; 