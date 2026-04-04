// ============================================================
// 测试: ThemeProvider 组件
// 描述: 验证主题切换、本地存储、系统偏好
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

// 测试组件
function TestComponent() {
	const { theme, setTheme, toggleTheme } = useTheme();
	return (
		<div>
			<div data-testid="theme">{theme}</div>
			<button onClick={() => setTheme('light')}>浅色</button>
			<button onClick={() => setTheme('dark')}>深色</button>
			<button onClick={toggleTheme}>切换</button>
		</div>
	);
}

describe('ThemeProvider', () => {
	beforeEach(() => {
		// 清理 localStorage
		localStorage.clear();
		// 重置 document class
		document.documentElement.classList.remove('dark');
	});

	describe('初始化', () => {
		it('应默认使用浅色主题', () => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			expect(screen.getByTestId('theme').textContent).toBe('light');
		});

		it('应从 localStorage 读取保存的主题', () => {
			localStorage.setItem('echo-tracks-theme', 'dark');
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			expect(screen.getByTestId('theme').textContent).toBe('dark');
		});
	});

	describe('主题切换', () => {
		it('应能切换到深色主题', () => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('深色'));
			expect(screen.getByTestId('theme').textContent).toBe('dark');
			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});

		it('应能切换到浅色主题', () => {
			localStorage.setItem('echo-tracks-theme', 'dark');
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('浅色'));
			expect(screen.getByTestId('theme').textContent).toBe('light');
			expect(document.documentElement.classList.contains('dark')).toBe(false);
		});

		it('toggleTheme 应在深浅色间切换', () => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			const toggleBtn = screen.getByText('切换');
			
			// 初始浅色
			expect(screen.getByTestId('theme').textContent).toBe('light');
			
			// 切到深色
			fireEvent.click(toggleBtn);
			expect(screen.getByTestId('theme').textContent).toBe('dark');
			
			// 切回浅色
			fireEvent.click(toggleBtn);
			expect(screen.getByTestId('theme').textContent).toBe('light');
		});
	});

	describe('本地存储', () => {
		it('主题变更应保存到 localStorage', () => {
			render(
				<ThemeProvider>
					<TestComponent />
				</ThemeProvider>
			);
			fireEvent.click(screen.getByText('深色'));
			expect(localStorage.getItem('echo-tracks-theme')).toBe('dark');
		});
	});
});


describe('useTheme hook', () => {
	it('应在 Provider 外抛出错误', () => {
		// 捕获控制台错误
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		
		expect(() => {
			render(<TestComponent />);
		}).toThrow('useTheme must be used within ThemeProvider');
		
		consoleSpy.mockRestore();
	});
});
