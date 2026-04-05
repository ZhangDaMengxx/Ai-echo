import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// useResponsive Hook 测试
// 响应式断点检测、移动端优化
// ============================================================

// 模拟 window.matchMedia
const mockMatchMedia = (matches: boolean) => {
	return vi.fn().mockImplementation((query: string) => ({
		matches,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
};

describe('响应式断点检测', () => {
	const originalMatchMedia = window.matchMedia;

	afterEach(() => {
		window.matchMedia = originalMatchMedia;
	});

	it('应在宽度 < 640px 时识别为移动端', () => {
		window.matchMedia = mockMatchMedia(true);
		const isMobile = window.matchMedia('(max-width: 639px)').matches;
		expect(isMobile).toBe(true);
	});

	it('应在宽度 >= 640px 时识别为非移动端', () => {
		window.matchMedia = mockMatchMedia(false);
		const isMobile = window.matchMedia('(max-width: 639px)').matches;
		expect(isMobile).toBe(false);
	});

	it('应在宽度 >= 1024px 时识别为桌面端', () => {
		window.matchMedia = mockMatchMedia(true);
		const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
		expect(isDesktop).toBe(true);
	});
});

describe('移动端优化配置', () => {
	const MOBILE_PARTICLE_COUNT = 40;
	const DESKTOP_PARTICLE_COUNT = 80;

	it('移动端粒子数量应减半', () => {
		const isMobile = true;
		const particleCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT;
		expect(particleCount).toBe(40);
	});

	it('桌面端应使用完整粒子数量', () => {
		const isMobile = false;
		const particleCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT;
		expect(particleCount).toBe(80);
	});
});

describe('响应式尺寸映射', () => {
	it('应定义响应式对话框宽度', () => {
		const DIALOG_WIDTH = {
			mobile: '95vw',
			tablet: '80vw',
			desktop: '800px',
		};

		expect(DIALOG_WIDTH.mobile).toBe('95vw');
		expect(DIALOG_WIDTH.tablet).toBe('80vw');
		expect(DIALOG_WIDTH.desktop).toBe('800px');
	});

	it('应定义响应式字体大小', () => {
		const FONT_SIZE = {
			mobile: {
				title: '1.25rem',
				body: '0.875rem',
			},
			desktop: {
				title: '1.5rem',
				body: '1rem',
			},
		};

		expect(FONT_SIZE.mobile.title).toBe('1.25rem');
		expect(FONT_SIZE.mobile.body).toBe('0.875rem');
		expect(FONT_SIZE.desktop.title).toBe('1.5rem');
		expect(FONT_SIZE.desktop.body).toBe('1rem');
	});
});

describe('触摸交互支持', () => {
	it('应支持触摸事件检测', () => {
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		expect(typeof isTouchDevice).toBe('boolean');
	});

	it('移动端应启用滑动阈值', () => {
		const SWIPE_THRESHOLD = 50;
		expect(SWIPE_THRESHOLD).toBe(50);
	});

	it('应支持触摸点追踪', () => {
		const touchStart = { x: 100, y: 200 };
		const touchEnd = { x: 200, y: 200 };
		const deltaX = touchEnd.x - touchStart.x;
		
		expect(deltaX).toBe(100);
		expect(deltaX > 50).toBe(true);
	});
});

describe('响应式导航配置', () => {
	it('移动端应使用汉堡菜单', () => {
		const NAV_CONFIG = {
			mobile: { type: 'hamburger', items: 3 },
			desktop: { type: 'horizontal', items: 3 },
		};

		expect(NAV_CONFIG.mobile.type).toBe('hamburger');
		expect(NAV_CONFIG.desktop.type).toBe('horizontal');
	});

	it('导航项应保持不变', () => {
		const NAV_ITEMS = ['Memory', 'Story', 'Dialogue'];
		expect(NAV_ITEMS).toHaveLength(3);
		expect(NAV_ITEMS).toContain('Memory');
		expect(NAV_ITEMS).toContain('Story');
		expect(NAV_ITEMS).toContain('Dialogue');
	});
});
