// ============================================================
// Home Page: 人物列表首页
// 展示所有人物卡片，支持创建新人物和查看详情
//
// 文件位置: src/app/page.tsx
// 主要依赖: CharacterCard, CharacterDetailModal, useCharacters, useCurrentCharacter
//
// 维护记录:
//   - 2026-04-06: 重写为人物列表页
// ============================================================

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { CharacterCard } from '@/components/CharacterCard';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import { useCharacters, useCurrentCharacter } from '@/hooks/useCurrentCharacter';
import { useCharacterDetail } from '@/hooks/useCurrentCharacter';
import type { Character } from '@/types/character';

export default function HomePage() {
	// 人物列表
	const { characters, isLoading, error, refresh } = useCharacters();
	
	// 当前选中人物（用于详情弹窗）
	const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
	const { profile } = useCharacterDetail(selectedCharacter?.id || null);
	
	// 当前活跃人物（用于进入Story）
	const { setCurrentCharacter } = useCurrentCharacter();
	
	// 是否显示详情弹窗
	const [showDetailModal, setShowDetailModal] = useState(false);
	
	// 处理卡片点击 - 打开详情
	const handleCardClick = (character: Character) => {
		setSelectedCharacter(character);
		setShowDetailModal(true);
	};
	
	// 处理双击 - 直接进入Story
	const handleCardDoubleClick = (character: Character) => {
		setCurrentCharacter(character.id);
		window.location.href = '/story';
	};
	
	// 处理进入Story
	const handleEnterStory = () => {
		if (selectedCharacter) {
			setCurrentCharacter(selectedCharacter.id);
			window.location.href = '/story';
		}
	};
	
	// 关闭弹窗
	const handleCloseModal = () => {
		setShowDetailModal(false);
		setTimeout(() => setSelectedCharacter(null), 200);
	};
	
	// 空状态组件
	const EmptyState = () => (
		<motion.div
			className="flex flex-col items-center justify-center py-20 text-center"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-4xl mb-6 border border-white/10">
				👤
			</div>
			<h3 className="text-white text-xl font-light tracking-wider mb-2">
				还没有人物
			</h3>
			<p className="text-white/40 text-sm max-w-xs mb-8">
				点击右上角的 + 按钮，创建你的第一个人物，开始一段羁绊
			</p>
			<Link
				href="/create"
				className="px-6 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors text-sm tracking-wider"
			>
				创建人物
			</Link>
		</motion.div>
	);
	
	return (
		<div className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
			{/* 顶部导航栏 */}
			<nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6">
				{/* Logo */}
				<div className="flex items-center gap-3">
					<span className="text-white text-lg font-light tracking-wider">Echo Tracks</span>
				</div>
				
				{/* 设置按钮 */}
				<Link href="/settings">
					<motion.button
						className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors mr-3"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="数据管理"
					>
						<Settings className="w-5 h-5" />
					</motion.button>
				</Link>
				
				{/* 创建按钮 */}
				<Link href="/create">
					<motion.button
						className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="创建新人物"
					>
						<Plus className="w-5 h-5" />
					</motion.button>
				</Link>
			</nav>
			
			{/* 主内容区 */}
			<main className="relative z-10 w-full h-full pt-24 pb-8 px-6 overflow-y-auto">
				{/* Hero 区域 */}
				<motion.div
					className="text-center mb-12"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<h1 className="text-white text-2xl font-light tracking-wider mb-2">
						你的人物档案
					</h1>
					<p className="text-white/40 text-sm">
						与不同的灵魂建立羁绊，编织回忆
					</p>
				</motion.div>
				
				{/* 加载状态 */}
				{isLoading && (
					<div className="flex items-center justify-center py-20">
						<div className="text-white/40 text-sm">加载中...</div>
					</div>
				)}
				
				{/* 错误状态 */}
				{error && (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="text-red-300/80 text-sm mb-4">
							加载失败: {error.message}
						</div>
						<button
							onClick={refresh}
							className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm"
						>
							重试
						</button>
					</div>
				)}
				
				{/* 人物网格 */}
				{!isLoading && !error && (
					<>
						{characters.length === 0 ? (
							<EmptyState />
						) : (
							<motion.div
								className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
							>
								{characters.map((character, index) => (
									<motion.div
										key={character.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<CharacterCard
											character={character}
											onClick={handleCardClick}
											onDoubleClick={handleCardDoubleClick}
										/>
									</motion.div>
								))}
							</motion.div>
						)}
					</>
				)}
				
				{/* 提示文字 */}
				{!isLoading && !error && characters.length > 0 && (
					<motion.p
						className="text-center text-white/30 text-xs mt-12"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
					>
						提示：点击人物卡片查看详情，双击直接进入Story
					</motion.p>
				)}
			</main>
			
			{/* 详情弹窗 */}
			{selectedCharacter && (
				<CharacterDetailModal
					isOpen={showDetailModal}
					character={selectedCharacter}
					profile={profile}
					onClose={handleCloseModal}
					onEnterStory={handleEnterStory}
				/>
			)}
		</div>
	);
}
