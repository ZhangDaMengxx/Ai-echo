'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive, NAV_ITEMS } from '../hooks/useResponsive';
// Navigation 属性接口
interface NavigationProps {
	activeSection: string;
	onNavigate: (section: 'memory' | 'story' | 'dialogue') => void;
}

// ============================================================
// ResponsiveNav: 响应式导航组件
// 桌面端横向导航 / 移动端汉堡菜单
// ============================================================

interface NavItemProps {
	label: string;
	isActive: boolean;
	onClick: () => void;
	isMobile?: boolean;
}

function NavItem({ label, isActive, onClick, isMobile }: NavItemProps) {
	return (
		<motion.button
			onClick={onClick}
			className={`
				relative px-4 py-2 font-medium transition-colors
				${isMobile 
					? 'text-lg text-white/80 hover:text-white w-full text-left py-4' 
					: 'text-sm text-white/60 hover:text-white'
				}
				${isActive && !isMobile ? 'text-white' : ''}
			`}
			whileHover={{ scale: isMobile ? 1 : 1.05 }}
			whileTap={{ scale: 0.95 }}
		>
			{label}
			{isActive && !isMobile && (
				<motion.div
					layoutId="activeNav"
					className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
				/>
			)}
		</motion.button>
	);
}

export function ResponsiveNav({ activeSection, onNavigate }: NavigationProps) {
	const { isMobile } = useResponsive();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleNavigate = (section: string) => {
		onNavigate(section as 'memory' | 'story' | 'dialogue');
		setIsMenuOpen(false);
	};

	// 移动端汉堡菜单
	if (isMobile) {
		return (
			<>
				{/* 汉堡按钮 */}
				<motion.button
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md"
					whileTap={{ scale: 0.9 }}
				>
					<div className="w-6 h-5 flex flex-col justify-between">
						<motion.span
							animate={{ rotate: isMenuOpen ? 45 : 0, y: isMenuOpen ? 8 : 0 }}
							className="w-full h-0.5 bg-white origin-center"
						/>
						<motion.span
							animate={{ opacity: isMenuOpen ? 0 : 1 }}
							className="w-full h-0.5 bg-white"
						/>
						<motion.span
							animate={{ rotate: isMenuOpen ? -45 : 0, y: isMenuOpen ? -8 : 0 }}
							className="w-full h-0.5 bg-white origin-center"
						/>
					</div>
				</motion.button>

				{/* 全屏菜单 */}
				<AnimatePresence>
					{isMenuOpen && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center"
						>
							<nav className="flex flex-col items-center space-y-2">
								{NAV_ITEMS.map((item) => (
									<NavItem
										key={item}
										label={item}
										isActive={activeSection === item.toLowerCase()}
										onClick={() => handleNavigate(item.toLowerCase())}
										isMobile
									/>
									))}
								</nav>
							</motion.div>
						)}
					</AnimatePresence>
				</>
			);
		}

	// 桌面端横向导航
	return (
		<nav className="fixed top-0 left-0 right-0 z-40 flex justify-center py-4">
			<div className="flex items-center space-x-2 px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
				{NAV_ITEMS.map((item) => (
					<NavItem
						key={item}
						label={item}
						isActive={activeSection === item.toLowerCase()}
						onClick={() => handleNavigate(item.toLowerCase())}
					/>
				))}
			</div>
		</nav>
	);
}
