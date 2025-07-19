/**
 * scoring.js
 * 
 * Core scoring utilities for the Archer's Edge application.
 * Migrated from reference-app/js/common.js with React compatibility.
 */

/**
 * Parses a score value from a string (e.g., 'X', '10', 'M') into a number.
 * @param {string|number} score The score to parse.
 * @returns {number} The numeric value of the score.
 */
export function parseScoreValue(score) {
    if (typeof score === 'string') {
        const upperScore = score.toUpperCase().trim();
        if (upperScore === 'X') return 10;
        if (upperScore === 'M') return 0;
        const num = parseInt(upperScore, 10);
        return isNaN(num) ? 0 : num;
    }
    if (typeof score === 'number' && !isNaN(score)) {
        return score;
    }
    return 0;
}

/**
 * Gets the appropriate Tailwind CSS class for a given score value for color-coding.
 * @param {string|number} score The score value.
 * @returns {string} The Tailwind CSS class name.
 */
export function getScoreColorClass(score) {
    if (score === '' || score === null || score === undefined) return 'bg-gray-100 text-gray-600';
    
    const strScore = String(score).toUpperCase().trim();
    
    // Gold (X) - Perfect shot
    if (strScore === 'X') return 'bg-yellow-400 text-black font-bold';
    
    // Teal (10) - Perfect score
    if (strScore === '10') return 'bg-teal-500 text-white font-bold';
    
    // Blue (9) - Excellent
    if (strScore === '9') return 'bg-blue-500 text-white font-bold';
    
    // Green (8) - Good
    if (strScore === '8') return 'bg-green-500 text-white font-bold';
    
    // Yellow (7) - Fair
    if (strScore === '7') return 'bg-yellow-500 text-black font-bold';
    
    // Orange (6) - Below average
    if (strScore === '6') return 'bg-orange-500 text-white font-bold';
    
    // Red (5 and below) - Poor
    if (strScore === '5') return 'bg-red-500 text-white font-bold';
    if (strScore === '4') return 'bg-red-600 text-white font-bold';
    if (strScore === '3') return 'bg-red-700 text-white font-bold';
    if (strScore === '2') return 'bg-red-800 text-white font-bold';
    if (strScore === '1') return 'bg-red-900 text-white font-bold';
    if (strScore === '0') return 'bg-red-900 text-white font-bold';
    
    // Miss (M) - Black
    if (strScore === 'M') return 'bg-gray-800 text-white font-bold';
    
    // Default for invalid input
    return 'bg-gray-100 text-gray-600';
}

/**
 * Validates if a score input is valid for archery scoring.
 * @param {string} input The score input to validate.
 * @returns {boolean} True if the input is valid.
 */
export function isValidScoreInput(input) {
    if (!input || input.trim() === '') return true; // Empty is valid
    const upperInput = input.toUpperCase().trim();
    if (upperInput === 'X' || upperInput === 'M') return true;
    const num = parseInt(upperInput, 10);
    return !isNaN(num) && num >= 0 && num <= 10;
}

/**
 * Formats a score for display (handles X, M, and numbers).
 * @param {string|number} score The score to format.
 * @returns {string} The formatted score string.
 */
export function formatScore(score) {
    if (score === 10) return 'X';
    if (score === 0) return 'M';
    return String(score);
}

/**
 * Calculates the total score for an array of scores.
 * @param {Array<string|number>} scores Array of scores.
 * @returns {number} The total score.
 */
export function calculateTotalScore(scores) {
    return scores.reduce((total, score) => total + parseScoreValue(score), 0);
}

/**
 * Calculates the average score for an array of scores.
 * @param {Array<string|number>} scores Array of scores.
 * @returns {number} The average score.
 */
export function calculateAverageScore(scores) {
    if (scores.length === 0) return 0;
    const total = calculateTotalScore(scores);
    return total / scores.length;
} 