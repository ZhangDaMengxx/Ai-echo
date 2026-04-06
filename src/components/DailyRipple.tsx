// ============================================================
// DailyRipple: 每日涟漪组件
// 描述: 展示每日情绪推送、语录、洞察和相关记忆
// 文件位置: src/components/DailyRipple.tsx
// 主要依赖: dailyRipple.ts
// 被引用: page.tsx (主页面)
//
// Props:
//   - ripple: 涟漪数据
//   - onDismiss: 关闭回调（可选）
//   - onNodeClick: 节点点击回调（可选）
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { DailyRipple as DailyRippleType } from '../lib/dailyRipple';
import type { EmotionType } from '../lib/emotionResonance';

interface DailyRippleProps {
	ripple: DailyRippleType;
	onDismiss?: () => void;
	onNodeClick?: (nodeId: string) => void;
}

// 情绪颜色映射
const EMOTION_COLORS: Record<EmotionType, { bg: string; text: string; glow: string }> = {
	calm: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
	joyful: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
	hopeful: { bg: 'bg-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/30' },
	passionate: { bg: 'bg-pink-500/20', text: 'text-pink-400', glow: 'shadow-pink-500/30' },
	angry: { bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/30' },
	sad: { bg: 'bg-slate-500/20', text: 'text-slate-400', glow: 'shadow-slate-500/30' },
	melancholy: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/30' },
	mysterious: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
};

// 情绪标签
const EMOTION_LABELS: Record<EmotionType, string> = {
	calm: '平静',
	joyful: '喜悦',
	hopeful: '希望',
	passionate: '热情',
	angry: '愤怒',
	sad: '悲伤',
	melancholy: '忧郁',
	mysterious: '神秘',
};

// 类型标签
const TYPE_LABELS = {
	morning: { label: '晨间寄语', icon: '🌅' },
	reflection: { label: '午后反思', icon: '🌤️' },
	evening: { label: '晚间回顾', icon: '🌙' },
};

// 趋势图标
const TREND_ICONS = {
	upward: { icon: '↗️', label: '上升', color: 'text-green-400' },
	downward: { icon: '↘️', label: '下降', color: 'text-rose-400' },
	stable: { icon: '→', label: '平稳', color: 'text-cyan-400' },
	neutral: { icon: '○', label: '中性', color: 'text-slate-400' },
};

// 洞察类型标签
const INSIGHT_TYPE_LABELS = {
	encouragement: { label: '鼓励', color: 'bg-green-500/20 text-green-400' },
	support: { label: '支持', color: 'bg-rose-500/20 text-rose-400' },
	reflection: { label: '反思', color: 'bg-indigo-500/20 text-indigo-400' },
	suggestion: { label: '建议', color: 'bg-amber-500/20 text-amber-400' },
};

export function DailyRipple({ ripple, onDismiss, onNodeClick }: DailyRippleProps) {
	const emotionStyle = EMOTION_COLORS[ripple.primaryEmotion];
	const typeInfo = TYPE_LABELS[ripple.type];
	const trendInfo = TREND_ICONS[ripple.trend.direction];
	const insightTypeInfo = INSIGHT_TYPE_LABELS[ripple.insight.type];

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -20, scale: 0.95 }}
			className="w-full max-w-md"
		>
			<div className={`
				relative overflow-hidden rounded-2xl
				bg-black/30 backdrop-blur-xl
				border border-white/10
				shadow-lg ${emotionStyle.glow}
			`}>
				{/* 顶部装饰条 */}
				<div className={`
					h-1 w-full
					bg-gradient-to-r from-transparent via-current to-transparent
					${emotionStyle.text.replace('text-', 'text-')}
				`} />

				<div className="p-6">
					{/* 头部 */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<span className="text-2xl">{typeInfo.icon}</span>
							<div>
								<p className="text-sm text-white/50">今日涟漪</p>
								<p className="text-white font-medium">{typeInfo.label}</p>
							</div>
						</div>
						<div className={`
							px-3 py-1 rounded-full text-sm font-medium
							${emotionStyle.bg} ${emotionStyle.text}
						`}>
							{EMOTION_LABELS[ripple.primaryEmotion]}
						</div>
					</div>

					{/* 语录 */}
					<blockquote className="mb-6">
						<p className="text-lg text-white/90 italic leading-relaxed">
							&quot;{ripple.quote}&quot;
						</p>
					</blockquote>

					{/* 数据指标 */}
					<div className="flex items-center gap-4 mb-4 text-sm">
						<div className="flex items-center gap-1">
							<span className="text-white/40">共振:</span>
							<span className={emotionStyle.text}>
								{(ripple.resonanceScore * 100).toFixed(0)}%
							</span>
						</div>
						<div className="flex items-center gap-1">
							<span className="text-white/40">趋势:</span>
							<span className={`flex items-center gap-1 ${trendInfo.color}`}>
								<span>{trendInfo.icon}</span>
								<span>{trendInfo.label}</span>
							</span>
						</div>
					</div>

					{/* 洞察 */}
					<div className="mb-4 p-4 bg-white/5 rounded-xl">
						<div className="flex items-center gap-2 mb-2">
							<span className={`
								px-2 py-0.5 rounded text-xs font-medium
								${insightTypeInfo.color}
							`}>
								{insightTypeInfo.label}
							</span>
						</div>
						<p className="text-white/80 text-sm mb-2">
							{ripple.insight.message}
						</p>
						{ripple.insight.action && (
							<p className="text-white/50 text-sm">
								💡 {ripple.insight.action}
							</p>
						)}
					</div>

					{/* 相关记忆 */}
					{ripple.relatedNodes.length > 0 && (
						<div className="mb-4">
							<p className="text-xs text-white/40 mb-2">相关记忆</p>
							<button
								onClick={() => onNodeClick?.(ripple.relatedNodes[0])}
								className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
							>
								查看相关记忆 →
							</button>
						</div>
					)}

					{/* 底部操作 */}
					<div className="flex items-center justify-between pt-4 border-t border-white/10">
						<span className="text-xs text-white/30">
							{new Date(ripple.date).toLocaleDateString('zh-CN', {
								month: 'long',
								day: 'numeric',
								weekday: 'short',
							})}
						</span>
						<button
							onClick={onDismiss}
							className="
								px-4 py-2 rounded-lg
								bg-white/10 hover:bg-white/20
								text-white/80 text-sm
								transition-colors
							"
						>
							知道了
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
