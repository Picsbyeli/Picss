import React, { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Get stored theme from localStorage or default to 'light'
        const storedTheme = localStorage.getItem('theme');
        return storedTheme || 'light';
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    useEffect(() => {
        const root = window.document.documentElement;
        // Remove previous theme classes
        root.classList.remove('light', 'dark');
        // Apply theme
        let selectedTheme = theme;
        if (theme === 'system') {
            selectedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        root.classList.add(selectedTheme);
        setIsDarkMode(selectedTheme === 'dark');
        // Store theme preference
        localStorage.setItem('theme', theme);
        // Listen for system preference changes if using system theme
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                root.classList.remove('light', 'dark');
                const newTheme = mediaQuery.matches ? 'dark' : 'light';
                root.classList.add(newTheme);
                setIsDarkMode(newTheme === 'dark');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);
    return (<ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>);
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
