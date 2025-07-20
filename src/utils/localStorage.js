/**
 * Local Storage Utilities
 * 
 * Provides offline data persistence for the archery scoring app.
 * Falls back to local storage when Firebase is unavailable.
 */

const STORAGE_KEYS = {
    CURRENT_BALE: 'archers_edge_current_bale',
    USER_SESSION: 'archers_edge_user_session',
    APP_STATE: 'archers_edge_app_state'
};

export const LocalStorage = {
    // Save bale data to local storage
    saveBaleData: (baleData) => {
        try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_BALE, JSON.stringify(baleData));
            console.log('Saved bale data to local storage:', baleData);
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    },

    // Load bale data from local storage
    loadBaleData: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CURRENT_BALE);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('Loaded bale data from local storage:', parsed);
                return parsed;
            }
            return null;
        } catch (error) {
            console.error('Error loading from local storage:', error);
            return null;
        }
    },

    // Save user session
    saveUserSession: (sessionData) => {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Error saving user session:', error);
            return false;
        }
    },

    // Load user session
    loadUserSession: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading user session:', error);
            return null;
        }
    },

    // Save app state
    saveAppState: (state) => {
        try {
            localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Error saving app state:', error);
            return false;
        }
    },

    // Load app state
    loadAppState: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading app state:', error);
            return null;
        }
    },

    // Clear all local storage
    clearAll: () => {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('Cleared all local storage');
        } catch (error) {
            console.error('Error clearing local storage:', error);
        }
    },

    // Check if local storage is available
    isAvailable: () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}; 