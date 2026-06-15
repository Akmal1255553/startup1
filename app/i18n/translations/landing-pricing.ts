import type { Locale } from "../types";

export type LandingPricingPlan = {
  name: string;
  highlight: string;
  features: string[];
  support: string;
};

export type LandingPricingCopy = {
  navPricing: string;
  pricingTitle: string;
  pricingLead: string;
  pricingMostPopular: string;
  pricingPerMonth: string;
  pricingBtnInstall: string;
  pricingPlans: [
    LandingPricingPlan,
    LandingPricingPlan,
    LandingPricingPlan,
  ];
};

const en: LandingPricingCopy = {
  navPricing: "Pricing",
  pricingTitle: "Simple, transparent pricing",
  pricingLead:
    "Predictable monthly pricing. All plans include a 21-day free trial. You stay in full control of every refund decision.",
  pricingMostPopular: "Most popular",
  pricingPerMonth: "/mo",
  pricingBtnInstall: "Install on Shopify",
  pricingPlans: [
    {
      name: "Starter",
      highlight: "Up to 250 scored returns / month",
      features: [
        "Larger queue pages (50 rows)",
        "Everything in Free tier",
        "Explainable risk scoring & alerts",
      ],
      support: "Standard email support",
    },
    {
      name: "Growth",
      highlight: "Up to 2,000 scored returns / month",
      features: [
        "All Starter features",
        "Automated playbooks (approve / review / hold)",
        "Full audit log & decision history",
        "Bulk moderation actions",
        "30-day analytics window",
      ],
      support: "Priority technical support",
    },
    {
      name: "Scale",
      highlight: "Unlimited scored returns (fair use)",
      features: [
        "All Growth features",
        "Advanced analytics (90-day window)",
        "Custom risk weights",
        "Multi-store ready",
      ],
      support: "Concierge setup & onboarding",
    },
  ],
};

const ru: LandingPricingCopy = {
  navPricing: "Тарифы",
  pricingTitle: "Простые и прозрачные тарифы",
  pricingLead:
    "Предсказуемая ежемесячная оплата. На всех планах — 21 день бесплатного периода. Вы полностью контролируете каждое решение по возврату.",
  pricingMostPopular: "Популярный",
  pricingPerMonth: "/мес",
  pricingBtnInstall: "Установить в Shopify",
  pricingPlans: [
    {
      name: "Starter",
      highlight: "До 250 оценённых возвратов / месяц",
      features: [
        "Расширенные страницы очереди (50 строк)",
        "Всё из бесплатного тарифа",
        "Понятный скоринг риска и оповещения",
      ],
      support: "Стандартная поддержка по email",
    },
    {
      name: "Growth",
      highlight: "До 2 000 оценённых возвратов / месяц",
      features: [
        "Все возможности Starter",
        "Автоматические сценарии (одобрить / проверить / удержать)",
        "Полный аудит-лог и история решений",
        "Массовые действия модерации",
        "Окно аналитики 30 дней",
      ],
      support: "Приоритетная техническая поддержка",
    },
    {
      name: "Scale",
      highlight: "Безлимитные оценённые возвраты (fair use)",
      features: [
        "Все возможности Growth",
        "Расширенная аналитика (окно 90 дней)",
        "Настраиваемые веса риска",
        "Готовность к нескольким магазинам",
      ],
      support: "Персональная настройка и онбординг",
    },
  ],
};

const es: LandingPricingCopy = {
  navPricing: "Precios",
  pricingTitle: "Precios simples y transparentes",
  pricingLead:
    "Precios mensuales predecibles. Todos los planes incluyen 21 días de prueba gratis. Usted mantiene el control total de cada decisión de reembolso.",
  pricingMostPopular: "Más popular",
  pricingPerMonth: "/mes",
  pricingBtnInstall: "Instalar en Shopify",
  pricingPlans: en.pricingPlans,
};

const de: LandingPricingCopy = {
  navPricing: "Preise",
  pricingTitle: "Einfache, transparente Preise",
  pricingLead:
    "Planbare monatliche Preise. Alle Pläne beinhalten 21 Tage kostenlose Testphase. Sie behalten die volle Kontrolle über jede Erstattungsentscheidung.",
  pricingMostPopular: "Am beliebtesten",
  pricingPerMonth: "/Mon.",
  pricingBtnInstall: "In Shopify installieren",
  pricingPlans: en.pricingPlans,
};

const fr: LandingPricingCopy = {
  navPricing: "Tarifs",
  pricingTitle: "Tarification simple et transparente",
  pricingLead:
    "Tarifs mensuels prévisibles. Tous les forfaits incluent 21 jours d'essai gratuit. Vous gardez le contrôle total de chaque décision de remboursement.",
  pricingMostPopular: "Le plus populaire",
  pricingPerMonth: "/mois",
  pricingBtnInstall: "Installer sur Shopify",
  pricingPlans: en.pricingPlans,
};

const ptBR: LandingPricingCopy = {
  navPricing: "Preços",
  pricingTitle: "Preços simples e transparentes",
  pricingLead:
    "Preços mensais previsíveis. Todos os planos incluem 21 dias de teste grátis. Você mantém controle total de cada decisão de reembolso.",
  pricingMostPopular: "Mais popular",
  pricingPerMonth: "/mês",
  pricingBtnInstall: "Instalar na Shopify",
  pricingPlans: en.pricingPlans,
};

const ja: LandingPricingCopy = {
  navPricing: "料金",
  pricingTitle: "シンプルで透明な料金",
  pricingLead:
    "予測可能な月額料金。全プランに21日間の無料トライアル付き。返金の判断は常にあなたがコントロールします。",
  pricingMostPopular: "人気No.1",
  pricingPerMonth: "/月",
  pricingBtnInstall: "Shopifyにインストール",
  pricingPlans: en.pricingPlans,
};

const it: LandingPricingCopy = {
  navPricing: "Prezzi",
  pricingTitle: "Prezzi semplici e trasparenti",
  pricingLead:
    "Prezzi mensili prevedibili. Tutti i piani includono 21 giorni di prova gratuita. Mantieni il pieno controllo su ogni decisione di rimborso.",
  pricingMostPopular: "Più popolare",
  pricingPerMonth: "/mese",
  pricingBtnInstall: "Installa su Shopify",
  pricingPlans: en.pricingPlans,
};

const nl: LandingPricingCopy = {
  navPricing: "Prijzen",
  pricingTitle: "Eenvoudige, transparante prijzen",
  pricingLead:
    "Voorspelbare maandelijkse prijzen. Alle plannen bevatten 21 dagen gratis proefperiode. U behoudt volledige controle over elke terugbetalingsbeslissing.",
  pricingMostPopular: "Meest populair",
  pricingPerMonth: "/mnd",
  pricingBtnInstall: "Installeren op Shopify",
  pricingPlans: en.pricingPlans,
};

const ko: LandingPricingCopy = {
  navPricing: "요금",
  pricingTitle: "간단하고 투명한 요금",
  pricingLead:
    "예측 가능한 월 요금. 모든 플랜에 21일 무료 체험이 포함됩니다. 모든 환불 결정을 완전히 통제할 수 있습니다.",
  pricingMostPopular: "가장 인기",
  pricingPerMonth: "/월",
  pricingBtnInstall: "Shopify에 설치",
  pricingPlans: en.pricingPlans,
};

export const LANDING_PRICING: Record<Locale, LandingPricingCopy> = {
  en,
  ru,
  es,
  de,
  fr,
  "pt-BR": ptBR,
  ja,
  it,
  nl,
  ko,
};
