// ============================================================
// ProfileSetup: 人物设定组件
// 设置人物名称、头像，上传记忆文件
//
// 文件位置: src/components/ProfileSetup.tsx
// 主要依赖: framer-motion
// 被引用: app/create/page.tsx
//
// Props:
//   - onNext: (data: { name: string; avatar: string; file?: File }) => void - 下一步
//   - onBack: () => void - 返回
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, User } from 'lucide-react';

interface ProfileSetupProps {
	onNext: (data: { name: string; avatar: string; file?: File; extractedText?: string }) => void;
	onBack: () => void;
}

const PRESET_AVATARS = ['👤', '🎭', '🌸', '🌙', '⭐', '🔥'];

export function ProfileSetup({ onNext, onBack }: ProfileSetupProps) {
	const [name, setName] = useState('');
	const [avatar, setAvatar] = useState('👤');
	const [file, setFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [nameError, setNameError] = useState('');
	
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);
	
	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);
	
	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		
		const droppedFile = e.dataTransfer.files[0];
		if (droppedFile && droppedFile.name.endsWith('.txt')) {
			setFile(droppedFile);
		}
	}, []);
	
	const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile && selectedFile.name.endsWith('.txt')) {
			setFile(selectedFile);
		}
	}, []);
	
	const handleNext = async () => {
		// 验证名称
		if (!name.trim()) {
			setNameError('请输入人物名称');
			return;
		}
		if (name.length < 2 || name.length > 20) {
			setNameError('名称长度应在 2-20 个字符之间');
			return;
		}
		
		// 读取文件内容（如果有）
		let extractedText = '';
		if (file) {
			extractedText = await file.text();
		}
		
		onNext({ name: name.trim(), avatar, file: file || undefined, extractedText });
	};
	
	return (
		<div className="w-full max-w-2xl mx-auto space-y-8">
			{/* 标题 */}
			<div className="text-center">
				<h2 className="text-white text-xl font-light tracking-wider mb-2">
					人物设定
				</h2>
				<div className="w-16 h-px bg-white/20 mx-auto" />
			</div>
			
			{/* 名称输入 */}
			<div className="space-y-2">
				<label className="text-white/60 text-sm">
					人物名称 <span className="text-white/30">*</span>
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setNameError('');
					}}
					placeholder="给这个人物起个名字..."
					className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
				/>
				{nameError && (
					<p className="text-red-300/80 text-xs">{nameError}</p>
				)}
			</div>
			
			{/* 头像选择 */}
			<div className="space-y-2">
				<label className="text-white/60 text-sm">
					头像（可选）
				</label>
				<div className="flex gap-3 flex-wrap">
					{PRESET_AVATARS.map((emoji) => (
						<motion.button
							key={emoji}
							onClick={() => setAvatar(emoji)}
							className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
								avatar === emoji
									? 'bg-white/20 border-2 border-white/40'
									: 'bg-white/5 border border-white/10 hover:bg-white/10'
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							{emoji}
						</motion.button>
					))}
					{/* 自定义头像占位 */}
					<button className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-white/10 transition-colors">
						<User className="w-5 h-5" />
					</button>
				</div>
			</div>
			
			{/* 文件上传 */}
			<div className="space-y-2">
				<label className="text-white/60 text-sm">
					记忆素材（可选）
				</label>
				<div
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className={`relative p-8 rounded-xl border-2 border-dashed transition-all ${
						isDragging
							? 'bg-white/10 border-white/30'
							: file
								? 'bg-white/5 border-white/20'
								: 'bg-white/5 border-white/10 hover:border-white/20'
					}`}
				>
					<input
						type="file"
						accept=".txt"
						onChange={handleFileSelect}
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					/>
					<div className="text-center">
						{file ? (
							<div className="space-y-2">
								<p className="text-white text-sm">{file.name}</p>
								<p className="text-white/40 text-xs">
									{(file.size / 1024).toFixed(1)} KB
								</p>
							</div>
						) : (
							<>
								<Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
								<p className="text-white/60 text-sm">拖拽文件到这里</p>
								<p className="text-white/30 text-xs mt-1">支持 .txt 格式的日记、聊天记录</p>
								<p className="text-white/20 text-xs mt-2">或点击选择文件</p>
							</>
						)}
					</div>
				</div>
			</div>
			
			{/* 操作按钮 */}
			<div className="flex gap-4 pt-4">
				<button
					onClick={onBack}
					className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 transition-colors text-sm tracking-wider"
				>
					上一步
				</button>
				<button
					onClick={handleNext}
					className="flex-1 py-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors text-sm tracking-wider"
				>
					下一步
				</button>
			</div>
		</div>
	);
}
