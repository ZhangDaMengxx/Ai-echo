// ============================================================
// useAutoBackup: 自动备份 Hook
// 定期检查并自动导出数据备份
//
// 文件位置: src/hooks/useAutoBackup.ts
// 主要依赖: exportToJSON
// 被引用: Settings 页面
//
// 功能:
//   - 定期检查上次备份时间
//   - 超过间隔自动触发备份
//   - 失败重试机制
//
// 使用示例:
//   useAutoBackup({ enabled: true, intervalDays: 7 });
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { exportToJSON } from '@/lib/exportImport';

interface UseAutoBackupOptions {
	/** 是否启用自动备份 */
	enabled: boolean;
	/** 备份间隔天数，默认 7 天 */
	intervalDays?: number;
}

const STORAGE_KEY = 'lastAutoBackup';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 每天检查一次

/**
 * 自动备份 Hook
 * 定期检查备份状态，超过间隔自动导出
 */
export function useAutoBackup(options: UseAutoBackupOptions): void {
	const { enabled, intervalDays = 7 } = options;
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const isBackingUp = useRef(false);

	const performBackup = useCallback(async (): Promise<boolean> => {
		if (isBackingUp.current) return false;
		
		isBackingUp.current = true;
		try {
			await exportToJSON();
			localStorage.setItem(STORAGE_KEY, String(Date.now()));
			return true;
		} catch (error) {
			console.error('自动备份失败:', error);
			return false;
		} finally {
			isBackingUp.current = false;
		}
	}, []);

	const checkAndBackup = useCallback(async () => {
		const lastBackupStr = localStorage.getItem(STORAGE_KEY);
		const now = Date.now();
		const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

		// 从未备份过，立即备份
		if (!lastBackupStr) {
			await performBackup();
			return;
		}

		const lastBackup = Number(lastBackupStr);
		const timeSinceLastBackup = now - lastBackup;

		// 超过间隔时间，触发备份
		if (timeSinceLastBackup >= intervalMs) {
			await performBackup();
		}
	}, [intervalDays, performBackup]);

	useEffect(() => {
		if (!enabled) return;

		// 立即检查一次
		checkAndBackup();

		// 设置定时检查
		timerRef.current = setInterval(checkAndBackup, CHECK_INTERVAL);

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [enabled, checkAndBackup]);
}

/**
 * 获取上次自动备份时间
 * @returns 时间戳或 null
 */
export function getLastAutoBackupTime(): number | null {
	const saved = localStorage.getItem(STORAGE_KEY);
	return saved ? Number(saved) : null;
}

/**
 * 清除自动备份记录
 */
export function clearAutoBackupRecord(): void {
	localStorage.removeItem(STORAGE_KEY);
}

/**
 * 设置上次自动备份时间（用于测试或手动设置）
 * @param timestamp 时间戳
 */
export function setLastAutoBackupTime(timestamp: number): void {
	localStorage.setItem(STORAGE_KEY, String(timestamp));
}
