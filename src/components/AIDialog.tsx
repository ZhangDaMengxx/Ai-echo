'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// AIDialog: AI对话展示框（放大版）
// ============================================================

interface Message {
	id: string;
	role: 'system' | 'assistant';
	content: string;
}

interface AIDialogProps {
	messages: Message[];
	characterName?: string;
}

export function AIDialog({ messages }: AIDialogProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 自动滚动
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div
			className="
				relative w-full max-w-4xl
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
			}}
		>
			{/* 顶部装饰线 */}
			<div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

			{/* 消息列表 - 加高 */}
			<div className="h-[450px] overflow-y-auto px-10 py-12 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
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
							) : (
								// AI回复
								<div className="text-white text-xl font-light leading-relaxed">
									<TypewriterText text={msg.content} />
								</div>
							)}
						</motion.div>
					))}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			{/* 底部装饰线 */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

			{/* 角落装饰 */}
			<div className="absolute top-5 left-5 w-3 h-3 border-l border-t border-white/20" />
			<div className="absolute top-5 right-5 w-3 h-3 border-r border-t border-white/20" />
			<div className="absolute bottom-5 left-5 w-3 h-3 border-l border-b border-white/20" />
			<div className="absolute bottom-5 right-5 w-3 h-3 border-r border-b border-white/20" />
		</div>
	);
}

// 逐字浮现组件
function TypewriterText({ text }: { text: string }) {
	return (
		<span>
			{text.split('').map((char, i) => (
				<motion.span
					key={i}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: i * 0.025 }}
				>
					{char}
				</motion.span>
			))}
		</span>
	);
}
