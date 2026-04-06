'use client';

import { useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { Vector2 } from 'three';
import { HorizontalTimeline } from '@/components/HorizontalTimeline';
import TWEEN from '@tweenjs/tween.js';

function TweenUpdater() {
	useFrame(() => {
		TWEEN.update();
	});
	return null;
}

// 拖拽提示组件
function DragHint() {
	return (
		<div 
			className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none"
		>
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
				<span className="text-[10px]">按住左键拖动切换</span>
				<span>→</span>
			</div>
		</div>
	);
}

// 节点指示器
function NodeIndicator({ total, current }: { total: number; current: number }) {
	return (
		<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
			{Array.from({ length: total }).map((_, i) => (
				<div
					key={i}
					className="transition-all duration-500 rounded-full"
					style={{
						width: i === current ? '24px' : '6px',
						height: '6px',
						background: i === current 
							? 'rgba(255,255,255,0.9)' 
							: 'rgba(255,255,255,0.2)',
						boxShadow: i === current 
							? '0 0 12px rgba(255,255,255,0.6)' 
							: 'none',
					}}
				/>
			))}
		</div>
	);
}

export default function TestPage() {
	const [currentNode, setCurrentNode] = useState(2);

	// 监听节点变化
	useEffect(() => {
		const handleNodeChange = (e: Event) => {
			const customEvent = e as CustomEvent;
			setCurrentNode(customEvent.detail.index);
		};
		
		window.addEventListener('nodechange', handleNodeChange);
		return () => window.removeEventListener('nodechange', handleNodeChange);
	}, []);

	return (
		<div className="w-screen h-screen bg-[#050505] overflow-hidden relative cursor-grab active:cursor-grabbing">
			<style jsx global>{`
				@keyframes zoomIn {
					0% { transform: scale(0.3); opacity: 0; }
					30% { opacity: 1; }
					100% { transform: scale(5); opacity: 0; }
				}
			`}</style>

			{/* 顶部标题 */}
			<div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center pointer-events-none">
				<div 
					className="font-mono text-sm tracking-widest"
					style={{ color: 'rgba(255,255,255,0.5)' }}
				>
					<span className="font-bold text-white">ECHO</span>
					<span className="text-white/30"> / </span>
					<span className="text-white/50">TRACKS</span>
					<span className="text-white/20 ml-2 text-xs">v4.2 DRAG</span>
				</div>
			</div>

			{/* 拖拽提示 */}
			<DragHint />
			
			{/* 节点指示器 */}
			<NodeIndicator total={5} current={currentNode} />

			{/* 3D 场景 */}
			<Canvas
				camera={{ position: [0, 0, 7], fov: 50 }}
				gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
			>
				<TweenUpdater />
				<ambientLight intensity={0.1} />
				<fog attach="fog" args={['#050505', 10, 30]} />
				<HorizontalTimeline />
				<EffectComposer>
					<Bloom
						luminanceThreshold={0.1}
						luminanceSmoothing={0.3}
						height={600}
						intensity={1.2}
						opacity={1.5}
					/>
					<ChromaticAberration 
						offset={new Vector2(0.0008, 0.0008)} 
						radialModulation={false} 
						modulationOffset={0} 
					/>
				</EffectComposer>
			</Canvas>
		</div>
	);
}
