// ============================================================
// CreateSuccess: 创建成功组件
// 展示创建成功信息和人物性格总结
//
// 文件位置: src/components/CreateSuccess.tsx
// 主要依赖: framer-motion
// 被引用: app/create/page.tsx
//
// Props:
//   - character: { name: string; avatar: string }
//   - profile: { style: string; logic: string; dominant_emotions: string[] }
//   - onViewDetail: () => void - 查看详情
//   - onEnterStory: () => void - 进入Story
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CreateSuccessProps {
	character: {
		name: string;
		avatar: string;
	};
	profile: {
		style: string;
		logic: string;
		dominant_emotions: string[];
	};
	onViewDetail: () => void;
	onEnterStory: () => void;
}

export function CreateSuccess({ character, profile, onViewDetail, onEnterStory }: CreateSuccessProps) {
	return (
		<div className="w-full max-w-md mx-auto text-center">
			{/* 成功图标 */}
			<motion.div
				className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: 'spring', duration: 0.5 }}
			>
				<Check className="w-10 h-10 text-emerald-400" />
			</motion.div>
			
			{/* 标题 */}
			<motion.h2
				className="text-white text-2xl font-light tracking-wider mb-2"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				人物创建成功！
			</motion.h2>
			
			{/* 人物头像和名称 */}
			<motion.div
				className="my-8"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-5xl mx-auto mb-4 border border-white/10">
					{character.avatar}
				</div>
				<h3 className="text-white text-xl font-light tracking-[0.2em]">
					{character.name}
				</h3>
			</motion.div>
			
			{/* 性格总结 */}
			<motion.div
				className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 text-left"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				<p className="text-white/40 text-xs text-center mb-4">
					基于你的回答，我们刻画了这个人物的性格
				</p>
				<div className="space-y-3 text-sm">
					<div className="flex justify-between">
						<span className="text-white/50">表达风格:</span>
						<span className="text-white">{profile.style}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-white/50">情感逻辑:</span>
						<span className="text-white">{profile.logic}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-white/50">主要情绪:</span>
						<span className="text-white">{profile.dominant_emotions.join('、')}</span>
					</div>
				</div>
			</motion.div>
			
			{/* 操作按钮 */}
			<motion.div
				className="flex gap-4"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
			>
				<button
					onClick={onViewDetail}
					className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors text-sm tracking-wider"
				>
					查看详情
				</button>
				<button
					onClick={onEnterStory}
					className="flex-1 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors text-sm tracking-wider"
				>
					进入Story
				</button>
			</motion.div>
			
			{/* 返回首页 */}
			<motion.button
				onClick={() => window.location.href = '/'}
				className="mt-4 text-white/30 text-sm hover:text-white/50 transition-colors"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
			>
				返回人物列表
			</motion.button>
		</div>
	);
}
