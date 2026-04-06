// ============================================================
// Create Page: 人物创建流程页面
// Step 1: 心理学测试 → Step 2: 人物设定 → Step 3: 节点确认 → Step 4: 成功
//
// 文件位置: src/app/create/page.tsx
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StepIndicator } from '@/components/StepIndicator';
import { PersonalityTest } from '@/components/PersonalityTest';
import { ProfileSetup } from '@/components/ProfileSetup';
import { CreateSuccess } from '@/components/CreateSuccess';
import { PipelineCalibration, DraftNode } from '@/components/PipelineCalibration';
import { extractNodes, commitNodes, CharacterBase } from '@/lib/pipeline';
import { generateProfileFromAnswers } from '@/lib/personalityTest';
import { localDb } from '@/lib/localDb';
import type { PersonalityAnswer } from '@/types/character';

type CreateStep = 'test' | 'profile' | 'nodes' | 'success';

const STEPS = ['性格测试', '人物设定', '节点确认', '创建成功'];

export default function CreatePage() {
	const [currentStep, setCurrentStep] = useState<CreateStep>('test');
	const stepIndex = STEPS.indexOf(
		currentStep === 'test' ? '性格测试' :
		currentStep === 'profile' ? '人物设定' :
		currentStep === 'nodes' ? '节点确认' : '创建成功'
	) + 1;
	
	const [testAnswers, setTestAnswers] = useState<PersonalityAnswer[]>([]);
	const [profileData, setProfileData] = useState<{
		name: string;
		avatar: string;
		file?: File;
		extractedText?: string;
	} | null>(null);
	
	const [draftNodes, setDraftNodes] = useState<DraftNode[]>([]);
	const [characterBase, setCharacterBase] = useState<CharacterBase | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState('');
	const [isCommitting, setIsCommitting] = useState(false);
	
	const [createdCharacter, setCreatedCharacter] = useState<{
		id: string;
		name: string;
		avatar: string;
	} | null>(null);
	const [generatedProfile, setGeneratedProfile] = useState<{
		style: string;
		logic: string;
		dominant_emotions: string[];
	} | null>(null);
	
	const handleTestComplete = (answers: PersonalityAnswer[]) => {
		setTestAnswers(answers);
		setCurrentStep('profile');
	};
	
	const handleTestSkip = () => {
		setTestAnswers([]);
		setCurrentStep('profile');
	};
	
	const handleProfileNext = async (data: {
		name: string;
		avatar: string;
		file?: File;
		extractedText?: string;
	}) => {
		setProfileData(data);
		
		if (data.extractedText && data.extractedText.trim().length > 10) {
			setIsExtracting(true);
			setExtractError('');
			
			try {
				const result = await extractNodes(data.extractedText);
				setDraftNodes(result.nodes);
				setCharacterBase(result.character_base || null);
				setCurrentStep('nodes');
			} catch (err) {
				setExtractError(err instanceof Error ? err.message : '提取失败');
			} finally {
				setIsExtracting(false);
			}
		} else {
			handleCreateCharacter([]);
		}
	};
	
	const handleProfileBack = () => {
		setCurrentStep('test');
	};
	
	const handleCreateCharacter = async (nodes: DraftNode[]) => {
		if (!profileData) return;
		
		setIsCommitting(true);
		
		try {
			const profile = testAnswers.length > 0
				? generateProfileFromAnswers(profileData.name, testAnswers)
				: null;
			
			const character = await localDb.createCharacter({
				name: profileData.name,
				avatar: profileData.avatar,
				description: profile?.summary || ''
			});
			
			if (profile) {
				await localDb.updateProfileByCharacter(character.id, {
					...profile,
					global_vibe: 'neutral'
				});
			}
			
			if (nodes.length > 0) {
				await commitNodes(character.id, nodes, characterBase || undefined);
			}
			
			setCreatedCharacter({
				id: character.id,
				name: character.name,
				avatar: character.avatar || '👤'
			});
			
			setGeneratedProfile({
				style: profile?.style || '温和平衡',
				logic: profile?.logic || '理性感性并重',
				dominant_emotions: profile?.dominant_emotions || ['平静']
			});
			
			setCurrentStep('success');
		} catch (err) {
			console.error('创建人物失败:', err);
			setExtractError(err instanceof Error ? err.message : '创建失败');
		} finally {
			setIsCommitting(false);
		}
	};
	
	const handleViewDetail = () => {
		if (createdCharacter) {
			window.location.href = '/';
		}
	};
	
	const handleEnterStory = () => {
		if (createdCharacter) {
			localStorage.setItem('echo-tracks-current-character', createdCharacter.id);
			window.location.href = '/story';
		}
	};
	
	return (
		<div className="fixed inset-0 overflow-hidden bg-[#0a0a0f]">
			{/* 顶部导航 */}
			<nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6">
				<Link href="/">
					<motion.button
						className="p-2 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<ArrowLeft className="w-5 h-5" />
					</motion.button>
				</Link>
				
				<h1 className="text-white text-lg font-light tracking-wider">
					创建新人物
				</h1>
				
				<div className="w-10" />
			</nav>
			
			{/* 主内容 */}
			<main className="relative z-10 w-full h-full pt-20 sm:pt-24 pb-8 px-4 sm:px-6 overflow-y-auto">
				<div className="max-w-3xl mx-auto">
					{/* 步骤指示器 */}
					<div className="mb-8 sm:mb-12 overflow-x-auto pb-2">
						<StepIndicator currentStep={stepIndex} steps={STEPS} />
					</div>
					
					{/* 步骤内容 */}
					<AnimatePresence mode="wait">
						{currentStep === 'test' && (
							<motion.div
								key="test"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
							>
								<PersonalityTest
									onComplete={handleTestComplete}
									onSkip={handleTestSkip}
								/>
							</motion.div>
						)}
						
						{currentStep === 'profile' && (
							<motion.div
								key="profile"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
							>
								{isExtracting ? (
									<div className="text-center py-20">
										<div className="text-white/60 text-sm">正在提取记忆节点...</div>
									</div>
								) : (
									<ProfileSetup
										onNext={handleProfileNext}
										onBack={handleProfileBack}
									/>
								)}
								{extractError && (
									<div className="mt-4 text-red-300/80 text-sm text-center">
										{extractError}
									</div>
								)}
							</motion.div>
						)}
						
						{currentStep === 'nodes' && (
							<motion.div
								key="nodes"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								className="space-y-6"
							>
								<div className="text-center mb-6">
									<h2 className="text-white text-lg font-light tracking-wider mb-2">
										提取记忆节点
									</h2>
									<p className="text-white/40 text-xs">
										从上传的文件中提取到以下关键节点，你可以编辑或删除不合适的节点
									</p>
								</div>
								
								{characterBase && (
									<div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
										<h3 className="text-white/60 text-sm mb-4">人物形象刻画</h3>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<span className="text-white/40">表达风格:</span>
												<span className="text-white ml-2">{characterBase.style}</span>
											</div>
											<div>
												<span className="text-white/40">情感逻辑:</span>
												<span className="text-white ml-2">{characterBase.logic}</span>
											</div>
										</div>
									</div>
								)}
								
								<PipelineCalibration
									draftNodes={draftNodes}
									onChange={setDraftNodes}
									onCommit={handleCreateCharacter}
									isLoading={isCommitting}
								/>
							</motion.div>
						)}
						
						{currentStep === 'success' && createdCharacter && generatedProfile && (
							<motion.div
								key="success"
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
							>
								<CreateSuccess
									character={createdCharacter}
									profile={generatedProfile}
									onViewDetail={handleViewDetail}
									onEnterStory={handleEnterStory}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</main>
		</div>
	);
}
