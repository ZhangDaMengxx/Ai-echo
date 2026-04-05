'use client';

import { useState, useRef, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

interface MemoryNodeProps {
	position: [number, number, number];
	title: string;
	scale?: number;
	isCenter?: boolean;
	isInteractive?: boolean;
	onExplode?: () => void;
	onClick?: () => void;
}

const PARTICLE_COUNT = 600;
const PARTICLE_SIZE = 0.025;

export function MemoryNode({
	position,
	title,
	scale = 1,
	isCenter = false,
	isInteractive = false,
	onExplode,
	onClick,
}: MemoryNodeProps) {
	const [hovered, setHovered] = useState(false);
	const [exploding, setExploding] = useState(false);
	const groupRef = useRef<THREE.Group>(null);
	const pointsRef = useRef<THREE.Points>(null);

	// 散开/爆炸状态的粒子 - 像星云一样分布
	const { positions, initialPositions } = useMemo(() => {
		const pos = new Float32Array(PARTICLE_COUNT * 3);
		const initial = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			
			// 随机方向
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			
			// 向外扩散的半径 - 使用幂函数让粒子在外围更密集
			const minR = 0.3;
			const maxR = 0.35;
			const r = minR + Math.pow(Math.random(), 0.6) * (maxR - minR);

			// 球形坐标转直角坐标
			const x = r * Math.sin(phi) * Math.cos(theta);
			const y = r * Math.sin(phi) * Math.sin(theta);
			const z = r * Math.cos(phi);

			// 添加一些随机扰动，让分布更自然
			const jitter = 0;
			pos[i3] = x + (Math.random() - 0.5) * jitter;
			pos[i3 + 1] = y + (Math.random() - 0.5) * jitter;
			pos[i3 + 2] = z + (Math.random() - 0.5) * jitter;

			initial[i3] = pos[i3];
			initial[i3 + 1] = pos[i3 + 1];
			initial[i3 + 2] = pos[i3 + 2];
		}

		return { positions: pos, initialPositions: initial };
	}, []);

	const tweenGroup = useMemo(() => new TWEEN.Group(), []);

	useFrame((state, delta) => {
		if (!groupRef.current || !pointsRef.current) return;

		tweenGroup.update();
		const time = state.clock.getElapsedTime();

		// 节点自转
		groupRef.current.rotation.y = time * 0.08;
		groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.03;

		// 呼吸动画
		const breatheAmp = isCenter ? 0.05 : 0.02;
		const breathe = Math.sin(time * 0.6 + position[0]) * breatheAmp;
		
		const baseScale = scale * (1 + breathe);
		
		if (!exploding) {
			groupRef.current.scale.setScalar(baseScale);
		}

		// 爆炸效果 - 从散开状态继续向外扩散
		if (exploding) {
			const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

			for (let i = 0; i < PARTICLE_COUNT; i++) {
				const i3 = i * 3;
				
				// 计算当前位置的方向（从中心向外）
				const currentX = positions[i3];
				const currentY = positions[i3 + 1];
				const currentZ = positions[i3 + 2];
				
				const direction = new THREE.Vector3(currentX, currentY, currentZ).normalize();
				
				// 向外扩散的速度
				const speed = 8 + Math.random() * 5;
				positions[i3] += direction.x * speed * delta;
				positions[i3 + 1] += direction.y * speed * delta;
				positions[i3 + 2] += direction.z * speed * delta;
			}

			pointsRef.current.geometry.attributes.position.needsUpdate = true;

			// 整体缩小消失
			const currentScale = groupRef.current.scale.x;
			if (currentScale > 0.01) {
				groupRef.current.scale.setScalar(currentScale - delta * 1.0);
			}
		}

		// 悬停时的粒子扰动 - 保持散开状态，只添加轻微浮动
		if (!exploding) {
			const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
			const intensity = (hovered || isCenter) ? 0.06 : 0.02;
			const speed = (hovered || isCenter) ? 1.5 : 0.8;

			for (let i = 0; i < PARTICLE_COUNT; i += 2) {
				const i3 = i * 3;
				const t = time * speed + i * 0.1;

				// 轻微的呼吸浮动
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
		
		setExploding(true);
		onClick?.();

		const scaleObj = { scale: groupRef.current?.scale.x || 1 };
		new TWEEN.Tween(scaleObj, tweenGroup)
			.to({ scale: 0.01 }, 1200)
			.easing(TWEEN.Easing.Exponential.In)
			.onUpdate(() => {
				if (groupRef.current) {
					groupRef.current.scale.setScalar(scaleObj.scale);
				}
			})
			.onComplete(() => {
				onExplode?.();
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
			{/* 粒子云 - 纯粒子，无光球 */}
			<points ref={pointsRef}>
				<bufferGeometry>
					<bufferAttribute
						attach="attributes-position"
						count={PARTICLE_COUNT}
						array={positions}
						itemSize={3}
					/>
				</bufferGeometry>
				<pointsMaterial
					size={PARTICLE_SIZE * (isCenter ? 1.3 : 0.7)}
					color={isCenter ? '#ffffff' : '#888888'}
					transparent
					opacity={isCenter ? 0.9 : 0.4}
					blending={THREE.AdditiveBlending}
					depthWrite={false}
					sizeAttenuation
				/>
			</points>

			{/* 标题 - 固定在节点上方 */}
			{!exploding && (
				<Html
					distanceFactor={10}
					position={[0, isCenter ? 0.55 : 0.4, 0]}
					center
					style={{
						transition: 'all 0.3s ease-out',
						pointerEvents: 'none',
					}}
				>
					<div
						className="font-mono text-xs tracking-widest whitespace-nowrap px-4 py-2 rounded"
						style={{
							color: isCenter ? '#ffffff' : 'rgba(255,255,255,0.5)',
							textShadow: isCenter 
								? '0 0 20px rgba(255,255,255,0.9)' 
								: '0 0 10px rgba(255,255,255,0.2)',
							background: isCenter 
								? 'rgba(5, 5, 8, 0.85)' 
								: 'rgba(5, 5, 8, 0.4)',
							border: isInteractive
								? '1px solid rgba(255,255,255,0.3)'
								: '1px solid rgba(255,255,255,0.08)',
							backdropFilter: 'blur(8px)',
							transform: isCenter ? 'scale(1.15)' : 'scale(1)',
							transition: 'all 0.3s ease-out',
							cursor: isInteractive ? 'pointer' : 'default',
						}}
					>
						{title}
						{isInteractive && (
							<span className="ml-2 text-[8px] opacity-50">点击进入</span>
						)}
					</div>
				</Html>
			)}
		</group>
	);
}
