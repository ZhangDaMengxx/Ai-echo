// ============================================================
// CharacterDetailModal Tests: 人物详情弹窗组件测试
// 测试内容: 渲染、关闭、操作按钮、统计数据
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterDetailModal } from '@/components/CharacterDetailModal';
import type { Character } from '@/types/character';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockCharacter: Character = {
	id: 'char_001',
	name: 'Elara',
	slug: 'elara',
	avatar: '👤',
	description: '一个理性而内敛的灵魂，习惯独自消化情绪。在深夜时分会展现出少有的感性一面。',
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

const mockProfile = {
	character_id: 'char_001',
	name: 'Elara',
	style: '简洁克制',
	logic: '理性优先',
	dominant_emotions: ['平静', '内敛', '偶尔忧郁'],
	dominant_attitudes: ['观察', '思考'],
	summary: '一个理性而内敛的灵魂',
	global_vibe: 'melancholy',
};

describe('CharacterDetailModal', () => {
	describe('渲染测试', () => {
		it('当isOpen为false时不渲染', () => {
			render(
				<CharacterDetailModal
					isOpen={false}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.queryByTestId('character-detail-modal')).not.toBeInTheDocument();
		});

		it('当isOpen为true时正确渲染', () => {
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.getByTestId('character-detail-modal')).toBeInTheDocument();
			expect(screen.getByText('Elara')).toBeInTheDocument();
		});

		it('应该显示人物描述', () => {
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.getByText(mockCharacter.description!)).toBeInTheDocument();
		});

		it('应该显示性格画像信息', () => {
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.getByText('表达风格:')).toBeInTheDocument();
			expect(screen.getByText('简洁克制')).toBeInTheDocument();
			expect(screen.getByText('理性优先')).toBeInTheDocument();
		});

		it('应该显示统计数据', () => {
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			// 使用部分匹配，因为数字和文本可能在不同元素
			expect(screen.getByText(/记忆节点/)).toBeInTheDocument();
			expect(screen.getByText(/隐藏线索/)).toBeInTheDocument();
			expect(screen.getByText(/IF线分支/)).toBeInTheDocument();
			// 验证数字存在
			const elements = screen.getAllByText(/12|5|2/);
			expect(elements.length).toBeGreaterThan(0);
		});
	});

	describe('交互测试', () => {
		it('点击关闭按钮触发onClose', () => {
			const handleClose = vi.fn();
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={handleClose}
					onEnterStory={() => {}}
				/>
			);
			
			const closeBtn = screen.getByTestId('modal-close-btn');
			fireEvent.click(closeBtn);
			
			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it('点击"进入Story"按钮触发onEnterStory', () => {
			const handleEnter = vi.fn();
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={handleEnter}
				/>
			);
			
			const enterBtn = screen.getByText('进入Story');
			fireEvent.click(enterBtn);
			
			expect(handleEnter).toHaveBeenCalledTimes(1);
		});

		it('点击"返回"按钮触发onClose', () => {
			const handleClose = vi.fn();
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={handleClose}
					onEnterStory={() => {}}
				/>
			);
			
			const backBtn = screen.getByText('返回');
			fireEvent.click(backBtn);
			
			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it('点击背景遮罩触发onClose', () => {
			const handleClose = vi.fn();
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={mockProfile}
					onClose={handleClose}
					onEnterStory={() => {}}
				/>
			);
			
			const overlay = screen.getByTestId('modal-overlay');
			fireEvent.click(overlay);
			
			expect(handleClose).toHaveBeenCalledTimes(1);
		});
	});

	describe('边界测试', () => {
		it('当没有profile时应该正常渲染', () => {
			render(
				<CharacterDetailModal
					isOpen={true}
					character={mockCharacter}
					profile={null}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.getByTestId('character-detail-modal')).toBeInTheDocument();
			expect(screen.getByText('Elara')).toBeInTheDocument();
		});

		it('当没有description时不显示描述区域', () => {
			const charNoDesc = { ...mockCharacter, description: undefined };
			render(
				<CharacterDetailModal
					isOpen={true}
					character={charNoDesc}
					profile={mockProfile}
					onClose={() => {}}
					onEnterStory={() => {}}
				/>
			);
			
			expect(screen.queryByTestId('character-description')).not.toBeInTheDocument();
		});
	});
});
