'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

/**
 * Reads persisted theme and toggles the `.dark` class on <html>.
 * Light = no class. Dark = `.dark` class.
 * Must render inside <body>. Produces no visible output.
 */
export function ThemeProvider() {
    const { theme } = useThemeStore();

    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [theme]);

    return null;
}
