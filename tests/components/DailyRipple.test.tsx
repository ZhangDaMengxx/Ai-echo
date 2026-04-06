// ============================================================
// DailyRipple 组件测试
// 功能: 测试每日涟漪组件
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyRipple } from '../../src/components/DailyRipple';

describe('DailyRipple', () => {
	const mockRipple = {
		id: 'ripple_2026-04-06',
		date: '2026-04-06',
		type: 'morning' as const,
		primaryEmotion: 'joyful' as const,
		resonanceScore: 0.75,
		quote: '今天的阳光正好，就像你心中的那份喜悦。',
		insight: {
			type: 'encouragement' as const,
			message: '你的情绪正在向上发展！',
			action: '记录下让你开心的事情。',
		},
		relatedNodes: ['node_1'],
		trend: {
			direction: 'upward' as const,
			strength: 0.8,
			periodDays: 7,
		},
		isRead: false,
		createdAt: '2026-04-06T08:00:00Z',
	};

	it('should render ripple card', () => {
		render(<DailyRipple ripple={mockRipple} />);
		expect(screen.getByText(/今日涟漪/i)).toBeInTheDocument();
	});

	it('should display quote', () => {
		render(<DailyRipple ripple={mockRipple} />);
		expect(screen.getByText(new RegExp(mockRipple.quote.slice(0, 10)))).toBeInTheDocument();
	});

	it('should display insight message', () => {
		render(<DailyRipple ripple={mockRipple} />);
		expect(screen.getByText(mockRipple.insight.message)).toBeInTheDocument();
	});

	it('should display emotion badge', () => {
		render(<DailyRipple ripple={mockRipple} />);
		const badges = screen.getAllByText(/喜悦/i);
		expect(badges.length).toBeGreaterThan(0);
	});

	it('should display resonance score', () => {
		render(<DailyRipple ripple={mockRipple} />);
		expect(screen.getByText(/75%/)).toBeInTheDocument();
	});

	it('should display trend indicator', () => {
		render(<DailyRipple ripple={mockRipple} />);
		const trends = screen.getAllByText(/上升/i);
		expect(trends.length).toBeGreaterThan(0);
	});

	it('should call onDismiss when dismiss button clicked', () => {
		const onDismiss = vi.fn();
		render(<DailyRipple ripple={mockRipple} onDismiss={onDismiss} />);
		
		const dismissButton = screen.getByText(/知道了/i);
		fireEvent.click(dismissButton);
		
		expect(onDismiss).toHaveBeenCalled();
	});

	it('should call onNodeClick when related node clicked', () => {
		const onNodeClick = vi.fn();
		render(<DailyRipple ripple={mockRipple} onNodeClick={onNodeClick} />);
		
		const nodeButton = screen.getByText(/查看相关记忆/i);
		fireEvent.click(nodeButton);
		
		expect(onNodeClick).toHaveBeenCalledWith('node_1');
	});

	it('should render evening type differently', () => {
		const eveningRipple = { ...mockRipple, type: 'evening' as const };
		render(<DailyRipple ripple={eveningRipple} />);
		expect(screen.getByText(/晚间回顾/i)).toBeInTheDocument();
	});

	it('should render support type insight differently', () => {
		const supportRipple = {
			...mockRipple,
			insight: {
				type: 'support' as const,
				message: '最近可能有些不顺。',
				action: '尝试放松一下。',
			},
		};
		render(<DailyRipple ripple={supportRipple} />);
		expect(screen.getByText(/最近可能有些不顺/)).toBeInTheDocument();
	});
});
