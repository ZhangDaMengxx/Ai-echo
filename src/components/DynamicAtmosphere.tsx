'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

// ============================================================
// DynamicAtmosphere: 动态背景氛围系统
// 情绪-色彩映射 + 平滑过渡 + 粒子响应
// ============================================================

export type EmotionType = 
	| 'calm' 
	| 'angry' 
	| 'sad' 
	| 'joyful' 
	| 'melancholy' 
	| 'hopeful' 
	| 'passionate' 
	| 'mysterious';

interface ThemeConfig {
	primary: [number, number, number];
	secondary: [number, number, number];
	particleSpeed: number;
	particleCount: number;
}

interface DynamicAtmosphereProps {
	emotion?: EmotionType;
	transitionDuration?: number;
	baseColor?: string;
}

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	size: number;
	opacity: number;
	life: number;
}

// 情绪-主题映射配置
export const EMOTION_THEME_MAP: Record<EmotionType, ThemeConfig> = {
	calm: {
		primary: [30, 60, 100],
		secondary: [20, 40, 80],
		particleSpeed: 0.5,
		particleCount: 80,
	},
	angry: {
		primary: [150, 30, 30],
		secondary: [100, 20, 20],
		particleSpeed: 3,
		particleCount: 120,
	},
	sad: {
		primary: [50, 70, 100],
		secondary: [30, 50, 80],
		particleSpeed: 0.3,
		particleCount: 60,
	},
	joyful: {
		primary: [255, 180, 60],
		secondary: [200, 140, 40],
		particleSpeed: 1.5,
		particleCount: 100,
	},
	melancholy: {
		primary: [80, 90, 120],
		secondary: [60, 70, 100],
		particleSpeed: 0.4,
		particleCount: 70,
	},
	hopeful: {
		primary: [60, 180, 120],
		secondary: [40, 140, 90],
		particleSpeed: 1,
		particleCount: 90,
	},
	passionate: {
		primary: [200, 60, 80],
		secondary: [160, 40, 60],
		particleSpeed: 2,
		particleCount: 110,
	},
	mysterious: {
		primary: [100, 60, 150],
		secondary: [80, 40, 120],
		particleSpeed: 0.8,
		particleCount: 85,
	},
};

const DEFAULT_TRANSITION_DURATION = 500;

// RGB 颜色线性插值
export function lerpColor(
	c1: [number, number, number],
	c2: [number, number, number],
	t: number
): [number, number, number] {
	return [
		Math.round(c1[0] + (c2[0] - c1[0]) * t),
		Math.round(c1[1] + (c2[1] - c1[1]) * t),
		Math.round(c1[2] + (c2[2] - c1[2]) * t),
	];
}

// 获取情绪配置
export function getEmotionTheme(emotion: string): ThemeConfig {
	return EMOTION_THEME_MAP[emotion as EmotionType] ?? EMOTION_THEME_MAP.calm;
}

export function DynamicAtmosphere({
	emotion = 'calm',
	transitionDuration = DEFAULT_TRANSITION_DURATION,
	baseColor = '#0a0a0f',
}: DynamicAtmosphereProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const animationRef = useRef<number>();
	const timeRef = useRef(0);
	
	// 当前颜色状态（用于平滑过渡）
	const currentColorRef = useRef<[number, number, number]>(
		EMOTION_THEME_MAP.calm.primary
	);
	const targetColorRef = useRef<[number, number, number]>(
		EMOTION_THEME_MAP.calm.primary
	);
	const transitionStartRef = useRef<number>(0);
	const isTransitioningRef = useRef(false);

	// 初始化粒子
	const initParticles = useCallback((
		width: number, 
		height: number,
		count: number
	) => {
		const particles: Particle[] = [];

		for (let i = 0; i < count; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				vx: (Math.random() - 0.5) * 0.3,
				vy: (Math.random() - 0.5) * 0.3,
				size: Math.random() * 2 + 0.5,
				opacity: Math.random() * 0.5 + 0.2,
				life: Math.random() * 100,
			});
		}
		return particles;
	}, []);

	// 处理情绪变化，开始颜色过渡
	useEffect(() => {
		const theme = getEmotionTheme(emotion);
		targetColorRef.current = theme.primary;
		transitionStartRef.current = performance.now();
		isTransitioningRef.current = true;
	}, [emotion]);

	// 动画循环
	const animate = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height } = canvas;
		timeRef.current += 0.016;
		const time = timeRef.current;

		const theme = getEmotionTheme(emotion);
		const emotionSpeed = theme.particleSpeed;

		// 颜色平滑过渡
		if (isTransitioningRef.current) {
			const elapsed = performance.now() - transitionStartRef.current;
			const progress = Math.min(elapsed / transitionDuration, 1);
			
			currentColorRef.current = lerpColor(
				currentColorRef.current,
				targetColorRef.current,
				progress * 0.1
			);

			if (progress >= 1) {
				isTransitioningRef.current = false;
			}
		}

		const particleColor = currentColorRef.current;

		// 清空画布 - 深黑背景
		ctx.fillStyle = baseColor;
		ctx.fillRect(0, 0, width, height);

		// 绘制暗色渐变叠加
		const gradient = ctx.createRadialGradient(
			width / 2, height / 2, 0,
			width / 2, height / 2, width
		);
		const secondary = theme.secondary;
		gradient.addColorStop(0, `rgba(${secondary[0]}, ${secondary[1]}, ${secondary[2]}, 0.3)`);
		gradient.addColorStop(1, `rgba(10, 10, 15, 0.8)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// 更新和绘制粒子
		particlesRef.current.forEach((p) => {
			const noiseX = Math.sin(time * emotionSpeed + p.y * 0.01) * 0.1;
			const noiseY = Math.cos(time * emotionSpeed + p.x * 0.01) * 0.1;

			p.x += p.vx * emotionSpeed + noiseX;
			p.y += p.vy * emotionSpeed + noiseY;
			p.life += 0.5;

			if (p.x < 0) p.x = width;
			if (p.x > width) p.x = 0;
			if (p.y < 0) p.y = height;
			if (p.y > height) p.y = 0;

			// 粒子发光效果
			const gradient = ctx.createRadialGradient(
				p.x, p.y, 0,
				p.x, p.y, p.size * 4
			);
			gradient.addColorStop(0, `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${p.opacity})`);
			gradient.addColorStop(0.5, `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${p.opacity * 0.5})`);
			gradient.addColorStop(1, 'transparent');

			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
			ctx.fillStyle = gradient;
			ctx.fill();
		});

		// 绘制连线
		particlesRef.current.forEach((p1, i) => {
			particlesRef.current.slice(i + 1).forEach((p2) => {
				const dx = p1.x - p2.x;
				const dy = p1.y - p2.y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < 100) {
					const alpha = (1 - dist / 100) * 0.1;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.strokeStyle = `rgba(${particleColor[0]}, ${particleColor[1]}, ${particleColor[2]}, ${alpha})`;
					ctx.stroke();
				}
			});
		});

		animationRef.current = requestAnimationFrame(animate);
	}, [baseColor, emotion, transitionDuration]);

	// 初始化 canvas 和粒子
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleResize = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			const theme = getEmotionTheme(emotion);
			particlesRef.current = initParticles(
				canvas.width,
				canvas.height,
				theme.particleCount
			);
		};

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [emotion, initParticles]);

	// 启动动画循环
	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animate]);

	// 情绪变化时重新初始化粒子
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		
		const theme = getEmotionTheme(emotion);
		particlesRef.current = initParticles(
			canvas.width,
			canvas.height,
			theme.particleCount
		);
	}, [emotion, initParticles]);

	return (
		<canvas
			ref={canvasRef}
			data-testid="atmosphere-canvas"
			data-emotion={emotion}
			className="fixed inset-0 pointer-events-none"
			style={{ width: '100%', height: '100%', zIndex: -1 }}
		/>
	);
}
