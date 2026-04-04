// ============================================================
// 测试: 项目初始化验证
// 描述: 验证项目配置、主题、API 集成
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// 路径常量
const ROOT = resolve(__dirname, '..');
const PKG_PATH = resolve(ROOT, 'package.json');
const TAILWIND_PATH = resolve(ROOT, 'tailwind.config.ts');
const ENV_PATH = resolve(ROOT, '.env.local');

describe('项目配置验证', () => {
	describe('基础文件检查', () => {
		it('应存在 package.json', () => {
			expect(existsSync(PKG_PATH)).toBe(true);
		});

		it('应存在 tailwind.config.ts', () => {
			expect(existsSync(TAILWIND_PATH)).toBe(true);
		});

		it('应存在 .env.local', () => {
			expect(existsSync(ENV_PATH)).toBe(true);
		});
	});

	describe('依赖检查', () => {
		let pkg: any;

		beforeAll(() => {
			const content = readFileSync(PKG_PATH, 'utf-8');
			pkg = JSON.parse(content);
		});

		it('应安装 framer-motion', () => {
			expect(pkg.dependencies['framer-motion']).toBeDefined();
		});

		it('应安装 @supabase/supabase-js', () => {
			expect(pkg.dependencies['@supabase/supabase-js']).toBeDefined();
		});

		it('应安装 lucide-react', () => {
			expect(pkg.dependencies['lucide-react']).toBeDefined();
		});

		it('应安装 vitest (开发依赖)', () => {
			expect(pkg.devDependencies['vitest']).toBeDefined();
		});

		it('不应再依赖 @google/generative-ai', () => {
			expect(pkg.dependencies['@google/generative-ai']).toBeUndefined();
		});
	});
});


describe('Tailwind 主题配置', () => {
	let tailwindContent: string;

	beforeAll(() => {
		tailwindContent = readFileSync(TAILWIND_PATH, 'utf-8');
	});

	it('应配置琥珀色主题扩展', () => {
		expect(tailwindContent).toContain('amber');
	});

	it('应配置手写体字体', () => {
		expect(tailwindContent).toContain('handwriting');
	});

	it('应配置拟物化阴影', () => {
		expect(tailwindContent).toContain('paper');
		expect(tailwindContent).toContain('polaroid');
	});

	it('应支持深色模式', () => {
		expect(tailwindContent).toContain('darkMode');
	});
});


describe('环境变量配置', () => {
	let envContent: string;

	beforeAll(() => {
		envContent = readFileSync(ENV_PATH, 'utf-8');
	});

	it('应配置 Qwen API Key', () => {
		expect(envContent).toMatch(/QWEN_API_KEY|DASHSCOPE_API_KEY/);
	});

	it('应配置 Supabase 连接', () => {
		expect(envContent).toContain('SUPABASE_URL');
		expect(envContent).toContain('SUPABASE_ANON_KEY');
	});
});


describe('安全测试 - 环境变量', () => {
	let envContent: string;

	beforeAll(() => {
		envContent = readFileSync(ENV_PATH, 'utf-8');
	});

	it('不应包含真实密钥值（仅应有占位符）', () => {
		const lines = envContent.split('\n');
		const keyLines = lines.filter(line => 
			line.includes('KEY') && !line.startsWith('#') && line.includes('=')
		);
		
		for (const line of keyLines) {
			const value = line.split('=')[1] || '';
			// 真实密钥通常较长（>50字符）
			// 测试用的短值是可接受的
			expect(value.length < 50 || 
				   line.includes('your_') || 
				   line.includes('placeholder')).toBe(true);
		}
	});
});
