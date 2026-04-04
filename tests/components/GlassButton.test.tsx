// ============================================================
// 测试: GlassButton 玻璃拟态按钮
// 描述: 验证极简风格、柔光特效、无实体边框
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassButton } from '@/components/GlassButton';

describe('GlassButton', () => {
	it('应渲染文字内容', () => {
		render(<GlassButton>Memory</GlassButton>);
		expect(screen.getByText('Memory')).toBeDefined();
	});

	it('应无实体边框', () => {
		const { container } = render(<GlassButton>测试</GlassButton>);
		const button = container.querySelector('button');
		expect(button?.className).not.toContain('border-solid');
	});

	it('应无填充背景', () => {
		const { container } = render(<GlassButton>测试</GlassButton>);
		const button = container.querySelector('button');
		expect(button?.className).not.toContain('bg-');
	});

	it('应为纯白色文字', () => {
		const { container } = render(<GlassButton>测试</GlassButton>);
		const button = container.querySelector('button');
		expect(button?.className).toContain('text-white');
	});

	it('悬停时应产生柔光效果', () => {
		const { container } = render(<GlassButton>测试</GlassButton>);
		const button = container.querySelector('button');
		expect(button?.className).toContain('hover:shadow');
		expect(button?.className).toContain('hover:shadow-white');
	});

	it('应支持激活状态', () => {
		const { container } = render(<GlassButton active>激活</GlassButton>);
		const button = container.querySelector('button');
		expect(button?.className).toContain('text-opacity-100');
	});
});


describe('GlassButton 导航', () => {
	it('Memory 按钮点击应触发导航', () => {
		let clicked = false;
		render(
			<GlassButton onClick={() => clicked = true}>Memory</GlassButton>
		);
		fireEvent.click(screen.getByText('Memory'));
		expect(clicked).toBe(true);
	});

	it('Story 按钮点击应触发导航', () => {
		let clicked = false;
		render(
			<GlassButton onClick={() => clicked = true}>Story</GlassButton>
		);
		fireEvent.click(screen.getByText('Story'));
		expect(clicked).toBe(true);
	});
});
