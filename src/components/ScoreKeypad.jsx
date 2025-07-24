import React from 'react';

/**
 * ScoreKeypad Component
 * 
 * A mobile-friendly keypad for entering archery scores.
 * Based on the existing keypad implementation from the reference app.
 */
function ScoreKeypad({ 
    isVisible = false, 
    onScoreInput, 
    onNext, 
    onPrevious, 
    onClear, 
    onClose 
}) {
    const handleKeypadClick = (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        
        // Prevent event bubbling
        event.preventDefault();
        event.stopPropagation();
        
        const value = button.dataset.value;
        const action = button.dataset.action;
        
        if (value !== undefined) {
            onScoreInput?.(value);
        } else if (action) {
            switch (action) {
                case 'next':
                    onNext?.();
                    break;
                case 'back':
                    onPrevious?.();
                    break;
                case 'clear':
                    onClear?.();
                    break;
                case 'close':
                    // Force close immediately
                    onClose?.();
                    break;
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div 
            id="score-keypad" 
            className="fixed bottom-0 left-0 w-full bg-gray-800 p-1 shadow-lg z-40 grid grid-cols-4 gap-1"
            onClick={handleKeypadClick}
        >
            {/* Top row */}
            <button 
                type="button" 
                data-value="X" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-yellow-600 bg-yellow-400 text-black rounded active:bg-yellow-500"
            >
                X
            </button>
            <button 
                type="button" 
                data-value="10" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-yellow-600 bg-yellow-400 text-black rounded active:bg-yellow-500"
            >
                10
            </button>
            <button 
                type="button" 
                data-value="9" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-yellow-600 bg-yellow-400 text-black rounded active:bg-yellow-500"
            >
                9
            </button>
            <button 
                type="button" 
                data-action="next" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-green-600 bg-green-500 text-white rounded active:bg-green-600"
                title="Next Field"
            >
                ➡️
            </button>

            {/* Second row */}
            <button 
                type="button" 
                data-value="8" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-red-600 bg-red-600 text-white rounded active:bg-red-700"
            >
                8
            </button>
            <button 
                type="button" 
                data-value="7" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-red-600 bg-red-600 text-white rounded active:bg-red-700"
            >
                7
            </button>
            <button 
                type="button" 
                data-value="6" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-cyan-600 bg-cyan-400 text-black rounded active:bg-cyan-500"
            >
                6
            </button>
            <button 
                type="button" 
                data-action="back" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-orange-600 bg-orange-500 text-white rounded active:bg-orange-600"
                title="Previous Field"
            >
                ⬅️
            </button>

            {/* Third row */}
            <button 
                type="button" 
                data-value="5" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-cyan-600 bg-cyan-400 text-black rounded active:bg-cyan-500"
            >
                5
            </button>
            <button 
                type="button" 
                data-value="4" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-gray-700 bg-gray-800 text-white rounded active:bg-gray-900"
            >
                4
            </button>
            <button 
                type="button" 
                data-value="3" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-gray-700 bg-gray-800 text-white rounded active:bg-gray-900"
            >
                3
            </button>
            <button 
                type="button" 
                data-action="clear" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-yellow-600 bg-yellow-500 text-black rounded active:bg-yellow-600"
                title="Clear Field"
            >
                Clear
            </button>

            {/* Bottom row */}
            <button 
                type="button" 
                data-value="2" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-gray-300 bg-white text-black rounded active:bg-gray-100"
            >
                2
            </button>
            <button 
                type="button" 
                data-value="1" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-gray-300 bg-white text-black rounded active:bg-gray-100"
            >
                1
            </button>
            <button 
                type="button" 
                data-value="M" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-gray-300 bg-white text-gray-500 rounded active:bg-gray-100"
            >
                M
            </button>
            <button 
                type="button" 
                data-action="close" 
                className="keypad-btn p-1 text-sm font-bold text-center border border-blue-600 bg-blue-500 text-white rounded active:bg-blue-600"
                title="Close Keypad"
            >
                Close
            </button>
        </div>
    );
}

export default ScoreKeypad; 