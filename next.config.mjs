/** @type {import('next').NextConfig} */
const nextConfig = {
	// 输出静态导出配置（可选，如需静态部署）
	// output: 'export',
	
	// 图片配置（如需使用外部图片）
	images: {
		unoptimized: true,
	},
	
	// 环境变量公开配置
	env: {
		NEXT_PUBLIC_APP_VERSION: '0.2.0',
	},
};

export default nextConfig;
