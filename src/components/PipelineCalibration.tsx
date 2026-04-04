'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Check, X, Plus, Merge, Database } from 'lucide-react';

// ============================================================
// PipelineCalibration: 人类在环校准组件
// 支持删除、编辑、合并、补充节点，最终确认入库
// ============================================================

export interface DraftNode {
	id: string;
	event_date?: string;
	core_event: string;
	npc_state?: {
		current_emotion?: string;
		attitude_towards_user?: string;
	};
	salience_score: number;
	hidden_clues?: Array<{ trigger: string; content: string }>;
	memory_source?: string;
	opening_mode?: string;
}

interface PipelineCalibrationProps {
	draftNodes: DraftNode[];
	onChange: (nodes: DraftNode[]) => void;
	onCommit: (nodes: DraftNode[]) => void;
	isLoading?: boolean;
}

export function PipelineCalibration({
	draftNodes,
	onChange,
	onCommit,
	isLoading = false,
}: PipelineCalibrationProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
	const [supplementText, setSupplementText] = useState('');

	// 删除节点
	const handleDelete = useCallback(
		(id: string) => {
			onChange(draftNodes.filter((n) => n.id !== id));
		},
		[draftNodes, onChange]
	);

	// 保存编辑
	const handleSaveEdit = useCallback(
		(id: string, updates: Partial<DraftNode>) => {
			onChange(
				draftNodes.map((n) => (n.id === id ? { ...n, ...updates } : n))
			);
			setEditingId(null);
		},
		[draftNodes, onChange]
	);

	// 合并节点
	const handleMerge = useCallback(
		(targetId: string) => {
			if (!mergeSourceId || mergeSourceId === targetId) {
				setMergeSourceId(null);
				return;
			}
			const source = draftNodes.find((n) => n.id === mergeSourceId);
			const target = draftNodes.find((n) => n.id === targetId);
			if (!source || !target) return;

			const merged: DraftNode = {
				...target,
				core_event: `${target.core_event}；${source.core_event}`,
				salience_score: Math.max(target.salience_score, source.salience_score),
				hidden_clues: [
					...(target.hidden_clues || []),
					...(source.hidden_clues || []),
				],
			};

			onChange(
				draftNodes
					.filter((n) => n.id !== mergeSourceId && n.id !== targetId)
					.concat(merged)
			);
			setMergeSourceId(null);
		},
		[draftNodes, mergeSourceId, onChange]
	);

	// 补充节点
	const handleSupplement = useCallback(() => {
		if (!supplementText.trim()) return;
		const newNode: DraftNode = {
			id: `supplement-${Date.now()}`,
			event_date: new Date().toISOString().split('T')[0],
			core_event: supplementText.trim(),
			npc_state: { current_emotion: '平静', attitude_towards_user: '中性' },
			salience_score: 6,
			hidden_clues: [],
			memory_source: 'user_supplement',
			opening_mode: 'dialogue_driven',
		};
		onChange([...draftNodes, newNode]);
		setSupplementText('');
	}, [draftNodes, onChange, supplementText]);

	return (
		<div className="w-full max-w-4xl space-y-6">
			{/* 节点列表 */}
			<div className="space-y-4">
				<AnimatePresence mode="popLayout">
					{draftNodes.map((node, index) => (
						<motion.div
							key={node.id}
							layout
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className={`
								relative rounded-2xl border p-5 transition-all
								${mergeSourceId === node.id ? 'border-amber-400/60 bg-amber-500/10' : 'border-white/10 bg-white/5'}
							`}
						>
							{editingId === node.id ? (
								<NodeEditForm
									node={node}
									onSave={(updates) => handleSaveEdit(node.id, updates)}
									onCancel={() => setEditingId(null)}
								/>
							) : (
								<NodeView
									node={node}
									index={index}
									onEdit={() => setEditingId(node.id)}
									onDelete={() => handleDelete(node.id)}
									onMergeToggle={() =>
										setMergeSourceId(
											mergeSourceId === node.id ? null : node.id
										)
									}
									onMergeTarget={() => handleMerge(node.id)}
									isMergeSource={mergeSourceId === node.id}
									hasMergeSource={mergeSourceId !== null}
								/>
							)}
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			{/* 补充节点 */}
			<div className="rounded-2xl border border-white/10 bg-white/5 p-5">
				<p className="mb-3 text-sm text-white/50">补充遗忘的记忆</p>
				<div className="flex gap-3">
					<input
						type="text"
						value={supplementText}
						onChange={(e) => setSupplementText(e.target.value)}
						placeholder="用一句话描述你想补充的记忆..."
						className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/10"
					/>
					<motion.button
						onClick={handleSupplement}
						disabled={!supplementText.trim()}
						className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30 hover:bg-white/20"
						whileHover={{ scale: supplementText.trim() ? 1.02 : 1 }}
						whileTap={{ scale: supplementText.trim() ? 0.98 : 1 }}
					>
						<Plus className="h-4 w-4" />
						添加
					</motion.button>
				</div>
			</div>

			{/* 提交区 */}
			<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5">
				<div className="text-sm text-white/50">
					共 <span className="text-white">{draftNodes.length}</span> 个节点 · 显著性均分{' '}
					<span className="text-white">
						{draftNodes.length > 0
							? Math.round(
									draftNodes.reduce((s, n) => s + n.salience_score, 0) /
										draftNodes.length
								)
							: 0}
					</span>
				</div>
				<motion.button
					onClick={() => onCommit(draftNodes)}
					disabled={draftNodes.length === 0 || isLoading}
					className="flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-sm font-light tracking-wider text-white disabled:opacity-30 hover:bg-white/30"
					whileHover={{ scale: draftNodes.length > 0 && !isLoading ? 1.02 : 1 }}
					whileTap={{ scale: draftNodes.length > 0 && !isLoading ? 0.98 : 1 }}
				>
					<Database className="h-4 w-4" />
					{isLoading ? '入库中...' : '确认入库'}
				</motion.button>
			</div>
		</div>
	);
}

// ============================================================
// NodeView: 节点只读展示
// ============================================================
function NodeView({
	node,
	index,
	onEdit,
	onDelete,
	onMergeToggle,
	onMergeTarget,
	isMergeSource,
	hasMergeSource,
}: {
	node: DraftNode;
	index: number;
	onEdit: () => void;
	onDelete: () => void;
	onMergeToggle: () => void;
	onMergeTarget: () => void;
	isMergeSource: boolean;
	hasMergeSource: boolean;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1">
					<div className="mb-1 flex items-center gap-3">
						<span className="text-xs text-white/30">#{index + 1}</span>
						<span className="text-xs text-white/40">{node.event_date || '未标注日期'}</span>
						<span
							className={`rounded-full px-2 py-0.5 text-xs ${
								node.salience_score >= 7
									? 'bg-white/20 text-white'
									: 'bg-white/5 text-white/50'
							}`}
						>
							显著性 {node.salience_score}
						</span>
						{node.memory_source === 'user_supplement' && (
							<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
								用户补充
							</span>
						)}
					</div>
					<p className="text-base font-light leading-relaxed text-white/90">
						{node.core_event}
					</p>
					<div className="mt-2 flex flex-wrap gap-2 text-xs text-white/40">
						<span>情绪: {node.npc_state?.current_emotion || '未知'}</span>
						<span>·</span>
						<span>态度: {node.npc_state?.attitude_towards_user || '未知'}</span>
						<span>·</span>
						<span>开场: {node.opening_mode === 'action_driven' ? '动作驱动' : '语言驱动'}</span>
					</div>
					{node.hidden_clues && node.hidden_clues.length > 0 && (
						<div className="mt-2 text-xs text-white/30">
							线索: {node.hidden_clues.map((c) => c.trigger).join('、')}
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{hasMergeSource && !isMergeSource ? (
						<motion.button
							onClick={onMergeTarget}
							className="rounded-lg bg-amber-500/20 p-2 text-amber-200 hover:bg-amber-500/30"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							title="合并到当前节点"
						>
							<Merge className="h-4 w-4" />
						</motion.button>
					) : (
						<motion.button
							onClick={onMergeToggle}
							className={`rounded-lg p-2 ${
								isMergeSource
									? 'bg-amber-500/30 text-amber-200'
									: 'bg-white/5 text-white/50 hover:bg-white/10'
							}`}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							title={isMergeSource ? '取消合并' : '选择为合并源'}
						>
							<Merge className="h-4 w-4" />
						</motion.button>
					)}
					<motion.button
						onClick={onEdit}
						className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-white/10"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="编辑"
					>
						<Edit2 className="h-4 w-4" />
					</motion.button>
					<motion.button
						onClick={onDelete}
						className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-red-500/20 hover:text-red-200"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="删除"
					>
						<Trash2 className="h-4 w-4" />
					</motion.button>
				</div>
			</div>
		</div>
	);
}

// ============================================================
// NodeEditForm: 节点编辑表单
// ============================================================
function NodeEditForm({
	node,
	onSave,
	onCancel,
}: {
	node: DraftNode;
	onSave: (updates: Partial<DraftNode>) => void;
	onCancel: () => void;
}) {
	const [coreEvent, setCoreEvent] = useState(node.core_event);
	const [eventDate, setEventDate] = useState(node.event_date || '');
	const [salience, setSalience] = useState(node.salience_score);
	const [emotion, setEmotion] = useState(node.npc_state?.current_emotion || '');
	const [attitude, setAttitude] = useState(node.npc_state?.attitude_towards_user || '');
	const [openingMode, setOpeningMode] = useState(node.opening_mode || 'dialogue_driven');

	const handleSave = () => {
		onSave({
			core_event: coreEvent.trim(),
			event_date: eventDate || undefined,
			salience_score: Math.max(1, Math.min(10, salience)),
			npc_state: {
				current_emotion: emotion.trim() || '平静',
				attitude_towards_user: attitude.trim() || '中性',
			},
			opening_mode: openingMode as 'action_driven' | 'dialogue_driven',
		});
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1 block text-xs text-white/40">核心事件</label>
				<textarea
					value={coreEvent}
					onChange={(e) => setCoreEvent(e.target.value)}
					className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/10"
					rows={3}
				/>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="mb-1 block text-xs text-white/40">日期</label>
					<input
						type="date"
						value={eventDate}
						onChange={(e) => setEventDate(e.target.value)}
						className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none focus:bg-white/10"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs text-white/40">显著性 (1-10)</label>
					<input
						type="number"
						min={1}
						max={10}
						value={salience}
						onChange={(e) => setSalience(Number(e.target.value))}
						className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none focus:bg-white/10"
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="mb-1 block text-xs text-white/40">情绪</label>
					<input
						type="text"
						value={emotion}
						onChange={(e) => setEmotion(e.target.value)}
						className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none focus:bg-white/10"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs text-white/40">态度</label>
					<input
						type="text"
						value={attitude}
						onChange={(e) => setAttitude(e.target.value)}
						className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white outline-none focus:bg-white/10"
					/>
				</div>
			</div>

			<div>
				<label className="mb-1 block text-xs text-white/40">开场模式</label>
				<div className="flex gap-3">
					<button
						onClick={() => setOpeningMode('action_driven')}
						className={`flex-1 rounded-xl px-4 py-2 text-sm ${
							openingMode === 'action_driven'
								? 'bg-white/20 text-white'
								: 'bg-white/5 text-white/50 hover:bg-white/10'
						}`}
					>
						动作驱动
					</button>
					<button
						onClick={() => setOpeningMode('dialogue_driven')}
						className={`flex-1 rounded-xl px-4 py-2 text-sm ${
							openingMode === 'dialogue_driven'
								? 'bg-white/20 text-white'
								: 'bg-white/5 text-white/50 hover:bg-white/10'
						}`}
					>
						语言驱动
					</button>
				</div>
			</div>

			<div className="flex justify-end gap-2 pt-2">
				<motion.button
					onClick={onCancel}
					className="flex items-center gap-1 rounded-lg bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<X className="h-4 w-4" />
					取消
				</motion.button>
				<motion.button
					onClick={handleSave}
					className="flex items-center gap-1 rounded-lg bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/30"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<Check className="h-4 w-4" />
					保存
				</motion.button>
			</div>
		</div>
	);
}
