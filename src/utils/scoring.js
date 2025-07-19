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
    if (score === '' || score === null || score === undefined) return 'bg-score-empty';
    const strScore = String(score).toUpperCase().trim();
    if (strScore === 'X') return 'bg-score-x text-white';
    if (strScore === 'M') return 'bg-score-m text-white';
    if (strScore === '10') return 'bg-score-10 text-white';
    if (strScore === '9') return 'bg-score-9 text-white';
    if (strScore === '8') return 'bg-score-8 text-white';
    if (strScore === '7') return 'bg-score-7 text-black';
    if (strScore === '6') return 'bg-score-6 text-white';
    if (strScore === '5') return 'bg-score-5 text-white';
    if (strScore === '4') return 'bg-score-4 text-white';
    if (strScore === '3') return 'bg-score-3 text-white';
    if (strScore === '2') return 'bg-score-2 text-white';
    if (strScore === '1') return 'bg-score-1 text-white';
    return 'bg-score-empty text-gray-600';
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