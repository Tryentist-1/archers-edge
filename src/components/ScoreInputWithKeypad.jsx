import React, { useState, useEffect, useRef } from 'react';
import { getScoreColorClass, isValidScoreInput, formatScore } from '../utils/scoring.js';
import ScoreKeypad from './ScoreKeypad.jsx';

/**
 * ScoreInputWithKeypad Component
 * 
 * A controlled input component for archery scores with integrated keypad.
 * Optimized for mobile use with touch-friendly keypad interface.
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

    const handleInputFocus = (e) => {
        setIsFocused(true);
        
        // Hide any other visible keypads first
        const allKeypads = document.querySelectorAll('#score-keypad');
        allKeypads.forEach(keypad => {
            if (keypad.style.display !== 'none') {
                keypad.style.display = 'none';
            }
        });
        
        setIsKeypadVisible(true);
        inputRef.current?.select();
        onFocus?.(e);
    };

    const handleInputBlur = (e) => {
        // Don't immediately hide keypad on blur - let user control it
        onBlur?.(e);
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
        
        // Auto-advance to next field after a short delay
        setTimeout(() => {
            handleNext();
        }, 100);
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
                nextInput.focus();
                nextInput.click(); // Trigger focus to show keypad
            }
        } else {
            // If we're at the last input, keep focus on current input
            currentInput.focus();
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
                prevInput.focus();
                prevInput.click(); // Trigger focus to show keypad
            }
        }
    };

    const handleClear = () => {
        setInputValue('');
        onChange?.('');
        inputRef.current?.focus();
    };

    const handleCloseKeypad = () => {
        console.log('handleCloseKeypad called'); // Debug log
        setIsKeypadVisible(false);
        setIsFocused(false);
        
        // Force blur and remove focus from current input
        if (inputRef.current) {
            inputRef.current.blur();
            // Also remove focus from any other inputs
            document.activeElement?.blur();
        }
        
        // Hide any other visible keypads
        const allKeypads = document.querySelectorAll('#score-keypad');
        allKeypads.forEach(keypad => {
            if (keypad.style.display !== 'none') {
                keypad.style.display = 'none';
            }
        });
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
                onClick={handleInputFocus}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                readOnly
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