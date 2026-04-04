'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// GlassButton: 极简主义玻璃按钮（深色版）
// 纯白文字、高对比度
// ============================================================

interface GlassButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	active?: boolean;
	disabled?: boolean;
	className?: string;
}

export function GlassButton({
	children,
	onClick,
	active = false,
	disabled = false,
	className = '',
}: GlassButtonProps) {
	return (
		<motion.button
			onClick={onClick}
			disabled={disabled}
			className={`
				relative
				px-8 py-3
				font-light tracking-[0.2em] text-sm
				text-white
				transition-all duration-300
				disabled:opacity-30 disabled:cursor-not-allowed
				${active ? 'text-white' : 'text-white/70 hover:text-white'}
				${className}
			`}
			whileHover={{ scale: disabled ? 1 : 1.05 }}
			whileTap={{ scale: disabled ? 1 : 0.95 }}
		>
			{/* 底部发光线条 - 激活时显示 */}
			<motion.span
				className="absolute bottom-0 left-1/2 h-[2px] bg-white"
				initial={{ width: active ? '60%' : 0, x: '-50%' }}
				animate={{ width: active ? '60%' : 0, x: '-50%' }}
				whileHover={{ width: disabled ? 0 : '80%', x: '-50%' }}
				transition={{ duration: 0.3 }}
				style={{
					boxShadow: active || !disabled ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
				}}
			/>
			<span className="relative z-10">{children}</span>
		</motion.button>
	);
}
