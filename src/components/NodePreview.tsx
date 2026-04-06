'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeIcon } from './NodeIconGenerator';
import { GlassButton } from './GlassButton';

// ============================================================
// NodePreview: 节点预览/确认组件
// 放大显示 + 前情介绍 + 确认进入
// ============================================================

export interface MemoryNode {
	id: string;
	title: string;
	date: string;
	description?: string;
	coreEvent?: string;
	emotion?: string;
	salienceScore?: number;
}

interface NodePreviewProps {
	node: MemoryNode | null;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	subjectName?: string;
}

export function NodePreview({
	node,
	isOpen,
	onConfirm,
	onCancel,
	subjectName = 'ELARA',
}: NodePreviewProps) {
	if (!node) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* 背景遮罩 */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
						onClick={onCancel}
					/>

					{/* 预览卡片 */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 50 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 50 }}
						transition={{ type: 'spring', stiffness: 200, damping: 25 }}
						className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none"
					>
						<div
							className="relative w-full max-w-2xl pointer-events-auto"
							onClick={(e) => e.stopPropagation()}
						>
							{/* 主卡片 */}
							<div className="relative rounded-3xl border border-white/20 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-2xl overflow-hidden p-12">
								{/* 发光边框 */}
								<motion.div
									className="absolute inset-0 rounded-3xl border-2 border-white/20 pointer-events-none"
									animate={{
										boxShadow: [
											'0 0 30px rgba(255,255,255,0.1)',
											'0 0 60px rgba(255,255,255,0.2)',
											'0 0 30px rgba(255,255,255,0.1)',
										],
									}}
									transition={{ duration: 3, repeat: Infinity }}
								/>

								{/* 人物水印 */}
								<div className="absolute top-4 right-4 text-white/5 text-6xl font-extralight tracking-widest">
									{subjectName}
								</div>

								{/* 日期标签 */}
								<div className="absolute top-8 left-8">
									<span className="text-white/40 text-sm tracking-widest font-light">
										{node.date}
									</span>
								</div>

								{/* 内容区 */}
								<div className="flex flex-col items-center text-center mt-8">
									{/* 节点图标 */}
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ delay: 0.1, type: 'spring' }}
										className="relative w-48 h-48 mb-8"
									>
										<NodeIcon
											nodeId={node.id}
											emotion={node.emotion || '平静'}
											salienceScore={node.salienceScore || 5}
											size={192}
											className="w-full h-full"
										/>
									</motion.div>

									{/* 标题 */}
									<motion.h2
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="text-white text-3xl font-light tracking-[0.3em] mb-6"
									>
										{node.title}
									</motion.h2>

									{/* 分隔线 */}
									<motion.div
										initial={{ scaleX: 0 }}
										animate={{ scaleX: 1 }}
										transition={{ delay: 0.3, duration: 0.5 }}
										className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8"
									/>

									{/* 前情介绍 */}
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.4 }}
										className="space-y-4 max-w-lg"
									>
										<p className="text-white/60 text-sm tracking-wider uppercase">
											前情提要
										</p>
										<p className="text-white/80 text-lg font-light leading-relaxed">
											{node.description || node.coreEvent || '一段被遗忘的记忆...'}
										</p>
									</motion.div>

									{/* 提示文字 */}
									<motion.p
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.5 }}
										className="text-white/40 text-sm mt-10 italic"
									>
										是否进入这段回忆？
									</motion.p>
								</div>

								{/* 操作按钮 */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.6 }}
									className="flex justify-center gap-6 mt-12"
								>
									<GlassButton onClick={onCancel} variant="secondary">
										返回
									</GlassButton>
									<GlassButton onClick={onConfirm} variant="primary">
										进入回忆
									</GlassButton>
								</motion.div>

								{/* 装饰角落 */}
								<div className="absolute top-6 left-6 w-4 h-4 border-l-2 border-t-2 border-white/20" />
								<div className="absolute top-6 right-6 w-4 h-4 border-r-2 border-t-2 border-white/20" />
								<div className="absolute bottom-6 left-6 w-4 h-4 border-l-2 border-b-2 border-white/20" />
								<div className="absolute bottom-6 right-6 w-4 h-4 border-r-2 border-b-2 border-white/20" />
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
