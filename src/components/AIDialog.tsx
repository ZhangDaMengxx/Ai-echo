'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionPulse, EmotionIndicator } from './EmotionPulse';
import { EmotionType } from './DynamicAtmosphere';

// ============================================================
// AIDialog: AI对话展示框（集成情绪脉冲）
// ============================================================

interface Message {
	id: string;
	role: 'system' | 'assistant' | 'user';
	content: string;
}

interface AIDialogProps {
	messages: Message[];
	characterName?: string;
	emotion?: EmotionType;
	emotionIntensity?: number;
}

export function AIDialog({
	messages,
	characterName = 'ELARA',
	emotion = 'calm',
	emotionIntensity = 0.5,
}: AIDialogProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [chatIntensity, setChatIntensity] = useState(0.3);

	// 自动滚动
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// 根据最新消息计算聊天强度
	useEffect(() => {
		if (messages.length === 0) return;

		const lastMessage = messages[messages.length - 1];
		if (lastMessage.role === 'user') {
			// 用户消息增加强度
			setChatIntensity((prev) => Math.min(prev + 0.1, 1));
		} else if (lastMessage.role === 'assistant') {
			// AI 回复后稍微降低强度
			setChatIntensity((prev) => Math.max(prev - 0.05, 0.3));
		}
	}, [messages]);

	// 计算综合强度（基础情绪强度 + 聊天强度）
	const totalIntensity = Math.min(
		(emotionIntensity + chatIntensity) / 2 + 0.2,
		1
	);

	return (
		<div className="relative w-full max-w-4xl">
			{/* 情绪指示器 */}
			<div className="absolute -top-14 left-0 z-20">
				<EmotionIndicator
					emotion={emotion}
					intensity={totalIntensity}
					label={characterName}
				/>
			</div>

			{/* 对话容器 */}
			<div
				className="
					relative w-full
					bg-black/30
					backdrop-blur-2xl
					rounded-3xl
					border border-white/10
					overflow-hidden
				"
				style={{
					boxShadow: `
						0 0 0 1px rgba(255,255,255,0.05),
						0 30px 60px -15px rgba(0,0,0,0.6),
						inset 0 1px 0 rgba(255,255,255,0.08)
					`,
					minWidth: '800px',
					minHeight: '450px',
				}}
			>
				{/* 情绪脉冲背景（在内容后面） */}
				<EmotionPulse
					emotion={emotion}
					intensity={totalIntensity}
					isActive={true}
				/>

				{/* 顶部装饰线 */}
				<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />

				{/* 消息列表 */}
				<div className="relative z-10 h-[450px] overflow-y-auto px-10 py-12 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
					<AnimatePresence initial={false}>
						{messages.map((msg, index) => (
							<motion.div
								key={msg.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.4, delay: index * 0.05 }}
								className="mb-8"
							>
								{msg.role === 'system' ? (
									// 系统消息 - 动作描写
									<p className="text-white/50 text-base italic font-light leading-relaxed">
										{msg.content}
									</p>
								) : msg.role === 'user' ? (
									// 用户消息 - 靠右显示
									<div className="flex justify-end">
										<div className="max-w-[80%] bg-white/10 rounded-2xl rounded-tr-sm px-6 py-4">
											<p className="text-white/90 text-lg font-light leading-relaxed">
												{msg.content}
											</p>
										</div>
									</div>
								) : (
									// AI回复
									<div className="flex items-start gap-4">
										{/* AI 头像 */}
										<div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-white/20 flex-shrink-0">
											<span className="text-white/80 text-sm font-medium">
												{characterName.slice(0, 2)}
											</span>
										</div>
										<div className="flex-1">
											<TypewriterText text={msg.content} />
										</div>
									</div>
								)}
							</motion.div>
						))}
					</AnimatePresence>
					<div ref={messagesEndRef} />
				</div>

				{/* 底部装饰线 */}
				<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

				{/* 角落装饰 */}
				<div className="absolute top-5 left-5 w-3 h-3 border-l border-t border-white/20 z-10" />
				<div className="absolute top-5 right-5 w-3 h-3 border-r border-t border-white/20 z-10" />
				<div className="absolute bottom-5 left-5 w-3 h-3 border-l border-b border-white/20 z-10" />
				<div className="absolute bottom-5 right-5 w-3 h-3 border-r border-b border-white/20 z-10" />
			</div>
		</div>
	);
}

// 逐字浮现组件
function TypewriterText({ text }: { text: string }) {
	return (
		<div className="text-white text-xl font-light leading-relaxed">
			{text.split('').map((char, i) => (
				<motion.span
					key={i}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: i * 0.02 }}
				>
					{char}
				</motion.span>
			))}
		</div>
	);
}
