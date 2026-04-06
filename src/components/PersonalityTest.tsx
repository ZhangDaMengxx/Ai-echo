// ============================================================
// PersonalityTest: 心理学测试组件
// 5题性格测试，根据答案生成人物画像
//
// 文件位置: src/components/PersonalityTest.tsx
// 主要依赖: framer-motion, @/lib/personalityTest
// 被引用: app/create/page.tsx
//
// Props:
//   - onComplete: (answers: PersonalityAnswer[]) => void - 完成回调
//   - onSkip: () => void - 跳过回调
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { personalityQuestions } from '@/lib/personalityTest';
import type { PersonalityAnswer } from '@/types/character';

interface PersonalityTestProps {
	onComplete: (answers: PersonalityAnswer[]) => void;
	onSkip: () => void;
}

export function PersonalityTest({ onComplete, onSkip }: PersonalityTestProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<PersonalityAnswer[]>([]);
	const [selectedValue, setSelectedValue] = useState<string | null>(null);
	
	const currentQuestion = personalityQuestions[currentIndex];
	const progress = ((currentIndex + 1) / personalityQuestions.length) * 100;
	
	const handleSelect = (value: string) => {
		setSelectedValue(value);
		
		// 添加答案
		const newAnswers = [...answers, {
			questionId: currentQuestion.id,
			answer: value
		}];
		setAnswers(newAnswers);
		
		// 延迟后进入下一题或完成
		setTimeout(() => {
			if (currentIndex < personalityQuestions.length - 1) {
				setCurrentIndex(prev => prev + 1);
				setSelectedValue(null);
			} else {
				onComplete(newAnswers);
			}
		}, 300);
	};
	
	return (
		<div className="w-full max-w-2xl mx-auto">
			{/* 标题 */}
			<div className="text-center mb-8">
				<h2 className="text-white text-xl font-light tracking-wider mb-2">
					初步性格测试
				</h2>
				<div className="w-16 h-px bg-white/20 mx-auto" />
			</div>
			
			{/* 进度指示 */}
			<div className="mb-8">
				<div className="flex justify-between text-white/40 text-xs mb-2">
					<span>问题 {currentIndex + 1} of {personalityQuestions.length}</span>
					<span>{Math.round(progress)}%</span>
				</div>
				<div 
					role="progressbar"
					aria-valuenow={progress}
					aria-valuemin={0}
					aria-valuemax={100}
					className="h-1 bg-white/10 rounded-full overflow-hidden"
				>
					<motion.div 
						className="h-full bg-white/40 rounded-full"
						initial={{ width: 0 }}
						animate={{ width: `${progress}%` }}
						transition={{ duration: 0.3 }}
					/>
				</div>
			</div>
			
			{/* 问题区域 */}
			<AnimatePresence mode="wait">
				<motion.div
					key={currentQuestion.id}
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -20 }}
					transition={{ duration: 0.2 }}
					className="space-y-6"
				>
					{/* 问题文本 */}
					<h3 className="text-white text-lg font-light leading-relaxed">
						{currentQuestion.text}
					</h3>
					
					{/* 选项列表 */}
					<div className="space-y-3">
						{currentQuestion.options.map((option) => (
							<motion.button
								key={option.value}
								onClick={() => handleSelect(option.value)}
								className={`w-full p-4 rounded-xl border text-left transition-all ${
									selectedValue === option.value
										? 'bg-white/20 border-white/30 text-white'
										: 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
								}`}
								whileHover={{ scale: 1.01 }}
								whileTap={{ scale: 0.99 }}
							>
								<div className="flex items-center gap-3">
									<div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
										selectedValue === option.value
											? 'border-white bg-white'
											: 'border-white/30'
									}`}>
										{selectedValue === option.value && (
											<div className="w-2 h-2 rounded-full bg-black" />
										)}
									</div>
									<span className="text-sm font-light">{option.label}</span>
								</div>
							</motion.button>
						))}
					</div>
				</motion.div>
			</AnimatePresence>
			
			{/* 跳过按钮 */}
			<div className="mt-8 text-center">
				<button
					onClick={onSkip}
					className="text-white/40 text-sm hover:text-white/60 transition-colors"
				>
					跳过测试
				</button>
			</div>
		</div>
	);
}
