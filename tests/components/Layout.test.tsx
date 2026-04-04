// ============================================================
// 测试: Layout 组件
// 描述: 验证布局结构、样式、子元素渲染
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from '@/components/Layout';
import { ThemeProvider } from '@/components/ThemeProvider';

describe('Layout', () => {
	it('应渲染子元素', () => {
		render(
			<ThemeProvider>
				<Layout>
					<div data-testid="child">子内容</div>
				</Layout>
			</ThemeProvider>
		);
		expect(screen.getByTestId('child')).toBeDefined();
	});

	it('应包含导航区域', () => {
		render(
			<ThemeProvider>
				<Layout>内容</Layout>
			</ThemeProvider>
		);
		expect(screen.getByRole('navigation')).toBeDefined();
	});

	it('应包含主内容区域', () => {
		render(
			<ThemeProvider>
				<Layout>内容</Layout>
			</ThemeProvider>
		);
		expect(screen.getByRole('main')).toBeDefined();
	});
});
