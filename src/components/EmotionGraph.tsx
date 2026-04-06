// ============================================================
// EmotionGraph: 情感图谱可视化组件
// 描述: 使用 Canvas 渲染情感节点和关联边，支持力导向和时间轴两种视图
// 文件位置: src/components/EmotionGraph.tsx
// 主要依赖: emotionResonance.ts
// 被引用: page.tsx (分析页面)
//
// Props:
//   - nodes: 情绪节点列表
//   - edges: 情绪边列表
//   - clusters: 情绪聚类（可选）
//   - onNodeSelect: 节点选中回调（可选）
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { EmotionNode, EmotionEdge, EmotionCluster, EmotionType } from '../lib/emotionResonance';
import { calculateResonanceIndex } from '../lib/emotionResonance';

interface EmotionGraphProps {
	nodes: EmotionNode[];
	edges: EmotionEdge[];
	clusters?: EmotionCluster[];
	onNodeSelect?: (nodeId: string) => void;
}

type ViewMode = 'force' | 'timeline';

// 情绪颜色映射
const EMOTION_COLORS: Record<EmotionType, string> = {
	calm: '#00d4ff',
	joyful: '#fbbf24',
	hopeful: '#4ade80',
	passionate: '#f472b6',
	angry: '#ff006e',
	sad: '#64748b',
	melancholy: '#818cf8',
	mysterious: '#a855f7',
};

// 情绪标签
const EMOTION_LABELS: Record<EmotionType, string> = {
	calm: '平静',
	joyful: '喜悦',
	hopeful: '希望',
	passionate: '热情',
	angry: '愤怒',
	sad: '悲伤',
	melancholy: '忧郁',
	mysterious: '神秘',
};

export function EmotionGraph({
	nodes,
	edges,
	clusters = [],
	onNodeSelect,
}: EmotionGraphProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [viewMode, setViewMode] = useState<ViewMode>('force');
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const animationRef = useRef<number>();
	const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

	const resonanceIndex = calculateResonanceIndex({ nodes, edges });

	// 初始化节点位置
	const initializePositions = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = Math.min(centerX, centerY) * 0.6;

		nodePositions.current.clear();

		if (viewMode === 'timeline') {
			// 时间轴布局
			const sortedNodes = [...nodes].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			);
			const spacing = canvas.width / (sortedNodes.length + 1);

			sortedNodes.forEach((node, index) => {
				nodePositions.current.set(node.id, {
					x: spacing * (index + 1),
					y: centerY + (Math.random() - 0.5) * 100,
				});
			});
		} else {
			// 力导向布局 - 圆形分布
			nodes.forEach((node, index) => {
				const angle = (index / nodes.length) * Math.PI * 2;
				nodePositions.current.set(node.id, {
					x: centerX + Math.cos(angle) * radius,
					y: centerY + Math.sin(angle) * radius,
				});
			});
		}
	}, [nodes, viewMode]);

	// 绘制图谱
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// 清空画布
		ctx.fillStyle = '#0a0a0f';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 绘制聚类背景
		clusters.forEach(cluster => {
			const positions = cluster.nodes
				.map(id => nodePositions.current.get(id))
				.filter((p): p is { x: number; y: number } => !!p);

			if (positions.length >= 2) {
				const centerX = positions.reduce((s, p) => s + p.x, 0) / positions.length;
				const centerY = positions.reduce((s, p) => s + p.y, 0) / positions.length;
				const maxDist = Math.max(...positions.map(p => 
					Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
				));

				ctx.beginPath();
				ctx.arc(centerX, centerY, maxDist + 30, 0, Math.PI * 2);
				ctx.fillStyle = `${EMOTION_COLORS[cluster.dominantEmotion]}10`;
				ctx.fill();
			}
		});

		// 绘制边
		edges.forEach(edge => {
			const source = nodePositions.current.get(edge.source);
			const target = nodePositions.current.get(edge.target);
			if (!source || !target) return;

			const isHighlighted = selectedNode === edge.source || selectedNode === edge.target;
			const isDimmed = selectedNode && !isHighlighted;

			ctx.beginPath();
			ctx.moveTo(source.x, source.y);
			ctx.lineTo(target.x, target.y);

			const alpha = isDimmed ? 0.1 : isHighlighted ? 0.8 : 0.3;
			const width = isHighlighted ? 3 : 1 + edge.weight * 2;
			
			ctx.strokeStyle = edge.resonance > 0 
				? `rgba(74, 222, 128, ${alpha})`  // 正相关 - 绿色
				: `rgba(255, 0, 110, ${alpha})`;   // 负相关 - 红色
			ctx.lineWidth = width;
			ctx.stroke();
		});

		// 绘制节点
		nodes.forEach(node => {
			const pos = nodePositions.current.get(node.id);
			if (!pos) return;

			const isSelected = selectedNode === node.id;
			const isHovered = hoveredNode === node.id;
			const isDimmed = selectedNode && selectedNode !== node.id;

			const baseRadius = 8 + node.intensity * 8;
			const radius = isHovered ? baseRadius * 1.3 : baseRadius;

			// 发光效果
			if (isSelected || isHovered) {
				const gradient = ctx.createRadialGradient(
					pos.x, pos.y, 0,
					pos.x, pos.y, radius * 2
				);
				gradient.addColorStop(0, EMOTION_COLORS[node.emotion] + '60');
				gradient.addColorStop(1, 'transparent');
				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
				ctx.fill();
			}

			// 节点主体
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
			ctx.fillStyle = isDimmed 
				? EMOTION_COLORS[node.emotion] + '40'
				: EMOTION_COLORS[node.emotion];
			ctx.fill();

			// 边框
			if (isSelected) {
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 2;
				ctx.stroke();
			}

			// 标签
			if (isHovered || isSelected) {
				ctx.fillStyle = '#ffffff';
				ctx.font = '12px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText(
					EMOTION_LABELS[node.emotion],
					pos.x,
					pos.y + radius + 20
				);
			}
		});
	}, [nodes, edges, clusters, selectedNode, hoveredNode]);

	// 动画循环
	useEffect(() => {
		const animate = () => {
			draw();
			animationRef.current = requestAnimationFrame(animate);
		};
		animate();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [draw]);

	// 初始化位置
	useEffect(() => {
		initializePositions();
	}, [initializePositions]);

	// 处理点击
	const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// 查找点击的节点
		for (const node of nodes) {
			const pos = nodePositions.current.get(node.id);
			if (!pos) continue;

			const radius = 8 + node.intensity * 8;
			const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

			if (dist <= radius + 10) {
				setSelectedNode(node.id);
				onNodeSelect?.(node.id);
				return;
			}
		}

		setSelectedNode(null);
	};

	// 处理鼠标移动
	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// 查找悬停的节点
		let hovered: string | null = null;
		for (const node of nodes) {
			const pos = nodePositions.current.get(node.id);
			if (!pos) continue;

			const radius = 8 + node.intensity * 8;
			const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);

			if (dist <= radius + 10) {
				hovered = node.id;
				break;
			}
		}

		setHoveredNode(hovered);
		canvas.style.cursor = hovered ? 'pointer' : 'default';
	};

	if (nodes.length === 0) {
		return (
			<div className="flex items-center justify-center h-96 bg-black/20 rounded-2xl">
				<p className="text-white/50">暂无数据</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			{/* 工具栏 */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-4">
					<span className="text-sm text-white/60">
						共振指数: 
						<span className={`font-bold ${
							resonanceIndex > 0.6 ? 'text-green-400' :
							resonanceIndex > 0.4 ? 'text-yellow-400' :
							'text-red-400'
						}`}>
							{(resonanceIndex * 100).toFixed(0)}%
						</span>
					</span>
					<span className="text-sm text-white/40">
						{nodes.length} 节点 · {edges.length} 关联
					</span>
					{clusters.length > 0 && (
						<span className="text-sm text-white/40">
							{clusters.length} 聚类
						</span>
					)}
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setViewMode('force')}
						className={`px-3 py-1 text-sm rounded-lg transition-colors ${
							viewMode === 'force'
								? 'bg-white/20 text-white'
								: 'bg-white/5 text-white/50 hover:bg-white/10'
						}`}
					>
						力导向
					</button>
					<button
						onClick={() => setViewMode('timeline')}
						className={`px-3 py-1 text-sm rounded-lg transition-colors ${
							viewMode === 'timeline'
								? 'bg-white/20 text-white'
								: 'bg-white/5 text-white/50 hover:bg-white/10'
						}`}
					>
						时间轴
					</button>
				</div>
			</div>

			{/* 画布 */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="relative bg-black/20 rounded-2xl overflow-hidden"
			>
				<canvas
					ref={canvasRef}
					width={800}
					height={400}
					data-testid="emotion-graph-canvas"
					onClick={handleClick}
					onMouseMove={handleMouseMove}
					className="w-full h-auto"
				/>
			</motion.div>

			{/* 图例 */}
			<div className="flex flex-wrap gap-4 mt-4">
				{Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
					<div key={emotion} className="flex items-center gap-2">
						<div
							className="w-3 h-3 rounded-full"
							style={{ backgroundColor: color }}
						/>
						<span className="text-xs text-white/50">
							{EMOTION_LABELS[emotion as EmotionType]}
						</span>
					</div>
				))}
			</div>

			{/* 选中节点详情 */}
			{selectedNode && (
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mt-4 p-4 bg-white/5 rounded-xl"
				>
					{(() => {
						const node = nodes.find(n => n.id === selectedNode);
						if (!node) return null;
						return (
							<div className="flex items-center gap-4">
								<div
									className="w-4 h-4 rounded-full"
									style={{ backgroundColor: EMOTION_COLORS[node.emotion] }}
								/>
								<div>
									<p className="text-white font-medium">
										{EMOTION_LABELS[node.emotion]}
									</p>
									<p className="text-sm text-white/50">
										强度: {(node.intensity * 100).toFixed(0)}% · {node.date}
									</p>
								</div>
							</div>
						);
					})()}
				</motion.div>
			)}
		</div>
	);
}
