'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// RadarChart: 六维性格雷达图（修复拖拽问题）
// ============================================================

interface Trait {
	label: string;
	value: number;
}

interface RadarChartProps {
	traits: Trait[];
	subjectName?: string;
	onChange?: (traits: Trait[]) => void;
}

const TRAIT_LABELS = ['理性', '感性', '外向', '内敛', '决断', '犹豫'];

export function RadarChart({
	traits: initialTraits,
	subjectName = 'ELARA',
	onChange,
}: RadarChartProps) {
	const [traits, setTraits] = useState<Trait[]>(
		initialTraits.length > 0
			? initialTraits
			: TRAIT_LABELS.map((label) => ({ label, value: 50 }))
	);
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const svgRef = useRef<SVGSVGElement>(null);

	// 计算六边形顶点位置
	const getVertexPosition = useCallback(
		(index: number, value: number, radius: number, center: number) => {
			const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
			const r = (value / 100) * radius;
			return {
				x: center + r * Math.cos(angle),
				y: center + r * Math.sin(angle),
			};
		},
		[]
	);

	// 从鼠标位置计算特质值
	const calculateValueFromMouse = useCallback(
		(clientX: number, clientY: number) => {
			if (!svgRef.current) return 50;
			
			const rect = svgRef.current.getBoundingClientRect();
			const centerX = rect.width / 2;
			const centerY = rect.height / 2;
			
			// 计算鼠标到中心的距离
			const dx = clientX - rect.left - centerX;
			const dy = clientY - rect.top - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			
			// 根据距离计算值（最大半径140）
			const radius = 140;
			let value = (distance / radius) * 100;
			value = Math.max(0, Math.min(100, value));
			
			return value;
		},
		[]
	);

	// 更新特质值
	const updateTrait = useCallback(
		(index: number, newValue: number) => {
			const clampedValue = Math.max(10, Math.min(100, newValue));
			const newTraits = traits.map((t, i) =>
				i === index ? { ...t, value: clampedValue } : t
			);
			setTraits(newTraits);
			onChange?.(newTraits);
		},
		[traits, onChange]
	);

	// 开始拖拽
	const handleMouseDown = useCallback((index: number) => {
		setDraggingIndex(index);
	}, []);

	// 拖拽中
	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (draggingIndex === null) return;
			e.preventDefault();
			
			const newValue = calculateValueFromMouse(e.clientX, e.clientY);
			updateTrait(draggingIndex, newValue);
		},
		[draggingIndex, calculateValueFromMouse, updateTrait]
	);

	// 结束拖拽
	const handleMouseUp = useCallback(() => {
		setDraggingIndex(null);
	}, []);

	// 全局鼠标事件
	React.useEffect(() => {
		if (draggingIndex === null) return;
		
		const handleGlobalMouseMove = (e: MouseEvent) => {
			const newValue = calculateValueFromMouse(e.clientX, e.clientY);
			updateTrait(draggingIndex, newValue);
		};
		
		const handleGlobalMouseUp = () => {
			setDraggingIndex(null);
		};
		
		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);
		
		return () => {
			document.removeEventListener('mousemove', handleGlobalMouseMove);
			document.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	}, [draggingIndex, calculateValueFromMouse, updateTrait]);

	// SVG 配置
	const size = 400;
	const center = size / 2;
	const radius = 140;

	// 生成多边形路径
	const polygonPath = traits
		.map((trait, i) => {
			const pos = getVertexPosition(i, trait.value, radius, center);
			return `${pos.x},${pos.y}`;
		})
		.join(' ');

	return (
		<div className="flex flex-col items-center select-none">
			{/* 人物代号 */}
			<div className="mb-8 text-center">
				<span className="text-white/40 text-xs tracking-[0.3em]">SUBJECT:</span>
				<h2 className="text-white text-3xl font-extralight tracking-[0.2em] mt-2">
					{subjectName}
				</h2>
			</div>

			{/* 雷达图 SVG */}
			<svg
				ref={svgRef}
				width={size}
				height={size}
				className="cursor-crosshair"
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				style={{ 
					filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))',
					userSelect: 'none',
					WebkitUserSelect: 'none',
				}}
			>
				{/* 背景网格 */}
				{[20, 40, 60, 80, 100].map((level) => (
					<polygon
						key={level}
						points={Array.from({ length: 6 }, (_, i) => {
							const pos = getVertexPosition(i, level, radius, center);
							return `${pos.x},${pos.y}`;
						}).join(' ')}
						fill="none"
						stroke="rgba(255,255,255,0.1)"
						strokeWidth="0.5"
					/>
				))}

				{/* 轴线 */}
				{traits.map((_, i) => {
					const pos = getVertexPosition(i, 100, radius, center);
					return (
						<line
							key={i}
							x1={center}
							y1={center}
							x2={pos.x}
							y2={pos.y}
							stroke="rgba(255,255,255,0.15)"
							strokeWidth="0.5"
						/>
					);
				})}

				{/* 数据多边形 */}
				<polygon
					points={polygonPath}
					fill="rgba(255,255,255,0.08)"
					stroke="rgba(255,255,255,0.6)"
					strokeWidth="1.5"
					style={{ transition: 'all 0.1s ease-out' }}
				/>

				{/* 流体球节点 */}
				{traits.map((trait, i) => {
					const pos = getVertexPosition(i, trait.value, radius, center);
					const isDragging = draggingIndex === i;

					return (
						<g key={i}>
							{/* 标签 */}
							<text
								x={getVertexPosition(i, 125, radius, center).x}
								y={getVertexPosition(i, 125, radius, center).y}
								textAnchor="middle"
								dominantBaseline="middle"
								className="fill-white/60 text-xs font-light"
								style={{ pointerEvents: 'none' }}
							>
								{trait.label}
							</text>

							{/* 数值标签 */}
							<text
								x={pos.x}
								y={pos.y - 15}
								textAnchor="middle"
								className="fill-white/80 text-[10px] font-light"
								style={{ pointerEvents: 'none' }}
							>
								{Math.round(trait.value)}
							</text>

							{/* 可拖拽节点 */}
							<motion.circle
								cx={pos.x}
								cy={pos.y}
								r={isDragging ? 14 : 10}
								fill={isDragging ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
								stroke="rgba(255,255,255,1)"
								strokeWidth="2"
								style={{ 
									cursor: isDragging ? 'grabbing' : 'grab',
									pointerEvents: 'auto',
								}}
								whileHover={{ scale: 1.3 }}
								onMouseDown={() => handleMouseDown(i)}
							/>
						</g>
					);
				})}
			</svg>
		</div>
	);
}
