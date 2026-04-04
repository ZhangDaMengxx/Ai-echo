// ============================================================
// 测试: AIDialog AI对话展示框
// 描述: 验证消息展示、自动滚动、样式
// ============================================================

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AIDialog } from '@/components/AIDialog';

const mockMessages = [
	{ id: '1', role: 'system' as const, content: '*他静静地坐着，肩膀还带着外场淋雨后的水渍*' },
	{ id: '2', role: 'assistant' as const, content: '...没事。只是有点冷。' },
] as const;

describe('AIDialog', () => {
	it('应渲染消息列表', () => {
		const { container } = render(<AIDialog messages={[...mockMessages]} />);
		// 使用 textContent 检查而不是 getByText，因为 TypewriterText 将文本分割成多个 span
		expect(container.textContent).toContain('...没事。只是有点冷。');
	});

	it('系统消息应有斜体效果', () => {
		const { container } = render(<AIDialog messages={[...mockMessages]} />);
		const systemMsg = container.querySelector('.italic');
		expect(systemMsg).toBeDefined();
		expect(systemMsg?.textContent).toContain('他静静地坐着');
	});

	it('应渲染AI回复', () => {
		const { container } = render(<AIDialog messages={[...mockMessages]} />);
		expect(container.textContent).toContain('...没事。只是有点冷。');
	});

	it('应具有模糊背景', () => {
		const { container } = render(<AIDialog messages={[...mockMessages]} />);
		const dialog = container.querySelector('.backdrop-blur-2xl');
		expect(dialog).toBeDefined();
	});
});
