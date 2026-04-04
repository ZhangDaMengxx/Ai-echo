import type { Config } from "tailwindcss";

// ============================================================
// Tailwind 配置: 温暖琥珀色治愈系主题
// ============================================================

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				// 基础颜色映射
				background: "var(--background)",
				foreground: "var(--foreground)",
				
				// 温暖琥珀色系
				amber: {
					50: "#fffbeb",
					100: "#fef3c7",
					200: "#fde68a",
					300: "#fcd34d",
					400: "#fbbf24",
					500: "#f59e0b",
					600: "#d97706",
					700: "#b45309",
					800: "#92400e",
					900: "#78350f",
				},
				
				// 深色模式专用暖色调
				warm: {
					dark: "#1a1410",
					surface: "#2d2418",
					surfaceHighlight: "#3d3020",
					primary: "#8b6914",
					accent: "#d4a574",
					text: "#f5e6c8",
					textMuted: "#a09070",
					border: "#5c4a3a",
				},
			},
			
			fontFamily: {
				handwriting: [
					"Zhi Mang Xing",
					"Ma Shan Zheng",
					"Long Cang",
					"Caveat",
					"Dancing Script",
					"cursive",
				],
				body: [
					"PingFang SC",
					"Microsoft YaHei",
					"sans-serif",
				],
			},
			
			boxShadow: {
				// 拟物化纸张阴影
				paper: "2px 3px 8px rgba(139, 105, 20, 0.15), 0 1px 2px rgba(139, 105, 20, 0.1)",
				"paper-hover": "4px 6px 12px rgba(139, 105, 20, 0.2), 0 2px 4px rgba(139, 105, 20, 0.15)",
				
				// 拍立得相框效果
				polaroid: "3px 3px 10px rgba(0, 0, 0, 0.15), inset 0 0 20px rgba(255, 251, 235, 0.5)",
				
				// 胶带效果
				tape: "0 1px 3px rgba(0, 0, 0, 0.1), inset 0 0 2px rgba(255, 255, 255, 0.3)",
				
				// 笔记本线圈
				coil: "1px 0 2px rgba(139, 105, 20, 0.3)",
			},
			
			borderRadius: {
				paper: "2px 3px 3px 2px",
			},
			
			animation: {
				// 温暖柔和的动画
				"fade-in": "fadeIn 0.5s ease-out",
				"slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
				"gentle-bounce": "gentleBounce 2s infinite",
			},
			
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				slideUp: {
					"0%": { transform: "translateY(20px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				gentleBounce: {
					"0%, 100%": { transform: "translateY(-2%)" },
					"50%": { transform: "translateY(0)" },
				},
			},
		},
	},
	plugins: [],
};

export default config;
