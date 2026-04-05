// ============================================================
// 粒子重组特效组件
// 描述: 逆天改命时的视觉特效 - 粒子汇聚重组效果
// ============================================================

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
	x: number
	y: number
	targetX: number
	targetY: number
	sx: number
	sy: number
	life: number
	maxLife: number
	color: string
	size: number
}

interface ParticleReassembleProps {
	isActive: boolean
	onComplete?: () => void
	duration?: number
}

export function ParticleReassemble({
	isActive,
	onComplete,
	duration = 3000,
}: ParticleReassembleProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const animationRef = useRef<number>(0);
	const startTimeRef = useRef<number>(0);

	const initParticles = useCallback((width: number, height: number) => {
		const particles: Particle[] = [];
		const centerX = width / 2;
		const centerY = height / 2;
		const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];

		for (let i = 0; i < 200; i++) {
			const angle = Math.random() * Math.PI * 2;
			const distance = Math.random() * Math.max(width, height) * 0.8;

			particles.push({
				x: centerX + Math.cos(angle) * distance,
				y: centerY + Math.sin(angle) * distance,
				targetX: centerX + (Math.random() - 0.5) * 200,
				targetY: centerY + (Math.random() - 0.5) * 200,
				sx: (Math.random() - 0.5) * 4,
				sy: (Math.random() - 0.5) * 4,
				life: 0,
				maxLife: duration,
				color: colors[Math.floor(Math.random() * colors.length)],
				size: Math.random() * 4 + 2,
			});
		}

		return particles;
	}, [duration]);

	const animate = useCallback((timestamp: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!startTimeRef.current) {
			startTimeRef.current = timestamp;
		}

		const elapsed = timestamp - startTimeRef.current;
		const progress = Math.min(elapsed / duration, 1);

		// 清空画布
		ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const particles = particlesRef.current;

		particles.forEach((p) => {
			// 计算向目标点移动的进度
			const moveProgress = Math.min(progress * 1.5, 1);
			const easeProgress = 1 - Math.pow(1 - moveProgress, 3);

			// 更新位置
			p.x = p.x + (p.targetX - p.x) * 0.05;
			p.y = p.y + (p.targetY - p.y) * 0.05;

			// 添加一些随机扰动
			p.x += Math.sin(elapsed * 0.01 + p.life) * 0.5;
			p.y += Math.cos(elapsed * 0.01 + p.life) * 0.5;

			// 绘制粒子
			const alpha = Math.sin(progress * Math.PI);
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * (1 - easeProgress * 0.5), 0, Math.PI * 2);
			ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
			ctx.fill();

			// 绘制轨迹
			if (progress < 0.8) {
				ctx.beginPath();
				ctx.moveTo(p.x - p.sx * 3, p.y - p.sy * 3);
				ctx.lineTo(p.x, p.y);
				ctx.strokeStyle = p.color + '40';
				ctx.stroke();
			}
		});

		// 绘制中心光晕
		if (progress > 0.3) {
			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;
			const glowSize = (progress - 0.3) * 300;

			const gradient = ctx.createRadialGradient(
				centerX, centerY, 0,
				centerX, centerY, glowSize
			);
			gradient.addColorStop(0, 'rgba(255, 255, 255, ' + (progress * 0.5) + ')');
			gradient.addColorStop(0.5, 'rgba(100, 200, 255, ' + (progress * 0.3) + ')');
			gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

			ctx.beginPath();
			ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
			ctx.fillStyle = gradient;
			ctx.fill();
		}

		if (progress < 1) {
			animationRef.current = requestAnimationFrame(animate);
		} else {
			onComplete?.();
		}
	}, [duration, onComplete]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isActive) return;

		// 设置画布尺寸
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener('resize', resize);

		// 初始化粒子
		particlesRef.current = initParticles(canvas.width, canvas.height);
		startTimeRef.current = 0;

		// 开始动画
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('resize', resize);
			cancelAnimationFrame(animationRef.current);
		};
	}, [isActive, animate, initParticles]);

	if (!isActive) return null;

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-50 pointer-events-none"
			style={{ background: 'rgba(10, 10, 15, 0.95)' }}
		/>
	);
}
