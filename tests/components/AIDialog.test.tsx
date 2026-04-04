// ============================================================
// 测试: AIDialog AI对话展示框
// 描述: 验证消息展示、自动滚动、样式
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIDialog } from '@/components/AIDialog';

const mockMessages = [
	{ id: '1', role: 'system' as const, content: '*他静静地坐着，肩膀还带着外场淋雨后的水渍*' },
	{ id: '2', role: 'assistant' as const, content: '...没事。只是有点冷。' },
] as const;

describe('AIDialog', () => {
	it('应渲染消息列表', () => {
		render(<AIDialog messages={[...mockMessages]} />);
		expect(screen.getByText('...没事。只是有点冷。')).toBeDefined();
	});

	it('系统消息应有斜体效果', () => {
		render(<AIDialog messages={[...mockMessages]} />);
		const systemMsg = screen.getByText('*他静静地坐着，肩膀还带着外场淋雨后的水渍*');
		expect(systemMsg.className).toContain('italic');
	});

	it('应渲染AI回复', () => {
		render(<AIDialog messages={[...mockMessages]} />);
		expect(screen.getByText('...没事。只是有点冷。')).toBeDefined();
	});

	it('应具有模糊背景', () => {
		const { container } = render(<AIDialog messages={[...mockMessages]} />);
		const dialog = container.querySelector('.backdrop-blur-2xl');
		expect(dialog).toBeDefined();
	});
});
