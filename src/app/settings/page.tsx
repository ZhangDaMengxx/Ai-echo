// ============================================================
// Settings 页面: 设置与数据管理
// 支持数据导出/导入、自动备份设置
//
// 文件位置: src/app/settings/page.tsx
// 主要依赖: exportImport, localDb
//
// 功能:
//   - 数据导出为 JSON
//   - 从 JSON 导入数据
//   - 存储状态显示
//   - 冲突处理 (合并/替换)
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToJSON, importFromJSON, validateBackupFile, ImportResult } from '@/lib/exportImport';
import { localDb } from '@/lib/localDb';
import { GlassButton } from '@/components/GlassButton';

interface StorageStats {
	nodes: number;
	clues: number;
	branches: number;
	characters: number;
	lastBackup: string | null;
}

export default function SettingsPage() {
	const [stats, setStats] = useState<StorageStats>({
		nodes: 0,
		clues: 0,
		branches: 0,
		characters: 0,
		lastBackup: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	// 加载存储统计
	const loadStats = useCallback(async () => {
		try {
			const [nodes, clues, branches, characters] = await Promise.all([
				localDb.getAllNodes(),
				localDb.getAllClues(),
				localDb.getAllBranches(),
				localDb.getAllCharacters(),
			]);

			const lastBackup = localStorage.getItem('lastBackupDate');

			setStats({
				nodes: nodes.length,
				clues: clues.length,
				branches: branches.length,
				characters: characters.length,
				lastBackup: lastBackup,
			});
		} catch (error) {
			console.error('加载统计失败:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStats();
	}, [loadStats]);

	// 处理导出
	const handleExport = async () => {
		try {
			await exportToJSON();
			const now = new Date().toISOString();
			localStorage.setItem('lastBackupDate', now);
			setStats(prev => ({ ...prev, lastBackup: now }));
		} catch (error) {
			alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
		}
	};

	// 处理文件选择
	const handleFileSelect = async (file: File) => {
		const validation = await validateBackupFile(file);

		if (!validation.valid) {
			setImportResult({
				success: false,
				message: validation.message,
			});
			return;
		}

		// 检查是否有现有数据
		if (stats.nodes > 0 || stats.clues > 0 || stats.branches > 0) {
			setPendingFile(file);
			setShowConflictModal(true);
		} else {
			// 直接导入
			await performImport(file, 'replace');
		}
	};

	// 执行导入
	const performImport = async (file: File, mode: 'merge' | 'replace') => {
		setIsLoading(true);
		try {
			const result = await importFromJSON(file, { mode });
			setImportResult(result);

			if (result.success) {
				await loadStats();
			}
		} catch (error) {
			setImportResult({
				success: false,
				message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
			});
		} finally {
			setIsLoading(false);
			setShowConflictModal(false);
			setPendingFile(null);
		}
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

		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].name.endsWith('.json')) {
			handleFileSelect(files[0]);
		}
	};

	// 格式化日期显示
	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return '从未备份';
		const date = new Date(dateStr);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return '今天';
		if (diffDays === 1) return '昨天';
		if (diffDays < 7) return `${diffDays} 天前`;
		return date.toLocaleDateString('zh-CN');
	};

	return (
		<div className="min-h-screen bg-[#0a0a0f] text-white p-8">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* 标题 */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center"
				>
					<h1 className="text-3xl font-light tracking-wider mb-2">设置</h1>
					<p className="text-white/50">数据管理与系统配置</p>
				</motion.div>

				{/* 存储状态卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
				>
					<h2 className="text-xl font-light mb-6 flex items-center gap-2">
						<span>💾</span>
						<span>本地存储状态</span>
					</h2>

					{isLoading ? (
						<div className="flex justify-center py-8">
							<div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
						</div>
					) : (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<StatCard label="记忆节点" value={stats.nodes} />
							<StatCard label="隐藏线索" value={stats.clues} />
							<StatCard label="IF 线分支" value={stats.branches} />
							<StatCard label="人物" value={stats.characters} />
						</div>
					)}

					<div className="flex items-center justify-between pt-4 border-t border-white/10">
						<span className="text-white/50">
							上次备份: {formatDate(stats.lastBackup)}
						</span>
						{stats.lastBackup && new Date().getTime() - new Date(stats.lastBackup).getTime() > 7 * 24 * 60 * 60 * 1000 && (
							<span className="text-yellow-400 text-sm">⚠️ 建议备份</span>
						)}
					</div>
				</motion.div>

				{/* 数据管理卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
				>
					<h2 className="text-xl font-light mb-6 flex items-center gap-2">
						<span>📦</span>
						<span>数据管理</span>
					</h2>

					<div className="flex flex-wrap gap-4 mb-6">
						<GlassButton onClick={handleExport} disabled={isLoading}>
							📥 导出备份
						</GlassButton>

						<label className="cursor-pointer">
							<input
								type="file"
								accept=".json"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleFileSelect(file);
								}}
							/>
							<GlassButton disabled={isLoading}>
								📤 导入备份
							</GlassButton>
						</label>
					</div>

					{/* 拖拽区域 */}
					<div
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`
							border-2 border-dashed rounded-xl p-8 text-center transition-all
							${isDragging 
								? 'border-white/40 bg-white/10' 
								: 'border-white/10 bg-white/5'
							}
						`}
					>
						<p className="text-white/50">
							拖拽 JSON 备份文件到此处导入
						</p>
					</div>

					{/* 导入结果提示 */}
					<AnimatePresence>
						{importResult && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className={`mt-4 p-4 rounded-lg ${
									importResult.success 
										? 'bg-green-500/20 border border-green-500/30' 
										: 'bg-red-500/20 border border-red-500/30'
								}`}
							>
								<p className={importResult.success ? 'text-green-300' : 'text-red-300'}>
									{importResult.success ? '✅' : '❌'} {importResult.message}
								</p>
								{importResult.imported && (
									<p className="text-white/70 text-sm mt-1">
										导入: {importResult.imported.nodes} 个节点, {importResult.imported.clues} 条线索, {importResult.imported.branches} 个分支
									</p>
								)}
								<button
									onClick={() => setImportResult(null)}
									className="text-white/50 text-sm mt-2 hover:text-white/80"
								>
									关闭
								</button>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>

				{/* 关于卡片 */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
				>
					<h2 className="text-xl font-light mb-4 flex items-center gap-2">
						<span>ℹ️</span>
						<span>关于</span>
					</h2>
					<p className="text-white/50 text-sm leading-relaxed">
						回音轨迹 (Echo Tracks) 使用浏览器本地存储 (IndexedDB) 保存您的数据。
						数据完全存储在您的设备上，不会上传到任何服务器。
						建议定期导出备份，以防浏览器数据丢失。
					</p>
				</motion.div>
			</div>

			{/* 冲突处理弹窗 */}
			<AnimatePresence>
				{showConflictModal && pendingFile && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-[#0a0a0f] border border-white/20 rounded-2xl p-6 max-w-md w-full"
						>
							<h3 className="text-xl font-light mb-4">检测到现有数据</h3>
							<p className="text-white/60 mb-6">
								您已有 {stats.nodes} 个节点、{stats.clues} 条线索。
								请选择导入方式：
							</p>

							<div className="space-y-3">
								<button
									onClick={() => performImport(pendingFile, 'merge')}
									className="w-full p-4 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-left transition-all"
								>
									<div className="font-medium">🔄 合并</div>
									<div className="text-sm text-white/50 mt-1">
										保留现有数据，添加新数据
									</div>
								</button>

								<button
									onClick={() => performImport(pendingFile, 'replace')}
									className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-left transition-all"
								>
									<div className="font-medium text-red-300">🗑️ 替换</div>
									<div className="text-sm text-white/50 mt-1">
										删除现有数据，使用备份数据
									</div>
								</button>

								<button
									onClick={() => {
										setShowConflictModal(false);
										setPendingFile(null);
									}}
									className="w-full p-3 text-white/50 hover:text-white/80 transition-all"
								>
									取消
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// 统计卡片组件
function StatCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white/5 rounded-xl p-4 text-center">
			<div className="text-2xl font-light text-white/90">{value}</div>
			<div className="text-sm text-white/40 mt-1">{label}</div>
		</div>
	);
}
