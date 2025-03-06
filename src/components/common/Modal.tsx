import React, { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    className?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className = ''
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const isBottomSheet = className.includes('bottom-0');

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            const scrollY = window.scrollY;
            
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
            
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            if (isOpen) {
                const scrollY = parseInt(document.body.style.top || '0', 10) * -1;
                
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                
                window.scrollTo(0, scrollY);
                
                document.removeEventListener('keydown', handleEscape);
                document.removeEventListener('mousedown', handleClickOutside);
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`  fixed inset-0 z-50 flex ${isBottomSheet ? 'items-end' : 'items-center'} justify-center bg-black/70 backdrop-blur-sm`}>
            <div
                ref={modalRef}
                className={`bg-neutral-900 scrollBar rounded-xl shadow-xl w-[90%] max-w-md max-h-[90vh] overflow-auto smooth ${className}`}
            >
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    {isBottomSheet && (
                        <div className="absolute left-0 right-0 top-0 flex justify-center">
                            <div className="w-12 h-1 bg-neutral-700 rounded-full my-2"></div>
                        </div>
                    )}
                    <h3 className="font-medium">{title || ''}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-neutral-800 rounded-full smooth"
                    >
                        <i className="fi fi-rr-cross text-neutral-500" />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal; 