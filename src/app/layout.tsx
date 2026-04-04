import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

// ============================================================
// Root Layout: 根布局
// 提供全局样式和主题支持
// ============================================================

export const metadata: Metadata = {
	title: '回音轨迹 | Echo Tracks',
	description: '动态人生档案馆 - 与AI共同书写的羁绊回忆录',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="zh-CN" suppressHydrationWarning>
			<body>
				<ThemeProvider>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
