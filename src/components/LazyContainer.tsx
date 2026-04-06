'use client';

import React, { Suspense, ComponentType } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// LazyContainer: 懒加载容器组件
// React.lazy + Suspense 封装
// ============================================================

// 加载占位符
function LoadingFallback() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="flex items-center justify-center min-h-[200px]"
		>
			<div className="relative">
				{/* 加载动画 */}
				<div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
			</div>
		</motion.div>
	);
}

// 延迟加载辅助函数
export function delayImport<T>(
	importFunc: () => Promise<T>,
	delay: number = 300
): Promise<T> {
	return Promise.all([
		importFunc(),
		new Promise((resolve) => setTimeout(resolve, delay)),
	]).then(([moduleExports]) => moduleExports as T);
}

// 懒加载高阶组件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLazyLoad<P extends Record<string, any>>(
	importFunc: () => Promise<{ default: ComponentType<P> }>,
	options: {
		delay?: number;
		fallback?: React.ReactNode;
	} = {}
): (props: P) => JSX.Element {
	const { delay = 0, fallback = <LoadingFallback /> } = options;

	const LazyComponent = React.lazy(() =>
		delay > 0
			? delayImport(importFunc, delay)
			: importFunc()
	);

	// eslint-disable-next-line react/display-name
	return function LazyWrapper(props: P): JSX.Element {
		return (
			<Suspense fallback={fallback}>
				<LazyComponent {...props} />
			</Suspense>
		);
	};
}

// 懒加载图片组件
interface LazyImageProps {
	src: string;
	alt: string;
	className?: string;
	placeholderSrc?: string;
}

import { useLazyLoad } from '../hooks/usePerformance';

export function LazyImage({
	src,
	alt,
	className = '',
	placeholderSrc,
}: LazyImageProps) {
	const [imageRef, isVisible] = useLazyLoad<HTMLImageElement>({
		threshold: 0.1,
		rootMargin: '50px',
	});

	return (
		<div ref={imageRef} className={`relative overflow-hidden ${className}`}>
			{placeholderSrc && !isVisible && (
				<img
					src={placeholderSrc}
					alt=""
					className="absolute inset-0 w-full h-full object-cover blur-sm"
				/>
			)}
			{isVisible && (
				<motion.img
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
					src={src}
					alt={alt}
					className="w-full h-full object-cover"
					loading="lazy"
				/>
			)}
		</div>
	);
}

// 虚拟列表容器
interface VirtualListProps<T> {
	items: T[];
	renderItem: (item: T, index: number) => React.ReactNode;
	itemHeight: number;
	containerHeight: number;
	overscan?: number;
	className?: string;
}

import { useState, useCallback, useRef, useMemo } from 'react';
import { calculateVisibleRange } from '../hooks/usePerformance';

export function VirtualList<T>({
	items,
	renderItem,
	itemHeight,
	containerHeight,
	overscan = 5,
	className = '',
}: VirtualListProps<T>) {
	const [scrollTop, setScrollTop] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const { startIndex, endIndex } = useMemo(
		() =>
			calculateVisibleRange(
				scrollTop,
				containerHeight,
				itemHeight,
				overscan,
				items.length
			),
		[scrollTop, containerHeight, itemHeight, overscan, items.length]
	);

	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollTop(e.currentTarget.scrollTop);
	}, []);

	const visibleItems = useMemo(
		() => items.slice(startIndex, endIndex),
		[items, startIndex, endIndex]
	);

	const totalHeight = items.length * itemHeight;
	const offsetY = startIndex * itemHeight;

	return (
		<div
			ref={containerRef}
			onScroll={handleScroll}
			style={{ height: containerHeight, overflow: 'auto' }}
			className={className}
		>
			<div style={{ height: totalHeight, position: 'relative' }}>
				<div
					style={{
						position: 'absolute',
						top: offsetY,
						left: 0,
						right: 0,
					}}
				>
					{visibleItems.map((item, index) => (
						<div key={startIndex + index} style={{ height: itemHeight }}>
							{renderItem(item, startIndex + index)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
