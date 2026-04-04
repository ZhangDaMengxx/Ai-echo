'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ============================================================
// DialogueTags: 对话提示标签（仅左右两侧，不遮挡上下）
// 距离对话框约30%
// ============================================================

interface Tag {
	id: string;
	label: string;
	hint: string;
}

interface DialogueTagsProps {
	tags: Tag[];
	onTagClick: (tag: Tag) => void;
}

export function DialogueTags({ tags, onTagClick }: DialogueTagsProps) {
	// 只使用4个标签，放在左右两侧，不遮挡上下
	const tagConfigs = [
		{ 
			// 左上
			position: { top: '10%', left: '-25%' },
			floatX: [0, 10, 0],
			floatY: [0, -8, 0],
			duration: 4.5,
		},
		{ 
			// 左中
			position: { top: '45%', left: '-30%' },
			floatX: [0, 8, 0],
			floatY: [0, 10, 0],
			duration: 5,
		},
		{ 
			// 左下
			position: { bottom: '15%', left: '-25%' },
			floatX: [0, 12, 0],
			floatY: [0, -6, 0],
			duration: 4,
		},
		{ 
			// 右上
			position: { top: '10%', right: '-25%' },
			floatX: [0, -10, 0],
			floatY: [0, -8, 0],
			duration: 4.8,
		},
		{ 
			// 右中
			position: { top: '45%', right: '-30%' },
			floatX: [0, -8, 0],
			floatY: [0, -10, 0],
			duration: 5.2,
		},
		{ 
			// 右下
			position: { bottom: '15%', right: '-25%' },
			floatX: [0, -12, 0],
			floatY: [0, 6, 0],
			duration: 4.2,
		},
	];

	return (
		<>
			{tags.slice(0, 6).map((tag, index) => {
				const config = tagConfigs[index] || tagConfigs[0];
				
				return (
					<motion.button
						key={tag.id}
						className="
							absolute
							px-5 py-2.5
							bg-black/40
							backdrop-blur-md
							border border-white/15
							rounded-full
							text-white/70 text-sm font-light tracking-wider
							hover:bg-black/60 hover:text-white
							hover:border-white/40
							transition-colors duration-300
							pointer-events-auto
							whitespace-nowrap
						"
						style={{
							...config.position,
							zIndex: 30,
						}}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{
							opacity: 1,
							scale: 1,
							x: config.floatX,
							y: config.floatY,
						}}
						transition={{
							opacity: { delay: index * 0.08, duration: 0.4 },
							scale: { delay: index * 0.08, duration: 0.4 },
							x: {
								duration: config.duration,
								repeat: Infinity,
								ease: 'easeInOut',
							},
							y: {
								duration: config.duration * 0.85,
								repeat: Infinity,
								ease: 'easeInOut',
							},
						}}
						whileHover={{
							scale: 1.12,
							boxShadow: '0 0 30px rgba(255,255,255,0.25)',
							zIndex: 40,
						}}
						onClick={() => onTagClick(tag)}
						title={tag.hint}
					>
						{tag.label}
					</motion.button>
				);
			})}
		</>
	);
}
