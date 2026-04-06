'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { EmotionType } from './DynamicAtmosphere';

// ============================================================
// EmotionPulse: 情绪心跳脉冲组件
// 在聊天框后面显示半透明情绪脉动
// ============================================================

interface EmotionPulseProps {
	emotion: EmotionType;
	intensity?: number; // 0-1 情绪强度
	isActive?: boolean; // 是否激活脉冲
}

// 情绪到心跳配置的映射
const HEARTBEAT_CONFIG: Record<EmotionType, {
	baseSpeed: number;      // 基础心跳速度 (秒)
	intensityMultiplier: number; // 强度倍数
	color: string;
}> = {
	calm: {
		baseSpeed: 2,
		intensityMultiplier: 0.5,
		color: 'rgba(30, 144, 255, 0.15)',
	},
	angry: {
		baseSpeed: 0.8,
		intensityMultiplier: 1.5,
		color: 'rgba(220, 38, 38, 0.25)',
	},
	sad: {
		baseSpeed: 3,
		intensityMultiplier: 0.3,
		color: 'rgba(100, 116, 139, 0.12)',
	},
	joyful: {
		baseSpeed: 1.2,
		intensityMultiplier: 1.2,
		color: 'rgba(251, 191, 36, 0.2)',
	},
	melancholy: {
		baseSpeed: 2.5,
		intensityMultiplier: 0.4,
		color: 'rgba(99, 102, 241, 0.15)',
	},
	hopeful: {
		baseSpeed: 1.5,
		intensityMultiplier: 1.0,
		color: 'rgba(52, 211, 153, 0.18)',
	},
	passionate: {
		baseSpeed: 0.9,
		intensityMultiplier: 1.4,
		color: 'rgba(244, 63, 94, 0.22)',
	},
	mysterious: {
		baseSpeed: 1.8,
		intensityMultiplier: 0.8,
		color: 'rgba(168, 85, 247, 0.16)',
	},
};

export function EmotionPulse({
	emotion,
	intensity = 0.5,
	isActive = true,
}: EmotionPulseProps) {
	const controls = useAnimation();
	const config = HEARTBEAT_CONFIG[emotion] || HEARTBEAT_CONFIG.calm;

	// 计算实际心跳速度（情绪强度越高，心跳越快）
	const heartRate = config.baseSpeed / (1 + intensity * config.intensityMultiplier);

	useEffect(() => {
		if (!isActive) {
			controls.stop();
			return;
		}

		// 心跳动画序列
		const heartbeat = async () => {
			while (isActive) {
				// 第一拍：强收缩
				await controls.start({
					scale: [1, 1.15, 1.1],
					opacity: [0.3, 0.6, 0.4],
					transition: { duration: heartRate * 0.15, ease: 'easeOut' },
				});
				// 第二拍：弱收缩
				await controls.start({
					scale: [1.1, 1.08, 1],
					opacity: [0.4, 0.3, 0.2],
					transition: { duration: heartRate * 0.15, ease: 'easeInOut' },
				});
				// 间隔
				await new Promise((resolve) => setTimeout(resolve, heartRate * 700));
			}
		};

		heartbeat();

		return () => {
			controls.stop();
		};
	}, [controls, heartRate, isActive]);

	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
			{/* 多层脉冲效果 */}
			{[1, 2, 3].map((layer) => (
				<motion.div
					key={layer}
					animate={controls}
					className="absolute inset-0 flex items-center justify-center"
					style={{
						opacity: 0.2 - layer * 0.05,
					}}
				>
					<div
						className="rounded-full blur-3xl"
						style={{
							width: `${60 + layer * 20}%`,
							height: `${60 + layer * 20}%`,
							background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
						}}
					/>
				</motion.div>
			))}

			{/* 边缘发光 */}
			<motion.div
				animate={{
					opacity: [0.1, 0.3, 0.1],
				}}
				transition={{
					duration: heartRate * 2,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
				className="absolute inset-0 rounded-3xl"
				style={{
					boxShadow: `inset 0 0 100px ${config.color}`,
				}}
			/>
		</div>
	);
}

// 情绪指示器（显示当前情绪状态）
interface EmotionIndicatorProps {
	emotion: EmotionType;
	intensity?: number;
	label?: string;
}

export function EmotionIndicator({
	emotion,
	intensity = 0.5,
	label,
}: EmotionIndicatorProps) {
	const config = HEARTBEAT_CONFIG[emotion] || HEARTBEAT_CONFIG.calm;
	const emotionLabels: Record<EmotionType, string> = {
		calm: '平静',
		angry: '愤怒',
		sad: '悲伤',
		joyful: '喜悦',
		melancholy: '忧郁',
		hopeful: '希望',
		passionate: '热情',
		mysterious: '神秘',
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			animate={{ opacity: 1, x: 0 }}
			className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/30 backdrop-blur-md border border-white/10"
		>
			{/* 心跳点 */}
			<motion.div
				animate={{
					scale: [1, 1.3, 1],
					opacity: [0.6, 1, 0.6],
				}}
				transition={{
					duration: config.baseSpeed,
					repeat: Infinity,
					ease: 'easeInOut',
				}}
				className="w-2 h-2 rounded-full"
				style={{ backgroundColor: config.color.replace(/[\d.]+\)$/, '1)') }}
			/>

			{/* 情绪标签 */}
			<div className="flex flex-col">
				<span className="text-white/80 text-sm font-medium">
					{label || emotionLabels[emotion]}
				</span>
				{/* 强度条 */}
				<div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
					<motion.div
						className="h-full rounded-full"
						style={{ backgroundColor: config.color.replace(/[\d.]+\)$/, '1)') }}
						initial={{ width: 0 }}
						animate={{ width: `${intensity * 100}%` }}
						transition={{ duration: 0.5 }}
					/>
				</div>
			</div>
		</motion.div>
	);
}

// 模拟情绪波动的 Hook
export function useEmotionWave(
	baseEmotion: EmotionType,
	chatIntensity: number
): { currentEmotion: EmotionType; intensity: number } {
	const [currentEmotion, setCurrentEmotion] = useState(baseEmotion);
	const [intensity, setIntensity] = useState(0.3);

	useEffect(() => {
		// 根据聊天强度调整情绪波动
		const newIntensity = Math.min(0.3 + chatIntensity * 0.7, 1);
		setIntensity(newIntensity);

		// 高强度时可能情绪升级
		if (chatIntensity > 0.8) {
			const escalation: Record<EmotionType, EmotionType> = {
				calm: 'hopeful',
				sad: 'melancholy',
				angry: 'passionate',
				joyful: 'passionate',
				melancholy: 'sad',
				hopeful: 'joyful',
				passionate: 'angry',
				mysterious: 'hopeful',
			};
			setCurrentEmotion((prev) => escalation[prev] || prev);
		} else {
			setCurrentEmotion(baseEmotion);
		}
	}, [baseEmotion, chatIntensity]);

	return { currentEmotion, intensity };
}
