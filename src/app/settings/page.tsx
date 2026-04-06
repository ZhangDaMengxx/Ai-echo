// ============================================================
// SettingsPage: 设置页面
// 描述: 数据管理、备份恢复、存储统计
// ============================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, CheckCircle, Database, User, Clock } from 'lucide-react';
import { GlassButton } from '@/components/GlassButton';
import { exportToJSON, importFromJSON, validateBackupFile, getStorageStats } from '@/lib/exportImport';
import Link from 'next/link';

export default function SettingsPage() {
	const [stats, setStats] = useState<{
		nodeCount: number;
		clueCount: number;
		branchCount: number;
		profileName?: string;
		lastBackup?: string;
	} | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [importStatus, setImportStatus] = useState<{
		type: 'idle' | 'loading' | 'success' | 'error';
		message: string;
	}>({ type: 'idle', message: '' });
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 加载存储统计
	const loadStats = useCallback(async () => {
		try {
			const data = await getStorageStats();
			setStats(data);
		} catch (err) {
			console.error('加载存储统计失败:', err);
		}
	}, []);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	// 处理导出
	const handleExport = async () => {
		setIsExporting(true);
		try {
			await exportToJSON();
			// 记录备份时间
			localStorage.setItem('echo-tracks-last-backup', new Date().toISOString());
			await loadStats();
		} catch (err) {
			console.error('导出失败:', err);
		} finally {
			setIsExporting(false);
		}
	};

	// 处理文件选择
	const handleFileSelect = async (file: File) => {
		setImportStatus({ type: 'loading', message: '正在验证文件...' });

		// 先验证文件
		const validation = await validateBackupFile(file);
		if (!validation.valid) {
			setImportStatus({ type: 'error', message: validation.message });
			return;
		}

		setImportStatus({ type: 'loading', message: '正在导入数据...' });

		// 执行导入（合并模式）
		const result = await importFromJSON(file, { mode: 'merge' });

		if (result.success) {
			setImportStatus({ type: 'success', message: result.message });
			await loadStats();
		} else {
			setImportStatus({ type: 'error', message: result.message });
		}
	};

	// 处理输入框文件选择
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileSelect(file);
		}
		// 重置输入框，允许重复选择同一文件
		e.target.value = '';
	};

	// 拖拽处理
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (file && file.name.endsWith('.json')) {
			handleFileSelect(file);
		} else {
			setImportStatus({ type: 'error', message: '请选择 .json 格式的备份文件' });
		}
	};

	// 格式化日期显示
	const formatDate = (isoString?: string) => {
		if (!isoString) return '从未';
		const date = new Date(isoString);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return '今天';
		if (diffDays === 1) return '昨天';
		if (diffDays < 7) return `${diffDays} 天前`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} 周前`;
		return `${Math.floor(diffDays / 30)} 个月前`;
	};

	return (
		<div className="min-h-screen bg-[#0a0a0f] p-6">
			{/* 返回导航 */}
			<nav className="mb-8">
				<Link href="/">
					<GlassButton>← 返回</GlassButton>
				</Link>
			</nav>

			<div className="max-w-2xl mx-auto space-y-6">
				{/* 页面标题 */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8"
				>
					<h1 className="text-white text-3xl font-extralight tracking-[0.3em] mb-2">设置</h1>
					<p className="text-white/40 text-sm">数据管理与备份恢复</p>
				</motion.div>

				{/* 数据管理卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
				>
					<div className="flex items-center gap-3 mb-6">
						<Database className="w-5 h-5 text-white/60" />
						<h2 className="text-white text-lg font-light tracking-wider">数据管理</h2>
					</div>

					{/* 存储统计 */}
					{stats && (
						<div className="grid grid-cols-2 gap-4 mb-6">
							<div className="rounded-2xl bg-white/5 p-4">
								<div className="flex items-center gap-2 text-white/40 text-xs mb-1">
									<Database className="w-3 h-3" />
									<span>记忆节点</span>
								</div>
								<p className="text-white text-2xl font-light">{stats.nodeCount}</p>
							</div>
							<div className="rounded-2xl bg-white/5 p-4">
								<div className="flex items-center gap-2 text-white/40 text-xs mb-1">
									<User className="w-3 h-3" />
									<span>人物名称</span>
								</div>
								<p className="text-white text-2xl font-light">{stats.profileName || '未设置'}</p>
							</div>
							<div className="rounded-2xl bg-white/5 p-4">
								<div className="flex items-center gap-2 text-white/40 text-xs mb-1">
									<AlertCircle className="w-3 h-3" />
									<span>隐藏线索</span>
								</div>
								<p className="text-white text-2xl font-light">{stats.clueCount}</p>
							</div>
							<div className="rounded-2xl bg-white/5 p-4">
								<div className="flex items-center gap-2 text-white/40 text-xs mb-1">
									<Clock className="w-3 h-3" />
									<span>上次备份</span>
								</div>
								<p className={`text-2xl font-light ${stats.lastBackup ? 'text-white' : 'text-yellow-400/80'}`}>
									{formatDate(stats.lastBackup)}
								</p>
							</div>
						</div>
					)}

					{/* 操作按钮 */}
					<div className="flex gap-4 mb-6">
						<motion.button
							onClick={handleExport}
							disabled={isExporting}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
						>
							<Download className="w-4 h-4" />
							{isExporting ? '导出中...' : '导出备份'}
						</motion.button>

						<motion.button
							onClick={() => fileInputRef.current?.click()}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
						>
							<Upload className="w-4 h-4" />
							导入备份
						</motion.button>

						<input
							ref={fileInputRef}
							type="file"
							accept=".json"
							onChange={handleInputChange}
							className="hidden"
						/>
					</div>

					{/* 拖拽区域 */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
							isDragging
								? 'border-white/40 bg-white/10'
								: 'border-white/10 bg-white/5'
						}`}
					>
						<p className="text-white/40 text-sm">
							拖拽备份文件到此处导入
						</p>
					</div>

					{/* 导入状态提示 */}
					{importStatus.type !== 'idle' && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className={`mt-4 flex items-center gap-2 p-3 rounded-xl ${
								importStatus.type === 'success'
									? 'bg-green-500/20 text-green-300'
									: importStatus.type === 'error'
										? 'bg-red-500/20 text-red-300'
										: 'bg-white/10 text-white/60'
							}`}
						>
							{importStatus.type === 'success' && <CheckCircle className="w-4 h-4" />}
							{importStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
							{importStatus.type === 'loading' && (
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
									className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
								/>
							)}
							<span className="text-sm">{importStatus.message}</span>
						</motion.div>
					)}
				</motion.div>

				{/* 说明卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
				>
					<h3 className="text-white/60 text-sm font-light mb-4">关于数据备份</h3>
					<ul className="space-y-2 text-white/40 text-xs leading-relaxed">
						<li>• 所有数据仅存储在浏览器本地（IndexedDB），不会上传到任何服务器</li>
						<li>• 导出备份可将数据保存为 JSON 文件，用于跨设备迁移</li>
						<li>• 建议定期导出备份，防止浏览器数据清理导致丢失</li>
						<li>• 导入备份时，已存在的节点会自动跳过（合并模式）</li>
					</ul>
				</motion.div>
			</div>
		</div>
	);
}
