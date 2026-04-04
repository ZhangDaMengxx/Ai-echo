'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

// ============================================================
// UserInput: 用户输入框（放大版）
// ============================================================

interface UserInputProps {
	onSend: (message: string) => void;
	placeholder?: string;
}

export function UserInput({
	onSend,
	placeholder = '输入消息...',
}: UserInputProps) {
	const [inputValue, setInputValue] = useState('');

	const handleSend = () => {
		if (inputValue.trim()) {
			onSend(inputValue.trim());
			setInputValue('');
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div
			className="
				relative w-full max-w-3xl
				bg-black/20
				backdrop-blur-xl
				rounded-2xl
				border border-white/10
				p-5
			"
			style={{
				minWidth: '700px',
				boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
			}}
		>
			<div className="flex gap-4">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="
						flex-1
						bg-transparent
						border-none
						outline-none
						text-white text-lg
						placeholder:text-white/25
						py-2
					"
				/>
				<motion.button
					onClick={handleSend}
					disabled={!inputValue.trim()}
					className="
						w-14 h-14
						flex items-center justify-center
						rounded-xl
						bg-white/10
						text-white
						disabled:opacity-30 disabled:cursor-not-allowed
						hover:bg-white/20
						transition-colors
					"
					whileHover={{ scale: inputValue.trim() ? 1.08 : 1 }}
					whileTap={{ scale: inputValue.trim() ? 0.95 : 1 }}
				>
					<Send className="w-6 h-6" />
				</motion.button>
			</div>
		</div>
	);
}
