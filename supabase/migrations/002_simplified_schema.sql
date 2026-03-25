-- =============================================
-- Schema Simplifié Xenora (sans table users)
-- =============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Tables principales (sans users)
-- =============================================

-- Plans d'abonnement
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle VARCHAR(20) NOT NULL, -- monthly, yearly
    tokens_per_month INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abonnements utilisateurs
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    tokens_remaining INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions de tokens
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- purchase, usage, refund
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clés API
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions d'utilisation
CREATE TABLE usage_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- chat, completion, generation
    tokens_used INTEGER DEFAULT 0,
    metadata JSONB,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Modèles IA
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, etc.
    model_id VARCHAR(100) NOT NULL,
    description TEXT,
    capabilities JSONB,
    cost_per_token DECIMAL(10,6),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates de réponses
CREATE TABLE response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL,
    variables JSONB,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs système
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factures
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, failed, cancelled
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_usage_sessions_user_id ON usage_sessions(user_id);
CREATE INDEX idx_usage_sessions_started_at ON usage_sessions(started_at);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Politiques RLS
-- =============================================

-- Plans d'abonnement (lecture publique)
CREATE POLICY "Plans are viewable by everyone" ON subscription_plans FOR SELECT USING (true);

-- Abonnements utilisateurs
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Transactions de tokens
CREATE POLICY "Users can view own token transactions" ON token_transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Clés API
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (auth.uid()::text = user_id::text);

-- Sessions d'utilisation
CREATE POLICY "Users can view own usage sessions" ON usage_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own usage sessions" ON usage_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Modèles IA (lecture publique)
CREATE POLICY "AI models are viewable by authenticated users" ON ai_models FOR SELECT USING (auth.role() = 'authenticated');

-- Templates de réponses (lecture publique)
CREATE POLICY "Templates are viewable by authenticated users" ON response_templates FOR SELECT USING (auth.role() = 'authenticated');

-- Logs système
CREATE POLICY "Users can view own system logs" ON system_logs FOR SELECT USING (auth.uid()::text = user_id::text);

-- Factures
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid()::text = user_id::text);

-- =============================================
-- Fonctions et Triggers
-- =============================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_response_templates_updated_at BEFORE UPDATE ON response_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Données initiales
-- =============================================

-- Plans d'abonnement par défaut
INSERT INTO subscription_plans (name, description, price, billing_cycle, tokens_per_month, features) VALUES
('Free', 'Pour débuter avec Xenora', 0.00, 'monthly', 50, '{"chat": true, "completion": false, "generation": false, "support": "community"}'),
('Pro', 'Pour développeurs actifs', 9.99, 'monthly', 1000, '{"chat": true, "completion": true, "generation": true, "support": "priority"}'),
('Enterprise', 'Pour équipes et entreprises', 49.99, 'monthly', 10000, '{"chat": true, "completion": true, "generation": true, "support": "24/7", "custom_models": true}');

-- Modèles IA disponibles
INSERT INTO ai_models (name, provider, model_id, description, capabilities, cost_per_token) VALUES
('GPT-3.5 Turbo', 'OpenAI', 'gpt-3.5-turbo', 'Modèle rapide et économique', '{"chat": true, "completion": true}', 0.000001),
('GPT-4', 'OpenAI', 'gpt-4', 'Modèle avancé et précis', '{"chat": true, "completion": true, "generation": true}', 0.00003),
('Claude Instant', 'Anthropic', 'claude-instant-1', 'Modèle rapide Anthropic', '{"chat": true, "completion": true}', 0.0000008),
('Claude 2', 'Anthropic', 'claude-2', 'Modèle avancé Anthropic', '{"chat": true, "completion": true, "generation": true}', 0.000008);
