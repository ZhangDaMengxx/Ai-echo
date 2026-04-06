// ============================================================
// CharacterDetailModal: 人物详情弹窗组件
// 玻璃拟态设计，展示人物详情、统计数据和操作按钮
//
// 文件位置: src/components/CharacterDetailModal.tsx
// 主要依赖: framer-motion, @/types/character, @/lib/localDb
// 被引用: page.tsx (人物列表页)
//
// Props:
//   - isOpen: boolean - 是否显示
//   - character: Character - 人物数据
//   - profile: CharacterProfileExtended | null - 人物画像（可选）
//   - onClose: () => void - 关闭回调
//   - onEnterStory: () => void - 进入Story回调
//
// 使用示例:
//   <CharacterDetailModal isOpen={true} character={char} profile={prof} onClose={close} onEnterStory={enter} />
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Character } from '@/types/character';
import type { CharacterProfileExtended } from '@/lib/localDb';
import { X } from 'lucide-react';

interface CharacterDetailModalProps {
	isOpen: boolean;
	character: Character;
	profile: CharacterProfileExtended | null;
	onClose: () => void;
	onEnterStory: () => void;
}

export function CharacterDetailModal({
	isOpen,
	character,
	profile,
	onClose,
	onEnterStory,
}: CharacterDetailModalProps) {
	const avatar = character.avatar || '👤';
	
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					data-testid="character-detail-modal"
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					{/* 背景遮罩 */}
					<motion.div
						data-testid="modal-overlay"
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						onClick={onClose}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					/>
					
					{/* 弹窗内容 */}
					<motion.div
						className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8"
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0, y: 20 }}
						onClick={(e) => e.stopPropagation()}
					>
						{/* 关闭按钮 */}
						<button
							data-testid="modal-close-btn"
							onClick={onClose}
							className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
						
						{/* 头像和名称 */}
						<div className="flex flex-col items-center mb-6">
							<div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-5xl mb-4 border border-white/10">
								{avatar}
							</div>
							<h2 className="text-white text-2xl font-light tracking-[0.2em] mb-2">
								{character.name}
							</h2>
							
							{/* 描述 */}
							{character.description && (
								<p 
									data-testid="character-description"
									className="text-white/60 text-sm text-center leading-relaxed"
								>
									{character.description}
								</p>
							)}
						</div>
						
						{/* 性格画像 */}
						{profile && (
							<div className="border-t border-white/10 pt-6 mb-6">
								<div className="grid grid-cols-2 gap-4 mb-4">
									<div>
										<p className="text-white/40 text-xs mb-1">表达风格:</p>
										<p className="text-white text-sm">{profile.style}</p>
									</div>
									<div>
										<p className="text-white/40 text-xs mb-1">情感逻辑:</p>
										<p className="text-white text-sm">{profile.logic}</p>
									</div>
								</div>
								<div>
									<p className="text-white/40 text-xs mb-1">主要情绪:</p>
									<p className="text-white text-sm">
										{profile.dominant_emotions.join('、')}
									</p>
								</div>
							</div>
						)}
						
						{/* 统计数据 */}
						<div className="border-t border-white/10 pt-6 mb-6">
							<h3 className="text-white/40 text-xs tracking-wider mb-4">记忆统计</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-white/60">记忆节点:</span>
									<span className="text-white">{character.stats.nodeCount}个</span>
								</div>
								<div className="flex justify-between">
									<span className="text-white/60">隐藏线索:</span>
									<span className="text-white">{character.stats.clueCount}/{character.stats.nodeCount} 已解锁</span>
								</div>
								<div className="flex justify-between">
									<span className="text-white/60">IF线分支:</span>
									<span className="text-white">{character.stats.branchCount}个</span>
								</div>
							</div>
						</div>
						
						{/* 操作按钮 */}
						<div className="flex gap-4 pt-4 border-t border-white/10">
							<button
								onClick={onClose}
								className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors text-sm tracking-wider"
							>
								返回
							</button>
							<button
								onClick={onEnterStory}
								className="flex-1 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors text-sm tracking-wider"
							>
								进入Story
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
