-- =============================================
-- NEXORA - Schema complet pour Supabase
-- Exécuter ce fichier unique dans le SQL Editor de Supabase
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  preferred_language VARCHAR(10) DEFAULT 'fr',
  preferred_model_id UUID,
  extension_settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_cycle VARCHAR(20) NOT NULL,
  tokens_per_month INTEGER NOT NULL,
  max_requests_per_day INTEGER,
  features JSONB,
  allowed_models JSONB,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  tokens_remaining INTEGER NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model_id VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  capabilities JSONB,
  context_window INTEGER,
  cost_per_input_token DECIMAL(10,8),
  cost_per_output_token DECIMAL(10,8),
  is_active BOOLEAN DEFAULT true,
  requires_plan VARCHAR(50) DEFAULT 'free',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  transaction_type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  model_id UUID REFERENCES ai_models(id),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  permissions JSONB DEFAULT '{"chat": true, "completion": true}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_model_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model_id VARCHAR(100) NOT NULL,
  api_base_url TEXT,
  api_key_encrypted TEXT,
  extra_params JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  model_id VARCHAR(100),
  mode VARCHAR(20) DEFAULT 'chat',
  message_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL,
  model_id UUID REFERENCES ai_models(id),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  duration_ms INTEGER,
  metadata JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100),
  description TEXT,
  system_prompt TEXT,
  model_id VARCHAR(100),
  config_yaml TEXT,
  is_public BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE response_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  template_content TEXT NOT NULL,
  variables JSONB,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_date ON token_transactions(created_at);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_usage_sessions_user ON usage_sessions(user_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_assistants_user ON assistants(user_id);
CREATE INDEX idx_assistants_public ON assistants(is_public) WHERE is_public = true;
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_webhook_events_eid ON webhook_events(event_id);
CREATE INDEX idx_daily_usage_ud ON daily_usage(user_id, date);
CREATE INDEX idx_user_model_configs_user ON user_model_configs(user_id);
CREATE INDEX idx_system_logs_user ON system_logs(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profile_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "plans_public" ON subscription_plans FOR SELECT USING (true);

CREATE POLICY "subs_select" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tx_select" ON token_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "keys_all" ON api_keys FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "models_auth" ON ai_models FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "modelcfg_all" ON user_model_configs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "chatsess_all" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "chatmsg_select" ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  ));

CREATE POLICY "chatmsg_insert" ON chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  ));

CREATE POLICY "usage_select" ON usage_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_insert" ON usage_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assist_select" ON assistants FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "assist_manage" ON assistants FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tpl_select" ON response_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "inv_select" ON invoices FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "logs_select" ON system_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_all" ON daily_usage FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_profiles BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_plans BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_subs BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_keys BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_models BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_modelcfg BEFORE UPDATE ON user_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_chatsess BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_assist BEFORE UPDATE ON assistants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tpl BEFORE UPDATE ON response_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inv BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO subscription_plans (name, slug, description, price, billing_cycle, tokens_per_month, max_requests_per_day, features, allowed_models, sort_order) VALUES
  ('Free', 'free', 'Pour débuter avec Nexora', 0.00, 'monthly', 500, 50,
   '{"chat":true,"completion":false,"agent":false,"support":"community"}',
   '["deepseek-chat","deepseek-coder"]', 1),
  ('Pro', 'pro', 'Pour développeurs actifs', 9.99, 'monthly', 10000, 500,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"support":"priority"}',
   '["deepseek-chat","deepseek-coder","gpt-4o-mini","claude-3-5-haiku-latest"]', 2),
  ('Business', 'business', 'Pour équipes', 29.99, 'monthly', 50000, 2000,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"background":true,"support":"priority","team":true}',
   '["deepseek-chat","deepseek-coder","gpt-4o","gpt-4o-mini","claude-3-5-sonnet-latest","claude-3-5-haiku-latest"]', 3),
  ('Enterprise', 'enterprise', 'Pour grandes entreprises', 99.99, 'monthly', 200000, NULL,
   '{"chat":true,"completion":true,"agent":true,"edit":true,"background":true,"support":"24/7","team":true,"custom_models":true,"sso":true}',
   NULL, 4);

INSERT INTO ai_models (name, provider, model_id, description, capabilities, context_window, cost_per_input_token, cost_per_output_token, requires_plan, sort_order) VALUES
  ('DeepSeek Chat', 'DeepSeek', 'deepseek-chat', 'Modèle intégré Nexora',
   '{"chat":true,"completion":true,"agent":true}', 128000, 0.00000014, 0.00000028, 'free', 1),
  ('DeepSeek Coder', 'DeepSeek', 'deepseek-coder', 'Spécialisé code',
   '{"chat":true,"completion":true,"agent":true,"edit":true}', 128000, 0.00000014, 0.00000028, 'free', 2),
  ('GPT-4o Mini', 'OpenAI', 'gpt-4o-mini', 'Rapide et économique',
   '{"chat":true,"completion":true}', 128000, 0.00000015, 0.0000006, 'pro', 3),
  ('GPT-4o', 'OpenAI', 'gpt-4o', 'Modèle phare OpenAI',
   '{"chat":true,"completion":true,"agent":true,"edit":true}', 128000, 0.0000025, 0.00001, 'business', 4),
  ('Claude 3.5 Haiku', 'Anthropic', 'claude-3-5-haiku-latest', 'Rapide Anthropic',
   '{"chat":true,"completion":true}', 200000, 0.0000008, 0.000004, 'pro', 5),
  ('Claude 3.5 Sonnet', 'Anthropic', 'claude-3-5-sonnet-latest', 'Meilleur rapport qualité/prix',
   '{"chat":true,"completion":true,"agent":true,"edit":true}', 200000, 0.000003, 0.000015, 'business', 6),
  ('Gemini 2.0 Flash', 'Google', 'gemini-2.0-flash', 'Ultra rapide Google',
   '{"chat":true,"completion":true}', 1000000, 0.0000001, 0.0000004, 'pro', 7),
  ('Llama 3.3 70B', 'Meta', 'llama-3.3-70b', 'Open source performant',
   '{"chat":true,"completion":true}', 128000, 0.00000059, 0.00000079, 'pro', 8);
