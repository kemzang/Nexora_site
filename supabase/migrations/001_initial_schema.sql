-- =============================================
-- Base de données : xenora_platform
-- =============================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Tables principales
-- =============================================

-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255)
);

-- Plans d'abonnement
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    tokens_per_month INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Abonnements utilisateurs
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- active, canceled, past_due, etc.
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions de tokens
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    transaction_type VARCHAR(50) NOT NULL, -- purchase, usage, refund, bonus
    amount INTEGER NOT NULL, -- positif pour achat, négatif pour usage
    balance_after INTEGER NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clés API des utilisateurs
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB, -- {"chat": true, "autocomplete": true, "generate": true}
    rate_limit_per_hour INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions d'utilisation
CREATE TABLE usage_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id),
    session_type VARCHAR(50) NOT NULL, -- chat, autocomplete, generate
    tokens_used INTEGER NOT NULL,
    model_used VARCHAR(100),
    request_data JSONB,
    response_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modèles IA disponibles
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- openai, anthropic, deepseek, etc.
    model_id VARCHAR(100) NOT NULL,
    cost_per_token DECIMAL(10,6),
    max_tokens INTEGER,
    capabilities JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates de réponses
CREATE TABLE response_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- chat, autocomplete, refactor, etc.
    template_content TEXT NOT NULL,
    variables JSONB,
    model_id UUID REFERENCES ai_models(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs système
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL, -- info, warning, error, critical
    message TEXT NOT NULL,
    context JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Factures
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- draft, open, paid, void, uncollectible
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimisation
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created ON token_transactions(created_at);
CREATE INDEX idx_api_keys_hash ON api_keys(api_key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_usage_sessions_user ON usage_sessions(user_id);
CREATE INDEX idx_usage_sessions_created ON usage_sessions(created_at);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des plans d'abonnement par défaut
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, tokens_per_month, features) VALUES
('Free', 'Plan gratuit pour découvrir Xenora', 0.00, 0.00, 50, '{"chat": true, "autocomplete": false, "generate": false, "support": "community"}'),
('Pro', 'Plan professionnel pour développeurs actifs', 9.99, 99.99, 1000, '{"chat": true, "autocomplete": true, "generate": true, "support": "priority"}'),
('Enterprise', 'Plan entreprise avec fonctionnalités avancées', 49.99, 499.99, -1, '{"chat": true, "autocomplete": true, "generate": true, "support": "24/7", "custom_models": true}');

-- Insertion des modèles IA par défaut
INSERT INTO ai_models (name, provider, model_id, cost_per_token, max_tokens, capabilities, is_active) VALUES
('Xenora Lite', 'xenora', 'xenora-lite-v1', 0.00001, 2048, '{"chat": true, "autocomplete": false, "generate": false}', true),
('Xenora Pro', 'xenora', 'xenora-pro-v1', 0.00005, 4096, '{"chat": true, "autocomplete": true, "generate": true}', true),
('GPT-4', 'openai', 'gpt-4', 0.0001, 8192, '{"chat": true, "autocomplete": true, "generate": true}', true),
('Claude-3', 'anthropic', 'claude-3-sonnet-20240229', 0.00008, 4096, '{"chat": true, "autocomplete": true, "generate": true}', true);

-- RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own token transactions" ON token_transactions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own usage sessions" ON usage_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid()::text = user_id::text);
