// ============================================================
// MigrationWizard: 数据迁移向导组件
// 引导用户完成数据迁移过程
//
// 文件位置: src/components/MigrationWizard.tsx
// 主要依赖: migration.ts
//
// 步骤:
//   1. 选择源文件
//   2. 验证数据
//   3. 预览迁移
//   4. 处理冲突
//   5. 执行迁移
//   6. 完成/回滚
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
	validateMigrationData, 
	previewMigration, 
	executeMigration, 
	rollbackMigration,
	MigrationData,
	MigrationPreview,
	MigrationResult,
	ConflictStrategy,
} from '@/lib/migration';
import { GlassButton } from './GlassButton';

interface MigrationWizardProps {
	onComplete?: () => void;
	onCancel?: () => void;
}

type WizardStep = 'select' | 'validate' | 'preview' | 'conflict' | 'migrate' | 'complete' | 'error';

export function MigrationWizard({ onComplete, onCancel }: MigrationWizardProps) {
	const [step, setStep] = useState<WizardStep>('select');
	const [sourceData, setSourceData] = useState<MigrationData | null>(null);
	const [preview, setPreview] = useState<MigrationPreview | null>(null);
	const [result, setResult] = useState<MigrationResult | null>(null);
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');

	// 步骤 1: 选择文件
	const handleFileSelect = useCallback(async (file: File) => {
		setIsLoading(true);
		setStep('validate');

		try {
			const text = await file.text();
			const data = JSON.parse(text);

			// 支持 BackupData 格式
			const migrationData: MigrationData = data.data || data;

			const validation = validateMigrationData(migrationData);
			if (!validation.valid) {
				setError(validation.message || '数据验证失败');
				setStep('error');
				return;
			}

			setSourceData(migrationData);

			// 生成预览
			const previewResult = await previewMigration(migrationData);
			setPreview(previewResult);
			setStep('preview');
		} catch (err) {
			setError(`文件解析失败: ${err instanceof Error ? err.message : '未知错误'}`);
			setStep('error');
		} finally {
			setIsLoading(false);
		}
	}, []);

	// 步骤 4/5: 执行迁移
	const handleMigrate = useCallback(async () => {
		if (!sourceData) return;

		setIsLoading(true);
		setStep('migrate');

		const result = await executeMigration(sourceData, conflictStrategy);
		setResult(result);
		setStep(result.success ? 'complete' : 'error');

		if (result.success && onComplete) {
			onComplete();
		}

		setIsLoading(false);
	}, [sourceData, conflictStrategy, onComplete]);

	// 回滚迁移
	const handleRollback = useCallback(async () => {
		if (!result?.migrationId) return;

		setIsLoading(true);
		const rollbackResult = await rollbackMigration(result.migrationId);
		setResult(rollbackResult);
		setStep(rollbackResult.success ? 'complete' : 'error');
		setIsLoading(false);
	}, [result]);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		const files = e.dataTransfer.files;
		if (files.length > 0 && files[0].name.endsWith('.json')) {
			handleFileSelect(files[0]);
		}
	}, [handleFileSelect]);

	return (
		<div className="max-w-2xl mx-auto">
			{/* 步骤指示器 */}
			<div className="flex justify-center mb-8">
				{['select', 'validate', 'preview', 'migrate', 'complete'].map((s, i) => {
					const stepIndex = ['select', 'validate', 'preview', 'conflict', 'migrate', 'complete'].indexOf(step);
					const isActive = stepIndex >= i;
					const isCurrent = ['select', 'validate', 'preview', 'conflict'].includes(step) 
						? i === Math.min(stepIndex, 2)
						: i === stepIndex - (step === 'migrate' || step === 'complete' ? 1 : 0);

					return (
						<div key={s} className="flex items-center">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
									isCurrent
										? 'bg-white text-black'
										: isActive
											? 'bg-white/30 text-white'
											: 'bg-white/10 text-white/40'
								}`}
							>
								{i + 1}
							</div>
							{i < 4 && (
								<div className={`w-12 h-0.5 ${isActive ? 'bg-white/30' : 'bg-white/10'}`} />
							)}
						</div>
					);
				})}
			</div>

			{/* 步骤内容 */}
			<AnimatePresence mode="wait">
				{step === 'select' && (
					<motion.div
						key="select"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="text-center"
					>
						<h3 className="text-xl font-light mb-4">选择迁移数据源</h3>
						<p className="text-white/50 mb-6">
							选择之前导出的 JSON 备份文件，或从另一个设备传输的备份文件。
						</p>

						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
							className="border-2 border-dashed border-white/20 rounded-xl p-12 mb-6 hover:border-white/40 transition-colors"
						>
							<p className="text-white/50 mb-4">拖拽文件到此处，或</p>
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
								<GlassButton>选择文件</GlassButton>
							</label>
						</div>

						{onCancel && (
							<button
								onClick={onCancel}
								className="text-white/50 hover:text-white/80"
							>
								取消
							</button>
						)}
					</motion.div>
				)}

				{step === 'validate' && (
					<motion.div
						key="validate"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="text-center py-12"
					>
						<div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
						<p className="text-white/60">正在验证数据...</p>
					</motion.div>
				)}

				{step === 'preview' && preview && (
					<motion.div
						key="preview"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
					>
						<h3 className="text-xl font-light mb-6">迁移预览</h3>

						<div className="grid grid-cols-2 gap-4 mb-6">
							<PreviewCard
								label="新节点"
								value={preview.newNodes}
								color="green"
							/>
							<PreviewCard
								label="新线索"
								value={preview.newClues}
								color="green"
							/>
							<PreviewCard
								label="新分支"
								value={preview.newBranches}
								color="green"
							/>
							<PreviewCard
								label="新人物"
								value={preview.newCharacters}
								color="green"
							/>
							{preview.duplicateNodes > 0 && (
								<PreviewCard
									label="重复节点"
									value={preview.duplicateNodes}
									color="yellow"
								/>
							)}
							{preview.conflictNodes > 0 && (
								<PreviewCard
									label="冲突节点"
									value={preview.conflictNodes}
									color="red"
								/>
							)}
						</div>

						{/* 冲突处理选项 */}
						{(preview.duplicateNodes > 0 || preview.conflictNodes > 0) && (
							<div className="mb-6 p-4 bg-white/5 rounded-lg">
								<div className="text-sm text-white/70 mb-3">冲突处理策略</div>
								<div className="space-y-2">
									{[
										{ value: 'skip', label: '跳过', desc: '保留现有数据' },
										{ value: 'replace', label: '替换', desc: '使用新数据覆盖' },
										{ value: 'rename', label: '重命名', desc: '创建副本' },
									].map((option) => (
										<label
											key={option.value}
											className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
												conflictStrategy === option.value
													? 'bg-white/20'
													: 'bg-white/5 hover:bg-white/10'
											}`}
										>
											<input
												type="radio"
												name="conflictStrategy"
												value={option.value}
												checked={conflictStrategy === option.value}
												onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)}
												className="mr-3"
											/>
											<div>
												<div className="font-medium">{option.label}</div>
												<div className="text-sm text-white/50">{option.desc}</div>
											</div>
										</label>
									))}
								</div>
							</div>
						)}

						<div className="flex gap-4">
							<GlassButton onClick={handleMigrate} disabled={isLoading}>
								{isLoading ? '迁移中...' : '开始迁移'}
							</GlassButton>
							<button
								onClick={() => setStep('select')}
								className="text-white/50 hover:text-white/80"
								disabled={isLoading}
							>
								重新选择
							</button>
						</div>
					</motion.div>
				)}

				{step === 'migrate' && (
					<motion.div
						key="migrate"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="text-center py-12"
					>
						<div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto mb-4" />
						<p className="text-white/60">正在执行迁移...</p>
					</motion.div>
				)}

				{step === 'complete' && result && (
					<motion.div
						key="complete"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="text-center"
					>
						<div className="text-5xl mb-4">{result.success ? '✅' : '❌'}</div>
						<h3 className="text-xl font-light mb-4">
							{result.success ? '迁移完成' : '迁移失败'}
						</h3>
						<p className="text-white/60 mb-6">{result.message}</p>

						{result.imported && (
							<div className="grid grid-cols-4 gap-4 mb-6">
								<ResultCard label="节点" value={result.imported.nodes} />
								<ResultCard label="线索" value={result.imported.clues} />
								<ResultCard label="分支" value={result.imported.branches} />
								<ResultCard label="人物" value={result.imported.characters} />
							</div>
						)}

						{result.skipped && result.skipped.nodes > 0 && (
							<p className="text-yellow-400 text-sm mb-4">
								跳过 {result.skipped.nodes} 个重复/冲突项
							</p>
						)}

						<div className="flex gap-4 justify-center">
							{result.success && result.migrationId && (
								<button
									onClick={handleRollback}
									disabled={isLoading}
									className="text-red-400 hover:text-red-300 text-sm"
								>
									撤销迁移
								</button>
							)}
							{onComplete && (
								<GlassButton onClick={onComplete}>完成</GlassButton>
							)}
						</div>
					</motion.div>
				)}

				{step === 'error' && (
					<motion.div
						key="error"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						className="text-center"
					>
						<div className="text-5xl mb-4">⚠️</div>
						<h3 className="text-xl font-light mb-4 text-red-400">出错了</h3>
						<p className="text-white/60 mb-6">{error}</p>
						<div className="flex gap-4 justify-center">
							<button
								onClick={() => setStep('select')}
								className="text-white/50 hover:text-white/80"
							>
								重试
							</button>
							{onCancel && (
								<GlassButton onClick={onCancel}>取消</GlassButton>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// 预览卡片组件
function PreviewCard({ 
	label, 
	value, 
	color 
}: { 
	label: string; 
	value: number; 
	color: 'green' | 'yellow' | 'red';
}) {
	const colorClasses = {
		green: 'bg-green-500/20 text-green-400',
		yellow: 'bg-yellow-500/20 text-yellow-400',
		red: 'bg-red-500/20 text-red-400',
	};

	return (
		<div className={`p-4 rounded-lg text-center ${colorClasses[color]}`}>
			<div className="text-2xl font-light">{value}</div>
			<div className="text-xs opacity-80">{label}</div>
		</div>
	);
}

// 结果卡片组件
function ResultCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="bg-white/5 rounded-lg p-3 text-center">
			<div className="text-xl font-light text-white/90">{value}</div>
			<div className="text-xs text-white/50">{label}</div>
		</div>
	);
}
