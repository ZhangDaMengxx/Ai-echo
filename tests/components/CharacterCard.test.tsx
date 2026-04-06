// ============================================================
// CharacterCard Tests: 人物卡片组件测试
// 测试内容: 渲染、交互、空状态、响应式
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '@/components/CharacterCard';
import type { Character } from '@/types/character';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
	},
}));

const mockCharacter: Character = {
	id: 'char_001',
	name: 'Elara',
	slug: 'elara',
	avatar: '👤',
	description: '一个理性而内敛的灵魂',
	createdAt: '2024-01-15T00:00:00Z',
	updatedAt: '2024-04-06T12:00:00Z',
	isDefault: false,
	stats: {
		nodeCount: 12,
		clueCount: 5,
		branchCount: 2,
		lastInteraction: '2024-04-06T10:30:00Z',
	},
};

describe('CharacterCard', () => {
	describe('渲染测试', () => {
		it('应该正确渲染人物卡片', () => {
			render(<CharacterCard character={mockCharacter} onClick={() => {}} />);
			
			expect(screen.getByText('Elara')).toBeInTheDocument();
			expect(screen.getByText('👤')).toBeInTheDocument();
			// 使用部分匹配，因为数字和文本可能在不同元素
			expect(screen.getByText(/12/)).toBeInTheDocument();
			expect(screen.getByText(/个记忆/)).toBeInTheDocument();
		});

		it('应该显示正确的统计数据', () => {
			render(<CharacterCard character={mockCharacter} onClick={() => {}} />);
			
			expect(screen.getByText(/12/)).toBeInTheDocument();
			expect(screen.getByText(/个记忆/)).toBeInTheDocument();
		});

		it('应该显示emoji头像', () => {
			render(<CharacterCard character={mockCharacter} onClick={() => {}} />);
			
			const avatar = screen.getByText('👤');
			expect(avatar).toBeInTheDocument();
		});

		it('当没有头像时应该显示默认头像', () => {
			const charWithoutAvatar = { ...mockCharacter, avatar: undefined };
			render(<CharacterCard character={charWithoutAvatar} onClick={() => {}} />);
			
			expect(screen.getByText('👤')).toBeInTheDocument();
		});
	});

	describe('交互测试', () => {
		it('点击卡片应该触发onClick回调', () => {
			const handleClick = vi.fn();
			render(<CharacterCard character={mockCharacter} onClick={handleClick} />);
			
			const card = screen.getByTestId('character-card');
			fireEvent.click(card);
			
			expect(handleClick).toHaveBeenCalledTimes(1);
			expect(handleClick).toHaveBeenCalledWith(mockCharacter);
		});

		it('双击卡片应该触发onDoubleClick回调', () => {
			const handleDoubleClick = vi.fn();
			render(
				<CharacterCard 
					character={mockCharacter} 
					onClick={() => {}}
					onDoubleClick={handleDoubleClick}
				/>
			);
			
			const card = screen.getByTestId('character-card');
			fireEvent.doubleClick(card);
			
			expect(handleDoubleClick).toHaveBeenCalledTimes(1);
			expect(handleDoubleClick).toHaveBeenCalledWith(mockCharacter);
		});
	});

	describe('时间格式化测试', () => {
		it('应该正确显示今天', () => {
			const today = new Date().toISOString();
			const char = { ...mockCharacter, stats: { ...mockCharacter.stats, lastInteraction: today } };
			render(<CharacterCard character={char} onClick={() => {}} />);
			
			expect(screen.getByText(/今天/)).toBeInTheDocument();
		});

		it('应该正确显示"3天前"', () => {
			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
			const char = { 
				...mockCharacter, 
				stats: { ...mockCharacter.stats, lastInteraction: threeDaysAgo.toISOString() }
			};
			render(<CharacterCard character={char} onClick={() => {}} />);
			
			expect(screen.getByText(/3天前/)).toBeInTheDocument();
		});

		it('应该正确显示"上周"', () => {
			const lastWeek = new Date();
			lastWeek.setDate(lastWeek.getDate() - 7);
			const char = { 
				...mockCharacter, 
				stats: { ...mockCharacter.stats, lastInteraction: lastWeek.toISOString() }
			};
			render(<CharacterCard character={char} onClick={() => {}} />);
			
			expect(screen.getByText(/上周/)).toBeInTheDocument();
		});

		it('当没有最后交互时间时不显示最近时间', () => {
			const char = { 
				...mockCharacter, 
				stats: { ...mockCharacter.stats, lastInteraction: undefined }
			};
			render(<CharacterCard character={char} onClick={() => {}} />);
			
			expect(screen.queryByText(/最近:/)).not.toBeInTheDocument();
		});
	});

	describe('边界测试', () => {
		it('应该处理0个记忆的情况', () => {
			const charWithNoNodes = { 
				...mockCharacter, 
				stats: { ...mockCharacter.stats, nodeCount: 0 }
			};
			render(<CharacterCard character={charWithNoNodes} onClick={() => {}} />);
			
			expect(screen.getByText(/0/)).toBeInTheDocument();
		});

		it('应该处理很长的名称', () => {
			const charWithLongName = { ...mockCharacter, name: '非常长的人物名称测试' };
			render(<CharacterCard character={charWithLongName} onClick={() => {}} />);
			
			expect(screen.getByText('非常长的人物名称测试')).toBeInTheDocument();
		});
	});
});
