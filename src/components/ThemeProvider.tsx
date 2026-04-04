'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ============================================================
// ThemeProvider: 主题管理上下文
// 提供深色/浅色模式切换，自动保存用户偏好
// ============================================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'echo-tracks-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>('light');
	const [mounted, setMounted] = useState(false);

	// 初始化：从 localStorage 或系统偏好读取
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
		
		if (stored) {
			setThemeState(stored);
			updateDocumentClass(stored);
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			setThemeState('dark');
			updateDocumentClass('dark');
		}
		
		setMounted(true);
	}, []);

	// 更新 document class
	const updateDocumentClass = (newTheme: Theme) => {
		if (newTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	};

	// 设置主题
	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem(STORAGE_KEY, newTheme);
		updateDocumentClass(newTheme);
	};

	// 切换主题
	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

// Hook: 使用主题
export function useTheme() {
	const context = useContext(ThemeContext);
	
	if (context === undefined) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	
	return context;
}
