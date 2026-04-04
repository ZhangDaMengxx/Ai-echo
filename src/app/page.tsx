'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { FluidBackground } from '@/components/FluidBackground';
import { GlassButton } from '@/components/GlassButton';
import { RadarChart } from '@/components/RadarChart';
import { TranslucentContainer } from '@/components/TranslucentContainer';
import { StoryCarousel } from '@/components/StoryCarousel';
import { AIDialog } from '@/components/AIDialog';
import { UserInput } from '@/components/UserInput';
import { DialogueTags } from '@/components/DialogueTags';
import { useTheme } from '@/components/ThemeProvider';
import { PipelineCalibration, DraftNode } from '@/components/PipelineCalibration';
import { extractNodes, commitNodes } from '@/lib/pipeline';

type PageType = 'memory' | 'story' | 'dialogue';

const memoryNodes = [
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

export default function TestPage() {
	const [currentPage, setCurrentPage] = useState<PageType>('memory');
	const [emotion, setEmotion] = useState<'calm' | 'angry'>('calm');
	const [aiMessages, setAiMessages] = useState([
		{ id: '1', role: 'system' as const, content: '*他静静地坐着，肩膀还带着外场淋雨后的水渍。*' },
		{ id: '2', role: 'assistant' as const, content: '...你又来了。' },
	]);
	const { theme, toggleTheme } = useTheme();

	// Pipeline 校准状态
	const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
	const [pipelineStage, setPipelineStage] = useState<'idle' | 'extracting' | 'calibrating' | 'committing' | 'done'>('idle');
	const [pipelineError, setPipelineError] = useState<string | null>(null);
	const [isCommitting, setIsCommitting] = useState(false);

	const handleExtract = async (text: string) => {
		setPipelineStage('extracting');
		setPipelineError(null);
		try {
			const result = await extractNodes(text);
			setDraftNodes(result.nodes);
			setPipelineStage(result.nodes.length > 0 ? 'calibrating' : 'idle');
		} catch (err) {
			setPipelineError(err instanceof Error ? err.message : '提取失败');
			setPipelineStage('idle');
		}
	};

	const handleFileDrop = (files: FileList) => {
		const file = files[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (text) handleExtract(text);
		};
		reader.readAsText(file);
	};

	const handleCommit = async (nodes: DraftNode[]) => {
		setIsCommitting(true);
		setPipelineStage('committing');
		setPipelineError(null);
		try {
			await commitNodes(nodes);
			setPipelineStage('done');
			setTimeout(() => {
				setPipelineStage('idle');
				setDraftNodes([]);
				setIsCommitting(false);
			}, 2000);
		} catch (err) {
			setPipelineError(err instanceof Error ? err.message : '提交失败');
			setPipelineStage('calibrating');
			setIsCommitting(false);
		}
	};

	const handleSend = (text: string) => {
		setAiMessages((prev) => [
			...prev,
			{ id: Date.now().toString(), role: 'assistant', content: `...${text}？让我想想。` },
		]);
	};

	const handleTagClick = (tag: { id: string; label: string; hint: string }) => {
		setAiMessages((prev) => [
			...prev,
			{ id: Date.now().toString(), role: 'assistant', content: `*对${tag.label}的话题有所反应*` },
		]);
	};

	const handleNodeClick = () => {
		setCurrentPage('dialogue');
	};

	const handleNavigateToDialogue = () => {
		setCurrentPage('dialogue');
	};

	return (
		<div className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
			<FluidBackground emotion={emotion} baseColor="#0a0a0f" secondaryColor={emotion === 'angry' ? '#3a1f1f' : '#1a1f2e'} turbulence={emotion === 'angry' ? 0.5 : 0.1} />

			{/* 顶部导航栏 - 居中在正上方 */}
			<nav className="absolute top-0 left-0 right-0 z-50 flex justify-center items-center gap-8 pt-6">
				<GlassButton onClick={() => setCurrentPage('memory')} active={currentPage === 'memory'}>Memory</GlassButton>
				<GlassButton onClick={() => setCurrentPage('story')} active={currentPage === 'story'}>Story</GlassButton>
				<GlassButton onClick={() => setCurrentPage('dialogue')} active={currentPage === 'dialogue'}>Dialogue</GlassButton>
				<div className="w-px h-6 bg-white/20 mx-2" />
				<motion.button onClick={() => setEmotion('calm')} className={`px-4 py-2 rounded-full text-sm font-light tracking-wider transition-all ${emotion === 'calm' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>平静</motion.button>
				<motion.button onClick={() => setEmotion('angry')} className={`px-4 py-2 rounded-full text-sm font-light tracking-wider transition-all ${emotion === 'angry' ? 'bg-red-500/30 text-red-100' : 'bg-red-500/10 text-red-300/50 hover:bg-red-500/20'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>愤怒</motion.button>
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
					{currentPage === 'memory' && (
						<motion.div key="memory" className="w-full h-full flex flex-col items-center justify-center gap-6 px-4 overflow-y-auto pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<RadarChart traits={[{ label: '理性', value: 70 }, { label: '感性', value: 50 }, { label: '外向', value: 30 }, { label: '内敛', value: 80 }, { label: '决断', value: 60 }, { label: '犹豫', value: 40 }]} subjectName="ELARA" />

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
								<motion.div className="w-full max-w-4xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
							<StoryCarousel nodes={memoryNodes} onNodeClick={handleNodeClick} onNavigateToDialogue={handleNavigateToDialogue} subjectName="ELARA" />
						</motion.div>
					)}
					{currentPage === 'dialogue' && (
						<motion.div key="dialogue" className="w-full h-full flex flex-col items-center justify-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
							<motion.div className="mb-6 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
								<h2 className="text-white/40 text-xs tracking-[0.4em] mb-1">SUBJECT</h2>
								<h1 className="text-white text-3xl font-extralight tracking-[0.3em]">ELARA</h1>
							</motion.div>
							<div className="relative flex justify-center items-center">
								<DialogueTags tags={dialogueTags} onTagClick={handleTagClick} />
								<AIDialog messages={aiMessages} characterName="ELARA" />
							</div>
							<motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
								<UserInput onSend={handleSend} />
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}
