-- 回音轨迹数据库初始化脚本
-- 执行顺序：1. 扩展 2. 表 3. 索引 4. RLS策略

-- ============================================
-- 1. 启用扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. 创建表
-- ============================================

-- Users表（扩展Supabase Auth）
CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    base_archetype JSONB DEFAULT '{"style": "未知", "logic": "未知"}',
    global_vibe VARCHAR(50) DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory_Nodes表（记忆节点主表）
CREATE TABLE IF NOT EXISTS Memory_Nodes (
    node_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    event_date DATE,
    salience_score INTEGER CHECK (salience_score BETWEEN 1 AND 10),
    core_event TEXT NOT NULL,
    npc_state JSONB DEFAULT '{}',
    memory_source VARCHAR(20) CHECK (memory_source IN ('txt_extraction', 'user_supplement')),
    opening_mode VARCHAR(20) CHECK (opening_mode IN ('action_driven', 'dialogue_driven')),
    embedding VECTOR(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hidden_Clues表（隐藏线索）
CREATE TABLE IF NOT EXISTS Hidden_Clues (
    clue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES Memory_Nodes(node_id) ON DELETE CASCADE,
    trigger_condition TEXT NOT NULL,
    clue_content TEXT NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If_Line_Branches表（逆天改命分支）
CREATE TABLE IF NOT EXISTS If_Line_Branches (
    branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_node_id UUID NOT NULL REFERENCES Memory_Nodes(node_id) ON DELETE CASCADE,
    altered_choices TEXT,
    new_ending TEXT,
    is_committed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations表（节点对话历史）
CREATE TABLE IF NOT EXISTS Conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES Memory_Nodes(node_id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_nodes_user_date ON Memory_Nodes(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_nodes_salience ON Memory_Nodes(user_id, salience_score);
CREATE INDEX IF NOT EXISTS idx_clues_node ON Hidden_Clues(node_id);
CREATE INDEX IF NOT EXISTS idx_branches_parent ON If_Line_Branches(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_conversations_node ON Conversations(node_id);

-- 向量相似度搜索索引
CREATE INDEX IF NOT EXISTS idx_nodes_embedding ON Memory_Nodes 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 4. 启用RLS（行级安全）
-- ============================================
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Memory_Nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Hidden_Clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE If_Line_Branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE Conversations ENABLE ROW LEVEL SECURITY;

-- Users表策略
DROP POLICY IF EXISTS "Users can only access own data" ON Users;
CREATE POLICY "Users can only access own data" ON Users
    FOR ALL USING (auth.uid() = id);

-- Memory_Nodes表策略
DROP POLICY IF EXISTS "Users can only access own nodes" ON Memory_Nodes;
CREATE POLICY "Users can only access own nodes" ON Memory_Nodes
    FOR ALL USING (auth.uid() = user_id);

-- Hidden_Clues表策略
DROP POLICY IF EXISTS "Users can only access own clues" ON Hidden_Clues;
CREATE POLICY "Users can only access own clues" ON Hidden_Clues
    FOR ALL USING (
        node_id IN (
            SELECT node_id FROM Memory_Nodes WHERE user_id = auth.uid()
        )
    );

-- If_Line_Branches表策略
DROP POLICY IF EXISTS "Users can only access own branches" ON If_Line_Branches;
CREATE POLICY "Users can only access own branches" ON If_Line_Branches
    FOR ALL USING (
        parent_node_id IN (
            SELECT node_id FROM Memory_Nodes WHERE user_id = auth.uid()
        )
    );

-- Conversations表策略
DROP POLICY IF EXISTS "Users can only access own conversations" ON Conversations;
CREATE POLICY "Users can only access own conversations" ON Conversations
    FOR ALL USING (
        node_id IN (
            SELECT node_id FROM Memory_Nodes WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 5. 触发器：自动创建Users记录
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.Users (id, base_archetype, global_vibe)
    VALUES (NEW.id, '{"style": "待测写", "logic": "待测写"}', 'neutral');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT '数据库初始化完成！' as status;
