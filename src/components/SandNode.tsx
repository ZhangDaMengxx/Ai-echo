'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ============================================================
// SandNode: 流沙晶体节点
// 侵蚀模拟 + 景深 + 电影级变焦
// ============================================================

interface SandNodeProps {
	title: string;
	date: string;
	onClick?: () => void;
	focused?: boolean;
}

export function SandNode({ title, date, onClick, focused = false }: SandNodeProps) {
	const [isHovered, setIsHovered] = useState(false);

	// 生成沙粒
	const sandParticles = Array.from({ length: 50 }, (_, i) => ({
		id: i,
		x: Math.random() * 100,
		y: Math.random() * 100,
		size: Math.random() * 2 + 1,
		delay: Math.random() * 2,
	}));

	return (
		<motion.div
			className={`
				sand-node
				relative w-40 h-48
				cursor-pointer
				transition-all duration-700
				${focused ? 'focus z-20' : 'blur-[1px] z-10'}
				${isHovered ? 'erosion' : ''}
			`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onClick}
			whileHover={{ scale: 1.1, zIndex: 30 }}
			whileTap={{ scale: 0.95 }}
		>
			{/* 背景光晕 */}
			<div
				className={`
					absolute inset-0 
					rounded-full 
					bg-gradient-radial from-amber-500/20 to-transparent
					transition-opacity duration-500
					${isHovered ? 'opacity-100' : 'opacity-0'}
				`}
			/>

			{/* 晶体几何体 */}
			<div className="sand-geometry relative w-full h-full flex items-center justify-center">
				{/* 六边形晶体 */}
				<svg
					viewBox="0 0 100 100"
					className="w-28 h-28"
					style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))' }}
				>
					{/* 晶体面 */}
					<motion.polygon
						points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
						fill="rgba(251,191,36,0.1)"
						stroke="rgba(251,191,36,0.5)"
						strokeWidth="1"
						animate={{
							strokeOpacity: isHovered ? 0.8 : 0.3,
							fillOpacity: isHovered ? 0.2 : 0.1,
						}}
					/>

					{/* 内部线条 */}
					<motion.line
						x1="50" y1="5" x2="50" y2="95"
						stroke="rgba(251,191,36,0.3)"
						strokeWidth="0.5"
						animate={{ opacity: isHovered ? 1 : 0.3 }}
					/>
					<motion.line
						x1="5" y1="27.5" x2="95" y2="72.5"
						stroke="rgba(251,191,36,0.3)"
						strokeWidth="0.5"
						animate={{ opacity: isHovered ? 1 : 0.3 }}
					/>
					<motion.line
						x1="95" y1="27.5" x2="5" y2="72.5"
						stroke="rgba(251,191,36,0.3)"
						strokeWidth="0.5"
						animate={{ opacity: isHovered ? 1 : 0.3 }}
					/>
				</svg>

				{/* 微观细节纹理 - 沙粒 */}
				<div className="micro-detail absolute inset-0 pointer-events-none overflow-hidden rounded-full">
					{sandParticles.map((p) => (
						<motion.div
							key={p.id}
							className="absolute rounded-full bg-amber-400"
							style={{
								left: `${p.x}%`,
								top: `${p.y}%`,
								width: p.size,
								height: p.size,
							}}
							animate={{
								opacity: isHovered ? [0.3, 0, 0.3] : 0.4,
								y: isHovered ? [0, 20, 0] : 0,
								x: isHovered ? [0, (Math.random() - 0.5) * 10, 0] : 0,
							}}
							transition={{
								duration: 2,
								delay: p.delay * 0.1,
								repeat: isHovered ? Infinity : 0,
							}}
						/>
					))}
				</div>
			</div>

			{/* 标题和日期 */}
			<motion.div
				className="absolute bottom-0 left-0 right-0 text-center"
				initial={{ opacity: 0, y: 10 }}
				animate={{
					opacity: isHovered ? 1 : 0,
					y: isHovered ? 0 : 10,
				}}
				transition={{ duration: 0.3 }}
			>
				<h3 className="text-white text-sm font-light tracking-wider mb-1">
					{title}
				</h3>
				<p className="text-white/50 text-xs">{date}</p>
			</motion.div>
		</motion.div>
	);
}
