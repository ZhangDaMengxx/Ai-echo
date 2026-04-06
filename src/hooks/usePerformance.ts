'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================
// usePerformance: 性能监控与优化 Hook
// 渲染性能监控、缓存优化、懒加载支持
// ============================================================

// 性能标记常量
export const PERF_MARKS = {
	RENDER_START: 'render_start',
	RENDER_END: 'render_end',
	INTERACTION_START: 'interaction_start',
	INTERACTION_END: 'interaction_end',
} as const;

// 性能测量名称
export const PERF_MEASURES = {
	RENDER_TIME: 'render_time',
	INTERACTION_TIME: 'interaction_time',
} as const;

// 缓存配置
export const MEMO_CONFIG = {
	maxSize: 100,
	ttl: 5 * 60 * 1000, // 5分钟
};

// 虚拟列表配置
export const VIRTUAL_LIST_CONFIG = {
	itemHeight: 50,
	overscan: 5,
	containerHeight: 400,
};

/**
 * 记忆化函数 - 缓存计算结果
 */
export function memoize<T extends (...args: any[]) => any>(
	fn: T,
	maxSize: number = MEMO_CONFIG.maxSize
): T {
	const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

	return ((...args: any[]) => {
		const key = JSON.stringify(args);
		const now = Date.now();
		const cached = cache.get(key);

		// 检查缓存是否有效
		if (cached && now - cached.timestamp < MEMO_CONFIG.ttl) {
			return cached.value;
		}

		// 计算结果
		const result = fn(...args);

		// 清理过期缓存
		if (cache.size >= maxSize) {
			const oldestKey = cache.keys().next().value;
			if (oldestKey) cache.delete(oldestKey);
		}

		cache.set(key, { value: result, timestamp: now });
		return result;
	}) as T;
}

/**
 * 计算虚拟列表可见范围
 */
export function calculateVisibleRange(
	scrollTop: number,
	containerHeight: number,
	itemHeight: number,
	overscan: number,
	totalItems: number
): { startIndex: number; endIndex: number; visibleCount: number } {
	const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
	const visibleCount = Math.ceil(containerHeight / itemHeight);
	const endIndex = Math.min(startIndex + visibleCount + overscan * 2, totalItems);

	return { startIndex, endIndex, visibleCount };
}

/**
 * 性能监控 Hook
 */
interface PerformanceMetrics {
	renderCount: number;
	lastRenderTime: number;
	averageRenderTime: number;
}

export function usePerformanceMonitor(componentName: string) {
	const metricsRef = useRef<PerformanceMetrics>({
		renderCount: 0,
		lastRenderTime: 0,
		averageRenderTime: 0,
	});
	const renderStartRef = useRef<number>(0);

	useEffect(() => {
		renderStartRef.current = performance.now();

		return () => {
			const renderTime = performance.now() - renderStartRef.current;
			const metrics = metricsRef.current;

			metrics.renderCount++;
			metrics.lastRenderTime = renderTime;
			metrics.averageRenderTime =
				(metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
				metrics.renderCount;

			// 性能标记
			if (process.env.NODE_ENV === 'development') {
				performance.mark(`${PERF_MARKS.RENDER_END}_${componentName}`);
				performance.measure(
					`${PERF_MEASURES.RENDER_TIME}_${componentName}`,
					`${PERF_MARKS.RENDER_START}_${componentName}`,
					`${PERF_MARKS.RENDER_END}_${componentName}`
				);
			}
		};
	}, [componentName]);

	// 记录渲染开始
	if (process.env.NODE_ENV === 'development') {
		performance.mark(`${PERF_MARKS.RENDER_START}_${componentName}`);
	}

	return metricsRef.current;
}

/**
 * 交互性能监控
 */
export function useInteractionMonitor(actionName: string) {
	const startTimeRef = useRef<number>(0);

	const start = useCallback(() => {
		startTimeRef.current = performance.now();
		if (process.env.NODE_ENV === 'development') {
			performance.mark(`${PERF_MARKS.INTERACTION_START}_${actionName}`);
		}
	}, [actionName]);

	const end = useCallback(() => {
		if (process.env.NODE_ENV === 'development' && startTimeRef.current > 0) {
			performance.mark(`${PERF_MARKS.INTERACTION_END}_${actionName}`);
			performance.measure(
				`${PERF_MEASURES.INTERACTION_TIME}_${actionName}`,
				`${PERF_MARKS.INTERACTION_START}_${actionName}`,
				`${PERF_MARKS.INTERACTION_END}_${actionName}`
			);
		}
		startTimeRef.current = 0;
	}, [actionName]);

	return { start, end };
}

/**
 * 懒加载 Hook - 用于图片或组件
 */
interface UseLazyLoadOptions {
	threshold?: number;
	rootMargin?: string;
}

export function useLazyLoad<T extends HTMLElement>(
	options: UseLazyLoadOptions = {}
): [React.RefObject<T>, boolean] {
	const { threshold = 0.1, rootMargin = '50px' } = options;
	const elementRef = useRef<T>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.unobserve(element);
				}
			},
			{ threshold, rootMargin }
		);

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [threshold, rootMargin]);

	return [elementRef, isVisible];
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

/**
 * 节流 Hook
 */
export function useThrottle<T extends (...args: any[]) => any>(
	fn: T,
	limit: number
): T {
	const lastRunRef = useRef<number>(0);
	const fnRef = useRef(fn);

	fnRef.current = fn;

	return useCallback(
		((...args: any[]) => {
			const now = Date.now();
			if (now - lastRunRef.current >= limit) {
				lastRunRef.current = now;
				fnRef.current(...args);
			}
		}) as T,
		[limit]
	);
}
