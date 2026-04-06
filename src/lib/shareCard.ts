// ============================================================
// ShareCard: 分享卡片生成
// 功能: 生成可分享的记忆卡片，支持 SVG 导出和 PNG 下载
// 文件位置: src/lib/shareCard.ts
// 主要依赖: localDb (MemoryNode)
// 被引用: ShareCard.tsx (分享卡片组件)
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import type { MemoryNode } from './localDb';
import type { EmotionType } from './emotionResonance';

// 卡片模板类型
export type ShareCardTemplate = 'modern' | 'vintage' | 'minimal' | 'artistic';

// 卡片数据
export interface ShareCardData {
	title: string;
	emotion: EmotionType;
	date: string;
	intensity: number;
	template: ShareCardTemplate;
	color: string;
	quote?: string;
}

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

// 模板背景（保留以备后用）
// const TEMPLATE_BACKGROUNDS: Record<ShareCardTemplate, string> = {
// 	modern: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
// 	vintage: 'linear-gradient(135deg, #1a1410 0%, #2d2418 100%)',
// 	minimal: '#0a0a0f',
// 	artistic: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #0a0a0f 100%)',
// };

/**
 * 生成分享卡片数据
 * @param node - 记忆节点
 * @param template - 卡片模板
 * @returns 卡片数据
 */
export function generateShareCardData(
	node: MemoryNode,
	template: ShareCardTemplate = 'modern'
): ShareCardData {
	const emotion = node.npc_state.current_emotion as EmotionType;
	const date = new Date(node.event_date).toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return {
		title: node.core_event,
		emotion,
		date,
		intensity: node.salience_score / 10,
		template,
		color: EMOTION_COLORS[emotion],
	};
}

/**
 * 生成卡片 SVG
 * @param data - 卡片数据
 * @returns SVG 字符串
 */
export function generateCardSVG(data: ShareCardData): string {
	const width = 800;
	const height = 450;
	const emotionLabel = EMOTION_LABELS[data.emotion];

	const templates: Record<ShareCardTemplate, string> = {
		modern: generateModernTemplate(data, width, height, emotionLabel),
		vintage: generateVintageTemplate(data, width, height, emotionLabel),
		minimal: generateMinimalTemplate(data, width, height, emotionLabel),
		artistic: generateArtisticTemplate(data, width, height, emotionLabel),
	};

	return templates[data.template];
}

/**
 * 生成现代风格模板
 */
function generateModernTemplate(
	data: ShareCardData,
	width: number,
	height: number,
	emotionLabel: string
): string {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  
  <!-- 装饰线条 -->
  <line x1="50" y1="50" x2="750" y2="50" stroke="${data.color}" stroke-width="2" opacity="0.5"/>
  <line x1="50" y1="400" x2="750" y2="400" stroke="${data.color}" stroke-width="2" opacity="0.5"/>
  
  <!-- 情绪标签 -->
  <circle cx="100" cy="100" r="30" fill="${data.color}" opacity="0.2"/>
  <text x="100" y="108" font-family="sans-serif" font-size="16" fill="${data.color}" text-anchor="middle">${emotionLabel}</text>
  
  <!-- 标题 -->
  <text x="400" y="200" font-family="sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">
    ${escapeXml(data.title)}
  </text>
  
  <!-- 日期 -->
  <text x="400" y="260" font-family="sans-serif" font-size="18" fill="rgba(255,255,255,0.6)" text-anchor="middle">
    ${data.date}
  </text>
  
  <!-- 强度指示 -->
  <text x="400" y="320" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.4)" text-anchor="middle">
    记忆强度: ${(data.intensity * 100).toFixed(0)}%
  </text>
  
  <!-- 品牌 -->
  <text x="400" y="380" font-family="sans-serif" font-size="12" fill="rgba(255,255,255,0.3)" text-anchor="middle">
    Echo Tracks · 回音轨迹
  </text>
</svg>
  `.trim();
}

/**
 * 生成复古风格模板
 */
function generateVintageTemplate(
	data: ShareCardData,
	width: number,
	height: number,
	emotionLabel: string
): string {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="vintageBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1410"/>
      <stop offset="100%" style="stop-color:#2d2418"/>
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="url(#vintageBg)"/>
  
  <!-- 边框 -->
  <rect x="30" y="30" width="740" height="390" fill="none" stroke="${data.color}" stroke-width="1" opacity="0.6"/>
  <rect x="40" y="40" width="720" height="370" fill="none" stroke="${data.color}" stroke-width="1" opacity="0.3"/>
  
  <!-- 装饰角 -->
  <path d="M 30 80 L 30 30 L 80 30" fill="none" stroke="${data.color}" stroke-width="2"/>
  <path d="M 720 30 L 770 30 L 770 80" fill="none" stroke="${data.color}" stroke-width="2"/>
  <path d="M 30 370 L 30 420 L 80 420" fill="none" stroke="${data.color}" stroke-width="2"/>
  <path d="M 720 420 L 770 420 L 770 370" fill="none" stroke="${data.color}" stroke-width="2"/>
  
  <!-- 情绪标签 -->
  <text x="400" y="100" font-family="serif" font-size="20" fill="${data.color}" text-anchor="middle">
    ${emotionLabel}
  </text>
  
  <!-- 分隔线 -->
  <line x1="300" y1="120" x2="500" y2="120" stroke="${data.color}" stroke-width="1" opacity="0.5"/>
  
  <!-- 标题 -->
  <text x="400" y="200" font-family="serif" font-size="36" fill="#f5e6c8" text-anchor="middle">
    ${escapeXml(data.title)}
  </text>
  
  <!-- 日期 -->
  <text x="400" y="280" font-family="serif" font-size="16" fill="rgba(245,230,200,0.6)" text-anchor="middle">
    ${data.date}
  </text>
  
  <!-- 品牌 -->
  <text x="400" y="380" font-family="serif" font-size="14" fill="rgba(245,230,200,0.4)" text-anchor="middle">
    Echo Tracks
  </text>
</svg>
  `.trim();
}

/**
 * 生成极简风格模板
 */
function generateMinimalTemplate(
	data: ShareCardData,
	width: number,
	height: number,
	emotionLabel: string
): string {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="#0a0a0f"/>
  
  <!-- 情绪圆点 -->
  <circle cx="400" cy="100" r="8" fill="${data.color}"/>
  
  <!-- 情绪标签 -->
  <text x="400" y="140" font-family="sans-serif" font-size="12" fill="${data.color}" text-anchor="middle">
    ${emotionLabel}
  </text>
  
  <!-- 标题 -->
  <text x="400" y="240" font-family="sans-serif" font-size="28" fill="white" text-anchor="middle" font-weight="300">
    ${escapeXml(data.title)}
  </text>
  
  <!-- 日期 -->
  <text x="400" y="290" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.5)" text-anchor="middle">
    ${data.date}
  </text>
</svg>
  `.trim();
}

/**
 * 生成艺术风格模板
 */
function generateArtisticTemplate(
	data: ShareCardData,
	width: number,
	height: number,
	emotionLabel: string
): string {
	const particles = Array.from({ length: 20 }, () => {
		const x = 100 + Math.random() * 600;
		const y = 50 + Math.random() * 350;
		const r = 2 + Math.random() * 4;
		const opacity = 0.3 + Math.random() * 0.5;
		return `<circle cx="${x}" cy="${y}" r="${r}" fill="${data.color}" opacity="${opacity}"/>`;
	}).join('\n  ');

	return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="artBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0a1a"/>
      <stop offset="50%" style="stop-color:#1a0f2e"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="url(#artBg)"/>
  
  <!-- 装饰粒子 -->
  ${particles}
  
  <!-- 情绪标签 -->
  <text x="400" y="120" font-family="sans-serif" font-size="14" fill="${data.color}" text-anchor="middle" letter-spacing="4">
    ${emotionLabel.toUpperCase()}
  </text>
  
  <!-- 标题 -->
  <text x="400" y="220" font-family="sans-serif" font-size="34" fill="white" text-anchor="middle" font-weight="bold">
    ${escapeXml(data.title)}
  </text>
  
  <!-- 日期 -->
  <text x="400" y="270" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="middle">
    ${data.date}
  </text>
  
  <!-- 底部装饰线 -->
  <line x1="350" y1="350" x2="450" y2="350" stroke="${data.color}" stroke-width="1" opacity="0.5"/>
</svg>
  `.trim();
}

/**
 * 转义 XML 特殊字符
 * @param str - 原始字符串
 * @returns 转义后的字符串
 */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * 下载卡片
 * @param data - 卡片数据
 * @param format - 下载格式 ('svg' | 'png')
 */
export function downloadCard(
	data: ShareCardData,
	format: 'svg' | 'png' = 'svg'
): void {
	const svg = generateCardSVG(data);

	if (format === 'svg') {
		// 下载 SVG
		const blob = new Blob([svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `echo-track-${Date.now()}.svg`;
		link.click();
		URL.revokeObjectURL(url);
	} else {
		// 下载 PNG（使用 Canvas 转换）
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = 800;
		canvas.height = 450;

		const img = new Image();
		const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);

		img.onload = () => {
			ctx.drawImage(img, 0, 0);
			canvas.toBlob(blob => {
				if (!blob) return;
				const pngUrl = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = pngUrl;
				link.download = `echo-track-${Date.now()}.png`;
				link.click();
				URL.revokeObjectURL(pngUrl);
				URL.revokeObjectURL(url);
			});
		};

		img.src = url;
	}
}
