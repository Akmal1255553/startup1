import type { Locale } from "../../types";

export type OnboardingCopy = {
  title: string;
  subtitle: string;
  skip: string;
  progressTitle: string;
  progressComplete: (shop: string) => string;
  progressStep: (current: number, total: number, label: string) => string;
  hide: string;
  resetDev: string;
  badgeDone: string;
  badgeSaving: string;
  badgeUpNext: string;
  badgeCurrent: string;
  stepWelcome: string;
  stepScopes: string;
  stepPlaybook: string;
  stepSettings: string;
  stepDone: string;
  s1Title: string;
  s1Body: string;
  s1Bullets: string[];
  s1Continue: string;
  s2Title: string;
  s2Body: string;
  s2Missing: string;
  s2Success: string;
  scopeGranted: string;
  scopeMissing: string;
  s2SubmitMissing: string;
  s2SubmitOk: string;
  s3Title: string;
  s3Body: string;
  s3Create: string;
  s3Skip: string;
  s3Link: string;
  s4Title: string;
  s4Body: string;
  s4Finish: string;
  completeBadge: string;
  completeTitle: string;
  completeBody: string;
  openQueue: string;
  backDashboard: string;
};

const en: OnboardingCopy = {
  title: "Get started with ReturnGuard AI",
  subtitle: "Four quick steps to start scoring returns automatically",
  skip: "Skip for now",
  progressTitle: "Setup progress",
  progressComplete: (shop) => `Onboarding complete for ${shop}.`,
  progressStep: (current, total, label) =>
    `Step ${current} of ${total} — ${label}`,
  hide: "Hide onboarding",
  resetDev: "Reset (dev only)",
  badgeDone: "Done",
  badgeSaving: "Saving…",
  badgeUpNext: "Up next",
  badgeCurrent: "Current",
  stepWelcome: "Welcome",
  stepScopes: "Connection",
  stepPlaybook: "Playbook",
  stepSettings: "Thresholds",
  stepDone: "Done",
  s1Title: "1. Welcome — what ReturnGuard does",
  s1Body:
    "ReturnGuard scores refund risk inside Shopify Admin so your team can approve, review, or hold returns with confidence.",
  s1Bullets: [
    "Live queue tied to Shopify Returns",
    "Explainable risk scores and narratives",
    "Optional playbooks for automation",
    "Audit-friendly decision history on paid plans",
  ],
  s1Continue: "Got it — continue",
  s2Title: "2. Connection — Shopify access",
  s2Body:
    "ReturnGuard needs read access to orders, returns, products, and customers to score risk.",
  s2Missing: "Some required scopes are missing. Reinstall or update permissions.",
  s2Success: "All required scopes look good.",
  scopeGranted: "Granted",
  scopeMissing: "Missing",
  s2SubmitMissing: "Grant missing scopes first",
  s2SubmitOk: "Looks good — continue",
  s3Title: "3. First playbook — automate the easy cases",
  s3Body:
    "We'll add a starter playbook that auto-approves low-risk, paid, fulfilled orders.",
  s3Create: "Create starter playbook",
  s3Skip: "Skip — I'll add later",
  s3Link: "Manage playbooks anytime from the Playbooks page.",
  s4Title: "4. Risk thresholds — your call",
  s4Body:
    "Default thresholds work for most stores. You can tune them later in Settings.",
  s4Finish: "Use defaults — finish setup",
  completeBadge: "All set",
  completeTitle: "You're ready to go",
  completeBody:
    "Open the returns queue to review live risk scores, or return to the dashboard.",
  openQueue: "Open Returns queue",
  backDashboard: "Back to dashboard",
};

const ru: OnboardingCopy = {
  title: "Начало работы с ReturnGuard AI",
  subtitle: "Четыре шага, чтобы автоматически оценивать возвраты",
  skip: "Пропустить",
  progressTitle: "Прогресс настройки",
  progressComplete: (shop) => `Настройка завершена для ${shop}.`,
  progressStep: (current, total, label) =>
    `Шаг ${current} из ${total} — ${label}`,
  hide: "Скрыть онбординг",
  resetDev: "Сброс (только dev)",
  badgeDone: "Готово",
  badgeSaving: "Сохранение…",
  badgeUpNext: "Далее",
  badgeCurrent: "Текущий",
  stepWelcome: "Приветствие",
  stepScopes: "Подключение",
  stepPlaybook: "Сценарий",
  stepSettings: "Пороги",
  stepDone: "Готово",
  s1Title: "1. Что делает ReturnGuard",
  s1Body:
    "ReturnGuard оценивает риск возврата в Shopify Admin, чтобы команда могла одобрять, проверять или удерживать возвраты уверенно.",
  s1Bullets: [
    "Живая очередь по возвратам Shopify",
    "Понятные оценки риска и пояснения",
    "Сценарии для автоматизации",
    "История решений на платных тарифах",
  ],
  s1Continue: "Понятно — далее",
  s2Title: "2. Подключение — доступ Shopify",
  s2Body:
    "Нужен доступ на чтение заказов, возвратов, товаров и клиентов для оценки риска.",
  s2Missing: "Не хватает прав. Переустановите приложение или обновите доступ.",
  s2Success: "Все нужные права выданы.",
  scopeGranted: "Есть",
  scopeMissing: "Нет",
  s2SubmitMissing: "Сначала выдайте права",
  s2SubmitOk: "Всё в порядке — далее",
  s3Title: "3. Первый сценарий",
  s3Body:
    "Добавим стартовый сценарий для авто-одобрения низкорисковых оплаченных выполненных заказов.",
  s3Create: "Создать стартовый сценарий",
  s3Skip: "Пропустить",
  s3Link: "Сценарии можно менять на странице «Сценарии».",
  s4Title: "4. Пороги риска",
  s4Body:
    "Пороги по умолчанию подходят большинству магазинов. Позже — в «Настройки».",
  s4Finish: "Оставить по умолчанию — завершить",
  completeBadge: "Готово",
  completeTitle: "Можно работать",
  completeBody: "Откройте очередь возвратов или вернитесь на панель.",
  openQueue: "Очередь возвратов",
  backDashboard: "На панель",
};

export function getOnboardingCopy(locale: Locale): OnboardingCopy {
  return locale === "ru" ? ru : en;
}
