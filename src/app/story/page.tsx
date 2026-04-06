// ============================================================
// Story Page: Story/Dialogue 主页面
// 原有 page.tsx 功能迁移至此，用于单个人物的 Story 展示和对话
//
// 文件位置: src/app/story/page.tsx
// 主要依赖: StoryCarousel, AIDialog, RadarChart, PipelineCalibration
//
// 维护记录:
//   - 2026-04-06: 从 page.tsx 迁移，添加人物隔离支持
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { FluidBackground } from '@/components/FluidBackground';
import { GlassButton } from '@/components/GlassButton';
import { RadarChart } from '@/components/RadarChart';
import { TranslucentContainer } from '@/components/TranslucentContainer';
import { StoryCarousel } from '@/components/StoryCarousel';
import { AIDialog } from '@/components/AIDialog';
import { UserInput } from '@/components/UserInput';
import { DialogueTags } from '@/components/DialogueTags';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { PipelineCalibration, DraftNode } from '@/components/PipelineCalibration';
import { FateChoice } from '@/components/FateChoice';
import { NodePreview } from '@/components/NodePreview';
import { extractNodes, commitNodes, commitNodesLegacy, CharacterBase } from '@/lib/pipeline';
import { fetchNode, sendChatMessage, ChatMessage } from '@/lib/chat';
import { localDb } from '@/lib/localDb';
import { useCurrentCharacter } from '@/hooks/useCurrentCharacter';
import { CharacterSwitcher } from '@/components/CharacterSwitcher';

type PageType = 'memory' | 'story' | 'dialogue';

const mockNodes = [
	{ id: '1', title: '初遇', date: '2024-01-15', description: '那个下雨的午后' },
	{ id: '2', title: '误会', date: '2024-03-20', description: '沉默的晚餐' },
	{ id: '3', title: '和解', date: '2024-06-10', description: '天台上的对话' },
	{ id: '4', title: '离别', date: '2024-09-01', description: '车站的背影' },
	{ id: '5', title: '重逢', date: '2024-12-25', description: '命运的安排' },
];

const dialogueTags = [
	{ id: '1', label: '询问过去', hint: '了解对方的过去经历' },
	{ id: '2', label: '表达关心', hint: '展示你的关心和体贴' },
	{ id: '3', label: '分享秘密', hint: '分享一个深藏的秘密' },
	{ id: '4', label: '提出疑问', hint: '对当前情况提出疑问' },
	{ id: '5', label: '安慰对方', hint: '给予情感上的安慰' },
	{ id: '6', label: '改变话题', hint: '将话题引向新的方向' },
];

export default function StoryPage() {
	const [currentPage, setCurrentPage] = useState<PageType>('memory');
	const [emotion, setEmotion] = useState<'calm' | 'angry'>('calm');
	const { theme, toggleTheme } = useTheme();
	
	// 当前人物
	const { character, isLoading: charLoading } = useCurrentCharacter();

	// Story 页面状态
	const [storyNodes, setStoryNodes] = useState(mockNodes);
	const [, setStoryLoading] = useState(false);

	// Dialogue 页面状态
	const [, setActiveNodeId] = useState<string | null>(null);
	const [activeNodeData, setActiveNodeData] = useState<{
		core_event: string
		npc_state?: { current_emotion?: string; attitude_towards_user?: string }
		memory_source?: string
		opening_mode?: string
	} | null>(null);
	const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
	const [chatLoading, setChatLoading] = useState(false);
	const [availableClues, setAvailableClues] = useState<Array<{ clue_id: string; trigger_condition: string; clue_content: string }>>([]);

	// 命运抉择状态
	const [showFateChoice, setShowFateChoice] = useState(false);
	const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

	// 节点预览状态
	const [showNodePreview, setShowNodePreview] = useState(false);
	const [previewNode, setPreviewNode] = useState<{ id: string; title: string; date: string; description?: string; emotion?: string; salienceScore?: number } | null>(null);

	// Pipeline 校准状态
	const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
	const [characterBase, setCharacterBase] = useState<CharacterBase | null>(null);
	const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'calibrating' | 'committing' | 'done'>('idle');
	const [pipelineError, setPipelineError] = useState<string | null>(null);
	const [isCommitting, setIsCommitting] = useState(false);

	// AI 人物名称
	const [aiName, setAiName] = useState('ELARA');

	// 页面加载时从当前人物获取名称
	useEffect(() => {
		if (character?.name) {
			setAiName(character.name);
		}
	}, [character]);

	// 节点详情缓存
	const [nodeDetailsMap, setNodeDetailsMap] = useState<Record<string, {
		core_event: string
		npc_state?: { current_emotion?: string; attitude_towards_user?: string }
		memory_source?: string
		opening_mode?: string
	}>>({});

	// 加载 Story 节点（按当前人物过滤）
	const loadStoryNodes = async (): Promise<boolean> => {
		if (!character) return false;
		
		setStoryLoading(true);
		try {
			const nodes = await localDb.getNodesByCharacter(character.id);
			if (nodes.length > 0) {
				const mapped = nodes.map((n) => ({
					id: n.node_id,
					title: n.core_event?.slice(0, 10) || '未命名',
					date: n.event_date,
					description: n.core_event,
					emotion: n.npc_state?.current_emotion || '平静',
					salienceScore: n.salience_score,
				}));
				setStoryNodes(mapped);
				const details: Record<string, typeof nodeDetailsMap[string]> = {};
				nodes.forEach((n) => {
					details[n.node_id] = {
						core_event: n.core_event,
						npc_state: n.npc_state,
						memory_source: n.memory_source,
						opening_mode: n.opening_mode,
					};
				});
				setNodeDetailsMap(details);
				return true;
			}
			return false;
		} catch (err) {
			console.error('Load story nodes failed:', err);
			return false;
		} finally {
			setStoryLoading(false);
		}
	};

	// 加载节点详情并生成开场白
	const loadNodeAndStartChat = async (nodeId: string) => {
		setActiveNodeId(nodeId);
		setCurrentNodeId(nodeId);
		setShowFateChoice(false);
		setCurrentPage('dialogue');
		setChatLoading(true);

		try {
			const { node, clues } = await fetchNode(nodeId);
			setActiveNodeData(node);
			setAvailableClues(clues || []);

			const { reply } = await sendChatMessage({
				message: '开始对话',
				conversationHistory: [],
				availableClues: clues || [],
				nodeData: node,
				isFirstRound: true,
			});

			setAiMessages([
				{ id: '1', role: 'system', content: `*${node.npc_state?.current_emotion || '平静'}*` },
				{ id: '2', role: 'assistant', content: reply },
			]);
		} catch {
			const cachedNode = nodeDetailsMap[nodeId];
			if (cachedNode) {
				setActiveNodeData(cachedNode);
				setAvailableClues([]);
				try {
					const { reply } = await sendChatMessage({
						message: '开始对话',
						conversationHistory: [],
						availableClues: [],
						nodeData: cachedNode,
						isFirstRound: true,
					});
					setAiMessages([
						{ id: '1', role: 'system', content: `*${cachedNode.npc_state?.current_emotion || '平静'}*` },
						{ id: '2', role: 'assistant', content: reply },
					]);
				} catch {
					setAiMessages([
						{ id: '1', role: 'system', content: `*${cachedNode.npc_state?.current_emotion || '平静'}*` },
						{ id: '2', role: 'assistant', content: cachedNode.core_event || '...你又来了。' },
					]);
				}
			} else {
				const mockNode = mockNodes.find((n) => n.id === nodeId);
				if (mockNode) {
					const localNodeData = {
						core_event: mockNode.title,
						npc_state: { current_emotion: '平静', attitude_towards_user: '中性' },
						memory_source: 'txt_extraction',
						opening_mode: 'dialogue_driven',
					};
					setActiveNodeData(localNodeData);
					setAvailableClues([]);
					setAiMessages([
						{ id: '1', role: 'system', content: `*${localNodeData.npc_state.current_emotion}*` },
						{ id: '2', role: 'assistant', content: mockNode.description || '...你又来了。' },
					]);
				} else {
					const fallbackNodeData = {
						core_event: '回忆片段',
						npc_state: { current_emotion: '平静', attitude_towards_user: '中性' },
						memory_source: 'txt_extraction',
						opening_mode: 'dialogue_driven',
					};
					setActiveNodeData(fallbackNodeData);
					setAvailableClues([]);
					setAiMessages([
						{ id: '1', role: 'system', content: '*他静静地坐着，肩膀还带着外场淋雨后的水渍。*' },
						{ id: '2', role: 'assistant', content: '...你又来了。' },
					]);
				}
			}
		} finally {
			setChatLoading(false);
		}
	};

	const handleExtract = async (text: string) => {
		setPipelineStage('extracting');
		setPipelineError(null);
		try {
			const result = await extractNodes(text);
			setDraftNodes(result.nodes);
			setCharacterBase(result.character_base || null);
			if (result.character_base?.name) {
				setAiName(result.character_base.name);
			}
			if (result.nodes.length === 0) {
				setPipelineError('未能从文本中提取到有效节点，请尝试粘贴更多内容');
				setPipelineStage('idle');
			} else {
				setPipelineStage('calibrating');
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : '提取失败';
			console.error('Extract error:', err);
			setPipelineError(`提取失败: ${errorMsg}。请检查：1.后端服务是否启动 2.网络连接 3.API配置`);
			setPipelineStage('idle');
		}
	};

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
				setPipelineError('文件内容太短，请上传包含足够文字的日记');
				return;
			}
			handleExtract(text);
		};

		reader.onerror = () => {
			setPipelineError('文件读取失败，请检查文件是否损坏');
		};

		reader.readAsText(file, 'UTF-8');
	};

	const handleCommit = async (nodes: DraftNode[]) => {
		if (!character) return;
		
		setIsCommitting(true);
		setPipelineStage('committing');
		setPipelineError(null);
		try {
			await commitNodes(character.id, nodes, characterBase || undefined);
			setPipelineStage('done');
			await loadStoryNodes();
			setTimeout(() => {
				setPipelineStage('idle');
				setDraftNodes([]);
				setCharacterBase(null);
				setIsCommitting(false);
			}, 2000);
		} catch (err) {
			setPipelineError(err instanceof Error ? err.message : '提交失败');
			setPipelineStage('calibrating');
			setIsCommitting(false);
		}
	};

	const handleSend = async (text: string) => {
		if (!activeNodeData) return;

		const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
		setAiMessages((prev) => [...prev, userMsg]);
		setChatLoading(true);

		try {
			const { reply, unlockedClues } = await sendChatMessage({
				message: text,
				conversationHistory: aiMessages,
				availableClues,
				nodeData: activeNodeData,
				isFirstRound: false,
			});

			setAiMessages((prev) => [
				...prev,
				{ id: (Date.now() + 1).toString(), role: 'assistant', content: reply },
			]);

			if (unlockedClues.length > 0) {
				setAvailableClues((prev) => {
					const remaining = prev.filter((c) => !unlockedClues.includes(c.clue_id));
					if (remaining.length === 0 && prev.length > 0) {
						setTimeout(() => setShowFateChoice(true), 1000);
					}
					return remaining;
				});
			}
		} catch {
			setAiMessages((prev) => [
				...prev,
				{ id: (Date.now() + 1).toString(), role: 'assistant', content: '...（没有回应）' },
			]);
		} finally {
			setChatLoading(false);
		}
	};

	const handleTagClick = (tag: { id: string; label: string; hint: string }) => {
		setAiMessages((prev) => [
			...prev,
			{ id: Date.now().toString(), role: 'assistant', content: `*对${tag.label}的话题有所反应*` },
		]);
	};

	const handleNodeClick = (node: { id: string; title?: string; description?: string; date?: string; emotion?: string; salienceScore?: number }) => {
		setPreviewNode({
			id: node.id,
			title: node.title || '未命名',
			date: node.date || '',
			description: node.description,
			emotion: node.emotion,
			salienceScore: node.salienceScore,
		});
		setShowNodePreview(true);
	};

	const handlePreviewConfirm = () => {
		if (previewNode) {
			setShowNodePreview(false);
			loadNodeAndStartChat(previewNode.id);
		}
	};

	const handlePreviewCancel = () => {
		setShowNodePreview(false);
		setPreviewNode(null);
	};

	// 加载中状态
	if (charLoading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0f]">
				<div className="text-white/40 text-sm">加载人物...</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
			<FluidBackground emotion={emotion} baseColor="#0a0a0f" secondaryColor={emotion === 'angry' ? '#3a1f1f' : '#1a1f2e'} turbulence={emotion === 'angry' ? 0.5 : 0.1} />

			{/* 顶部导航栏 */}
			<nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
				{/* 左侧：返回 + 人物切换 */}
				<div className="flex items-center gap-3">
					<Link href="/">
						<motion.button
							className="p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<ArrowLeft className="w-5 h-5" />
						</motion.button>
					</Link>
					<CharacterSwitcher currentCharacterId={character?.id} />
				</div>
				
				{/* 中间：页面切换 */}
				<div className="hidden sm:flex items-center gap-4">
					<GlassButton onClick={() => setCurrentPage('memory')} active={currentPage === 'memory'}>Memory</GlassButton>
					<GlassButton onClick={() => { setCurrentPage('story'); loadStoryNodes(); }} active={currentPage === 'story'}>Story</GlassButton>
					<GlassButton onClick={() => setCurrentPage('dialogue')} active={currentPage === 'dialogue'}>Dialogue</GlassButton>
				</div>
				
				{/* 右侧：情绪和主题 */}
				<div className="flex items-center gap-2">
					<div className="hidden sm:flex items-center gap-2">
						<div className="w-px h-6 bg-white/20 mx-1" />
						<motion.button onClick={() => setEmotion('calm')} className={`px-3 py-2 rounded-full text-xs sm:text-sm font-light tracking-wider transition-all ${emotion === 'calm' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>平静</motion.button>
						<motion.button onClick={() => setEmotion('angry')} className={`px-3 py-2 rounded-full text-xs sm:text-sm font-light tracking-wider transition-all ${emotion === 'angry' ? 'bg-red-500/30 text-red-100' : 'bg-red-500/10 text-red-300/50 hover:bg-red-500/20'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>愤怒</motion.button>
					</div>
					<motion.button
						onClick={toggleTheme}
						className="p-2 rounded-full text-white/70 hover:bg-white/10 transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label={`切换主题，当前为${theme === 'light' ? '浅色' : '深色'}模式`}
					>
						{theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</motion.button>
				</div>
			</nav>
			
			{/* 移动端页面切换 */}
			<div className="sm:hidden absolute top-16 left-0 right-0 z-40 flex justify-center gap-2 px-4">
				<GlassButton onClick={() => setCurrentPage('memory')} active={currentPage === 'memory'}>Memory</GlassButton>
				<GlassButton onClick={() => { setCurrentPage('story'); loadStoryNodes(); }} active={currentPage === 'story'}>Story</GlassButton>
				<GlassButton onClick={() => setCurrentPage('dialogue')} active={currentPage === 'dialogue'}>Dialogue</GlassButton>
			</div>

			<main className="relative z-10 w-full h-full pt-24">
				<AnimatePresence mode="wait">
					{currentPage === 'memory' && (
						<motion.div key="memory" className="w-full h-full flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							{/* 当前人物显示 */}
							<div className="text-center mb-4">
								<p className="text-white/40 text-xs tracking-wider mb-1">当前人物</p>
								<h2 className="text-white text-xl font-light tracking-[0.2em]">{aiName}</h2>
							</div>
							
							<RadarChart traits={[{ label: '理性', value: 70 }, { label: '感性', value: 50 }, { label: '外向', value: 30 }, { label: '内敛', value: 80 }, { label: '决断', value: 60 }, { label: '犹豫', value: 40 }]} subjectName={aiName} />

							{pipelineStage === 'idle' && (
								<TranslucentContainer
									onFileDrop={handleFileDrop}
									onPaste={handleExtract}
									placeholder="拖拽 .txt 文件或粘贴日记文本到这里..."
								/>
							)}

							{pipelineStage === 'extracting' && (
								<motion.div className="text-white/50 text-sm tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									正在提取记忆节点...
								</motion.div>
							)}

							{pipelineStage === 'calibrating' && (
								<motion.div className="w-full max-w-4xl space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
									{characterBase && (
										<div className="rounded-2xl border border-white/10 bg-white/5 p-6">
											<h3 className="mb-4 text-center text-white text-lg font-light tracking-wider">人物形象刻画</h3>
											<div className="grid grid-cols-2 gap-4 mb-4">
												<div className="rounded-xl bg-white/5 p-4">
													<p className="text-white/40 text-xs mb-1">表达风格</p>
													<p className="text-white text-lg font-light">{characterBase.style}</p>
												</div>
												<div className="rounded-xl bg-white/5 p-4">
													<p className="text-white/40 text-xs mb-1">情感逻辑</p>
													<p className="text-white text-lg font-light">{characterBase.logic}</p>
												</div>
											</div>
											<div className="rounded-xl bg-white/5 p-4 mb-4">
												<p className="text-white/40 text-xs mb-1">AI 人物名称</p>
												<p className="text-white text-lg font-light">{characterBase.name || 'ELARA'}</p>
											</div>
											<div className="space-y-2 text-sm text-white/60">
												<p><span className="text-white/40">主要情绪：</span>{characterBase.dominant_emotions.join('、') || '暂无数据'}</p>
												<p><span className="text-white/40">核心态度：</span>{characterBase.dominant_attitudes.join('、') || '暂无数据'}</p>
											</div>
											<p className="mt-4 text-xs text-white/40 leading-relaxed">{characterBase.summary}</p>
										</div>
									)}

									<div className="mb-4 text-center">
										<h3 className="text-white text-lg font-light tracking-wider">校准提取结果</h3>
										<p className="text-white/40 text-xs mt-1">删除低质量节点、编辑细节、补充遗漏记忆</p>
									</div>
									<PipelineCalibration
										draftNodes={draftNodes}
										onChange={setDraftNodes}
										onCommit={handleCommit}
										isLoading={isCommitting}
									/>
								</motion.div>
							)}

							{pipelineStage === 'committing' && (
								<motion.div className="text-white/50 text-sm tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									正在写入数据库...
								</motion.div>
							)}

							{pipelineStage === 'done' && (
								<motion.div className="text-white text-sm tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									✓ 记忆节点已成功归档
								</motion.div>
							)}

							{pipelineError && (
								<motion.div className="text-red-300/80 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
									错误: {pipelineError}
								</motion.div>
							)}
						</motion.div>
					)}
					{currentPage === 'story' && (
						<motion.div key="story" className="w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<StoryCarousel nodes={storyNodes} onNodeClick={handleNodeClick} subjectName={aiName} />
							<NodePreview
								node={previewNode}
								isOpen={showNodePreview}
								onConfirm={handlePreviewConfirm}
								onCancel={handlePreviewCancel}
								subjectName={aiName}
							/>
						</motion.div>
					)}
					{currentPage === 'dialogue' && (
						<motion.div key="dialogue" className="w-full h-full flex flex-col items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<motion.div className="mb-6 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
								<h2 className="text-white/40 text-xs tracking-[0.4em] mb-1">SUBJECT</h2>
								<h1 className="text-white text-3xl font-extralight tracking-[0.3em]">{aiName}</h1>
								<h2 className="text-white/60 text-sm font-light tracking-wider mt-1">{activeNodeData?.core_event?.slice(0, 12) || '回忆片段'}</h2>
								{activeNodeData?.npc_state && (
									<div className="mt-2 text-xs text-white/40">
										<span>{activeNodeData.npc_state.current_emotion || '平静'}</span>
										{activeNodeData.npc_state.attitude_towards_user && (
											<span> · {activeNodeData.npc_state.attitude_towards_user}</span>
										)}
									</div>
								)}
							</motion.div>
							<div className="relative flex justify-center items-center">
								<DialogueTags tags={dialogueTags} onTagClick={handleTagClick} />
								<AIDialog messages={aiMessages.filter((m) => m.role !== 'user') as Array<{ id: string; role: 'system' | 'assistant'; content: string }>} />
							</div>
							<motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
								<UserInput onSend={handleSend} disabled={chatLoading} />
							</motion.div>

							<FateChoice
								isOpen={showFateChoice}
								nodeId={currentNodeId || ''}
								onClose={() => setShowFateChoice(false)}
								onComplete={(choice) => {
									console.log('用户选择:', choice);
									setCurrentPage('story');
								}}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}
