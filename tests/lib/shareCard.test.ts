// ============================================================
// ShareCard 测试
// 功能: 测试分享卡片生成功能
// ============================================================

import { describe, it, expect } from 'vitest';
import {
	generateShareCardData,
	generateCardSVG,
	downloadCard,
	type ShareCardTemplate,
	type ShareCardData,
} from '../../src/lib/shareCard';

describe('ShareCard', () => {
	describe('generateShareCardData', () => {
		it('should generate card data from memory node', () => {
			const node = {
				node_id: '1',
				core_event: '开心的回忆',
				npc_state: { current_emotion: 'joyful' },
				salience_score: 8,
				event_date: '2026-04-06',
			};

			const cardData = generateShareCardData(node as any, 'modern');
			expect(cardData).toBeDefined();
			expect(cardData.title).toBe('开心的回忆');
			expect(cardData.emotion).toBe('joyful');
		});

		it('should support different templates', () => {
			const node = {
				node_id: '1',
				core_event: '测试',
				npc_state: { current_emotion: 'calm' },
				salience_score: 7,
				event_date: '2026-04-06',
			};

			const templates: ShareCardTemplate[] = ['modern', 'vintage', 'minimal', 'artistic'];
			templates.forEach(template => {
				const cardData = generateShareCardData(node as any, template);
				expect(cardData.template).toBe(template);
			});
		});

		it('should format date correctly', () => {
			const node = {
				node_id: '1',
				core_event: '测试',
				npc_state: { current_emotion: 'calm' },
				salience_score: 7,
				event_date: '2026-04-06',
			};

			const cardData = generateShareCardData(node as any, 'modern');
			expect(cardData.date).toContain('2026');
		});

		it('should include salience score', () => {
			const node = {
				node_id: '1',
				core_event: '测试',
				npc_state: { current_emotion: 'calm' },
				salience_score: 8,
				event_date: '2026-04-06',
			};

			const cardData = generateShareCardData(node as any, 'modern');
			expect(cardData.intensity).toBe(0.8);
		});
	});

	describe('generateCardSVG', () => {
		it('should generate valid SVG string', () => {
			const cardData: ShareCardData = {
				title: '测试标题',
				emotion: 'joyful',
				date: '2026年4月6日',
				intensity: 0.8,
				template: 'modern',
				color: '#fbbf24',
			};

			const svg = generateCardSVG(cardData);
			expect(svg).toContain('<svg');
			expect(svg).toContain('</svg>');
		});

		it('should include title in SVG', () => {
			const cardData: ShareCardData = {
				title: '特别的回忆',
				emotion: 'joyful',
				date: '2026年4月6日',
				intensity: 0.8,
				template: 'modern',
				color: '#fbbf24',
			};

			const svg = generateCardSVG(cardData);
			expect(svg).toContain('特别的回忆');
		});

		it('should include emotion color', () => {
			const cardData: ShareCardData = {
				title: '测试',
				emotion: 'calm',
				date: '2026年4月6日',
				intensity: 0.7,
				template: 'modern',
				color: '#00d4ff',
			};

			const svg = generateCardSVG(cardData);
			expect(svg).toContain('#00d4ff');
		});
	});
});
