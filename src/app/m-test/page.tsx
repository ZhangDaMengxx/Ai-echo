'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Database, ChevronLeft, Trash2, Edit2, Check, X } from 'lucide-react';
import { FluidBackground } from '@/components/FluidBackground';
import { GlassButton } from '@/components/GlassButton';
import { RadarChart } from '@/components/RadarChart';
import { TranslucentContainer } from '@/components/TranslucentContainer';
import { useTheme } from '@/components/ThemeProvider';
import { ParticleNodeTimeline, TimelineNode } from '@/components/ParticleNodeTimeline';
import { extractNodes, commitNodesLegacy, CharacterBase } from '@/lib/pipeline';

// 校准模式类型
type ViewMode = 'upload' | 'timeline' | 'detail';

// 线索类型
interface HiddenClue {
	trigger: string;
	content: string;
}

// 扩展的节点类型，包含编辑状态
interface EditableNode extends TimelineNode {
	isEditing?: boolean;
	hidden_clues?: HiddenClue[];
}

// 演示节点数据（当没有提取节点时显示）
const DEMO_NODES: EditableNode[] = [
	{
		id: 'demo-1',
		title: '初次相遇',
		description: '那个下雨的午后，我们在咖啡馆偶遇',
		event_date: '2024-01-15',
		salience_score: 9,
		core_event: '咖啡馆偶遇，她坐在窗边读着我最喜欢的书',
		npc_state: { current_emotion: '平静', attitude_towards_user: '友好' },
	},
	{
		id: 'demo-2',
		title: '深夜长谈',
		description: '第一次敞开心扉聊各自过往',
		event_date: '2024-02-20',
		salience_score: 8,
		core_event: '在公园长椅上聊到深夜，分享了各自的童年往事',
		npc_state: { current_emotion: '兴奋', attitude_towards_user: '信任' },
	},
	{
		id: 'demo-3',
		title: '误会与沉默',
		description: '一次误解让我们陷入冷战',
		event_date: '2024-04-10',
		salience_score: 7,
		core_event: '因为一条短信产生误会，连续三天没有说话',
		npc_state: { current_emotion: '郁闷', attitude_towards_user: '疏远' },
	},
	{
		id: 'demo-4',
		title: '和解',
		description: '天台上的对话化解了所有隔阂',
		event_date: '2024-04-25',
		salience_score: 8,
		core_event: '在天台上坦白彼此的真实想法，重归于好',
		npc_state: { current_emotion: '生气', attitude_towards_user: '亲近' },
	},
	{
		id: 'demo-5',
		title: '分别',
		description: '车站的背影成为最后的记忆',
		event_date: '2024-08-01',
		salience_score: 10,
		core_event: '她离开了这座城市，在车站挥手告别',
		npc_state: { current_emotion: '忧郁', attitude_towards_user: '依恋' },
	},
];

export default function MTestPage() {
	const { theme, toggleTheme } = useTheme();

	// 视图模式
	const [viewMode, setViewMode] = useState<ViewMode>('upload');

	// 节点数据
	const [nodes, setNodes] = useState<EditableNode[]>([]);
	const [selectedNode, setSelectedNode] = useState<EditableNode | null>(null);

	// 人物性格基座
	const [characterBase, setCharacterBase] = useState<CharacterBase | null>(null);

	// Pipeline 状态
	const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'done'>('idle');
	const [pipelineError, setPipelineError] = useState<string | null>(null);
	const [isCommitting, setIsCommitting] = useState(false);

	// AI 人物名称
	const [aiName, setAiName] = useState('ELARA');

	// 处理文本提取
	const handleExtract = async (text: string) => {
		setPipelineStage('extracting');
		setPipelineError(null);
		try {
			const result = await extractNodes(text);
			const extractedNodes: EditableNode[] = result.nodes.map((n) => ({
				...n,
				title: n.core_event.slice(0, 12),
				description: n.core_event,
			}));
			setNodes(extractedNodes);
			setCharacterBase(result.character_base || null);
			if (result.character_base?.name) {
				setAiName(result.character_base.name);
			}
			if (extractedNodes.length === 0) {
				setPipelineError('未能从文本中提取到有效节点');
				setPipelineStage('idle');
			} else {
				setPipelineStage('done');
				setViewMode('timeline');
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : '提取失败';
			console.error('Extract error:', err);
			setPipelineError(`提取失败: ${errorMsg}`);
			setPipelineStage('idle');
		}
	};

	// 处理文件上传
	const handleFileDrop = (files: FileList) => {
		const file = files[0];
		if (!file) return;
		if (!file.name.endsWith('.txt')) {
			setPipelineError('请上传 .txt 格式的文本文件');
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (!text || text.trim().length < 10) {
				setPipelineError('文件内容太短');
				return;
			}
			handleExtract(text);
		};
		reader.onerror = () => {
			setPipelineError('文件读取失败');
		};
		reader.readAsText(file, 'UTF-8');
	};

	// 提交入库
	const handleCommit = async () => {
		setIsCommitting(true);
		try {
			await commitNodesLegacy(nodes, characterBase || undefined);
			setViewMode('upload');
			setNodes([]);
			setPipelineStage('idle');
			setCharacterBase(null);
		} catch (err) {
			setPipelineError(err instanceof Error ? err.message : '提交失败');
		} finally {
			setIsCommitting(false);
		}
	};

	// 删除节点
	const handleDeleteNode = (nodeId: string) => {
		setNodes((prev) => prev.filter((n) => n.id !== nodeId));
		if (selectedNode?.id === nodeId) {
			setSelectedNode(null);
			setViewMode('timeline');
		}
	};

	// 保存节点编辑
	const handleSaveEdit = (nodeId: string, updates: Partial<EditableNode>) => {
		setNodes((prev) =>
			prev.map((n) => (n.id === nodeId ? { ...n, ...updates, isEditing: false } : n))
		);
		if (selectedNode?.id === nodeId) {
			setSelectedNode((prev) => (prev ? { ...prev, ...updates, isEditing: false } : null));
		}
	};

	// 点击节点
	const handleNodeClick = (node: TimelineNode) => {
		setSelectedNode(node as EditableNode);
		setViewMode('detail');
	};

	// 返回时间轴
	const backToTimeline = () => {
		setSelectedNode(null);
		setViewMode('timeline');
	};

	// 返回上传
	const backToUpload = () => {
		setViewMode('upload');
		setNodes([]);
		setPipelineStage('idle');
		setSelectedNode(null);
	};

	return (
		<div className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
			<FluidBackground
				baseColor="#0a0a0f"
				secondaryColor="#1a1f2e"
			/>

			{/* 顶部导航栏 */}
			<nav className="absolute top-0 left-0 right-0 z-50 flex justify-center items-center gap-8 pt-6">
				<GlassButton onClick={backToUpload} active={viewMode === 'upload'}>
					Memory
				</GlassButton>
				<GlassButton
					onClick={() => setViewMode('timeline')}
					active={viewMode === 'timeline' || viewMode === 'detail'}
				>
					节点时间轴
				</GlassButton>
				<div className="w-px h-6 bg-white/20 mx-2" />
				<motion.button
					onClick={toggleTheme}
					className="ml-2 px-3 py-2 rounded-full text-sm font-light tracking-wider transition-all bg-white/10 text-white hover:bg-white/20"
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					aria-label={`切换主题，当前为${theme === 'light' ? '浅色' : '深色'}模式`}
				>
					{theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
				</motion.button>
			</nav>

			<main className="relative z-10 w-full h-full pt-24">
				<AnimatePresence mode="wait">
					{/* 上传视图 */}
					{viewMode === 'upload' && (
						<motion.div
							key="upload"
							className="w-full h-full flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto pb-8"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<RadarChart
								traits={[
									{ label: '理性', value: 70 },
									{ label: '感性', value: 50 },
									{ label: '外向', value: 30 },
									{ label: '内敛', value: 80 },
									{ label: '决断', value: 60 },
									{ label: '犹豫', value: 40 },
								]}
								subjectName={aiName}
							/>

							{pipelineStage === 'idle' && (
								<TranslucentContainer
									onFileDrop={handleFileDrop}
									onPaste={handleExtract}
									placeholder="拖拽 .txt 文件或粘贴日记文本到这里..."
								/>
							)}

							{pipelineStage === 'extracting' && (
								<motion.div
									className="text-white/50 text-sm tracking-wider"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
								>
									正在提取记忆节点...
								</motion.div>
							)}

							{pipelineError && (
								<motion.div
									className="text-red-300/80 text-sm"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
								>
									错误: {pipelineError}
								</motion.div>
							)}
						</motion.div>
					)}

					{/* 时间轴视图 - 使用粒子球效果 */}
					{viewMode === 'timeline' && (
						<motion.div
							key="timeline"
							className="w-full h-full flex flex-col"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{/* 返回按钮 */}
							<div className="absolute top-24 left-6 z-20">
								<motion.button
									onClick={backToUpload}
									className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<ChevronLeft className="h-4 w-4" />
									返回上传
								</motion.button>
							</div>

							{/* 人物性格基座展示 */}
							{characterBase && (
								<motion.div
									className="absolute top-24 right-6 z-20 max-w-xs"
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
								>
									<div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
										<h3 className="mb-3 text-center text-white text-sm font-light tracking-wider">
											人物形象刻画
										</h3>
										<div className="space-y-2 text-xs">
											<div className="flex justify-between">
												<span className="text-white/40">名称:</span>
												<span className="text-white">{characterBase.name || 'ELARA'}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-white/40">风格:</span>
												<span className="text-white">{characterBase.style}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-white/40">逻辑:</span>
												<span className="text-white">{characterBase.logic}</span>
											</div>
										</div>
									</div>
								</motion.div>
							)}

							{/* 3D粒子节点时间轴 - 替换卡片式展示 */}
							<div className="flex-1 w-full h-full pt-16">
								<ParticleNodeTimeline
									nodes={nodes.length > 0 ? nodes : DEMO_NODES}
									onNodeClick={handleNodeClick}
									className="w-full h-full"
								/>
							</div>

							{/* 底部操作栏 */}
							<div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-20">
								<div className="text-sm text-white/50">
									共 <span className="text-white">{nodes.length > 0 ? nodes.length : DEMO_NODES.length}</span> 个节点
									{nodes.length === 0 && <span className="ml-2 text-white/30">(演示数据)</span>}
								</div>
								<motion.button
									onClick={handleCommit}
									disabled={nodes.length === 0 || isCommitting}
									className="flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-sm font-light tracking-wider text-white disabled:opacity-30 hover:bg-white/30"
									whileHover={{ scale: nodes.length > 0 && !isCommitting ? 1.02 : 1 }}
									whileTap={{ scale: nodes.length > 0 && !isCommitting ? 0.98 : 1 }}
								>
									<Database className="h-4 w-4" />
									{isCommitting ? '入库中...' : '确认入库'}
								</motion.button>
							</div>
						</motion.div>
					)}

					{/* 节点详情视图 */}
					{viewMode === 'detail' && selectedNode && (
						<motion.div
							key="detail"
							className="w-full h-full flex items-center justify-center px-4"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							{/* 返回按钮 */}
							<div className="absolute top-24 left-6 z-20">
								<motion.button
									onClick={backToTimeline}
									className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
								>
									<ChevronLeft className="h-4 w-4" />
									返回时间轴
								</motion.button>
							</div>

							{/* 节点详情卡片 */}
							<motion.div
								className="max-w-2xl w-full rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-8"
								initial={{ scale: 0.9, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
							>
								{selectedNode.isEditing ? (
									<NodeEditForm
										node={selectedNode}
										onSave={(updates) => handleSaveEdit(selectedNode.id, updates)}
										onCancel={() =>
											setSelectedNode({ ...selectedNode, isEditing: false })
										}
									/>
								) : (
									<>
										<div className="flex items-start justify-between mb-6">
											<div>
												<h2 className="text-2xl font-light text-white mb-2">
													{selectedNode.title}
												</h2>
												<div className="flex items-center gap-3 text-sm text-white/50">
													<span>{selectedNode.event_date || '未标注日期'}</span>
													<span>·</span>
													<span>显著性 {selectedNode.salience_score}</span>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<motion.button
													onClick={() =>
														setSelectedNode({ ...selectedNode, isEditing: true })
													}
													className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-white/10"
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
												>
													<Edit2 className="h-4 w-4" />
												</motion.button>
												<motion.button
													onClick={() => handleDeleteNode(selectedNode.id)}
													className="rounded-lg bg-white/5 p-2 text-white/50 hover:bg-red-500/20 hover:text-red-200"
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
												>
													<Trash2 className="h-4 w-4" />
												</motion.button>
											</div>
										</div>

										<div className="space-y-4">
											<div>
												<h3 className="text-xs text-white/40 mb-2">核心事件</h3>
												<p className="text-white/90 leading-relaxed">
													{selectedNode.core_event}
												</p>
											</div>

											{selectedNode.npc_state && (
												<div className="grid grid-cols-2 gap-4">
													<div className="rounded-xl bg-white/5 p-4">
														<p className="text-xs text-white/40 mb-1">当前情绪</p>
														<p className="text-white">
															{selectedNode.npc_state.current_emotion || '未知'}
														</p>
													</div>
													<div className="rounded-xl bg-white/5 p-4">
														<p className="text-xs text-white/40 mb-1">对用户的态度</p>
														<p className="text-white">
															{selectedNode.npc_state.attitude_towards_user || '未知'}
														</p>
													</div>
												</div>
												)}

											{selectedNode.hidden_clues && selectedNode.hidden_clues.length > 0 && (
												<div>
													<h3 className="text-xs text-white/40 mb-2">隐藏线索</h3>
													<div className="space-y-2">
														{selectedNode.hidden_clues.map((clue, idx) => (
															<div
																key={idx}
																className="rounded-lg bg-white/5 p-3 text-sm"
															>
																<p className="text-white/60">
																	触发: {clue.trigger}
																</p>
																<p className="text-white/40 text-xs mt-1">
																	内容: {clue.content}
																</p>
															</div>
														))}
													</div>
												</div>
												)}
										</div>
									</>
								)}
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}

// 节点编辑表单
function NodeEditForm({
	node,
	onSave,
	onCancel,
}: {
	node: EditableNode;
	onSave: (updates: Partial<EditableNode>) => void;
	onCancel: () => void;
}) {
	const [coreEvent, setCoreEvent] = useState(node.core_event);
	const [eventDate, setEventDate] = useState(node.event_date || '');
	const [salience, setSalience] = useState(node.salience_score);
	const [emotion, setEmotion] = useState(node.npc_state?.current_emotion || '');
	const [attitude, setAttitude] = useState(node.npc_state?.attitude_towards_user || '');

	const handleSave = () => {
		onSave({
			core_event: coreEvent.trim(),
			title: coreEvent.trim().slice(0, 12),
			description: coreEvent.trim(),
			event_date: eventDate || undefined,
			salience_score: Math.max(1, Math.min(10, salience)),
			npc_state: {
				current_emotion: emotion.trim() || '平静',
				attitude_towards_user: attitude.trim() || '中性',
			},
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
