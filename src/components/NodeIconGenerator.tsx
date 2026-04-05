// ============================================================
// NodeIconGenerator: 节点图标生成器
// 描述: 使用 Canvas 生成抽象几何图形作为节点图标
// 特点: 零成本、风格统一、情绪映射、每个节点独特
// 预留: ComfyUI 接口，可切换为 AI 生成
// ============================================================

import React, { useEffect, useRef, useState } from 'react';

// 全局配置：是否使用 ComfyUI
export const NODE_ICON_CONFIG = {
	// 设为 true 启用 ComfyUI，false 使用本地 Canvas 生成
	useComfyUI: false,
	// ComfyUI 服务地址
	comfyUIBaseURL: process.env.NEXT_PUBLIC_COMFYUI_URL || 'http://localhost:8188',
	// 默认工作流 ID（后续可配置）
	defaultWorkflowId: 'echo_tracks_node_icon',
};

export interface NodeIconProps {
	nodeId: string;
	emotion: string;
	salienceScore: number;
	size?: number;
	className?: string;
	// 可选：强制使用 ComfyUI 生成（覆盖全局配置）
	forceComfyUI?: boolean;
	// 可选：ComfyUI 工作流参数
	comfyUIParams?: Record<string, unknown>;
}

// 情绪色彩映射
const EMOTION_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
	'平静': { primary: '#00d4ff', secondary: '#0a4a5c', accent: '#ffffff' },
	'开心': { primary: '#fbbf24', secondary: '#92400e', accent: '#fef3c7' },
	'兴奋': { primary: '#f59e0b', secondary: '#b45309', accent: '#fde68a' },
	'忧郁': { primary: '#6366f1', secondary: '#312e81', accent: '#c7d2fe' },
	'悲伤': { primary: '#4a5568', secondary: '#1a202c', accent: '#a0aec0' },
	'生气': { primary: '#ef4444', secondary: '#991b1b', accent: '#fecaca' },
	'愤怒': { primary: '#ff006e', secondary: '#831843', accent: '#fbcfe8' },
	'郁闷': { primary: '#64748b', secondary: '#334155', accent: '#cbd5e1' },
	'冷淡': { primary: '#94a3b8', secondary: '#475569', accent: '#e2e8f0' },
	'温柔': { primary: '#f472b6', secondary: '#be185d', accent: '#fce7f3' },
	'焦虑': { primary: '#a855f7', secondary: '#6b21a8', accent: '#e9d5ff' },
	'default': { primary: '#00d4ff', secondary: '#0a4a5c', accent: '#ffffff' },
};

// 获取情绪配色
function getEmotionColors(emotion: string): typeof EMOTION_COLORS['default'] {
	for (const [key, colors] of Object.entries(EMOTION_COLORS)) {
		if (emotion.includes(key)) return colors;
	}
	return EMOTION_COLORS.default;
}

// 基于 nodeId 生成伪随机数（保证同一节点总是生成相同图形）
function createPseudoRandom(nodeId: string) {
	let seed = 0;
	for (let i = 0; i < nodeId.length; i++) {
		seed = ((seed << 5) - seed + nodeId.charCodeAt(i)) | 0;
	}
	return () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
}

// 生成抽象几何图形
export function generateNodeIcon(
	canvas: HTMLCanvasElement,
	nodeId: string,
	emotion: string,
	salienceScore: number
): void {
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const size = canvas.width;
	const center = size / 2;
	const rand = createPseudoRandom(nodeId);
	const colors = getEmotionColors(emotion);

	// 根据显著性分数决定复杂度 (5-10)
	const complexity = Math.max(3, Math.min(8, salienceScore));

	// 清空画布
	ctx.fillStyle = '#0a0a0f';
	ctx.fillRect(0, 0, size, size);

	// 绘制背景渐变
	const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 2);
	gradient.addColorStop(0, colors.primary + '20');
	gradient.addColorStop(0.5, colors.secondary + '40');
	gradient.addColorStop(1, '#0a0a0f');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);

	// 绘制外圈光环
	ctx.beginPath();
	ctx.arc(center, center, size * 0.45, 0, Math.PI * 2);
	ctx.strokeStyle = colors.primary + '60';
	ctx.lineWidth = 2;
	ctx.stroke();

	// 根据复杂度绘制几何图形
	const shapeType = Math.floor(rand() * 4);

	switch (shapeType) {
		case 0: // 多边形网络
			drawPolygonNetwork(ctx, center, size, complexity, colors, rand);
			break;
		case 1: // 同心圆环
			drawConcentricRings(ctx, center, size, complexity, colors, rand);
			break;
		case 2: // 放射线条
			drawRadialLines(ctx, center, size, complexity, colors, rand);
			break;
		case 3: // 粒子点阵
			drawParticleGrid(ctx, center, size, complexity, colors, rand);
			break;
	}

	// 绘制中心核心
	ctx.beginPath();
	ctx.arc(center, center, size * 0.08, 0, Math.PI * 2);
	ctx.fillStyle = colors.primary;
	ctx.fill();
	ctx.shadowBlur = 20;
	ctx.shadowColor = colors.primary;
	ctx.fill();
	ctx.shadowBlur = 0;
}

// 多边形网络
function drawPolygonNetwork(
	ctx: CanvasRenderingContext2D,
	center: number,
	size: number,
	complexity: number,
	colors: typeof EMOTION_COLORS['default'],
	rand: () => number
) {
	const points: Array<{ x: number; y: number }> = [];
	const numPoints = complexity + 3;

	// 生成顶点
	for (let i = 0; i < numPoints; i++) {
		const angle = (i / numPoints) * Math.PI * 2 + rand() * 0.5;
		const radius = size * (0.15 + rand() * 0.25);
		points.push({
			x: center + Math.cos(angle) * radius,
			y: center + Math.sin(angle) * radius,
		});
	}

	// 绘制连接线
	ctx.strokeStyle = colors.secondary + '80';
	ctx.lineWidth = 1;
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			if (rand() > 0.4) {
				ctx.beginPath();
				ctx.moveTo(points[i].x, points[i].y);
				ctx.lineTo(points[j].x, points[j].y);
				ctx.stroke();
			}
		}
	}

	// 绘制顶点
	points.forEach((p) => {
		ctx.beginPath();
		ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
		ctx.fillStyle = colors.accent;
		ctx.fill();
	});
}

// 同心圆环
function drawConcentricRings(
	ctx: CanvasRenderingContext2D,
	center: number,
	size: number,
	complexity: number,
	colors: typeof EMOTION_COLORS['default'],
	rand: () => number
) {
	const numRings = Math.floor(complexity / 2) + 2;

	for (let i = 0; i < numRings; i++) {
		const radius = size * (0.1 + (i / numRings) * 0.35);
		const lineWidth = 1 + rand() * 3;
		const alpha = 0.3 + rand() * 0.5;

		ctx.beginPath();
		ctx.arc(center, center, radius, 0, Math.PI * 2);
		ctx.strokeStyle = i % 2 === 0 ? colors.primary : colors.secondary;
		ctx.globalAlpha = alpha;
		ctx.lineWidth = lineWidth;
		ctx.stroke();
		ctx.globalAlpha = 1;

		// 添加缺口
		if (rand() > 0.5) {
			const gapStart = rand() * Math.PI * 2;
			const gapEnd = gapStart + rand() * Math.PI;
			ctx.beginPath();
			ctx.arc(center, center, radius, gapStart, gapEnd);
			ctx.strokeStyle = '#0a0a0f';
			ctx.lineWidth = lineWidth + 2;
			ctx.stroke();
		}
	}
}

// 放射线条
function drawRadialLines(
	ctx: CanvasRenderingContext2D,
	center: number,
	size: number,
	complexity: number,
	colors: typeof EMOTION_COLORS['default'],
	rand: () => number
) {
	const numLines = complexity * 3 + 6;

	for (let i = 0; i < numLines; i++) {
		const angle = (i / numLines) * Math.PI * 2 + rand() * 0.1;
		const innerRadius = size * (0.05 + rand() * 0.1);
		const outerRadius = size * (0.2 + rand() * 0.25);

		const x1 = center + Math.cos(angle) * innerRadius;
		const y1 = center + Math.sin(angle) * innerRadius;
		const x2 = center + Math.cos(angle) * outerRadius;
		const y2 = center + Math.sin(angle) * outerRadius;

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.strokeStyle = i % 3 === 0 ? colors.primary : colors.secondary;
		ctx.lineWidth = i % 3 === 0 ? 2 : 1;
		ctx.globalAlpha = 0.4 + rand() * 0.4;
		ctx.stroke();
	}
	ctx.globalAlpha = 1;
}

// 粒子点阵
function drawParticleGrid(
	ctx: CanvasRenderingContext2D,
	center: number,
	size: number,
	complexity: number,
	colors: typeof EMOTION_COLORS['default'],
	rand: () => number
) {
	const gridSize = Math.floor(complexity / 2) + 2;
	const spacing = size * 0.3 / gridSize;
	const startX = center - (gridSize - 1) * spacing / 2;
	const startY = center - (gridSize - 1) * spacing / 2;

	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			if (rand() > 0.3) {
				const x = startX + i * spacing + (rand() - 0.5) * spacing * 0.5;
				const y = startY + j * spacing + (rand() - 0.5) * spacing * 0.5;
				const radius = 2 + rand() * 4;

				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI * 2);
				ctx.fillStyle = (i + j) % 2 === 0 ? colors.primary : colors.accent;
				ctx.globalAlpha = 0.5 + rand() * 0.5;
				ctx.fill();
			}
		}
	}
	ctx.globalAlpha = 1;
}

// ComfyUI 生成函数（预留接口）
async function generateWithComfyUI(
	nodeId: string,
	emotion: string,
	salienceScore: number,
	params?: Record<string, unknown>
): Promise<string | null> {
	try {
		// TODO: 实现 ComfyUI 调用
		// 1. 构建工作流参数
		// 2. 提交任务到 ComfyUI
		// 3. 轮询或 WebSocket 等待完成
		// 4. 返回图片 URL
		
		console.log('[ComfyUI] 生成节点图标:', { nodeId, emotion, salienceScore, params });
		
		// 预留示例代码：
		// const response = await fetch(`${NODE_ICON_CONFIG.comfyUIBaseURL}/prompt`, {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({
		//     prompt: buildWorkflow(nodeId, emotion, salienceScore),
		//     client_id: nodeId,
		//   }),
		// });
		// const { prompt_id } = await response.json();
		// return await waitForImage(prompt_id);
		
		return null; // 暂时返回 null，使用本地生成作为 fallback
	} catch (err) {
		console.error('[ComfyUI] 生成失败:', err);
		return null;
	}
}

// React 组件
export const NodeIcon: React.FC<NodeIconProps> = ({
	nodeId,
	emotion,
	salienceScore,
	size = 120,
	className = '',
	forceComfyUI,
	comfyUIParams,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [comfyUIImage, setComfyUIImage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const shouldUseComfyUI = forceComfyUI ?? NODE_ICON_CONFIG.useComfyUI;
		
		if (shouldUseComfyUI) {
			// 使用 ComfyUI 生成
			setIsLoading(true);
			generateWithComfyUI(nodeId, emotion, salienceScore, comfyUIParams)
				.then((url) => {
					if (url) {
						setComfyUIImage(url);
					}
				})
				.finally(() => setIsLoading(false));
		} else {
			// 使用本地 Canvas 生成
			const canvas = canvasRef.current;
			if (!canvas) return;

			const dpr = window.devicePixelRatio || 1;
			canvas.width = size * dpr;
			canvas.height = size * dpr;
			canvas.style.width = `${size}px`;
			canvas.style.height = `${size}px`;

			generateNodeIcon(canvas, nodeId, emotion, salienceScore);
		}
	}, [nodeId, emotion, salienceScore, size, forceComfyUI, comfyUIParams]);

	// 如果有 ComfyUI 图片，显示图片
	if (comfyUIImage && !isLoading) {
		return (
			<img
				src={comfyUIImage}
				alt="节点图标"
				className={`rounded-full object-cover ${className}`}
				style={{ width: size, height: size }}
			/>
		);
	}

	// 否则显示 Canvas
	return (
		<canvas
			ref={canvasRef}
			className={`rounded-full ${className}`}
			style={{
				width: size,
				height: size,
				imageRendering: 'crisp-edges',
				opacity: isLoading ? 0.5 : 1,
			}}
		/>
	);
};

// 生成 Data URL（用于 img 标签）
export function generateNodeIconDataURL(
	nodeId: string,
	emotion: string,
	salienceScore: number,
	size: number = 120
): string {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	generateNodeIcon(canvas, nodeId, emotion, salienceScore);
	return canvas.toDataURL('image/png');
}

export default NodeIcon;
