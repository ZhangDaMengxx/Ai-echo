// ============================================================
// StepIndicator: 步骤指示器组件
// 显示创建流程的当前步骤
//
// 文件位置: src/components/StepIndicator.tsx
// 被引用: app/create/page.tsx
//
// Props:
//   - currentStep: number - 当前步骤 (1-4)
//   - steps: string[] - 步骤名称数组
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { motion } from 'framer-motion';

interface StepIndicatorProps {
	currentStep: number;
	steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
	return (
		<div className="flex items-center justify-center gap-1 sm:gap-2 min-w-max px-2">
			{steps.map((step, index) => {
				const stepNumber = index + 1;
				const isActive = stepNumber === currentStep;
				const isCompleted = stepNumber < currentStep;
				
				return (
					<div key={step} className="flex items-center">
						<div className="flex flex-col items-center">
							{/* 步骤圆圈 */}
							<motion.div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-light ${
									isActive
										? 'bg-white text-black'
										: isCompleted
											? 'bg-white/20 text-white'
											: 'bg-white/5 text-white/40 border border-white/10'
								}`}
								animate={isActive ? { scale: [1, 1.1, 1] } : {}}
								transition={{ duration: 0.3 }}
							>
								{isCompleted ? (
									<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
									</svg>
								) : (
									stepNumber
								)}
							</motion.div>
							
							{/* 步骤名称 */}
							<span className={`text-xs mt-1 ${
								isActive ? 'text-white' : 'text-white/40'
							}`}>
								{step}
							</span>
						</div>
						
						{/* 连接线 */}
						{index < steps.length - 1 && (
							<div className={`w-12 h-px mx-2 ${
								isCompleted ? 'bg-white/30' : 'bg-white/10'
							}`} />
						)}
					</div>
				);
			})}
		</div>
	);
}
