'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

// ============================================================
// Navigation: 顶部导航栏
// 包含品牌 Logo 和主题切换按钮
// ============================================================

export function Navigation() {
	const { theme, toggleTheme } = useTheme();

	return (
		<motion.nav
			className="sticky top-0 z-50 border-b border-amber-200 bg-amber-100/80 backdrop-blur-sm dark:border-warm-border dark:bg-warm-surface/80"
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.4 }}
			role="navigation"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center gap-2">
						<div className="relative">
							<div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-paper" />
							<div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-300" />
						</div>
						<h1 className="font-handwriting text-2xl font-bold text-amber-900 dark:text-warm-text">
							回音轨迹
						</h1>
					</div>

					{/* 主题切换按钮 */}
					<motion.button
						onClick={toggleTheme}
						className="relative rounded-full bg-amber-200 p-2 text-amber-800 shadow-tape transition-colors hover:bg-amber-300 dark:bg-warm-surfaceHighlight dark:text-warm-text dark:hover:bg-warm-border"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label={`切换主题，当前为${theme === 'light' ? '浅色' : '深色'}模式`}
					>
						{theme === 'light' ? (
							<Sun className="h-5 w-5" />
						) : (
							<Moon className="h-5 w-5" />
						)}
					</motion.button>
				</div>
			</div>
		</motion.nav>
	);
}
