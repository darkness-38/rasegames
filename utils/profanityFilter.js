/**
 * Simple Profanity Filter for RaseGames
 * Support for English and Turkish bad words
 */

const BANNED_WORDS = [
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'whore', 'slut', 'bastard', 'cunt', 'nigger', 'faggot',
    'motherfucker', 'cock', 'piss',

    // Turkish
    'amk', 'aq', 'sik', 'yarrak', 'kaşar', 'fahişe', 'piç', 'gavat', 'oç', 'orospu', 'siktir', 'yarak', 'amcik',
    'meme', 'got', 'göt', 'ibne', 'puşt', 'yavşak', 'ananı', 'bacını'
];

/**
 * Replaces bad words in the text with asterisks
 * @param {string} text - The input text
 * @returns {string} - The sanitized text
 */
function filterBadWords(text) {
    if (!text) return text;

    let sanitizedText = text;

    BANNED_WORDS.forEach(word => {
        // Create a regex that matches the word with word boundaries
        // Case insensitive and global match
        // We handle Turkish characters for case insensitivity manually or rely on simple matching for now

        // Simple regex for exact word match, allowing for some common substitutions or simple boundaries
        const regex = new RegExp(`\\b${word}\\b`, 'gi');

        // Replace with asterisks of same length
        sanitizedText = sanitizedText.replace(regex, '*'.repeat(word.length));
    });

    return sanitizedText;
}

module.exports = {
    filterBadWords
};
