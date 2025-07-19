import React, { useState, useEffect, useRef } from 'react';
import { getScoreColorClass, isValidScoreInput, formatScore } from '../utils/scoring.js';

/**
 * ScoreInput Component
 * 
 * A controlled input component for archery scores with validation and color coding.
 * Supports X (10), M (miss), and numbers 0-10.
 */
function ScoreInput({ 
    value = '', 
    onChange, 
    placeholder = '', 
    className = '',
    disabled = false,
    autoFocus = false 
}) {
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(true);
    const inputRef = useRef(null);

    // Update internal state when prop changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // Validate input
        const valid = isValidScoreInput(newValue);
        setIsValid(valid);
        
        // Only call onChange if input is valid or empty
        if (valid || newValue === '') {
            onChange?.(newValue);
        }
    };

    const handleKeyDown = (e) => {
        // Allow: backspace, delete, tab, escape, enter, and navigation keys
        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
            return;
        }
        
        // Allow: X, M, and numbers
        const allowedChars = /[0-9xXmM]/;
        if (!allowedChars.test(e.key)) {
            e.preventDefault();
        }
    };

    const handleBlur = () => {
        // Format the value when leaving the input
        if (inputValue.trim() !== '') {
            const formatted = formatScore(parseInt(inputValue.toUpperCase().replace('X', '10').replace('M', '0'), 10));
            setInputValue(formatted);
            onChange?.(formatted);
        }
    };

    const handleClick = () => {
        // Ensure the input is focused when clicked
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    };

    const colorClass = getScoreColorClass(inputValue);
    const borderClass = isValid ? 'border-gray-300' : 'border-red-500';

    return (
        <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={handleClick}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`
                w-12 h-12 text-center text-lg font-bold rounded-md border-2 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors duration-200 cursor-text
                ${colorClass}
                ${borderClass}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}
                ${className}
            `}
            maxLength={2}
        />
    );
}

export default ScoreInput; 