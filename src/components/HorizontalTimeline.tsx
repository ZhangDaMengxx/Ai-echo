'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { MemoryNode } from './MemoryNode';

interface NodeData {
	id: number;
	title: string;
	description: string;
}

interface IntroModalProps {
	node: NodeData | null;
	visible: boolean;
	onEnter: () => void;
	onCancel: () => void;
}

function IntroModal({ node, visible, onEnter, onCancel }: IntroModalProps) {
	if (!node || !visible) return null;

	return (
		<div 
			className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-700"
			style={{
				background: 'radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.98) 100%)',
				animation: 'fadeIn 0.5s ease-out',
			}}
		>
			<style jsx>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slideUp {
					from { opacity: 0; transform: translateY(30px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
			
			<div
				className="max-w-lg w-full mx-4 p-8 rounded-2xl"
				style={{
					background: 'rgba(10, 10, 15, 0.95)',
					border: '1px solid rgba(255,255,255,0.15)',
					boxShadow: '0 0 80px rgba(255,255,255,0.1), inset 0 0 40px rgba(255,255,255,0.02)',
					animation: 'slideUp 0.6s ease-out 0.2s both',
				}}
			>
				<div className="text-center mb-6">
					<div 
						className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
						style={{
							background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
							border: '1px solid rgba(255,255,255,0.2)',
						}}
					>
						<span className="text-2xl">✦</span>
					</div>
					
					<h2
						className="text-2xl font-bold mb-2 font-mono tracking-wider"
						style={{
							color: '#ffffff',
							textShadow: '0 0 30px rgba(255,255,255,0.5)',
						}}
					>
						{node.title}
					</h2>
					
					<div 
						className="w-12 h-px mx-auto my-4"
						style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
					/>
				</div>

				<div className="text-white/70 text-sm leading-relaxed mb-8 font-mono text-center">
					<p className="mb-4">{node.description}</p>
					<p className="text-white/40 text-xs">
						你即将穿越进入这段记忆
					</p>
				</div>

				<div className="flex gap-4">
					<button
						onClick={onCancel}
						className="flex-1 py-3 px-4 rounded-lg font-mono text-sm transition-all duration-300 hover:scale-105"
						style={{
							color: 'rgba(255,255,255,0.5)',
							background: 'rgba(255,255,255,0.03)',
							border: '1px solid rgba(255,255,255,0.1)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
							e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
							e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
						}}
					>
						离开
					</button>
					<button
						onClick={onEnter}
						className="flex-1 py-3 px-4 rounded-lg font-mono text-sm font-bold transition-all duration-300 hover:scale-105"
						style={{
							background: '#ffffff',
							color: '#000',
							boxShadow: '0 0 40px rgba(255,255,255,0.3)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.boxShadow = '0 0 60px rgba(255,255,255,0.5)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.3)';
						}}
					>
						进入回忆
					</button>
				</div>
			</div>
		</div>
	);
}

function AtmosphereParticles({ count, range }: { count: number; range: number }) {
	const pointsRef = useRef<THREE.Points>(null);

	const positions = useMemo(() => {
		const pos = new Float32Array(count * 3);
		for (let i = 0; i < count; i++) {
			pos[i * 3] = (Math.random() - 0.5) * range;
			pos[i * 3 + 1] = (Math.random() - 0.5) * range;
			pos[i * 3 + 2] = (Math.random() - 0.5) * range - 5;
		}
		return pos;
	}, [count, range]);

	useFrame(() => {
		if (pointsRef.current) {
			pointsRef.current.rotation.y += 0.0002;
		}
	});

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					count={count}
					array={positions}
					itemSize={3}
				/>
			</bufferGeometry>
			<pointsMaterial
				size={0.012}
				color="#ffffff"
				transparent
				opacity={0.2}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
				sizeAttenuation
			/>
		</points>
	);
}

export function HorizontalTimeline() {
	const { camera, gl } = useThree();
	const groupRef = useRef<THREE.Group>(null);
	
	const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
	const [showModal, setShowModal] = useState(false);
	const [centerIndex, setCenterIndex] = useState(2);
	const [isDragging, setIsDragging] = useState(false);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const nodes: NodeData[] = [
		{ id: 1, title: '初次觉醒', description: '那是你第一次意识到，这个世界并非表面看起来那么简单。某个深夜，一段被尘封的记忆突然涌现...' },
		{ id: 2, title: '矩阵重组', description: '当现实的结构开始崩解，你被迫重新审视一切。这不是终点，而是重生的开始。' },
		{ id: 3, title: '遗憾的分岔', description: '如果时间可以倒流，你会做出不同的选择吗？在这里，两条时间线曾短暂交汇...' },
		{ id: 4, title: '深渊凝视', description: '当你凝视深渊时，深渊也在凝视你。这是勇气与恐惧的最终对决。' },
		{ id: 5, title: '最终推演', description: '所有的线索汇聚于此。真相，或许比你想象的更加复杂。' },
	];

	const NODE_SPACING = 4.5; // 节点间距
	
	// 拖拽相关引用
	const dragStartX = useRef(0);
	const currentOffsetX = useRef(0);
	const targetOffsetX = useRef(0);
	const isDragged = useRef(false);

	// 计算目标偏移量
	const calculateTargetOffset = useCallback((index: number) => {
		return -index * NODE_SPACING;
	}, []);

	// 初始化目标位置
	useEffect(() => {
		targetOffsetX.current = calculateTargetOffset(centerIndex);
		currentOffsetX.current = targetOffsetX.current;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 拖拽事件处理
	useEffect(() => {
		const canvas = gl.domElement;

		const handleMouseDown = (e: MouseEvent) => {
			if (showModal || isTransitioning) return;
			dragStartX.current = e.clientX;
			isDragged.current = false;
			setIsDragging(true);
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging || showModal || isTransitioning) return;
			
			const deltaX = e.clientX - dragStartX.current;
			if (Math.abs(deltaX) > 5) {
				isDragged.current = true;
			}
			
			// 拖拽时实时更新位置
			targetOffsetX.current = currentOffsetX.current + deltaX * 0.01;
		};

		const handleMouseUp = (e: MouseEvent) => {
			if (!isDragging) return;
			setIsDragging(false);
			
			const deltaX = e.clientX - dragStartX.current;
			
			// 如果不是拖拽（点击），不处理切换
			if (!isDragged.current) return;
			
			// 判断拖拽方向和距离来切换节点
			if (Math.abs(deltaX) > 50) {
				if (deltaX > 0 && centerIndex > 0) {
					// 向右拖拽，切换到左边节点
					setCenterIndex(centerIndex - 1);
				} else if (deltaX < 0 && centerIndex < nodes.length - 1) {
					// 向左拖拽，切换到右边节点
					setCenterIndex(centerIndex + 1);
				}
			}
			
			// 更新当前偏移基准
			currentOffsetX.current = calculateTargetOffset(centerIndex);
		};

		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			canvas.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isDragging, centerIndex, nodes.length, calculateTargetOffset, showModal, isTransitioning, gl.domElement]);

	// 当中心索引变化时，更新目标位置
	useEffect(() => {
		targetOffsetX.current = calculateTargetOffset(centerIndex);
		currentOffsetX.current = targetOffsetX.current;
	}, [centerIndex, calculateTargetOffset]);

	// 动画循环 - 平滑移动节点组
	useFrame(() => {
		if (groupRef.current && !isDragging) {
			// 平滑插值到目标位置
			currentOffsetX.current += (targetOffsetX.current - currentOffsetX.current) * 0.08;
			groupRef.current.position.x = currentOffsetX.current;
		} else if (groupRef.current && isDragging) {
			groupRef.current.position.x = targetOffsetX.current;
		}
		
		TWEEN.update();
	});

	// 点击中心节点
	const handleCenterNodeClick = (node: NodeData) => {
		if (isDragging || isDragged.current) return;
		
		setSelectedNode(node);
		setIsTransitioning(true);

		// 摄像机拉近动画
		const startPos = camera.position.clone();
		const targetPos = new THREE.Vector3(0, 0, 3.5); // 靠近中心节点
		
		const tweenObj = { 
			x: startPos.x, y: startPos.y, z: startPos.z,
		};

		new TWEEN.Tween(tweenObj)
			.to({ x: 0, y: 0, z: targetPos.z }, 1200)
			.easing(TWEEN.Easing.Cubic.InOut)
			.onUpdate(() => {
				camera.position.set(tweenObj.x, tweenObj.y, tweenObj.z);
				camera.lookAt(0, 0, 0);
			})
			.onComplete(() => {
				setShowModal(true);
				setIsTransitioning(false);
			})
			.start();
	};

	const handleEnter = () => {
		setShowModal(false);
		console.log('进入回忆:', selectedNode?.title);
	};

	const handleCancel = () => {
		setShowModal(false);
		
		// 摄像机返回原位
		const startPos = camera.position.clone();
		const tweenObj = { x: startPos.x, y: startPos.y, z: startPos.z };

		new TWEEN.Tween(tweenObj)
			.to({ x: 0, y: 0, z: 7 }, 1000)
			.easing(TWEEN.Easing.Cubic.Out)
			.onUpdate(() => {
				camera.position.set(tweenObj.x, tweenObj.y, tweenObj.z);
				camera.lookAt(0, 0, 0);
			})
			.start();
	};

	// 计算节点属性
	const getNodeProps = (index: number) => {
		const distance = Math.abs(index - centerIndex);
		const xPosition = index * NODE_SPACING;
		
		// 根据距离计算缩放
		let scale = 0.5;
		if (distance === 0) scale = 1.6;
		else if (distance === 1) scale = 0.9;
		else if (distance === 2) scale = 0.6;
		
		// 是否为中心节点（可交互）
		const isCenter = distance === 0;
		
		return { xPosition, scale, isCenter };
	};

	return (
		<>
			{/* 环境光 */}
			<ambientLight intensity={0.15} />
			<pointLight position={[10, 10, 10]} intensity={0.3} color="#ffffff" />
			<pointLight position={[-10, -10, 5]} intensity={0.1} color="#ffffff" />

			{/* 背景粒子 */}
			<AtmosphereParticles count={150} range={25} />
			<AtmosphereParticles count={100} range={20} />

			{/* 连接线 */}
			<mesh position={[NODE_SPACING * 2, 0, -0.5]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.002, 0.002, NODE_SPACING * (nodes.length - 1), 8]} />
				<meshBasicMaterial color="#333333" transparent opacity={0.15} />
			</mesh>

			{/* 节点组 */}
			<group ref={groupRef}>
				{nodes.map((node, index) => {
					const { xPosition, scale, isCenter } = getNodeProps(index);
					
					return (
						<MemoryNode
							key={node.id}
							position={[xPosition, 0, 0]}
							title={node.title}
							scale={scale}
							isCenter={isCenter}
							isInteractive={isCenter && !isDragging && !isTransitioning}
							onClick={() => handleCenterNodeClick(node)}
							onExplode={() => {}}
						/>
					);
				})}
			</group>

			{/* 介绍弹窗 */}
			<IntroModal
				node={selectedNode}
				visible={showModal}
				onEnter={handleEnter}
				onCancel={handleCancel}
			/>
		</>
	);
}
