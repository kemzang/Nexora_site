export type Lang = 'fr' | 'en' | 'es' | 'pt'

export type Translations = {
  langName: string
  flag: string
  nav: {
    features: string
    pricing: string
    docs: string
    login: string
    start: string
  }
  hero: {
    badge: string
    title1: string
    title2: string
    desc: string
    cta: string
    demo: string
    stats: [string, string, string, string]
  }
  features: {
    badge: string
    title: string
    subtitle: string
    items: { title: string; desc: string }[]
  }
  statsSection: {
    developers: string
    requests: string
    models: string
    uptime: string
  }
  pricing: {
    badge: string
    title: string
    subtitle: string
    popular: string
    cta: Record<string, string>
    planFeatures: Record<string, string[]>
    period: string
    models: Record<string, string>
  }
  cta: { title: string; subtitle: string; button: string }
  footer: {
    desc: string
    cols: { title: string; links: string[] }[]
    rights: string
  }
  checkout: {
    back: string
    planSelected: string
    title: string
    subtitle: string
    country: string
    method: string
    card: string
    momo: string
    phone: string
    phonePlaceholder: string
    cardName: string
    cardNumber: string
    expiry: string
    cvv: string
    operator: string
    accepted: string
    submit: string
    submitFree: string
    processing: string
    securePayment: string
    tls: string
    searchCountry: string
    noCountry: string
    holder: string
    exp: string
    digits: string
    valid: string
    mobilePrompt: string
    errors: {
      cardName: string
      cardNumber: string
      expiry: string
      expiryMonth: string
      expired: string
      cvv: string
      phone: string
      phoneLength: string
      operator: string
      duplicate: string
      connection: string
      initError: string
    }
  }
}

const fr: Translations = {
  langName: 'Français',
  flag: '🇫🇷',
  nav: {
    features: 'Fonctionnalités',
    pricing: 'Tarifs',
    docs: 'Documentation',
    login: 'Connexion',
    start: 'Commencer',
  },
  hero: {
    badge: 'IA de nouvelle génération pour VS Code',
    title1: "L'IA qui transforme",
    title2: 'votre façon de coder',
    desc: "Nexora s'intègre directement dans VS Code pour vous donner accès aux modèles d'IA les plus puissants. Codez plus vite, mieux, et avec plus de confiance.",
    cta: 'Essayer gratuitement',
    demo: 'Voir la démo',
    stats: ['GPT-4o & Claude', 'DeepSeek V3', '10x plus rapide', 'Code sécurisé'],
  },
  features: {
    badge: 'Fonctionnalités',
    title: 'Tout ce dont vous avez besoin',
    subtitle: 'Des outils puissants pour accélérer votre développement au quotidien',
    items: [
      { title: 'Chat IA Intégré', desc: "Discutez avec l'IA directement dans VS Code pour obtenir de l'aide et des suggestions en temps réel." },
      { title: 'Auto-complétion', desc: 'Complétez votre code 10x plus vite avec des suggestions intelligentes qui comprennent le contexte.' },
      { title: 'Génération de Code', desc: 'Générez des fonctions, des classes et des algorithmes complets à partir de descriptions en langage naturel.' },
      { title: 'Multi-modèles', desc: "Accédez à GPT-4o, Claude, Gemini, DeepSeek et bien d'autres modèles depuis un seul outil." },
      { title: 'Mode Agent', desc: "Laissez l'IA exécuter des tâches complexes, naviguer dans votre code et proposer des modifications." },
      { title: 'Sécurité & Privacy', desc: "Vos données sont chiffrées et jamais utilisées pour l'entraînement. Contrôle total sur votre code." },
    ],
  },
  statsSection: {
    developers: 'Développeurs actifs',
    requests: 'Requêtes traitées',
    models: 'Modèles IA',
    uptime: 'Uptime',
  },
  pricing: {
    badge: 'Tarifs',
    title: 'Des tarifs pour tous les besoins',
    subtitle: 'Commencez gratuitement et passez à un plan supérieur quand vous êtes prêt',
    popular: 'Populaire',
    period: '/mois',
    cta: {
      free: 'Commencer',
      neo: 'Choisir Neo',
      pro: 'Choisir Pro',
      business: 'Choisir Business',
      enterprise: 'Contacter',
    },
    models: {
      free: 'DeepSeek, Gemini Flash',
      neo: 'DeepSeek, Gemini Flash/Pro',
      pro: 'DeepSeek, Gemini, Claude Haiku, Grok',
      business: 'DeepSeek, Gemini, Claude, Grok',
      enterprise: 'Tous les modèles',
    },
    planFeatures: {
      free: ['1K tokens/mois', '20 requêtes/jour', 'DeepSeek, Gemini Flash'],
      neo: ['15K tokens/mois', '150 requêtes/jour', '+ Gemini Pro', 'Auto-complétion'],
      pro: ['50K tokens/mois', '500 requêtes/jour', '+ Grok, Claude Haiku', 'Mode Agent', 'Support prioritaire'],
      business: ['200K tokens/mois', '2K requêtes/jour', '+ Claude Sonnet', 'Mode équipe', 'Support prioritaire'],
      enterprise: ['1M tokens/mois', 'Requêtes illimitées', '+ Claude Opus, GPT-5', 'Tous les modèles', 'SSO + Support 24/7'],
    },
  },
  cta: {
    title: 'Prêt à transformer votre code ?',
    subtitle: 'Rejoignez des milliers de développeurs qui codent plus intelligemment avec Nexora.',
    button: 'Commencer gratuitement',
  },
  footer: {
    desc: "L'extension VS Code qui transforme votre code avec l'intelligence artificielle.",
    cols: [
      { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Documentation', 'API'] },
      { title: 'Entreprise', links: ['Contact', 'Support', 'Partenaires', 'Blog'] },
      { title: 'Légal', links: ['Confidentialité', 'CGU', 'Sécurité', 'Mentions légales'] },
    ],
    rights: 'Tous droits réservés.',
  },
  checkout: {
    back: 'Retour aux tarifs',
    planSelected: 'Plan sélectionné',
    title: 'Paiement sécurisé',
    subtitle: 'Vos données sont protégées par chiffrement TLS',
    country: 'Pays',
    method: 'Méthode de paiement',
    card: 'Carte bancaire',
    momo: 'Mobile Money',
    phone: 'Numéro de téléphone',
    phonePlaceholder: 'Votre numéro',
    cardName: 'Nom du titulaire',
    cardNumber: 'Numéro de carte',
    expiry: "Date d'expiration",
    cvv: 'CVV / CVC',
    operator: 'Opérateur Mobile Money',
    accepted: 'Cartes acceptées :',
    submit: 'Payer',
    submitFree: 'Activer gratuitement',
    processing: 'Traitement en cours...',
    securePayment: 'Paiement sécurisé',
    tls: 'Chiffrement TLS',
    searchCountry: 'Rechercher un pays...',
    noCountry: 'Aucun pays trouvé',
    holder: 'Titulaire',
    exp: 'Exp.',
    digits: 'chiffres',
    valid: '✓ Valide',
    mobilePrompt: 'Validez le paiement sur votre téléphone',
    errors: {
      cardName: 'Veuillez saisir le nom du titulaire',
      cardNumber: 'Numéro de carte incomplet (16 chiffres requis)',
      expiry: "Date d'expiration invalide (MM/AA)",
      expiryMonth: "Mois d'expiration invalide",
      expired: 'Carte expirée',
      cvv: 'CVV incomplet (3 chiffres requis)',
      phone: 'Numéro de téléphone requis',
      phoneLength: 'Le numéro doit contenir {length} chiffres',
      operator: 'Sélectionnez un opérateur Mobile Money',
      duplicate: 'Vous êtes déjà abonné à ce plan ce mois-ci',
      connection: 'Erreur de connexion. Vérifiez votre réseau.',
      initError: "Erreur d'initialisation du paiement",
    },
  },
}

const en: Translations = {
  langName: 'English',
  flag: '🇬🇧',
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    docs: 'Documentation',
    login: 'Login',
    start: 'Get Started',
  },
  hero: {
    badge: 'Next-generation AI for VS Code',
    title1: 'The AI that transforms',
    title2: 'the way you code',
    desc: 'Nexora integrates directly into VS Code to give you access to the most powerful AI models. Code faster, better, and with more confidence.',
    cta: 'Try for free',
    demo: 'Watch demo',
    stats: ['GPT-4o & Claude', 'DeepSeek V3', '10x faster', 'Secure code'],
  },
  features: {
    badge: 'Features',
    title: 'Everything you need',
    subtitle: 'Powerful tools to accelerate your daily development workflow',
    items: [
      { title: 'Integrated AI Chat', desc: 'Talk to AI directly inside VS Code to get real-time help and code suggestions.' },
      { title: 'Auto-completion', desc: 'Complete your code 10x faster with smart suggestions that understand context.' },
      { title: 'Code Generation', desc: 'Generate full functions, classes, and algorithms from natural language descriptions.' },
      { title: 'Multi-model', desc: 'Access GPT-4o, Claude, Gemini, DeepSeek and many more models from a single tool.' },
      { title: 'Agent Mode', desc: 'Let AI execute complex tasks, navigate your codebase, and propose changes.' },
      { title: 'Security & Privacy', desc: 'Your data is encrypted and never used for training. Full control over your code.' },
    ],
  },
  statsSection: {
    developers: 'Active developers',
    requests: 'Requests processed',
    models: 'AI Models',
    uptime: 'Uptime',
  },
  pricing: {
    badge: 'Pricing',
    title: 'Plans for every need',
    subtitle: 'Start for free and upgrade when you are ready',
    popular: 'Popular',
    period: '/month',
    cta: {
      free: 'Get started',
      neo: 'Choose Neo',
      pro: 'Choose Pro',
      business: 'Choose Business',
      enterprise: 'Contact us',
    },
    models: {
      free: 'DeepSeek, Gemini Flash',
      neo: 'DeepSeek, Gemini Flash/Pro',
      pro: 'DeepSeek, Gemini, Claude Haiku, Grok',
      business: 'DeepSeek, Gemini, Claude, Grok',
      enterprise: 'All models',
    },
    planFeatures: {
      free: ['1K tokens/month', '20 requests/day', 'DeepSeek, Gemini Flash'],
      neo: ['15K tokens/month', '150 requests/day', '+ Gemini Pro', 'Auto-completion'],
      pro: ['50K tokens/month', '500 requests/day', '+ Grok, Claude Haiku', 'Agent Mode', 'Priority support'],
      business: ['200K tokens/month', '2K requests/day', '+ Claude Sonnet', 'Team mode', 'Priority support'],
      enterprise: ['1M tokens/month', 'Unlimited requests', '+ Claude Opus, GPT-5', 'All models', 'SSO + 24/7 support'],
    },
  },
  cta: {
    title: 'Ready to transform your code?',
    subtitle: 'Join thousands of developers who code smarter with Nexora.',
    button: 'Start for free',
  },
  footer: {
    desc: 'The VS Code extension that transforms your code with artificial intelligence.',
    cols: [
      { title: 'Product', links: ['Features', 'Pricing', 'Documentation', 'API'] },
      { title: 'Company', links: ['Contact', 'Support', 'Partners', 'Blog'] },
      { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Legal notice'] },
    ],
    rights: 'All rights reserved.',
  },
  checkout: {
    back: 'Back to pricing',
    planSelected: 'Selected plan',
    title: 'Secure payment',
    subtitle: 'Your data is protected by TLS encryption',
    country: 'Country',
    method: 'Payment method',
    card: 'Credit / Debit card',
    momo: 'Mobile Money',
    phone: 'Phone number',
    phonePlaceholder: 'Your number',
    cardName: 'Cardholder name',
    cardNumber: 'Card number',
    expiry: 'Expiration date',
    cvv: 'CVV / CVC',
    operator: 'Mobile Money operator',
    accepted: 'Accepted cards:',
    submit: 'Pay',
    submitFree: 'Activate for free',
    processing: 'Processing...',
    securePayment: 'Secure payment',
    tls: 'TLS Encryption',
    searchCountry: 'Search country...',
    noCountry: 'No country found',
    holder: 'Cardholder',
    exp: 'Exp.',
    digits: 'digits',
    valid: '✓ Valid',
    mobilePrompt: 'Confirm the payment on your phone',
    errors: {
      cardName: 'Please enter the cardholder name',
      cardNumber: 'Incomplete card number (16 digits required)',
      expiry: 'Invalid expiration date (MM/YY)',
      expiryMonth: 'Invalid expiration month',
      expired: 'Card is expired',
      cvv: 'Incomplete CVV (3 digits required)',
      phone: 'Phone number is required',
      phoneLength: 'Number must contain {length} digits',
      operator: 'Select a Mobile Money operator',
      duplicate: 'You are already subscribed to this plan this month',
      connection: 'Connection error. Check your network.',
      initError: 'Payment initialization error',
    },
  },
}

const es: Translations = {
  langName: 'Español',
  flag: '🇪🇸',
  nav: {
    features: 'Características',
    pricing: 'Precios',
    docs: 'Documentación',
    login: 'Iniciar sesión',
    start: 'Comenzar',
  },
  hero: {
    badge: 'IA de nueva generación para VS Code',
    title1: 'La IA que transforma',
    title2: 'tu forma de programar',
    desc: 'Nexora se integra directamente en VS Code para darte acceso a los modelos de IA más potentes. Programa más rápido, mejor y con más confianza.',
    cta: 'Probar gratis',
    demo: 'Ver demo',
    stats: ['GPT-4o & Claude', 'DeepSeek V3', '10x más rápido', 'Código seguro'],
  },
  features: {
    badge: 'Características',
    title: 'Todo lo que necesitas',
    subtitle: 'Herramientas potentes para acelerar tu desarrollo diario',
    items: [
      { title: 'Chat IA Integrado', desc: 'Habla con la IA directamente en VS Code para obtener ayuda y sugerencias en tiempo real.' },
      { title: 'Autocompletado', desc: 'Completa tu código 10x más rápido con sugerencias inteligentes que entienden el contexto.' },
      { title: 'Generación de Código', desc: 'Genera funciones, clases y algoritmos completos a partir de descripciones en lenguaje natural.' },
      { title: 'Multi-modelos', desc: 'Accede a GPT-4o, Claude, Gemini, DeepSeek y muchos más modelos desde una sola herramienta.' },
      { title: 'Modo Agente', desc: 'Deja que la IA ejecute tareas complejas, navegue tu código y proponga modificaciones.' },
      { title: 'Seguridad & Privacidad', desc: 'Tus datos están cifrados y nunca se usan para entrenamiento. Control total sobre tu código.' },
    ],
  },
  statsSection: {
    developers: 'Desarrolladores activos',
    requests: 'Solicitudes procesadas',
    models: 'Modelos de IA',
    uptime: 'Disponibilidad',
  },
  pricing: {
    badge: 'Precios',
    title: 'Planes para cada necesidad',
    subtitle: 'Comienza gratis y actualiza cuando estés listo',
    popular: 'Popular',
    period: '/mes',
    cta: {
      free: 'Comenzar',
      neo: 'Elegir Neo',
      pro: 'Elegir Pro',
      business: 'Elegir Business',
      enterprise: 'Contactar',
    },
    models: {
      free: 'DeepSeek, Gemini Flash',
      neo: 'DeepSeek, Gemini Flash/Pro',
      pro: 'DeepSeek, Gemini, Claude Haiku, Grok',
      business: 'DeepSeek, Gemini, Claude, Grok',
      enterprise: 'Todos los modelos',
    },
    planFeatures: {
      free: ['1K tokens/mes', '20 solicitudes/día', 'DeepSeek, Gemini Flash'],
      neo: ['15K tokens/mes', '150 solicitudes/día', '+ Gemini Pro', 'Autocompletado'],
      pro: ['50K tokens/mes', '500 solicitudes/día', '+ Grok, Claude Haiku', 'Modo Agente', 'Soporte prioritario'],
      business: ['200K tokens/mes', '2K solicitudes/día', '+ Claude Sonnet', 'Modo equipo', 'Soporte prioritario'],
      enterprise: ['1M tokens/mes', 'Solicitudes ilimitadas', '+ Claude Opus, GPT-5', 'Todos los modelos', 'SSO + Soporte 24/7'],
    },
  },
  cta: {
    title: '¿Listo para transformar tu código?',
    subtitle: 'Únete a miles de desarrolladores que programan de forma más inteligente con Nexora.',
    button: 'Comenzar gratis',
  },
  footer: {
    desc: 'La extensión de VS Code que transforma tu código con inteligencia artificial.',
    cols: [
      { title: 'Producto', links: ['Características', 'Precios', 'Documentación', 'API'] },
      { title: 'Empresa', links: ['Contacto', 'Soporte', 'Socios', 'Blog'] },
      { title: 'Legal', links: ['Privacidad', 'Términos', 'Seguridad', 'Aviso legal'] },
    ],
    rights: 'Todos los derechos reservados.',
  },
  checkout: {
    back: 'Volver a precios',
    planSelected: 'Plan seleccionado',
    title: 'Pago seguro',
    subtitle: 'Tus datos están protegidos con cifrado TLS',
    country: 'País',
    method: 'Método de pago',
    card: 'Tarjeta bancaria',
    momo: 'Mobile Money',
    phone: 'Número de teléfono',
    phonePlaceholder: 'Tu número',
    cardName: 'Nombre del titular',
    cardNumber: 'Número de tarjeta',
    expiry: 'Fecha de expiración',
    cvv: 'CVV / CVC',
    operator: 'Operador Mobile Money',
    accepted: 'Tarjetas aceptadas:',
    submit: 'Pagar',
    submitFree: 'Activar gratis',
    processing: 'Procesando...',
    securePayment: 'Pago seguro',
    tls: 'Cifrado TLS',
    searchCountry: 'Buscar país...',
    noCountry: 'No se encontró país',
    holder: 'Titular',
    exp: 'Exp.',
    digits: 'dígitos',
    valid: '✓ Válido',
    mobilePrompt: 'Confirma el pago en tu teléfono',
    errors: {
      cardName: 'Por favor ingresa el nombre del titular',
      cardNumber: 'Número de tarjeta incompleto (16 dígitos requeridos)',
      expiry: 'Fecha de expiración inválida (MM/AA)',
      expiryMonth: 'Mes de expiración inválido',
      expired: 'Tarjeta vencida',
      cvv: 'CVV incompleto (3 dígitos requeridos)',
      phone: 'Número de teléfono requerido',
      phoneLength: 'El número debe contener {length} dígitos',
      operator: 'Selecciona un operador Mobile Money',
      duplicate: 'Ya estás suscrito a este plan este mes',
      connection: 'Error de conexión. Verifica tu red.',
      initError: 'Error al inicializar el pago',
    },
  },
}

const pt: Translations = {
  langName: 'Português',
  flag: '🇧🇷',
  nav: {
    features: 'Funcionalidades',
    pricing: 'Preços',
    docs: 'Documentação',
    login: 'Entrar',
    start: 'Começar',
  },
  hero: {
    badge: 'IA de nova geração para VS Code',
    title1: 'A IA que transforma',
    title2: 'a sua forma de programar',
    desc: 'Nexora integra-se diretamente no VS Code para lhe dar acesso aos modelos de IA mais poderosos. Programe mais rápido, melhor e com mais confiança.',
    cta: 'Experimentar grátis',
    demo: 'Ver demo',
    stats: ['GPT-4o & Claude', 'DeepSeek V3', '10x mais rápido', 'Código seguro'],
  },
  features: {
    badge: 'Funcionalidades',
    title: 'Tudo o que você precisa',
    subtitle: 'Ferramentas poderosas para acelerar o seu desenvolvimento diário',
    items: [
      { title: 'Chat IA Integrado', desc: 'Converse com a IA diretamente no VS Code para obter ajuda e sugestões em tempo real.' },
      { title: 'Auto-completar', desc: 'Complete seu código 10x mais rápido com sugestões inteligentes que entendem o contexto.' },
      { title: 'Geração de Código', desc: 'Gere funções, classes e algoritmos completos a partir de descrições em linguagem natural.' },
      { title: 'Multi-modelos', desc: 'Acesse GPT-4o, Claude, Gemini, DeepSeek e muitos outros modelos de uma única ferramenta.' },
      { title: 'Modo Agente', desc: 'Deixe a IA executar tarefas complexas, navegar no seu código e propor modificações.' },
      { title: 'Segurança & Privacidade', desc: 'Seus dados são criptografados e nunca usados para treinamento. Controle total sobre seu código.' },
    ],
  },
  statsSection: {
    developers: 'Desenvolvedores ativos',
    requests: 'Requisições processadas',
    models: 'Modelos de IA',
    uptime: 'Disponibilidade',
  },
  pricing: {
    badge: 'Preços',
    title: 'Planos para todas as necessidades',
    subtitle: 'Comece gratuitamente e faça upgrade quando estiver pronto',
    popular: 'Popular',
    period: '/mês',
    cta: {
      free: 'Começar',
      neo: 'Escolher Neo',
      pro: 'Escolher Pro',
      business: 'Escolher Business',
      enterprise: 'Contactar',
    },
    models: {
      free: 'DeepSeek, Gemini Flash',
      neo: 'DeepSeek, Gemini Flash/Pro',
      pro: 'DeepSeek, Gemini, Claude Haiku, Grok',
      business: 'DeepSeek, Gemini, Claude, Grok',
      enterprise: 'Todos os modelos',
    },
    planFeatures: {
      free: ['1K tokens/mês', '20 requisições/dia', 'DeepSeek, Gemini Flash'],
      neo: ['15K tokens/mês', '150 requisições/dia', '+ Gemini Pro', 'Auto-completar'],
      pro: ['50K tokens/mês', '500 requisições/dia', '+ Grok, Claude Haiku', 'Modo Agente', 'Suporte prioritário'],
      business: ['200K tokens/mês', '2K requisições/dia', '+ Claude Sonnet', 'Modo equipe', 'Suporte prioritário'],
      enterprise: ['1M tokens/mês', 'Requisições ilimitadas', '+ Claude Opus, GPT-5', 'Todos os modelos', 'SSO + Suporte 24/7'],
    },
  },
  cta: {
    title: 'Pronto para transformar o seu código?',
    subtitle: 'Junte-se a milhares de programadores que programam de forma mais inteligente com Nexora.',
    button: 'Começar gratuitamente',
  },
  footer: {
    desc: 'A extensão VS Code que transforma o seu código com inteligência artificial.',
    cols: [
      { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Documentação', 'API'] },
      { title: 'Empresa', links: ['Contacto', 'Suporte', 'Parceiros', 'Blog'] },
      { title: 'Legal', links: ['Privacidade', 'Termos', 'Segurança', 'Aviso legal'] },
    ],
    rights: 'Todos os direitos reservados.',
  },
  checkout: {
    back: 'Voltar aos preços',
    planSelected: 'Plano selecionado',
    title: 'Pagamento seguro',
    subtitle: 'Os seus dados são protegidos por encriptação TLS',
    country: 'País',
    method: 'Método de pagamento',
    card: 'Cartão bancário',
    momo: 'Mobile Money',
    phone: 'Número de telemóvel',
    phonePlaceholder: 'O seu número',
    cardName: 'Nome do titular',
    cardNumber: 'Número do cartão',
    expiry: 'Data de validade',
    cvv: 'CVV / CVC',
    operator: 'Operador Mobile Money',
    accepted: 'Cartões aceites:',
    submit: 'Pagar',
    submitFree: 'Ativar gratuitamente',
    processing: 'A processar...',
    securePayment: 'Pagamento seguro',
    tls: 'Encriptação TLS',
    searchCountry: 'Pesquisar país...',
    noCountry: 'Nenhum país encontrado',
    holder: 'Titular',
    exp: 'Val.',
    digits: 'dígitos',
    valid: '✓ Válido',
    mobilePrompt: 'Confirme o pagamento no seu telemóvel',
    errors: {
      cardName: 'Por favor insira o nome do titular',
      cardNumber: 'Número de cartão incompleto (16 dígitos necessários)',
      expiry: 'Data de validade inválida (MM/AA)',
      expiryMonth: 'Mês de validade inválido',
      expired: 'Cartão expirado',
      cvv: 'CVV incompleto (3 dígitos necessários)',
      phone: 'Número de telemóvel obrigatório',
      phoneLength: 'O número deve ter {length} dígitos',
      operator: 'Selecione um operador Mobile Money',
      duplicate: 'Já está subscrito a este plano este mês',
      connection: 'Erro de ligação. Verifique a sua rede.',
      initError: 'Erro ao inicializar o pagamento',
    },
  },
}

export const translations: Record<Lang, Translations> = { fr, en, es, pt }
export const LANGS: Lang[] = ['fr', 'en', 'es', 'pt']
