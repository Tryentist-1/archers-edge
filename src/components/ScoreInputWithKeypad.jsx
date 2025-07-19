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
        setIsKeypadVisible(false);
        setIsFocused(false);
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
                    w-10 h-8 text-center text-sm font-bold rounded border-2 
                    focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200 cursor-pointer
                    ${colorClass}
                    ${borderClass}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
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