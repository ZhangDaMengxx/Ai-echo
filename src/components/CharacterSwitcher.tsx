// ============================================================
// CharacterSwitcher: 人物切换器组件
// 在 Story 页面快速切换当前人物
//
// 文件位置: src/components/CharacterSwitcher.tsx
// 主要依赖: framer-motion, @/hooks/useCurrentCharacter
// 被引用: story/page.tsx
//
// Props:
//   - currentCharacterId: string - 当前人物ID
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCharacters, useCurrentCharacter } from '@/hooks/useCurrentCharacter';

interface CharacterSwitcherProps {
	currentCharacterId?: string;
}

export function CharacterSwitcher({ currentCharacterId }: CharacterSwitcherProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { characters } = useCharacters();
	const { setCurrentCharacter } = useCurrentCharacter();
	const containerRef = useRef<HTMLDivElement>(null);
	
	const currentChar = characters.find(c => c.id === currentCharacterId);
	
	// 点击外部关闭
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);
	
	const handleSelect = (charId: string) => {
		setCurrentCharacter(charId);
		setIsOpen(false);
		// 刷新页面以加载新人物的数据
		window.location.reload();
	};
	
	if (characters.length <= 1) {
		return null; // 只有一个人物时不显示切换器
	}
	
	return (
		<div ref={containerRef} className="relative">
			<motion.button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				<span className="text-lg">{currentChar?.avatar || '👤'}</span>
				<span className="text-sm font-light max-w-[80px] truncate hidden sm:inline">
					{currentChar?.name || '选择人物'}
				</span>
				<ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</motion.button>
			
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden z-50"
					>
						<div className="p-2">
							<p className="text-white/40 text-xs px-3 py-2">切换人物</p>
							
							{characters.map((char) => (
								<button
									key={char.id}
									onClick={() => handleSelect(char.id)}
									className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
										char.id === currentCharacterId
											? 'bg-white/20 text-white'
											: 'text-white/70 hover:bg-white/10'
									}`}
								>
									<span className="text-xl">{char.avatar || '👤'}</span>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-light truncate">{char.name}</p>
										<p className="text-white/40 text-xs">{char.stats.nodeCount}个记忆</p>
									</div>
									{char.id === currentCharacterId && (
										<div className="w-2 h-2 rounded-full bg-emerald-400" />
									)}
								</button>
							))}
							
							<div className="border-t border-white/10 mt-2 pt-2">
								<Link
									href="/create"
									className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 transition-colors"
								>
									<Plus className="w-4 h-4" />
									<span className="text-sm">创建新人物</span>
								</Link>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
