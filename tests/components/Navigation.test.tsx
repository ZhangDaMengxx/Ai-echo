// ============================================================
// 测试: Navigation 组件
// 描述: 验证导航结构、主题切换按钮、链接
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '@/components/Navigation';
import { ThemeProvider } from '@/components/ThemeProvider';

describe('Navigation', () => {
	it('应显示 Logo/品牌名', () => {
		render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		expect(screen.getByText('回音轨迹')).toBeDefined();
	});

	it('应包含主题切换按钮', () => {
		render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		const themeBtn = screen.getByRole('button', { name: /切换主题/i });
		expect(themeBtn).toBeDefined();
	});

	it('点击主题按钮应切换主题', () => {
		render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		const themeBtn = screen.getByRole('button', { name: /切换主题/i });
		
		// 初始浅色
		expect(document.documentElement.classList.contains('dark')).toBe(false);
		
		// 点击切换
		fireEvent.click(themeBtn);
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});
});


describe('Navigation 样式', () => {
	it('应使用琥珀色背景', () => {
		const { container } = render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		const nav = container.querySelector('nav');
		expect(nav?.className).toContain('bg-amber-100');
	});

	it('应使用手写体字体', () => {
		render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		const brand = screen.getByText('回音轨迹');
		expect(brand.className).toContain('font-handwriting');
	});
});


describe('Navigation 无障碍', () => {
	it('导航按钮应有 aria-label', () => {
		render(
			<ThemeProvider>
				<Navigation />
			</ThemeProvider>
		);
		const themeBtn = screen.getByRole('button', { name: /切换主题/i });
		expect(themeBtn.getAttribute('aria-label')).toBeDefined();
	});
});
