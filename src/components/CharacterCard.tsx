// ============================================================
// CharacterCard: 人物卡片组件
// 展示人物头像、名称、统计数据，支持点击和双击交互
//
// 文件位置: src/components/CharacterCard.tsx
// 主要依赖: framer-motion, @/types/character
// 被引用: page.tsx (人物列表页)
//
// Props:
//   - character: Character - 人物数据
//   - onClick: (char: Character) => void - 点击回调
//   - onDoubleClick?: (char: Character) => void - 双击回调（可选）
//
// 使用示例:
//   <CharacterCard character={char} onClick={handleClick} />
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { motion } from 'framer-motion';
import type { Character } from '@/types/character';

interface CharacterCardProps {
	character: Character;
	onClick: (character: Character) => void;
	onDoubleClick?: (character: Character) => void;
}

/**
 * 格式化最后交互时间为相对时间
 */
function formatLastInteraction(dateStr?: string): string {
	if (!dateStr) return '';
	
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) return '最近:今天';
	if (diffDays === 1) return '最近:昨天';
	if (diffDays < 7) return `最近:${diffDays}天前`;
	if (diffDays < 14) return '最近:上周';
	if (diffDays < 30) return `最近:${Math.floor(diffDays / 7)}周前`;
	return `最近:${Math.floor(diffDays / 30)}个月前`;
}

export function CharacterCard({ character, onClick, onDoubleClick }: CharacterCardProps) {
	const avatar = character.avatar || '👤';
	const lastInteraction = formatLastInteraction(character.stats.lastInteraction);
	
	return (
		<motion.div
			data-testid="character-card"
			className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105"
			whileHover={{ y: -4 }}
			whileTap={{ scale: 0.98 }}
			onClick={() => onClick(character)}
			onDoubleClick={() => onDoubleClick?.(character)}
		>
			{/* 头像 */}
			<div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-4 border border-white/10">
				{avatar}
			</div>
			
			{/* 名称 */}
			<h3 className="text-white text-lg font-light tracking-wider mb-2">
				{character.name}
			</h3>
			
			{/* 统计数据 */}
			<div className="text-center space-y-1">
				<p className="text-white/60 text-sm">
					{character.stats.nodeCount}个记忆
				</p>
				{lastInteraction && (
					<p className="text-white/40 text-xs">
						{lastInteraction}
					</p>
				)}
			</div>
			
			{/* 默认人物标记 */}
			{character.isDefault && (
				<div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400/80" />
			)}
		</motion.div>
	);
}
