'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================
// ParticleBackground: 粒子背景效果
// 动态颜色 + 情绪波动扩散效果
// ============================================================

interface ParticleBackgroundProps {
	baseColor?: string;
	emotionColor?: string;
	emotionIntensity?: number;
	fullscreen?: boolean;
}

interface Particle {
	x: number;
	y: number;
	sx: number;
	sy: number;
	size: number;
	opacity: number;
	life: number;
	maxLife: number;
}

export function ParticleBackground({
	baseColor = '#f59e0b',
	emotionColor = '#ef4444',
	emotionIntensity = 0.5,
	fullscreen = true,
}: ParticleBackgroundProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const animationRef = useRef<number>();
	const mouseRef = useRef({ x: 0, y: 0 });

	// 解析颜色
	const parseColor = useCallback((hex: string) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return { r, g, b };
	}, []);

	// 初始化粒子
	const initParticles = useCallback((width: number, height: number) => {
		const particles: Particle[] = [];
		const count = Math.floor((width * height) / 15000);
		
		for (let i = 0; i < count; i++) {
			particles.push({
				x: Math.random() * width,
				y: Math.random() * height,
				sx: (Math.random() - 0.5) * 0.5,
				sy: (Math.random() - 0.5) * 0.5,
				size: Math.random() * 2 + 1,
				opacity: Math.random() * 0.5 + 0.2,
				life: Math.random() * 100,
				maxLife: 100 + Math.random() * 100,
			});
		}
		return particles;
	}, []);

	// 动画循环
	const animate = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height } = canvas;
		const baseRgb = parseColor(baseColor);
		const emotionRgb = parseColor(emotionColor);

		// 清空画布
		ctx.clearRect(0, 0, width, height);

		// 更新和绘制粒子
		particlesRef.current.forEach((p) => {
			// 情绪波动扩散效果
			const spread = emotionIntensity * 2;
			const dx = (mouseRef.current.x - p.x) / width;
			const dy = (mouseRef.current.y - p.y) / height;
			
			p.x += p.sx + dx * spread;
			p.y += p.sy + dy * spread;
			p.life++;

			// 边界处理
			if (p.x < 0) p.x = width;
			if (p.x > width) p.x = 0;
			if (p.y < 0) p.y = height;
			if (p.y > height) p.y = 0;

			// 生命周期
			if (p.life > p.maxLife) {
				p.life = 0;
				p.opacity = Math.random() * 0.5 + 0.2;
			}

			// 颜色插值
			const t = emotionIntensity;
			const r = Math.floor(baseRgb.r * (1 - t) + emotionRgb.r * t);
			const g = Math.floor(baseRgb.g * (1 - t) + emotionRgb.g * t);
			const b = Math.floor(baseRgb.b * (1 - t) + emotionRgb.b * t);

			// 绘制粒子
			const lifeRatio = 1 - Math.abs(p.life - p.maxLife / 2) / (p.maxLife / 2);
			const alpha = p.opacity * lifeRatio;
			
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
			ctx.fill();
		});

		// 绘制连线
		particlesRef.current.forEach((p1, i) => {
			particlesRef.current.slice(i + 1).forEach((p2) => {
				const dx = p1.x - p2.x;
				const dy = p1.y - p2.y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				
				if (dist < 100) {
					const alpha = (1 - dist / 100) * 0.2;
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.strokeStyle = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${alpha})`;
					ctx.stroke();
				}
			});
		});

		animationRef.current = requestAnimationFrame(animate);
	}, [baseColor, emotionColor, emotionIntensity, parseColor]);

	// 初始化
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleResize = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			particlesRef.current = initParticles(canvas.width, canvas.height);
		};

		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseRef.current = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
			};
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		canvas.addEventListener('mousemove', handleMouseMove);

		return () => {
			window.removeEventListener('resize', handleResize);
			canvas.removeEventListener('mousemove', handleMouseMove);
		};
	}, [initParticles]);

	// 启动动画
	useEffect(() => {
		animationRef.current = requestAnimationFrame(animate);
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [animate]);

	return (
		<canvas
			ref={canvasRef}
			className={`${fullscreen ? 'fixed inset-0' : 'absolute inset-0'} pointer-events-auto`}
			style={{ width: '100%', height: '100%' }}
		/>
	);
}
