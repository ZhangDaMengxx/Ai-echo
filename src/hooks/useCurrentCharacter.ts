// ============================================================
// useCurrentCharacter: 当前人物状态管理
// 描述: 使用React Context + localStorage管理当前活跃人物
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { localDb } from '@/lib/localDb';
import type { Character } from '@/types/character';

const STORAGE_KEY = 'echo-tracks-current-character';

/**
 * 从localStorage获取当前人物ID
 */
function getStoredCharacterId(): string | null {
	if (typeof window === 'undefined') return null;
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

/**
 * 保存当前人物ID到localStorage
 */
function setStoredCharacterId(id: string | null): void {
	if (typeof window === 'undefined') return;
	try {
		if (id) {
			localStorage.setItem(STORAGE_KEY, id);
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// 忽略存储错误
	}
}

/**
 * 获取当前人物的Hook（包含自动初始化）
 */
export function useCurrentCharacter(): {
	character: Character | null;
	isLoading: boolean;
	error: Error | null;
	setCurrentCharacter: (id: string) => void;
	refresh: () => Promise<void>;
} {
	const [character, setCharacter] = useState<Character | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadCharacter = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			let charId = getStoredCharacterId();

			// 如果没有当前人物，获取默认人物
			if (!charId) {
				const chars = await localDb.getAllCharacters();
				if (chars.length > 0) {
					// 优先使用默认人物，否则用第一个
					const defaultChar = chars.find(c => c.isDefault) || chars[0];
					charId = defaultChar.id;
					setStoredCharacterId(charId);
				}
			}

			if (charId) {
				const char = await localDb.getCharacterById(charId);
				setCharacter(char);
			} else {
				// 没有人物时创建默认人物
				const newChar = await localDb.createCharacter({
					name: 'ELARA',
					description: '默认人物'
				});
				await localDb.setDefaultCharacter(newChar.id);
				setStoredCharacterId(newChar.id);
				setCharacter(newChar);
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error('加载人物失败'));
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setCurrentCharacter = useCallback((id: string) => {
		setStoredCharacterId(id);
		// 立即更新状态
		localDb.getCharacterById(id).then(char => {
			setCharacter(char);
		});
	}, []);

	useEffect(() => {
		loadCharacter();
	}, [loadCharacter]);

	return {
		character,
		isLoading,
		error,
		setCurrentCharacter,
		refresh: loadCharacter
	};
}

/**
 * 获取所有人物的Hook
 */
export function useCharacters(): {
	characters: Character[];
	isLoading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
} {
	const [characters, setCharacters] = useState<Character[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	const loadCharacters = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const chars = await localDb.getAllCharacters();
			setCharacters(chars);
		} catch (err) {
			setError(err instanceof Error ? err : new Error('加载人物列表失败'));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCharacters();
	}, [loadCharacters]);

	return {
		characters,
		isLoading,
		error,
		refresh: loadCharacters
	};
}

/**
 * 获取指定人物详情的Hook
 */
export function useCharacterDetail(characterId: string | null): {
	character: Character | null;
	profile: import('@/lib/localDb').CharacterProfileExtended | null;
	stats: {
		nodeCount: number;
		clueCount: number;
		branchCount: number;
	} | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
} {
	const [character, setCharacter] = useState<Character | null>(null);
	const [profile, setProfile] = useState<import('@/lib/localDb').CharacterProfileExtended | null>(null);
	const [stats, setStats] = useState<{ nodeCount: number; clueCount: number; branchCount: number } | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const loadDetail = useCallback(async () => {
		if (!characterId) return;

		setIsLoading(true);
		try {
			const [char, prof, nodes, clues, branches] = await Promise.all([
				localDb.getCharacterById(characterId),
				localDb.getProfileByCharacter(characterId),
				localDb.getNodesByCharacter(characterId),
				localDb.getCluesByCharacter(characterId),
				localDb.getBranchesByCharacter(characterId)
			]);

			setCharacter(char);
			setProfile(prof);
			setStats({
				nodeCount: nodes.length,
				clueCount: clues.length,
				branchCount: branches.length
			});
		} finally {
			setIsLoading(false);
		}
	}, [characterId]);

	useEffect(() => {
		loadDetail();
	}, [loadDetail]);

	return {
		character,
		profile,
		stats,
		isLoading,
		refresh: loadDetail
	};
}
