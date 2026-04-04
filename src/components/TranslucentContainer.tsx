'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// TranslucentContainer: 半透明冰块容器
// 高斯模糊 + 物理折射 + 水面涟漪
// ============================================================

interface TranslucentContainerProps {
	children?: React.ReactNode;
	onFileDrop?: (files: FileList) => void;
	onPaste?: (text: string) => void;
	placeholder?: string;
}

export function TranslucentContainer({
	children,
	onFileDrop,
	onPaste,
	placeholder = '拖拽文件或粘贴文本到这里...',
}: TranslucentContainerProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

	// 添加涟漪效果
	const addRipple = useCallback((x: number, y: number) => {
		const id = Date.now();
		setRipples((prev) => [...prev, { x, y, id }]);
		setTimeout(() => {
			setRipples((prev) => prev.filter((r) => r.id !== id));
		}, 1000);
	}, []);

	// 处理拖拽进入
	const handleDragEnter = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(true);
			addRipple(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
		},
		[addRipple]
	);

	// 处理拖拽离开
	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	// 处理拖拽悬停
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	// 处理文件放下
	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			addRipple(e.nativeEvent.offsetX, e.nativeEvent.offsetY);

			if (e.dataTransfer.files.length > 0) {
				onFileDrop?.(e.dataTransfer.files);
			}
		},
		[onFileDrop, addRipple]
	);

	// 处理粘贴
	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
			const text = e.clipboardData.getData('text');
			if (text) {
				onPaste?.(text);
				addRipple(50, 50);
			}
		},
		[onPaste, addRipple]
	);

	// 处理点击涟漪
	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			addRipple(e.clientX - rect.left, e.clientY - rect.top);
		},
		[addRipple]
	);

	return (
		<motion.div
			className={`
				ice-container
				relative w-full max-w-lg min-h-[200px]
				rounded-2xl
				backdrop-blur-xl
				bg-white/5
				border border-white/20
				overflow-hidden
				transition-all duration-500
				${isDragging ? 'bg-white/10 border-white/40 ripple' : ''}
			`}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			onPaste={handlePaste}
			onClick={handleClick}
			animate={{
				boxShadow: isDragging
					? '0 0 40px rgba(255,255,255,0.2), inset 0 0 20px rgba(255,255,255,0.1)'
					: '0 0 20px rgba(255,255,255,0.05), inset 0 0 10px rgba(255,255,255,0.05)',
			}}
		>
			{/* 菲涅尔效应边缘 */}
			<div className="absolute inset-0 rounded-2xl pointer-events-none">
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
				<div className="absolute inset-0 rounded-2xl border border-white/5" />
			</div>

			{/* 涟漪效果 */}
			<AnimatePresence>
				{ripples.map((ripple) => (
					<motion.div
						key={ripple.id}
						className="absolute rounded-full border border-white/30 pointer-events-none"
						style={{
							left: ripple.x,
							top: ripple.y,
							transform: 'translate(-50%, -50%)',
						}}
						initial={{ width: 0, height: 0, opacity: 0.8 }}
						animate={{ width: 200, height: 200, opacity: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 1, ease: 'easeOut' }}
					/>
				))}
			</AnimatePresence>

			{/* 内容区域 */}
			<div className="relative z-10 p-8">
				{children || (
					<div className="flex flex-col items-center justify-center h-full text-white/50">
						<svg
							className="w-12 h-12 mb-4 opacity-50"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p className="text-sm font-light tracking-wider text-center">
							{placeholder}
						</p>
					</div>
				)}
			</div>
		</motion.div>
	);
}
