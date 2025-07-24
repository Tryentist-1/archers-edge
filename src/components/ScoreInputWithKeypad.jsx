import React, { useState, useEffect, useRef } from 'react';
import { getScoreColorClass, isValidScoreInput, formatScore } from '../utils/scoring.js';
import ScoreKeypad from './ScoreKeypad.jsx';

// Global focus tracking (like the standalone version)
let currentlyFocusedInput = null;
let blurTimeout = null;

// Global keypad hide function
export const hideKeypad = () => {
    // Dispatch a custom event to hide all keypads
    window.dispatchEvent(new CustomEvent('hideKeypad'));
};

// Focus management utility
const ensureFocus = (element, callback = null) => {
    if (!element) return;
    
    // Use multiple strategies to ensure focus
    requestAnimationFrame(() => {
        element.focus();
        element.click();
        
        // Double-check focus after a short delay
        setTimeout(() => {
            if (document.activeElement !== element) {
                element.focus();
                element.click();
            }
            if (callback) callback();
        }, 10);
    });
};

/**
 * ScoreInputWithKeypad Component
 * 
 * A controlled input component for archery scores with integrated keypad.
 * Optimized for mobile use with touch-friendly keypad interface.
 * Also supports desktop keyboard input for better accessibility.
 */
function ScoreInputWithKeypad({ 
    value = '', 
    onChange, 
    placeholder = '', 
    className = '',
    disabled = false,
    autoFocus = false,
    onFocus,
    onBlur
}) {
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(true);
    const [isKeypadVisible, setIsKeypadVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Update internal state when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Cleanup effect when component unmounts
    useEffect(() => {
        return () => {
            // If this input was the currently focused one, clear the global reference
            if (currentlyFocusedInput === inputRef.current) {
                currentlyFocusedInput = null;
            }
            // Clear any pending blur timeout
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }
        };
    }, []);

    // Global effect to hide keypad when navigating between ends
    useEffect(() => {
        const handleEndChange = () => {
            // Hide keypad when navigating between ends
            setIsKeypadVisible(false);
            setIsFocused(false);
            currentlyFocusedInput = null;
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }
        };

        const handleHideKeypad = () => {
            // Hide keypad when global hide event is triggered
            setIsKeypadVisible(false);
            setIsFocused(false);
            currentlyFocusedInput = null;
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }
        };

        // Listen for end navigation events (you can customize this based on your app's navigation)
        window.addEventListener('endChange', handleEndChange);
        window.addEventListener('hideKeypad', handleHideKeypad);
        
        return () => {
            window.removeEventListener('endChange', handleEndChange);
            window.removeEventListener('hideKeypad', handleHideKeypad);
        };
    }, []);

    const handleInputFocus = (e) => {
        currentlyFocusedInput = inputRef.current;
        setIsFocused(true);
        
        // Clear any existing blur timeout
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        
        // Show keypad immediately
        setIsKeypadVisible(true);
        
        // Ensure input is selected
        if (inputRef.current) {
            inputRef.current.select();
        }
        
        onFocus?.(e);
    };

    const handleInputBlur = (e) => {
        if (blurTimeout) clearTimeout(blurTimeout);
        
        // Reduced timeout for faster response
        blurTimeout = setTimeout(() => {
            const activeElement = document.activeElement;
            const scoreKeypad = document.getElementById('score-keypad');
            const isKeypadButton = scoreKeypad && activeElement && 
                                  scoreKeypad.contains(activeElement) && 
                                  activeElement.tagName === 'BUTTON';
            const isScoreInput = activeElement && 
                                activeElement.tagName === 'INPUT' && 
                                activeElement.classList.contains('score-input-keypad');
            
            if (!isKeypadButton && !isScoreInput) {
                setIsKeypadVisible(false);
                setIsFocused(false);
                currentlyFocusedInput = null;
            }
            blurTimeout = null;
        }, 50); // Reduced from 150ms to 50ms for faster response
        
        onBlur?.(e);
    };

    // Handle keyboard input for desktop users
    const handleKeyDown = (e) => {
        if (disabled) return;

        // Allow navigation keys
        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
            return;
        }

        // Handle score input via keyboard
        const key = e.key.toLowerCase();
        let scoreValue = null;

        // Map keyboard keys to scores
        switch (key) {
            case 'x':
                scoreValue = 'X';
                break;
            case '0':
                scoreValue = '10';
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                scoreValue = key;
                break;
            case 'm':
                scoreValue = 'M';
                break;
            case 'enter':
            case ' ':
                // Auto-advance to next field
                handleNext();
                return;
            case 'tab':
                // Let default tab behavior work
                return;
            default:
                // Prevent other keys
                e.preventDefault();
                return;
        }

        if (scoreValue) {
            e.preventDefault();
            handleScoreInput(scoreValue);
        }
    };

    const handleScoreInput = (scoreValue) => {
        const newValue = scoreValue;
        setInputValue(newValue);
        
        // Validate input
        const valid = isValidScoreInput(newValue);
        setIsValid(valid);
        
        // Only call onChange if input is valid or empty
        if (valid || newValue === '') {
            onChange?.(newValue);
        }
        
        // Auto-advance to next field immediately for better responsiveness
        handleNext();
    };

    const handleNext = () => {
        // Find next input in the same table row or move to next row
        const currentInput = inputRef.current;
        if (!currentInput) return;

        const allInputs = Array.from(document.querySelectorAll('.score-input-keypad'));
        const currentIndex = allInputs.findIndex(input => input === currentInput);
        
        if (currentIndex !== -1 && currentIndex < allInputs.length - 1) {
            const nextInput = allInputs[currentIndex + 1];
            if (nextInput) {
                // Use improved focus management
                ensureFocus(nextInput);
            }
        } else {
            // If we're at the last input, hide keypad
            setIsKeypadVisible(false);
            setIsFocused(false);
            currentlyFocusedInput = null;
        }
    };

    const handlePrevious = () => {
        // Find previous input
        const currentInput = inputRef.current;
        if (!currentInput) return;

        const allInputs = Array.from(document.querySelectorAll('.score-input-keypad'));
        const currentIndex = allInputs.findIndex(input => input === currentInput);
        
        if (currentIndex > 0) {
            const prevInput = allInputs[currentIndex - 1];
            if (prevInput) {
                // Use improved focus management
                ensureFocus(prevInput);
            }
        }
    };

    const handleClear = () => {
        setInputValue('');
        onChange?.('');
        // Ensure focus stays on current input after clear
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleCloseKeypad = () => {
        // Force hide keypad immediately
        setIsKeypadVisible(false);
        setIsFocused(false);
        currentlyFocusedInput = null;
        
        // Clear any pending blur timeout
        if (blurTimeout) {
            clearTimeout(blurTimeout);
            blurTimeout = null;
        }
        
        // Also blur the current input
        if (inputRef.current) {
            inputRef.current.blur();
        }
        
        // Force focus to body to ensure keypad is completely hidden
        document.body.focus();
    };

    const colorClass = getScoreColorClass(inputValue);
    const borderClass = isValid ? 'border-gray-300' : 'border-red-500';

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={() => {}} // Read-only for keypad input
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                onClick={handleInputFocus}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                readOnly
                data-testid="score-input"
                title="Click to show keypad • Desktop: Type X, 0-9, M • Space/Enter: Next field"
                className={`
                    score-input-keypad
                    w-full h-full text-center text-sm font-bold border-0 
                    focus:outline-none focus:ring-0
                    transition-colors duration-200 cursor-pointer
                    ${colorClass}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${className}
                `}
                maxLength={2}
            />
            
            <ScoreKeypad
                isVisible={isKeypadVisible}
                onScoreInput={handleScoreInput}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onClear={handleClear}
                onClose={handleCloseKeypad}
            />
        </>
    );
}

export default ScoreInputWithKeypad; 