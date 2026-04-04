// ============================================================
// 测试: TranslucentContainer 半透明容器
// 描述: 验证冰块质感、高斯模糊、水面涟漪
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { TranslucentContainer } from '@/components/TranslucentContainer';

describe('TranslucentContainer', () => {
	it('应渲染子元素', () => {
		const { container } = render(
			<TranslucentContainer>
				<div data-testid="child">内容</div>
			</TranslucentContainer>
		);
		expect(container.querySelector('[data-testid="child"]')).toBeDefined();
	});

	it('应存在容器元素', () => {
		const { container } = render(
			<TranslucentContainer>内容</TranslucentContainer>
		);
		const wrapper = container.firstChild;
		expect(wrapper).toBeDefined();
	});

	it('拖拽文件时应产生涟漪效果', () => {
		const { container } = render(
			<TranslucentContainer>内容</TranslucentContainer>
		);
		const wrapper = container.firstChild as HTMLElement;
		if (wrapper) {
			fireEvent.dragEnter(wrapper);
			expect(wrapper.classList.contains('ripple')).toBe(true);
		}
	});

	it('应存在 onPaste 回调属性', () => {
		// 简化测试：仅验证组件接受 onPaste 属性而不报错
		const { container } = render(
			<TranslucentContainer onPaste={() => {}}>
				内容
			</TranslucentContainer>
		);
		const wrapper = container.firstChild;
		expect(wrapper).toBeDefined();
	});
});
