-- ============================================================
-- Echo Tracks 数据库初始架构
-- 描述: Memory_Nodes, Hidden_Clues, Users, If_Line_Branches
-- 版本: 1.0.0
-- ============================================================

-- 启用 pgvector 扩展（用于向量搜索）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 表1: Users（用户扩展表）
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	base_archetype JSONB DEFAULT '{}',        -- 3-5道测试题提取的共性基座
	global_vibe VARCHAR(50) DEFAULT 'neutral', -- 当前主线全局色调
	character_name VARCHAR(100),              -- AI 人物名称
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can only access own data" ON Users
	FOR ALL USING (auth.uid() = id);

-- ============================================================
-- 表2: Memory_Nodes（记忆节点主表）
-- ============================================================
CREATE TABLE IF NOT EXISTS Memory_Nodes (
	node_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
	event_date DATE,                          -- 时间轴排序依据
	salience_score INT CHECK (salience_score BETWEEN 1 AND 10),
	core_event TEXT NOT NULL,                 -- 事件事实（RAG检索核心）
	npc_state JSONB DEFAULT '{}',             -- {current_emotion, attitude}
	memory_source VARCHAR(20) DEFAULT 'txt_extraction', -- txt_extraction | user_supplement
	opening_mode VARCHAR(20) DEFAULT 'action_driven',   -- action_driven | dialogue_driven
	embedding VECTOR(768),                    -- pgvector扩展，用于语义检索
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE Memory_Nodes ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的节点
CREATE POLICY "Users can only access own nodes" ON Memory_Nodes
	FOR ALL USING (auth.uid() = user_id);

-- 索引：时间排序 + 显著性过滤
CREATE INDEX IF NOT EXISTS idx_nodes_user_date ON Memory_Nodes(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_nodes_salience ON Memory_Nodes(user_id, salience_score);

-- 索引：向量相似度搜索（使用余弦距离）
CREATE INDEX IF NOT EXISTS idx_nodes_embedding ON Memory_Nodes 
	USING ivfflat (embedding vector_cosine_ops);

-- ============================================================
-- 表3: Hidden_Clues（隐藏线索表）
-- ============================================================
CREATE TABLE IF NOT EXISTS Hidden_Clues (
	clue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	node_id UUID NOT NULL REFERENCES Memory_Nodes(node_id) ON DELETE CASCADE,
	trigger_condition TEXT NOT NULL,     -- 触发条件描述（给AI判断）
	clue_content TEXT NOT NULL,          -- 线索内容
	is_unlocked BOOLEAN DEFAULT FALSE,
	unlocked_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE Hidden_Clues ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的线索（通过 node_id 关联）
CREATE POLICY "Users can only access own clues" ON Hidden_Clues
	FOR ALL USING (
		node_id IN (
			SELECT node_id FROM Memory_Nodes WHERE user_id = auth.uid()
		)
	);

-- 索引：节点线索查询
CREATE INDEX IF NOT EXISTS idx_clues_node_id ON Hidden_Clues(node_id);
CREATE INDEX IF NOT EXISTS idx_clues_unlocked ON Hidden_Clues(node_id, is_unlocked);

-- ============================================================
-- 表4: If_Line_Branches（IF线分支表）
-- ============================================================
CREATE TABLE IF NOT EXISTS If_Line_Branches (
	branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	parent_node_id UUID NOT NULL REFERENCES Memory_Nodes(node_id) ON DELETE CASCADE,
	altered_choices TEXT,                -- 用户改变历史的关键对话摘要
	new_ending TEXT,                     -- AI推演的当日新结局
	is_committed BOOLEAN DEFAULT FALSE,  -- 是否"逆天改命"覆写主线
	created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE If_Line_Branches ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can only access own branches" ON If_Line_Branches
	FOR ALL USING (
		parent_node_id IN (
			SELECT node_id FROM Memory_Nodes WHERE user_id = auth.uid()
		)
	);

-- ============================================================
-- 向量相似度搜索函数
-- ============================================================
CREATE OR REPLACE FUNCTION match_memory_nodes(
	query_embedding VECTOR(768),
	match_threshold FLOAT,
	match_count INT,
	p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
	node_id UUID,
	user_id UUID,
	core_event TEXT,
	salience_score INT,
	npc_state JSONB,
	embedding VECTOR(768),
	similarity FLOAT
) AS $$
BEGIN
	RETURN QUERY
	SELECT
		m.node_id,
		m.user_id,
		m.core_event,
		m.salience_score,
		m.npc_state,
		m.embedding,
		1 - (m.embedding <=> query_embedding) AS similarity
	FROM Memory_Nodes m
	WHERE (p_user_id IS NULL OR m.user_id = p_user_id)
		AND 1 - (m.embedding <=> query_embedding) > match_threshold
		AND m.embedding IS NOT NULL
	ORDER BY m.embedding <=> query_embedding
	LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 触发器：线索解锁时间自动更新
-- ============================================================
CREATE OR REPLACE FUNCTION update_clue_unlocked_at()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.is_unlocked = TRUE AND OLD.is_unlocked = FALSE THEN
		NEW.unlocked_at = NOW();
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clue_unlocked_at ON Hidden_Clues;
CREATE TRIGGER trigger_clue_unlocked_at
	BEFORE UPDATE ON Hidden_Clues
	FOR EACH ROW
	EXECUTE FUNCTION update_clue_unlocked_at();

-- ============================================================
-- 触发器：用户注册时自动创建 Users 记录
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO Users (id, base_archetype, global_vibe)
	VALUES (NEW.id, '{}', 'neutral');
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
CREATE TRIGGER trigger_on_auth_user_created
	AFTER INSERT ON auth.users
	FOR EACH ROW
	EXECUTE FUNCTION handle_new_user();
