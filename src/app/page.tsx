'use client';

import { motion } from 'framer-motion';

// ============================================================
// Home Page: 首页示例
// 展示琥珀色治愈系主题效果
// ============================================================

export default function Home() {
	return (
		<div className="space-y-8">
			{/* 欢迎区域 */}
			<motion.section
				className="rounded-lg bg-amber-100 p-8 shadow-paper dark:bg-warm-surface"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="mb-4 font-handwriting text-3xl font-bold text-amber-900 dark:text-warm-text">
					欢迎来到回音轨迹
				</h2>
				<p className="text-lg text-amber-800 dark:text-warm-textSecondary">
					这是你与 AI 共同书写的、可交互的动态人生羁绊档案馆。
				</p>
			</motion.section>

			{/* 特性展示 */}
			<div className="grid gap-6 md:grid-cols-3">
				<FeatureCard
					title="记忆提取"
					description="AI 智能清洗日记，提取人生中最具张力的关键节点"
					delay={0.1}
				/>
				<FeatureCard
					title="沉浸对话"
					description="重返当时场景，与过去的羁绊对象深度对话"
					delay={0.2}
				/>
				<FeatureCard
					title="命运抉择"
					description="收集线索后，决定是拥抱遗憾还是逆天改命"
					delay={0.3}
				/>
			</div>

			{/* 示例拍立得 */}
			<motion.div
				className="mx-auto max-w-md"
				initial={{ opacity: 0, rotate: -5 }}
				animate={{ opacity: 1, rotate: -2 }}
				transition={{ duration: 0.6, delay: 0.4 }}
			>
				<div className="polaroid bg-white p-4 dark:bg-warm-surface">
					<div className="aspect-video rounded bg-gradient-to-br from-amber-200 to-amber-400" />
					<p className="mt-4 text-center font-handwriting text-lg text-amber-900 dark:text-warm-text">
						每一段记忆，都值得被珍藏
					</p>
				</div>
			</motion.div>
		</div>
	);
}

// 特性卡片组件
function FeatureCard({
	title,
	description,
	delay,
}: {
	title: string;
	description: string;
	delay: number;
}) {
	return (
		<motion.div
			className="rounded-lg bg-amber-50 p-6 shadow-paper transition-shadow hover:shadow-paper-hover dark:bg-warm-surface dark:hover:bg-warm-surfaceHighlight"
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay }}
			whileHover={{ y: -4 }}
		>
			<h3 className="mb-2 font-handwriting text-xl font-semibold text-amber-900 dark:text-warm-text">
				{title}
			</h3>
			<p className="text-amber-700 dark:text-warm-textMuted">{description}</p>
		</motion.div>
	);
}
