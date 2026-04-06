// ============================================================
// PersonalityTest Tests: 心理学测试组件测试
// 测试内容: 渲染、选项选择、进度、提交
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalityTest } from '@/components/PersonalityTest';
import { personalityQuestions } from '@/lib/personalityTest';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
		button: ({ children, ...props }: { children: React.ReactNode }) => <button {...props}>{children}</button>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock personalityTest module
vi.mock('@/lib/personalityTest', () => ({
	personalityQuestions: [
		{
			id: 'q1',
			text: '问题1',
			options: [
				{ value: 'A', label: '选项A', scores: {} },
				{ value: 'B', label: '选项B', scores: {} },
				{ value: 'C', label: '选项C', scores: {} },
				{ value: 'D', label: '选项D', scores: {} },
			]
		},
		{
			id: 'q2',
			text: '问题2',
			options: [
				{ value: 'A', label: '选项A', scores: {} },
				{ value: 'B', label: '选项B', scores: {} },
			]
		}
	]
}));

describe('PersonalityTest', () => {
	describe('渲染测试', () => {
		it('应该正确渲染第一个问题', () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			expect(screen.getByText('初步性格测试')).toBeInTheDocument();
			expect(screen.getByText(`问题 1 of ${personalityQuestions.length}`)).toBeInTheDocument();
			expect(screen.getByText(personalityQuestions[0].text)).toBeInTheDocument();
		});

		it('应该显示所有选项', () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			personalityQuestions[0].options.forEach(option => {
				expect(screen.getByText(option.label)).toBeInTheDocument();
			});
		});

		it('应该显示进度条', () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			const progressBar = screen.getByRole('progressbar');
			expect(progressBar).toBeInTheDocument();
		});

		it('应该显示跳过按钮', () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			expect(screen.getByText('跳过测试')).toBeInTheDocument();
		});
	});

	describe('交互测试', () => {
		it('选择选项后应该进入下一题', async () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			const firstOption = screen.getByText(personalityQuestions[0].options[0].label);
			fireEvent.click(firstOption);
			
			await waitFor(() => {
				expect(screen.getByText(`问题 2 of ${personalityQuestions.length}`)).toBeInTheDocument();
			});
		});

		it('应该能完成所有题目并提交', async () => {
			const handleComplete = vi.fn();
			render(<PersonalityTest onComplete={handleComplete} onSkip={() => {}} />);
			
			// 回答所有问题
			for (let i = 0; i < personalityQuestions.length; i++) {
				const option = screen.getByText(personalityQuestions[i].options[0].label);
				fireEvent.click(option);
				
				if (i < personalityQuestions.length - 1) {
					await waitFor(() => {
						expect(screen.getByText(`问题 ${i + 2} of ${personalityQuestions.length}`)).toBeInTheDocument();
					});
				}
			}
			
			await waitFor(() => {
				expect(handleComplete).toHaveBeenCalledTimes(1);
			});
			
			// 验证回调包含答案
			const callArg = handleComplete.mock.calls[0][0];
			expect(callArg).toHaveLength(personalityQuestions.length);
			expect(callArg[0]).toHaveProperty('questionId');
			expect(callArg[0]).toHaveProperty('answer');
		});

		it('点击跳过应该触发onSkip', () => {
			const handleSkip = vi.fn();
			render(<PersonalityTest onComplete={() => {}} onSkip={handleSkip} />);
			
			const skipBtn = screen.getByText('跳过测试');
			fireEvent.click(skipBtn);
			
			expect(handleSkip).toHaveBeenCalledTimes(1);
		});
	});

	describe('进度计算', () => {
		it('第一题进度应该是 20%', () => {
			render(<PersonalityTest onComplete={() => {}} onSkip={() => {}} />);
			
			const progressBar = screen.getByRole('progressbar');
			const expectedProgress = (1 / personalityQuestions.length) * 100;
			expect(progressBar).toHaveAttribute('aria-valuenow', String(expectedProgress));
		});
	});
});
