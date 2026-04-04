'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// GlassDialog: 玻璃拟态对话窗
// 60%透明度 + 菲涅尔效应 + 逐字浮现
// ============================================================

interface Message {
	id: string;
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface GlassDialogProps {
	messages: Message[];
	onSend: (message: string) => void;
	subjectName?: string;
}

export function GlassDialog({
	messages,
	onSend,
	subjectName = 'ELARA',
}: GlassDialogProps) {
	const [inputValue, setInputValue] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 自动滚动到底部
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	// 发送消息
	const handleSend = () => {
		if (inputValue.trim()) {
			onSend(inputValue.trim());
			setInputValue('');
		}
	};

	// 处理按键
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div
			className="
				glass-dialog
				relative w-full max-w-2xl
				bg-black/60
				backdrop-blur-[40px]
				rounded-2xl
				border border-white/10
				overflow-hidden
				fresnel
			"
			style={{
				// 菲涅尔效应 - 边缘轻微绿色折射
				boxShadow: `
					inset 0 1px 0 rgba(255,255,255,0.1),
					0 0 0 1px rgba(255,255,255,0.05),
					0 20px 50px rgba(0,0,0,0.5)
				`,
			}}
		>
			{/* 菲涅尔边缘效果 */}
			<div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden">
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-50" />
			</div>

			{/* 人物代号 */}
			<div className="absolute top-6 left-0 right-0 text-center pointer-events-none">
				<span className="text-white/40 text-xs tracking-[0.4em]">
					{subjectName}
				</span>
			</div>

			{/* 消息列表 */}
			<div className="h-96 overflow-y-auto px-8 py-16 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
				<AnimatePresence initial={false}>
					{messages.map((msg, index) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.3, delay: index * 0.1 }}
							className={`
								${msg.role === 'user' ? 'ml-auto text-right' : 'mr-auto'}
								max-w-[80%]
							`}
						>
							{msg.role === 'system' ? (
								// 系统消息 - 动作描写
								<p className="typewriter text-white/60 text-sm italic font-light">
									{msg.content}
								</p>
							) : (
								// 对话消息
								<div
									className={`
										inline-block px-5 py-3 rounded-xl
										${
											msg.role === 'user'
												? 'bg-white/10 text-white'
												: 'bg-transparent text-white border border-white/20'
										}
									`}
								>
									<TypewriterText text={msg.content} />
								</div>
							)}
						</motion.div>
					))}
				</AnimatePresence>
				<div ref={messagesEndRef} />
			</div>

			{/* 输入区域 */}
			<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/20">
				<div className="flex gap-3">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="输入消息..."
						className="
							flex-1
							px-4 py-3
							bg-white/5
							border border-white/10
							rounded-lg
							text-white placeholder-white/30
							focus:outline-none focus:border-white/30
							transition-colors
						"
					/>
					<motion.button
						onClick={handleSend}
						disabled={!inputValue.trim()}
						className="
							px-6 py-3
							bg-white/10
							text-white
							rounded-lg
							disabled:opacity-30 disabled:cursor-not-allowed
							hover:bg-white/20
							transition-colors
						"
						whileHover={{ scale: inputValue.trim() ? 1.05 : 1 }}
						whileTap={{ scale: inputValue.trim() ? 0.95 : 1 }}
					>
						发送
					</motion.button>
				</div>
			</div>
		</div>
	);
}

// 逐字浮现组件
function TypewriterText({ text }: { text: string }) {
	return (
		<span className="typewriter">
			{text.split('').map((char, i) => (
				<motion.span
					key={i}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: i * 0.03 }}
				>
					{char}
				</motion.span>
			))}
		</span>
	);
}
