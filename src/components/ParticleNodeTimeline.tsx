'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { Vector2 } from 'three';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { Html } from '@react-three/drei';

// ============================================================
// ParticleNodeTimeline: 3D粒子球节点时间轴
// 替换卡片式节点展示，使用MemoryNode的粒子球效果
// ============================================================

// 情绪颜色映射 - 根据节点情绪自动变化
const EMOTION_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
	// 平静/平和 - 白色/淡蓝
	平静: { primary: '#e0e7ff', secondary: '#c7d2fe', glow: '#ffffff' },
	平和: { primary: '#e0e7ff', secondary: '#c7d2fe', glow: '#ffffff' },
	// 郁闷/压抑 - 灰蒙蒙
	郁闷: { primary: '#6b7280', secondary: '#4b5563', glow: '#9ca3af' },
	压抑: { primary: '#6b7280', secondary: '#4b5563', glow: '#9ca3af' },
	// 兴奋/开心 - 橙红色
	兴奋: { primary: '#f97316', secondary: '#ea580c', glow: '#fdba74' },
	开心: { primary: '#f97316', secondary: '#ea580c', glow: '#fdba74' },
	喜悦: { primary: '#f97316', secondary: '#ea580c', glow: '#fdba74' },
	// 生气/愤怒 - 怒红
	生气: { primary: '#dc2626', secondary: '#b91c1c', glow: '#fca5a5' },
	愤怒: { primary: '#dc2626', secondary: '#b91c1c', glow: '#fca5a5' },
	怒: { primary: '#dc2626', secondary: '#b91c1c', glow: '#fca5a5' },
	// 忧郁/悲伤 - 蓝色
	忧郁: { primary: '#3b82f6', secondary: '#2563eb', glow: '#93c5fd' },
	悲伤: { primary: '#3b82f6', secondary: '#2563eb', glow: '#93c5fd' },
	伤心: { primary: '#3b82f6', secondary: '#2563eb', glow: '#93c5fd' },
	// 默认 - 淡紫色
	default: { primary: '#a78bfa', secondary: '#7c3aed', glow: '#c4b5fd' },
};

// 获取情绪颜色
function getEmotionColor(emotion?: string) {
	if (!emotion) return EMOTION_COLORS.default;
	return EMOTION_COLORS[emotion] || EMOTION_COLORS.default;
}

export interface TimelineNode {
	id: string;
	title: string;
	description?: string;
	event_date?: string;
	salience_score: number;
	core_event: string;
	npc_state?: {
		current_emotion?: string;
		attitude_towards_user?: string;
	};
}

interface ParticleNodeTimelineProps {
	nodes: TimelineNode[];
	onNodeClick?: (node: TimelineNode) => void;
	onNodeDelete?: (nodeId: string) => void;
	className?: string;
}

// 粒子球组件
function ParticleSphere({
	position,
	title,
	scale = 1,
	isCenter = false,
	distance = 0,
	isInteractive = false,
	onClick,
	nodeEmotion,
}: {
	position: [number, number, number];
	title: string;
	scale?: number;
	isCenter?: boolean;
	distance?: number;
	isInteractive?: boolean;
	onClick?: () => void;
	nodeEmotion?: string;
}) {
	const [hovered, setHovered] = useState(false);
	const [exploding, setExploding] = useState(false);
	const groupRef = useRef<THREE.Group>(null);
	const pointsRef = useRef<THREE.Points>(null);
	const breathePhaseRef = useRef(0);

	const PARTICLE_COUNT = 400;
	const PARTICLE_SIZE = 0.022;

	const { positions, initialPositions } = useMemo(() => {
		const pos = new Float32Array(PARTICLE_COUNT * 3);
		const initial = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const minR = 0.25;
			const maxR = 0.32;
			const r = minR + Math.pow(Math.random(), 0.6) * (maxR - minR);

			const x = r * Math.sin(phi) * Math.cos(theta);
			const y = r * Math.sin(phi) * Math.sin(theta);
			const z = r * Math.cos(phi);

			pos[i3] = x;
			pos[i3 + 1] = y;
			pos[i3 + 2] = z;
			initial[i3] = x;
			initial[i3 + 1] = y;
			initial[i3 + 2] = z;
		}

		return { positions: pos, initialPositions: initial };
	}, []);

	const tweenGroup = useMemo(() => new TWEEN.Group(), []);

	useFrame((state, delta) => {
		if (!groupRef.current || !pointsRef.current) return;

		tweenGroup.update();
		const time = state.clock.getElapsedTime();

		groupRef.current.rotation.y = time * 0.06;
		groupRef.current.rotation.z = Math.sin(time * 0.15) * 0.02;

		// 呼吸式缩放：悬停时频率加快、幅度增大
		if (!exploding) {
			const baseBreatheFreq = 0.5; // 基础频率
			const hoverBreatheFreq = 2.5; // 悬停时频率（更快）
			const breatheFreq = hovered ? hoverBreatheFreq : baseBreatheFreq;
			
			const baseBreatheAmp = isCenter ? 0.04 : 0.02; // 基础幅度
			const hoverBreatheAmp = 0.08; // 悬停时幅度（更大）
			const breatheAmp = hovered ? hoverBreatheAmp : baseBreatheAmp;
			
			// 累加呼吸相位，悬停时加速
			breathePhaseRef.current += delta * breatheFreq;
			const breathe = Math.sin(breathePhaseRef.current) * breatheAmp;
			
			const baseScale = scale * (1 + breathe);
			groupRef.current.scale.setScalar(baseScale);
		}

		if (exploding) {
			const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
			for (let i = 0; i < PARTICLE_COUNT; i++) {
				const i3 = i * 3;
				const currentX = positions[i3];
				const currentY = positions[i3 + 1];
				const currentZ = positions[i3 + 2];
				const direction = new THREE.Vector3(currentX, currentY, currentZ).normalize();
				const speed = 8 + Math.random() * 5;
				positions[i3] += direction.x * speed * delta;
				positions[i3 + 1] += direction.y * speed * delta;
				positions[i3 + 2] += direction.z * speed * delta;
			}
			pointsRef.current.geometry.attributes.position.needsUpdate = true;

			const currentScale = groupRef.current.scale.x;
			if (currentScale > 0.01) {
				groupRef.current.scale.setScalar(currentScale - delta * 1.0);
			}
		}

		if (!exploding) {
			const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
			// 悬停时粒子扰动更活跃
			const intensity = hovered ? 0.08 : isCenter ? 0.03 : 0.01;
			const speed = hovered ? 2.0 : isCenter ? 0.8 : 0.4;

			for (let i = 0; i < PARTICLE_COUNT; i += 2) {
				const i3 = i * 3;
				const t = time * speed + i * 0.1;
				const noiseX = Math.sin(t) * intensity * 0.5;
				const noiseY = Math.cos(t * 0.7) * intensity * 0.5;
				const noiseZ = Math.sin(t * 1.3) * intensity * 0.5;
				positions[i3] = initialPositions[i3] + noiseX;
				positions[i3 + 1] = initialPositions[i3 + 1] + noiseY;
				positions[i3 + 2] = initialPositions[i3 + 2] + noiseZ;
			}
			pointsRef.current.geometry.attributes.position.needsUpdate = true;
		}
	});

	const handleClick = () => {
		if (!isInteractive || exploding) return;
		// 立即触发点击回调
		onClick?.();
		// 然后播放爆炸动画
		setExploding(true);

		const scaleObj = { scale: groupRef.current?.scale.x || 1 };
		new TWEEN.Tween(scaleObj, tweenGroup)
			.to({ scale: 0.01 }, 800)
			.easing(TWEEN.Easing.Exponential.In)
			.onUpdate(() => {
				if (groupRef.current) {
					groupRef.current.scale.setScalar(scaleObj.scale);
				}
			})
			.start();
	};

	return (
		<group
			ref={groupRef}
			position={position}
			onPointerOver={() => isInteractive && setHovered(true)}
			onPointerOut={() => setHovered(false)}
			onClick={handleClick}
		>
			<points ref={pointsRef}>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						count={PARTICLE_COUNT}
						array={positions}
						itemSize={3}
					/>
				</bufferGeometry>
				<EmotionParticleMaterial
					isCenter={isCenter}
					distance={distance}
					hovered={hovered}
					nodeEmotion={nodeEmotion}
					size={PARTICLE_SIZE}
				/>
			</points>

			{!exploding && (
				<Html
					distanceFactor={10}
					position={[0, isCenter ? 0.5 : 0.38, 0]}
					center
					style={{ transition: 'all 0.3s ease-out', pointerEvents: 'none' }}
				>
					<div
						className="font-mono text-xs tracking-widest whitespace-nowrap px-4 py-2 rounded"
						style={{
							color: isCenter ? '#ffffff' : 'rgba(255,255,255,0.5)',
							textShadow: isCenter
								? `0 0 20px ${getEmotionColor(nodeEmotion).glow}80`
								: '0 0 10px rgba(255,255,255,0.2)',
							background: isCenter
								? 'rgba(5, 5, 8, 0.9)'
								: 'rgba(5, 5, 8, 0.4)',
							border: isInteractive
								? `1px solid ${getEmotionColor(nodeEmotion).primary}60`
								: '1px solid rgba(255,255,255,0.08)',
							backdropFilter: 'blur(8px)',
							transform: isCenter ? 'scale(1.1)' : 'scale(1)',
							transition: 'all 0.3s ease-out',
						}}
					>
						{title}
						{isInteractive && (
							<span className="ml-2 text-[8px] opacity-50">点击查看</span>
						)}
					</div>
				</Html>
			)}
		</group>
	);
}

// 3D场景组件
function TimelineScene({
	nodes,
	centerIndex,
	onNodeClick,
	setCenterIndex,
}: {
	nodes: TimelineNode[];
	centerIndex: number;
	onNodeClick: (node: TimelineNode, index: number) => void;
	setCenterIndex: (index: number) => void;
}) {
	const { gl } = useThree();
	const groupRef = useRef<THREE.Group>(null);

	const NODE_SPACING = 3.5;
	// const SWITCH_THRESHOLD = 1.8; // 拖拽超过节点间距的50%就切换

	// 拖拽状态
	const dragState = useRef({
		isDragging: false,
		startX: 0,
		startIndex: 0,
		currentOffset: 0,
		dragDistance: 0,
	});

	// 目标位置和当前位置（用于动画）
	const targetX = useRef(0);
	const currentX = useRef(0);

	// 计算目标位置
	const getTargetX = useCallback((index: number) => {
		return -index * NODE_SPACING;
	}, []);

	// 当 centerIndex 变化时更新目标
	useEffect(() => {
		targetX.current = getTargetX(centerIndex);
	}, [centerIndex, getTargetX]);

	// 初始化
	useEffect(() => {
		currentX.current = getTargetX(centerIndex);
		targetX.current = currentX.current;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const canvas = gl.domElement;

		const handleMouseDown = (e: MouseEvent) => {
			dragState.current.isDragging = true;
			dragState.current.startX = e.clientX;
			dragState.current.startIndex = centerIndex;
			dragState.current.currentOffset = currentX.current;
			dragState.current.dragDistance = 0;
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!dragState.current.isDragging) return;

			const deltaX = e.clientX - dragState.current.startX;
			dragState.current.dragDistance = deltaX;

			// 直接跟随鼠标移动（转换为3D坐标，需要缩放）
			// 屏幕像素到3D单位的转换系数
			const pixelTo3D = 0.008;
			targetX.current = dragState.current.currentOffset + deltaX * pixelTo3D;
		};

		const handleMouseUp = () => {
			if (!dragState.current.isDragging) return;
			dragState.current.isDragging = false;

			// 根据拖拽距离计算应该切换到哪个节点
			const dragOffset = dragState.current.dragDistance * 0.008;
			const nodeShift = Math.round(-dragOffset / NODE_SPACING);

			let newIndex = dragState.current.startIndex + nodeShift;

			// 边界限制
			newIndex = Math.max(0, Math.min(newIndex, nodes.length - 1));

			// 设置新的中心节点
			setCenterIndex(newIndex);

			// 目标位置会在 useEffect 中自动更新
			targetX.current = getTargetX(newIndex);
		};

		// 点击切换（只在非拖拽时触发）
		const handleClick = (e: MouseEvent) => {
			// 如果拖拽距离很小，认为是点击
			if (Math.abs(dragState.current.dragDistance) > 10) return;

			const rect = canvas.getBoundingClientRect();
			const clickX = e.clientX - rect.left;
			const canvasCenterX = rect.width / 2;

			// 点击右侧 -> 下一个
			if (clickX > canvasCenterX + 80 && centerIndex < nodes.length - 1) {
				setCenterIndex(centerIndex + 1);
			}
			// 点击左侧 -> 上一个
			else if (clickX < canvasCenterX - 80 && centerIndex > 0) {
				setCenterIndex(centerIndex - 1);
			}
		};

		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
		canvas.addEventListener('click', handleClick);

		return () => {
			canvas.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			canvas.removeEventListener('click', handleClick);
		};
	}, [gl.domElement, centerIndex, nodes.length, getTargetX, setCenterIndex]);

	useFrame(() => {
		if (groupRef.current) {
			// 使用弹簧动画平滑过渡
			const isDragging = dragState.current.isDragging;
			const stiffness = isDragging ? 0.8 : 0.12; // 拖拽时更跟手，松开时平滑回弹
			const damping = isDragging ? 0.5 : 0.08;

			const diff = targetX.current - currentX.current;
			currentX.current += diff * stiffness;

			// 添加一点阻尼感
			if (!isDragging) {
				currentX.current += (targetX.current - currentX.current) * damping * 0.1;
			}

			groupRef.current.position.x = currentX.current;
		}
		TWEEN.update();
	});

	const getNodeProps = (index: number) => {
		const distance = Math.abs(index - centerIndex);
		const xPosition = index * NODE_SPACING;
		// 居中节点大且清晰，左右节点小且虚化
		let scale = 0.4;
		if (distance === 0) scale = 1.5;      // 居中：最大
		else if (distance === 1) scale = 0.7;  // 旁边：明显缩小
		else if (distance === 2) scale = 0.45; // 再旁边：更小
		const isCenter = distance === 0;
		return { xPosition, scale, isCenter, distance };
	};

	// 包装点击处理，判断是否拖拽
	const handleNodeClickWrapper = useCallback(
		(node: TimelineNode, _index: number) => {
			// 如果是拖拽操作，不触发点击
			// 触发点击事件
			onNodeClick(node);
		},
		[onNodeClick]
	);

	return (
		<>
			<ambientLight intensity={0.1} />
			<pointLight position={[10, 10, 10]} intensity={0.3} />
			<pointLight position={[-10, -10, 5]} intensity={0.1} />

			<group ref={groupRef}>
				{nodes.map((node, index) => {
					const { xPosition, scale, isCenter, distance } = getNodeProps(index);
					return (
						<ParticleSphere
							key={node.id}
							position={[xPosition, 0, 0]}
							title={node.title || node.core_event.slice(0, 10)}
							scale={scale}
							isCenter={isCenter}
							distance={distance}
							isInteractive={isCenter}
							onClick={() => handleNodeClickWrapper(node, index)}
							nodeEmotion={node.npc_state?.current_emotion}
						/>
					);
				})}
			</group>

			<mesh position={[NODE_SPACING * 2, 0, -0.3]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.002, 0.002, NODE_SPACING * (nodes.length - 1), 8]} />
				<meshBasicMaterial color="#333333" transparent opacity={0.12} />
			</mesh>
		</>
	);
}

// 情绪粒子材质组件
function EmotionParticleMaterial({
	isCenter,
	distance,
	hovered,
	nodeEmotion,
	size,
}: {
	isCenter: boolean;
	distance: number;
	hovered: boolean;
	nodeEmotion?: string;
	size: number;
}) {
	const emotionColor = getEmotionColor(nodeEmotion);

	// 根据节点位置和悬停状态计算颜色
	const getColor = () => {
		if (!isCenter) {
			// 非中心节点：使用情绪色的淡化版本
			return emotionColor.secondary;
		}
		// 中心节点：悬停时使用辉光色，否则使用主色
		return hovered ? emotionColor.glow : emotionColor.primary;
	};

	// 根据节点位置计算透明度
	const getOpacity = () => {
		if (isCenter) {
			return hovered ? 1.0 : 0.9;
		}
		// 非中心节点根据距离淡化
		return Math.max(0.1, 0.3 - distance * 0.1);
	};

	// 粒子大小
	const particleSize = size * (isCenter ? 1.4 : 0.5) * (hovered ? 1.3 : 1);

	return (
		<pointsMaterial
			size={particleSize}
			color={getColor()}
			transparent
			opacity={getOpacity()}
			blending={THREE.AdditiveBlending}
			depthWrite={false}
			sizeAttenuation
		/>
	);
}

// Tween更新器
function TweenUpdater() {
	useFrame(() => {
		TWEEN.update();
	});
	return null;
}

// 主组件
export function ParticleNodeTimeline({
	nodes,
	onNodeClick,
	className = '',
}: ParticleNodeTimelineProps) {
	const [centerIndex, setCenterIndex] = useState(0);

	const handleNodeClick = useCallback(
		(node: TimelineNode) => {
			onNodeClick?.(node);
		},
		[onNodeClick]
	);

	// 切换到指定节点（带动画）
	const goToIndex = useCallback((index: number) => {
		if (index >= 0 && index < nodes.length) {
			setCenterIndex(index);
		}
	}, [nodes.length]);

	// 拖拽切换节点
	const goToPrev = useCallback(() => {
		setCenterIndex((prev) => (prev === 0 ? nodes.length - 1 : prev - 1));
	}, [nodes.length]);

	const goToNext = useCallback(() => {
		setCenterIndex((prev) => (prev === nodes.length - 1 ? 0 : prev + 1));
	}, [nodes.length]);

	if (nodes.length === 0) {
		return (
			<div
				className={`flex items-center justify-center ${className}`}
				style={{ color: 'rgba(255,255,255,0.4)' }}
			>
				<p className="text-sm tracking-wider">暂无节点数据</p>
			</div>
		);
	}

	return (
		<div className={`relative ${className}`}>
			{/* 拖拽提示 */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
				<div
					className="flex items-center gap-3 px-4 py-2 rounded-full font-mono text-xs tracking-wider"
					style={{
						color: 'rgba(255,255,255,0.4)',
						background: 'rgba(255,255,255,0.03)',
						border: '1px solid rgba(255,255,255,0.08)',
						backdropFilter: 'blur(8px)',
					}}
				>
					<span>←</span>
					<span className="text-[10px]">拖拽或点击切换</span>
					<span>→</span>
				</div>
			</div>

			{/* 节点指示器 */}
			<div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
				{nodes.map((_, i) => (
					<button
						key={i}
						onClick={() => goToIndex(i)}
						className="transition-all duration-300 rounded-full"
						style={{
							width: i === centerIndex ? '20px' : '5px',
							height: '5px',
							background:
								i === centerIndex
									? 'rgba(255,255,255,0.9)'
									: 'rgba(255,255,255,0.2)',
							boxShadow:
								i === centerIndex ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
						}}
					/>
				))}
			</div>

			{/* 左右切换按钮 */}
			<button
				onClick={goToPrev}
				className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
				style={{
					background: 'rgba(255,255,255,0.05)',
					border: '1px solid rgba(255,255,255,0.1)',
					color: 'rgba(255,255,255,0.6)',
				}}
			>
				←
			</button>
			<button
				onClick={goToNext}
				className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
				style={{
					background: 'rgba(255,255,255,0.05)',
					border: '1px solid rgba(255,255,255,0.1)',
					color: 'rgba(255,255,255,0.6)',
				}}
			>
				→
			</button>

			{/* 3D Canvas */}
			<Canvas
				camera={{ position: [0, 0, 6], fov: 50 }}
				gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
				className="cursor-grab active:cursor-grabbing"
			>
				<TweenUpdater />
				<TimelineScene
					nodes={nodes}
					centerIndex={centerIndex}
					onNodeClick={handleNodeClick}
					setCenterIndex={goToIndex}
				/>
				<EffectComposer>
					<Bloom
						luminanceThreshold={0.1}
						luminanceSmoothing={0.3}
						height={500}
						intensity={1.0}
						opacity={1.2}
					/>
					<ChromaticAberration
						offset={new Vector2(0.0006, 0.0006)}
						radialModulation={false}
						modulationOffset={0}
					/>
				</EffectComposer>
			</Canvas>
		</div>
	);
}
