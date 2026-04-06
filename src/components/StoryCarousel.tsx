'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { NodeIcon } from './NodeIconGenerator';

// ============================================================
// StoryCarousel: 记忆长廊轮播（居中放大版）
// 更新: 集成 NodeIcon 动态图标生成
// ============================================================

export interface MemoryNode {
	id: string;
	title: string;
	date: string;
	description?: string;
	emotion?: string;
	salienceScore?: number;
}

interface StoryCarouselProps {
	nodes: MemoryNode[];
	onNodeClick: (node: MemoryNode) => void;
	onNodePreview?: (node: MemoryNode) => void; // 点击中心节点预览
	subjectName?: string;
}

export function StoryCarousel({
	nodes,
	onNodeClick,
	subjectName = 'ELARA',
}: StoryCarouselProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const [isZooming] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);

	const goToPrev = useCallback(() => {
		setActiveIndex((prev) => (prev === 0 ? nodes.length - 1 : prev - 1));
	}, [nodes.length]);

	const goToNext = useCallback(() => {
		setActiveIndex((prev) => (prev === nodes.length - 1 ? 0 : prev + 1));
	}, [nodes.length]);

	const handleNodeClick = useCallback(
		(node: MemoryNode, index: number) => {
			if (index === activeIndex) {
				onNodeClick(node);
			} else {
				setActiveIndex(index);
			}
		},
		[activeIndex, onNodeClick]
	);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		setIsDragging(true);
		setStartX(e.clientX);
	}, []);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging) return;
			const diff = e.clientX - startX;
			if (Math.abs(diff) > 50) {
				if (diff > 0) {
					goToPrev();
				} else {
					goToNext();
				}
				setIsDragging(false);
			}
		},
		[isDragging, startX, goToPrev, goToNext]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	const getNodeStyle = (index: number) => {
		let diff = index - activeIndex;
		if (diff > nodes.length / 2) diff -= nodes.length;
		if (diff < -nodes.length / 2) diff += nodes.length;

		if (diff === 0) {
			return { x: 0, scale: 1, blur: 0, opacity: 1, zIndex: 10 };
		} else if (Math.abs(diff) === 1) {
			return { x: diff > 0 ? 400 : -400, scale: 0.6, blur: 10, opacity: 0.3, zIndex: 5 };
		} else {
			return { x: diff > 0 ? 700 : -700, scale: 0.4, blur: 20, opacity: 0, zIndex: 0 };
		}
	};

	return (
		<div className="relative w-full h-full flex items-center justify-center overflow-hidden">
			{/* 人物名称水印 */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02]">
				<span className="text-[400px] font-extralight text-white tracking-[0.5em]">
					{subjectName}
				</span>
			</div>

			{/* 提示文字 */}
			<div className="absolute top-24 left-0 right-0 text-center pointer-events-none">
				<p className="text-white/30 text-sm tracking-widest">拖拽切换 · 点击进入对话</p>
			</div>

			{/* 轮播容器 */}
			<div
				className="relative w-full h-[600px] flex items-center justify-center"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				{nodes.map((node, index) => {
					const style = getNodeStyle(index);
					const isActive = index === activeIndex;

					return (
						<motion.div
							key={node.id}
							className="absolute cursor-pointer"
							animate={{
								x: style.x,
								scale: isZooming && isActive ? 8 : style.scale,
								opacity: isZooming && isActive ? 0 : style.opacity,
							}}
							transition={{ type: 'spring', stiffness: 150, damping: 20 }}
							style={{ zIndex: style.zIndex, filter: `blur(${style.blur}px)` }}
							onClick={() => handleNodeClick(node, index)}
						>
							{/* 节点卡片 */}
							<div
								className={`
									relative w-80 h-[420px] rounded-3xl border border-white/20
									bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm
									overflow-hidden transition-shadow duration-500
									${isActive ? 'hover:shadow-[0_0_80px_rgba(255,255,255,0.25)]' : ''}
								`}
							>
								{/* 内部内容 */}
								<div className="absolute inset-0 flex flex-col items-center justify-center p-8">
									{/* 动态生成节点图标 */}
									<div className="relative w-40 h-40 mb-8">
										<NodeIcon
											nodeId={node.id}
											emotion={node.emotion || '平静'}
											salienceScore={node.salienceScore || 5}
											size={160}
											className="w-full h-full"
										/>
									</div>

									{/* 标题 */}
									<h3 className="text-white text-2xl font-light tracking-[0.3em] mb-3">
										{node.title}
									</h3>

									{/* 日期 */}
									<p className="text-white/50 text-base">{node.date}</p>

									{/* 描述 */}
									{isActive && node.description && (
										<motion.p
											className="text-white/30 text-sm mt-4 text-center"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.2 }}
										>
											{node.description}
										</motion.p>
									)}

									{/* 活跃指示器 */}
									{isActive && (
										<motion.div
											className="absolute bottom-6 w-16 h-1 bg-white rounded-full"
											layoutId="activeIndicator"
										/>
									)}
								</div>

								{/* 边框发光效果 */}
								{isActive && (
									<motion.div
										className="absolute inset-0 rounded-3xl border-2 border-white/30 pointer-events-none"
										animate={{
											boxShadow: [
												'0 0 20px rgba(255,255,255,0.1)',
												'0 0 40px rgba(255,255,255,0.2)',
												'0 0 20px rgba(255,255,255,0.1)',
											],
										}}
										transition={{ duration: 2, repeat: Infinity }}
									/>
								)}
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* 指示器 */}
			<div className="absolute bottom-12 left-0 right-0 flex justify-center gap-3">
				{nodes.map((_, index) => (
					<button
						key={index}
						onClick={() => setActiveIndex(index)}
						className={`
							h-2 rounded-full transition-all duration-300
							${index === activeIndex ? 'bg-white w-10' : 'bg-white/20 w-2 hover:bg-white/40'}
						`}
					/>
				))}
			</div>
		</div>
	);
}
