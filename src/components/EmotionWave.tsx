'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { EmotionType } from './DynamicAtmosphere';

// ============================================================
// EmotionWave: 情绪波形组件（ECG 心电图风格）
// 在聊天框后面显示连续波形
// ============================================================

interface EmotionWaveProps {
	emotion: EmotionType;
	intensity?: number; // 0-1 情绪强度
	isActive?: boolean;
}

// 情绪到波形配置的映射
const WAVE_CONFIG: Record<EmotionType, {
	baseFrequency: number;  // 基础频率 (Hz)
	baseAmplitude: number;  // 基础振幅
	waveSpeed: number;      // 波形移动速度
	color: string;
	secondaryColor: string;
}> = {
	calm: {
		baseFrequency: 0.5,
		baseAmplitude: 20,
		waveSpeed: 50,
		color: '#3b82f6',
		secondaryColor: '#60a5fa',
	},
	angry: {
		baseFrequency: 2.5,
		baseAmplitude: 45,
		waveSpeed: 150,
		color: '#dc2626',
		secondaryColor: '#f87171',
	},
	sad: {
		baseFrequency: 0.3,
		baseAmplitude: 15,
		waveSpeed: 30,
		color: '#64748b',
		secondaryColor: '#94a3b8',
	},
	joyful: {
		baseFrequency: 1.5,
		baseAmplitude: 35,
		waveSpeed: 100,
		color: '#f59e0b',
		secondaryColor: '#fbbf24',
	},
	melancholy: {
		baseFrequency: 0.7,
		baseAmplitude: 25,
		waveSpeed: 40,
		color: '#6366f1',
		secondaryColor: '#818cf8',
	},
	hopeful: {
		baseFrequency: 1.0,
		baseAmplitude: 30,
		waveSpeed: 80,
		color: '#10b981',
		secondaryColor: '#34d399',
	},
	passionate: {
		baseFrequency: 2.0,
		baseAmplitude: 40,
		waveSpeed: 120,
		color: '#f43f5e',
		secondaryColor: '#fb7185',
	},
	mysterious: {
		baseFrequency: 1.2,
		baseAmplitude: 28,
		waveSpeed: 70,
		color: '#a855f7',
		secondaryColor: '#c084fc',
	},
};

export function EmotionWave({
	emotion,
	intensity = 0.5,
	isActive = true,
}: EmotionWaveProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const timeRef = useRef(0);
	const dataPointsRef = useRef<number[]>([]);

	const config = WAVE_CONFIG[emotion] || WAVE_CONFIG.calm;

	// 生成心电图波形数据点
	const generateECGPoint = useCallback((time: number): number => {
		const frequency = config.baseFrequency * (1 + intensity * 0.5);
		const amplitude = config.baseAmplitude * (0.5 + intensity * 0.5);
		
		// ECG 波形合成：基线 + P波 + QRS波群 + T波
		const t = time * frequency;
		const cycle = t % (Math.PI * 2);
		
		let value = 0;
		
		// P波（小隆起）
		if (cycle > 0.2 && cycle < 0.6) {
			value += Math.sin((cycle - 0.2) / 0.4 * Math.PI) * amplitude * 0.15;
		}
		
		// QRS波群（主脉冲）
		if (cycle > 1.0 && cycle < 1.4) {
			const qrsPhase = (cycle - 1.0) / 0.4;
			if (qrsPhase < 0.15) {
				// Q波（小凹陷）
				value -= Math.sin(qrsPhase / 0.15 * Math.PI) * amplitude * 0.2;
			} else if (qrsPhase < 0.35) {
				// R波（高峰）
				value += Math.sin((qrsPhase - 0.15) / 0.2 * Math.PI) * amplitude;
			} else if (qrsPhase < 0.5) {
				// S波（深谷）
				value -= Math.sin((qrsPhase - 0.35) / 0.15 * Math.PI) * amplitude * 0.4;
			}
		}
		
		// T波（中等隆起）
		if (cycle > 1.8 && cycle < 2.4) {
			value += Math.sin((cycle - 1.8) / 0.6 * Math.PI) * amplitude * 0.25;
		}
		
		// 添加微小噪声使波形更自然
		value += (Math.random() - 0.5) * amplitude * 0.05;
		
		return value;
	}, [config, intensity]);

	// 绘制波形
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { width, height } = canvas;
		const centerY = height / 2;

		// 更新数据点
		const newPoint = generateECGPoint(timeRef.current);
		dataPointsRef.current.push(newPoint);
		
		// 保持固定数量的数据点（根据宽度）
		const maxPoints = Math.ceil(width / 2);
		if (dataPointsRef.current.length > maxPoints) {
			dataPointsRef.current.shift();
		}

		// 清空画布
		ctx.clearRect(0, 0, width, height);

		// 绘制网格背景（类似监护仪）
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
		ctx.lineWidth = 1;
		const gridSize = 40;
		
		// 竖线
		for (let x = 0; x < width; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		
		// 横线
		for (let y = 0; y < height; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		// 绘制基线
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.moveTo(0, centerY);
		ctx.lineTo(width, centerY);
		ctx.stroke();
		ctx.setLineDash([]);

		// 绘制主波形
		if (dataPointsRef.current.length > 1) {
			// 渐变线条
			const gradient = ctx.createLinearGradient(0, 0, width, 0);
			gradient.addColorStop(0, config.color + '00');
			gradient.addColorStop(0.3, config.color + '80');
			gradient.addColorStop(0.7, config.color + '80');
			gradient.addColorStop(1, config.color + '00');

			// 发光效果
			ctx.shadowColor = config.color;
			ctx.shadowBlur = 15;
			ctx.strokeStyle = gradient;
			ctx.lineWidth = 2.5;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';

			ctx.beginPath();
			dataPointsRef.current.forEach((value, index) => {
				const x = width - (dataPointsRef.current.length - 1 - index) * 2;
				const y = centerY - value;
				
				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					// 使用贝塞尔曲线使波形更平滑
					const prevX = width - (dataPointsRef.current.length - index) * 2;
					const prevY = centerY - dataPointsRef.current[index - 1];
					const cpX = (prevX + x) / 2;
					ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
				}
			});
			ctx.stroke();

			// 重置阴影
			ctx.shadowBlur = 0;

			// 绘制扫描线效果（在最右侧）
			const scanX = width - 10;
			const scanGradient = ctx.createLinearGradient(scanX - 50, 0, scanX + 20, 0);
			scanGradient.addColorStop(0, config.color + '00');
			scanGradient.addColorStop(0.7, config.color + '40');
			scanGradient.addColorStop(1, config.color);
			
			ctx.strokeStyle = scanGradient;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(scanX - 50, 0);
			ctx.lineTo(scanX, 0);
			ctx.lineTo(scanX, height);
			ctx.lineTo(scanX - 50, height);
			ctx.stroke();
		}

		timeRef.current += 0.016 * config.waveSpeed / 50;
	}, [config, generateECGPoint]);

	// 动画循环
	useEffect(() => {
		if (!isActive) {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			return;
		}

		const animate = () => {
			draw();
			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [draw, isActive]);

	// 响应式调整
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const handleResize = () => {
			const parent = canvas.parentElement;
			if (parent) {
				canvas.width = parent.clientWidth;
				canvas.height = parent.clientHeight;
			}
		};

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// 情绪变化时重置数据
	useEffect(() => {
		dataPointsRef.current = [];
		timeRef.current = 0;
	}, [emotion]);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 pointer-events-none"
			style={{
				width: '100%',
				height: '100%',
				zIndex: 0,
				opacity: 0.6,
			}}
		/>
	);
}

// 情绪指示器（带波形预览）
interface EmotionWaveIndicatorProps {
	emotion: EmotionType;
	intensity?: number;
	label?: string;
}

export function EmotionWaveIndicator({
	emotion,
	intensity = 0.5,
	label,
}: EmotionWaveIndicatorProps) {
	const config = WAVE_CONFIG[emotion] || WAVE_CONFIG.calm;
	const emotionLabels: Record<EmotionType, string> = {
		calm: '平静',
		angry: '愤怒',
		sad: '悲伤',
		joyful: '喜悦',
		melancholy: '忧郁',
		hopeful: '希望',
		passionate: '热情',
		mysterious: '神秘',
	};

	// 心率（BPM）
	const heartRate = Math.round(config.baseFrequency * 60 * (1 + intensity * 0.5));

	return (
		<div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
			{/* 波形预览 */}
			<div className="relative w-12 h-6 overflow-hidden">
				<svg
					className="w-full h-full"
					viewBox="0 0 48 24"
					preserveAspectRatio="none"
				>
					<path
						d="M0,12 L8,12 L10,12 L12,6 L14,18 L16,12 L20,12 L24,12 L26,12 L28,4 L30,20 L32,12 L36,12 L40,12 L48,12"
						fill="none"
						stroke={config.color}
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="animate-pulse"
					/>
				</svg>
			</div>

			{/* 情绪信息 */}
			<div className="flex flex-col">
				<div className="flex items-center gap-2">
					<span className="text-white/80 text-sm font-medium">
						{label || emotionLabels[emotion]}
					</span>
					<span className="text-white/40 text-xs">
						{heartRate} BPM
					</span>
				</div>
				{/* 强度条 */}
				<div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
					<div
						className="h-full rounded-full transition-all duration-500"
						style={{
							width: `${intensity * 100}%`,
							backgroundColor: config.color,
						}}
					/>
				</div>
			</div>

			{/* 状态点 */}
			<div
				className="w-2 h-2 rounded-full animate-pulse"
				style={{ backgroundColor: config.color }}
			/>
		</div>
	);
}
