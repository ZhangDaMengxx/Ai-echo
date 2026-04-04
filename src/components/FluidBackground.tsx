'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// ============================================================
// FluidBackground: 深色流体动力学背景
// 深黑背景 + 暗蓝粒子 + 情绪响应
// ============================================================

interface FluidBackgroundProps {
	emotion?: 'calm' | 'angry' | 'sad' | 'joyful';
	baseColor?: string;
	secondaryColor?: string;
	turbulence?: number;
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

export function FluidBackground({
	emotion = 'calm',
	baseColor = '#0a0a0f',
	turbulence = 0.1,
}: FluidBackgroundProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const animationRef = useRef<number>();
	const timeRef = useRef(0);

	// 初始化粒子
	const initParticles = useCallback((width: number, height: number) => {
		const particles: Particle[] = [];
		const count = Math.floor((width * height) / 15000);

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

	// 动画循环
	const animate = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height } = canvas;
		timeRef.current += 0.016;
		const time = timeRef.current;

		// 情绪影响参数
		const emotionSpeed = emotion === 'angry' ? 3 : emotion === 'joyful' ? 1.5 : 0.5;
		const currentTurbulence = emotion === 'angry' ? turbulence * 5 : turbulence;
		const particleColor = emotion === 'angry' ? '100, 50, 50' : emotion === 'sad' ? '50, 70, 100' : '30, 60, 100';

		// 清空画布 - 深黑背景
		ctx.fillStyle = baseColor;
		ctx.fillRect(0, 0, width, height);

		// 绘制暗色渐变叠加
		const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
		gradient.addColorStop(0, 'rgba(20, 25, 40, 0.3)');
		gradient.addColorStop(1, 'rgba(10, 10, 15, 0.8)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// 更新和绘制粒子
		particlesRef.current.forEach((p) => {
			const noiseX = Math.sin(time * emotionSpeed + p.y * 0.01) * currentTurbulence;
			const noiseY = Math.cos(time * emotionSpeed + p.x * 0.01) * currentTurbulence;

			p.x += p.vx + noiseX;
			p.y += p.vy + noiseY;
			p.life += 0.5;

			if (p.x < 0) p.x = width;
			if (p.x > width) p.x = 0;
			if (p.y < 0) p.y = height;
			if (p.y > height) p.y = 0;

			// 粒子发光效果
			const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
			gradient.addColorStop(0, `rgba(${particleColor}, ${p.opacity})`);
			gradient.addColorStop(0.5, `rgba(${particleColor}, ${p.opacity * 0.5})`);
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
					ctx.strokeStyle = `rgba(${particleColor}, ${alpha})`;
					ctx.stroke();
				}
			});
		});

		animationRef.current = requestAnimationFrame(animate);
	}, [baseColor, emotion, turbulence]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleResize = () => {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
			particlesRef.current = initParticles(canvas.width, canvas.height);
		};

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [initParticles]);

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
			className="fixed inset-0 pointer-events-none"
			style={{ width: '100%', height: '100%', zIndex: -1 }}
		/>
	);
}
