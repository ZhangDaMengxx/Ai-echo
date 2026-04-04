'use client';

import React from 'react';
import { Navigation } from './Navigation';

// ============================================================
// Layout: 主布局组件
// 包含导航栏和主内容区域
// ============================================================

interface LayoutProps {
	children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
	return (
		<div className="min-h-screen bg-amber-50 text-amber-900 dark:bg-warm-dark dark:text-warm-text">
			<Navigation />
			<main
				className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
				role="main"
			>
				{children}
			</main>
		</div>
	);
}
