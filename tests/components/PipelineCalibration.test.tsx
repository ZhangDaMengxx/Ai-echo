// ============================================================
// 测试: PipelineCalibration 人类在环校准组件
// 描述: 验证节点展示、删除、编辑、提交
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PipelineCalibration } from '@/components/PipelineCalibration';

const mockNodes = [
	{
		id: 'draft-1',
		event_date: '2024-01-15',
		core_event: '那个下雨的午后，我们在实验室熬了一整夜',
		npc_state: { current_emotion: '疲惫', attitude_towards_user: '依赖' },
		salience_score: 8,
		hidden_clues: [],
		memory_source: 'txt_extraction',
		opening_mode: 'action_driven',
	},
	{
		id: 'draft-2',
		event_date: '2024-03-01',
		core_event: '他转组了，没有提前告诉我',
		npc_state: { current_emotion: '冷漠', attitude_towards_user: '疏离' },
		salience_score: 9,
		hidden_clues: [{ trigger: '问他为什么离开', content: '他其实怕拖累你' }],
		memory_source: 'txt_extraction',
		opening_mode: 'dialogue_driven',
	},
];

describe('PipelineCalibration', () => {
	it('应渲染所有草稿节点', () => {
		render(
			<PipelineCalibration
				draftNodes={mockNodes}
				onChange={() => {}}
				onCommit={() => {}}
			/>
		);
		expect(screen.getByText('那个下雨的午后，我们在实验室熬了一整夜')).toBeDefined();
		expect(screen.getByText('他转组了，没有提前告诉我')).toBeDefined();
	});

	it('删除节点应触发 onChange', () => {
		const handleChange = vi.fn();
		render(
			<PipelineCalibration
				draftNodes={mockNodes}
				onChange={handleChange}
				onCommit={() => {}}
			/>
		);
		const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
		fireEvent.click(deleteButtons[0]);
		expect(handleChange).toHaveBeenCalled();
	});

	it('提交按钮应在有节点时可用', () => {
		render(
			<PipelineCalibration
				draftNodes={mockNodes}
				onChange={() => {}}
				onCommit={() => {}}
			/>
		);
		const commitBtn = screen.getByRole('button', { name: /确认入库/i });
		expect(commitBtn).toBeDefined();
		expect(commitBtn.hasAttribute('disabled')).toBe(false);
	});
});
