import type { Locale } from "../types";
import { pickByLocale } from "../pick-locale";
import { LANDING_COPY } from "../translations/landing";

export type LandingFeature = { title: string; description: string };
export type LandingStep = { n: string; title: string; text: string };
export type LandingMetric = { value: string; label: string };

export type LandingCopy = {
  metaTitle: string;
  metaDescription: string;
  navProduct: string;
  navWorkflow: string;
  navInstall: string;
  navPrivacy: string;
  navSupport: string;
  navPreview: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  btnSeeInterface: string;
  installDisabled: string;
  labelStoreDomain: string;
  placeholderShop: string;
  btnInstall: string;
  chipEmbedded: string;
  chipQueue: string;
  chipAudit: string;
  mockAria: string;
  mockUrl: string;
  mockReturnsQueue: string;
  mockToday: string;
  mockLiveSync: string;
  mockPortfolioRisk: string;
  mockWeighted: string;
  mockHighRisk: string;
  mockReview: string;
  mockApproved: string;
  metricsAria: string;
  platformEyebrow: string;
  featTitle: string;
  featLead: string;
  features: LandingFeature[];
  workflowEyebrow: string;
  workflowTitle: string;
  steps: LandingStep[];
  ctaTitle: string;
  ctaLead: string;
  btnInstallCta: string;
  btnExplore: string;
  footerPrivacy: string;
  footerSupport: string;
  footerNote: string;
  metrics: LandingMetric[];
  langLabel: string;
};

const enLanding: LandingCopy = {
  metaTitle: "ReturnGuard AI | Returns intelligence for Shopify",
  metaDescription:
    "ReturnGuard AI helps Shopify teams flag risky returns, protect margins, and keep refunds moving fast.",
  navProduct: "Product",
  navWorkflow: "Workflow",
  navInstall: "Install",
  navPrivacy: "Privacy",
  navSupport: "Support",
  navPreview: "View preview",
  heroEyebrow: "Shopify · Returns operations",
  heroTitle: "Control refund risk before it hits your margin.",
  heroLede:
    "ReturnGuard AI brings return requests into a single review surface—scored, explainable, and auditable—so finance and support stay aligned without leaving Shopify Admin.",
  btnSeeInterface: "See interface",
  installDisabled: "Install flow is disabled in this environment.",
  labelStoreDomain: "Store domain",
  placeholderShop: "your-store.myshopify.com",
  btnInstall: "Install app",
  chipEmbedded: "Embedded app",
  chipQueue: "Return-level queue",
  chipAudit: "Audit-friendly history",
  mockAria: "Product interface preview",
  mockUrl: "admin.shopify.com · Returns",
  mockReturnsQueue: "Returns queue",
  mockToday: "Today · 12 open",
  mockLiveSync: "Live sync",
  mockPortfolioRisk: "Portfolio risk index",
  mockWeighted: "Weighted by value & velocity",
  mockHighRisk: "High risk",
  mockReview: "Review",
  mockApproved: "Approved",
  metricsAria: "Outcomes",
  platformEyebrow: "Platform",
  featTitle: "Everything your team needs to decide faster.",
  featLead:
    "Purpose-built for merchants who treat returns as a margin line item—not an afterthought.",
  features: [
    {
      title: "Real Shopify returns",
      description:
        "Each row ties to a live Return in Admin—status, line context, and parent order in one place.",
    },
    {
      title: "Explainable risk scoring",
      description:
        "Value, payment state, fulfillment, and customer signals surface as reasons, not a black box.",
    },
    {
      title: "Playbooks that match your policy",
      description:
        "No-code rules for thresholds, repeat patterns, and escalation—without leaving the embedded app.",
    },
    {
      title: "Decision trail & analytics",
      description:
        "Approvals, holds, and reviews are recorded for compliance, coaching, and trending dashboards.",
    },
    {
      title: "Billing-ready plans",
      description:
        "Starter to scale tiers so you can align packaging with how serious the merchant is about refunds.",
    },
    {
      title: "Built for embedded Admin",
      description:
        "Runs where your team already works—Polaris-aligned UI inside Shopify without context switching.",
    },
  ],
  workflowEyebrow: "How it works",
  workflowTitle: "From install to disciplined triage—in three moves.",
  steps: [
    {
      n: "01",
      title: "Connect & scope",
      text: "Install on your dev or production shop; approvals use standard Shopify OAuth and scopes.",
    },
    {
      n: "02",
      title: "Tune thresholds",
      text: "Adjust review and hold bands, playbook rules, and what “risky” means for your catalog.",
    },
    {
      n: "03",
      title: "Operate the queue",
      text: "Triage returns, log decisions in one click, export or analyze without spreadsheets.",
    },
  ],
  ctaTitle: "Ready to tighten your return posture?",
  ctaLead:
    "Start on a development store, validate your playbook, then roll out to production when your team is aligned.",
  btnInstallCta: "Install on Shopify",
  btnExplore: "Explore capabilities",
  footerPrivacy: "Privacy",
  footerSupport: "Support",
  footerNote: "Not affiliated with Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Fewer high-risk refunds settled without review",
    },
    {
      value: "4.8h",
      label: "Median time saved on triage per merchant / week",
    },
    {
      value: "92%",
      label: "Return cases auto-routed with a clear risk band",
    },
  ],
  langLabel: "Language",
};

const ruLanding: LandingCopy = {
  metaTitle: "ReturnGuard AI | Контроль возвратов для Shopify",
  metaDescription:
    "ReturnGuard AI помогает командам Shopify выявлять рискованные возвраты, защищать маржу и ускорять решения по возвратам.",
  navProduct: "Продукт",
  navWorkflow: "Процесс",
  navInstall: "Установка",
  navPrivacy: "Конфиденциальность",
  navSupport: "Поддержка",
  navPreview: "Превью",
  heroEyebrow: "Shopify · Операции с возвратами",
  heroTitle: "Управляйте риском возвратов до удара по марже.",
  heroLede:
    "ReturnGuard AI собирает заявки на возврат в одну панель — со скорингом, объяснимыми причинами и аудитом — чтобы финансы и поддержка работали согласованно, не выходя из админки Shopify.",
  btnSeeInterface: "Смотреть интерфейс",
  installDisabled: "Установка отключена в этой среде.",
  labelStoreDomain: "Домен магазина",
  placeholderShop: "ваш-магазин.myshopify.com",
  btnInstall: "Установить приложение",
  chipEmbedded: "Встроенное приложение",
  chipQueue: "Очередь по возвратам",
  chipAudit: "История для аудита",
  mockAria: "Превью интерфейса",
  mockUrl: "admin.shopify.com · Возвраты",
  mockReturnsQueue: "Очередь возвратов",
  mockToday: "Сегодня · 12 открыто",
  mockLiveSync: "Синхронизация",
  mockPortfolioRisk: "Индекс риска портфеля",
  mockWeighted: "С весом по сумме и динамике",
  mockHighRisk: "Высокий риск",
  mockReview: "На проверке",
  mockApproved: "Одобрено",
  metricsAria: "Результаты",
  platformEyebrow: "Платформа",
  featTitle: "Всё, чтобы решать быстрее.",
  featLead:
    "Для магазинов, которые считают возвраты статьёй маржи — а не хвостом процессов.",
  features: [
    {
      title: "Реальные возвраты Shopify",
      description:
        "Каждая строка — живой Return в админке: статус, позиции и родительский заказ в одном месте.",
    },
    {
      title: "Понятный скоринг риска",
      description:
        "Сумма, оплата, фулфилмент и профиль клиента — как причины, а не «чёрный ящик».",
    },
    {
      title: "Сценарии под вашу политику",
      description:
        "Правила без кода: пороги, повторы, эскалация — без выхода из встроенного приложения.",
    },
    {
      title: "История решений и аналитика",
      description:
        "Одобрения, удержания и ревью фиксируются для комплаенса, обучения и трендов.",
    },
    {
      title: "Тарифы под биллинг",
      description:
        "От старта до масштаба — чтобы упаковка плана совпадала с серьёзностью контроля возвратов.",
    },
    {
      title: "Под встроенную админку",
      description:
        "Там, где уже работает команда — UI в духе Polaris внутри Shopify без переключения контекста.",
    },
  ],
  workflowEyebrow: "Как это работает",
  workflowTitle: "От установки до дисциплинированного разбора — в три шага.",
  steps: [
    {
      n: "01",
      title: "Подключение и доступы",
      text: "Установка на dev или prod; авторизация через стандартный OAuth и скоупы Shopify.",
    },
    {
      n: "02",
      title: "Настройка порогов",
      text: "Пороги review/hold, сценарии и то, что считать «рискованным» для вашего каталога.",
    },
    {
      n: "03",
      title: "Работа с очередью",
      text: "Разбор возвратов, решения в один клик, экспорт и аналитика без таблиц вручную.",
    },
  ],
  ctaTitle: "Ужесточить контроль возвратов?",
  ctaLead:
    "Начните с dev-магазина, проверьте сценарии, затем выкатывайте в прод, когда команда готова.",
  btnInstallCta: "Установить в Shopify",
  btnExplore: "Возможности продукта",
  footerPrivacy: "Конфиденциальность",
  footerSupport: "Поддержка",
  footerNote: "Не аффилировано с Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Меньше высокорисковых возвратов без проверки",
    },
    {
      value: "4.8h",
      label: "Медиана сэкономленного времени на разбор / неделя",
    },
    {
      value: "92%",
      label: "Кейсы с понятной зоной риска",
    },
  ],
  langLabel: "Язык",
};

export function getLandingCopy(locale: Locale): LandingCopy {
  return pickByLocale(LANDING_COPY, locale);
}
