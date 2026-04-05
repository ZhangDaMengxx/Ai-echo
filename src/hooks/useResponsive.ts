'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// useResponsive: 响应式布局 Hook
// 断点检测、移动端优化、触摸交互
// ============================================================

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveState {
	breakpoint: Breakpoint;
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
	isTouchDevice: boolean;
}

// 响应式配置
export const RESPONSIVE_CONFIG = {
	breakpoints: {
		mobile: 640,
		tablet: 1024,
	},
	particles: {
		mobile: 40,
		tablet: 60,
		desktop: 80,
	},
	dialog: {
		mobile: '95vw',
		tablet: '80vw',
		desktop: '800px',
	},
	fontSize: {
		mobile: {
			title: '1.25rem',
			body: '0.875rem',
		},
		desktop: {
			title: '1.5rem',
			body: '1rem',
		},
	},
	nav: {
		mobile: { type: 'hamburger' as const, items: 3 },
		desktop: { type: 'horizontal' as const, items: 3 },
	},
};

// 导航项
export const NAV_ITEMS = ['Memory', 'Story', 'Dialogue'];

// 滑动阈值
export const SWIPE_THRESHOLD = 50;

/**
 * 检测是否为触摸设备
 */
export function isTouchDevice(): boolean {
	if (typeof window === 'undefined') return false;
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 根据窗口宽度获取断点
 */
export function getBreakpoint(width: number): Breakpoint {
	if (width < RESPONSIVE_CONFIG.breakpoints.mobile) {
		return 'mobile';
	}
	if (width < RESPONSIVE_CONFIG.breakpoints.tablet) {
		return 'tablet';
	}
	return 'desktop';
}

/**
 * 获取响应式粒子数量
 */
export function getParticleCount(breakpoint: Breakpoint): number {
	return RESPONSIVE_CONFIG.particles[breakpoint];
}

/**
 * 获取响应式对话框宽度
 */
export function getDialogWidth(breakpoint: Breakpoint): string {
	return RESPONSIVE_CONFIG.dialog[breakpoint];
}

/**
 * 计算滑动方向
 */
export function calculateSwipe(
	startX: number,
	endX: number,
	threshold: number = SWIPE_THRESHOLD
): 'left' | 'right' | null {
	const deltaX = endX - startX;
	if (Math.abs(deltaX) < threshold) return null;
	return deltaX > 0 ? 'right' : 'left';
}

/**
 * 响应式 Hook
 */
export function useResponsive(): ResponsiveState {
	const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
	const [isTouch, setIsTouch] = useState(false);

	// 更新断点
	const updateBreakpoint = useCallback(() => {
		const newBreakpoint = getBreakpoint(window.innerWidth);
		setBreakpoint(newBreakpoint);
	}, []);

	useEffect(() => {
		// 初始检测
		updateBreakpoint();
		setIsTouch(isTouchDevice());

		// 监听窗口变化
		window.addEventListener('resize', updateBreakpoint);

		return () => {
			window.removeEventListener('resize', updateBreakpoint);
		};
	}, [updateBreakpoint]);

	// 使用 useMemo 缓存计算结果
	return useMemo(() => ({
		breakpoint,
		isMobile: breakpoint === 'mobile',
		isTablet: breakpoint === 'tablet',
		isDesktop: breakpoint === 'desktop',
		isTouchDevice: isTouch,
	}), [breakpoint, isTouch]);
}

/**
 * 触摸滑动 Hook
 */
interface UseSwipeOptions {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	threshold?: number;
}

interface UseSwipeReturn {
	onTouchStart: (e: React.TouchEvent) => void;
	onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe(options: UseSwipeOptions): UseSwipeReturn {
	const { onSwipeLeft, onSwipeRight, threshold = SWIPE_THRESHOLD } = options;
	const [touchStart, setTouchStart] = useState<number | null>(null);

	const onTouchStart = useCallback((e: React.TouchEvent) => {
		setTouchStart(e.touches[0].clientX);
	}, []);

	const onTouchEnd = useCallback((e: React.TouchEvent) => {
		if (touchStart === null) return;

		const endX = e.changedTouches[0].clientX;
		const direction = calculateSwipe(touchStart, endX, threshold);

		if (direction === 'left' && onSwipeLeft) {
			onSwipeLeft();
		} else if (direction === 'right' && onSwipeRight) {
			onSwipeRight();
		}

		setTouchStart(null);
	}, [touchStart, threshold, onSwipeLeft, onSwipeRight]);

	return { onTouchStart, onTouchEnd };
}
