// ============================================================
// useAutoBackup Hook 测试
// 测试自动备份功能
//
// 文件位置: tests/hooks/useAutoBackup.test.ts
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock exportImport
const mockExportToJSON = vi.fn();
vi.mock('@/lib/exportImport', () => ({
	exportToJSON: (...args: any[]) => mockExportToJSON(...args),
}));

import { useAutoBackup, getLastAutoBackupTime, setLastAutoBackupTime } from '@/hooks/useAutoBackup';

describe('useAutoBackup', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('禁用时不应执行备份', () => {
		renderHook(() => useAutoBackup({ enabled: false, intervalDays: 7 }));
		
		vi.advanceTimersByTime(24 * 60 * 60 * 1000); // 1天
		
		expect(mockExportToJSON).not.toHaveBeenCalled();
	});

	it('首次启用且从未备份时应立即备份', async () => {
		mockExportToJSON.mockResolvedValue(undefined);
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		// 等待异步操作完成
		await vi.advanceTimersByTimeAsync(100);
		
		await waitFor(() => {
			expect(mockExportToJSON).toHaveBeenCalledTimes(1);
		}, { timeout: 3000 });
	}, 10000);

	it('未到间隔时间不应备份', async () => {
		mockExportToJSON.mockResolvedValue(undefined);
		const lastBackup = Date.now() - 3 * 24 * 60 * 60 * 1000; // 3天前
		localStorage.setItem('lastAutoBackup', String(lastBackup));
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		await vi.advanceTimersByTimeAsync(100);
		vi.advanceTimersByTime(24 * 60 * 60 * 1000); // 1天
		
		expect(mockExportToJSON).not.toHaveBeenCalled();
	});

	it('超过间隔时间应触发备份', async () => {
		mockExportToJSON.mockResolvedValue(undefined);
		const lastBackup = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8天前
		localStorage.setItem('lastAutoBackup', String(lastBackup));
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		await vi.advanceTimersByTimeAsync(100);
		
		await waitFor(() => {
			expect(mockExportToJSON).toHaveBeenCalledTimes(1);
		}, { timeout: 3000 });
	}, 10000);

	it('备份成功后应更新本地存储时间', async () => {
		mockExportToJSON.mockResolvedValue(undefined);
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		await vi.advanceTimersByTimeAsync(100);
		
		await waitFor(() => {
			const savedTime = localStorage.getItem('lastAutoBackup');
			expect(savedTime).not.toBeNull();
		}, { timeout: 3000 });
	}, 10000);

	it('备份失败不应更新本地存储时间', async () => {
		mockExportToJSON.mockRejectedValue(new Error('Export failed'));
		const oldTime = String(Date.now() - 10000);
		localStorage.setItem('lastAutoBackup', oldTime);
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		await vi.advanceTimersByTimeAsync(100);
		await new Promise(r => setTimeout(r, 100));
		
		const savedTime = localStorage.getItem('lastAutoBackup');
		expect(savedTime).toBe(oldTime);
	});

	it('卸载时应清理定时器', () => {
		const { unmount } = renderHook(() => useAutoBackup({ enabled: true, intervalDays: 7 }));
		
		unmount();
		
		// 推进时间不应报错
		expect(() => {
			vi.advanceTimersByTime(24 * 60 * 60 * 1000);
		}).not.toThrow();
	});

	it('应使用自定义间隔时间', async () => {
		mockExportToJSON.mockResolvedValue(undefined);
		const lastBackup = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15天前
		localStorage.setItem('lastAutoBackup', String(lastBackup));
		
		renderHook(() => useAutoBackup({ enabled: true, intervalDays: 14 }));
		
		await vi.advanceTimersByTimeAsync(100);
		
		await waitFor(() => {
			expect(mockExportToJSON).toHaveBeenCalledTimes(1);
		}, { timeout: 3000 });
	}, 10000);
});

describe('useAutoBackup 工具函数', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('getLastAutoBackupTime 应返回 null 当没有记录', () => {
		expect(getLastAutoBackupTime()).toBeNull();
	});

	it('getLastAutoBackupTime 应返回保存的时间戳', () => {
		const now = Date.now();
		localStorage.setItem('lastAutoBackup', String(now));
		expect(getLastAutoBackupTime()).toBe(now);
	});

	it('setLastAutoBackupTime 应保存时间戳', () => {
		const timestamp = 1234567890;
		setLastAutoBackupTime(timestamp);
		expect(localStorage.getItem('lastAutoBackup')).toBe(String(timestamp));
	});
});
