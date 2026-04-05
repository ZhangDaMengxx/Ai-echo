// ============================================================
// 命运抉择组件
// 描述: 拥抱遗憾 / 逆天改命 双选项 UI
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleReassemble } from './ParticleReassemble';

interface FateChoiceProps {
	isOpen: boolean
	nodeId: string
	onClose: () => void
	onComplete: (choice: 'embrace' | 'alter') => void
}

export function FateChoice({ isOpen, nodeId, onClose, onComplete }: FateChoiceProps) {
	const [selectedChoice, setSelectedChoice] = useState<'embrace' | 'alter' | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showParticleEffect, setShowParticleEffect] = useState(false);
	const [alteredChoices, setAlteredChoices] = useState('');
	const [newEnding, setNewEnding] = useState('');

	const handleSubmit = async () => {
		if (!selectedChoice || !alteredChoices.trim() || !newEnding.trim()) return;

		setIsSubmitting(true);

		try {
			const res = await fetch('/api/choice/commit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nodeId,
					choice: selectedChoice === 'alter' ? 'commit' : 'discard',
					alteredChoices: alteredChoices.trim(),
					newEnding: newEnding.trim(),
					userId: 'test-user',
				}),
			});

			if (!res.ok) {
				throw new Error('提交失败');
			}

			const data = await res.json();

			// 如果是逆天改命，播放特效
			if (selectedChoice === 'alter' && data.isCommitted) {
				setShowParticleEffect(true);
				setTimeout(() => {
					setShowParticleEffect(false);
					onComplete(selectedChoice);
					onClose();
				}, 3500);
			} else {
				onComplete(selectedChoice);
				onClose();
			}
		} catch (error) {
			console.error('提交抉择失败:', error);
			alert('提交失败，请重试');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 flex items-center justify-center"
						style={{ backgroundColor: 'rgba(10, 10, 15, 0.9)' }}
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							transition={{ type: 'spring', damping: 25 }}
							className="relative w-full max-w-2xl p-8 mx-4"
							style={{
								background: 'rgba(0, 0, 0, 0.5)',
								backdropFilter: 'blur(40px)',
								borderRadius: '24px',
								border: '1px solid rgba(255, 255, 255, 0.1)',
							}}
						>
							{/* 标题 */}
							<h2 className="text-3xl font-light text-center text-white mb-2 tracking-wider">
								命运抉择
							</h2>
							<p className="text-center text-white/50 mb-8 text-sm">
								所有线索已解锁，是时候做出选择了
							</p>

							{/* 选择区域 */}
							<div className="grid grid-cols-2 gap-6 mb-8">
								{/* 拥抱遗憾 */}
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setSelectedChoice('embrace')}
									className={`p-6 rounded-xl border transition-all duration-300 text-left ${
										selectedChoice === 'embrace'
											? 'border-blue-400/50 bg-blue-500/10'
											: 'border-white/10 bg-white/5 hover:bg-white/10'
									}`}
								>
									<div className="text-2xl mb-2">🌙</div>
									<h3 className="text-lg font-medium text-white mb-2">
										拥抱遗憾
									</h3>
									<p className="text-sm text-white/50">
										接受过去的结局，将这段记忆珍藏。不改变任何既定事实。
									</p>
								</motion.button>

								{/* 逆天改命 */}
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => setSelectedChoice('alter')}
									className={`p-6 rounded-xl border transition-all duration-300 text-left ${
										selectedChoice === 'alter'
											? 'border-purple-400/50 bg-purple-500/10'
											: 'border-white/10 bg-white/5 hover:bg-white/10'
									}`}
								>
									<div className="text-2xl mb-2">⚡</div>
									<h3 className="text-lg font-medium text-white mb-2">
										逆天改命
									</h3>
									<p className="text-sm text-white/50">
										改变历史的关键选择，推演新的结局。这将影响后续的世界线。
									</p>
								</motion.button>
							</div>

							{/* 输入区域 */}
							{selectedChoice && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="space-y-4 mb-8"
								>
									<div>
										<label className="block text-sm text-white/70 mb-2">
											你改变历史的关键选择是什么？
										</label>
										<textarea
											value={alteredChoices}
											onChange={(e) => setAlteredChoices(e.target.value)}
											placeholder="例如：如果当时我勇敢一点，说出了那句话..."
											className="w-full h-20 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30"
										/>
									</div>

									<div>
										<label className="block text-sm text-white/70 mb-2">
											{selectedChoice === 'embrace' ? '这段记忆的结局是？' : '推演的新结局是？'}
										</label>
										<textarea
											value={newEnding}
											onChange={(e) => setNewEnding(e.target.value)}
											placeholder={selectedChoice === 'embrace' ? '接受现实，继续前行...' : '在那个平行时空，事情会变得不一样...'}
											className="w-full h-20 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30"
										/>
									</div>
								</motion.div>
							)}

							{/* 按钮 */}
							<div className="flex gap-4">
								<button
									onClick={onClose}
									disabled={isSubmitting}
									className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
								>
									再想想
								</button>

								<button
									onClick={handleSubmit}
									disabled={!selectedChoice || !alteredChoices.trim() || !newEnding.trim() || isSubmitting}
									className={`flex-1 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
										selectedChoice === 'alter'
											? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
											: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
									}`}
								>
									{isSubmitting ? '提交中...' : '确认选择'}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* 粒子特效 */}
			<ParticleReassemble
				isActive={showParticleEffect}
				onComplete={() => setShowParticleEffect(false)}
			/>
		</>
	);
}
