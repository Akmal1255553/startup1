import type { LandingBaseCopy } from "../messages/landing";
import type { Locale } from "../types";

const en: LandingBaseCopy = {
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

const ru: LandingBaseCopy = {
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

const es: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Inteligencia de devoluciones para Shopify",
  metaDescription:
    "ReturnGuard AI ayuda a los equipos de Shopify a detectar devoluciones de riesgo, proteger márgenes y agilizar los reembolsos.",
  navProduct: "Producto",
  navWorkflow: "Flujo de trabajo",
  navInstall: "Instalar",
  navPrivacy: "Privacidad",
  navSupport: "Soporte",
  navPreview: "Ver vista previa",
  heroEyebrow: "Shopify · Operaciones de devoluciones",
  heroTitle: "Controle el riesgo de reembolso antes de que afecte su margen.",
  heroLede:
    "ReturnGuard AI reúne las solicitudes de devolución en una sola superficie de revisión — puntuadas, explicables y auditables — para que finanzas y soporte trabajen alineados sin salir del Admin de Shopify.",
  btnSeeInterface: "Ver interfaz",
  installDisabled: "El flujo de instalación está deshabilitado en este entorno.",
  labelStoreDomain: "Dominio de la tienda",
  placeholderShop: "su-tienda.myshopify.com",
  btnInstall: "Instalar aplicación",
  chipEmbedded: "Aplicación integrada",
  chipQueue: "Cola por devolución",
  chipAudit: "Historial apto para auditoría",
  mockAria: "Vista previa de la interfaz del producto",
  mockUrl: "admin.shopify.com · Devoluciones",
  mockReturnsQueue: "Cola de devoluciones",
  mockToday: "Hoy · 12 abiertas",
  mockLiveSync: "Sincronización en vivo",
  mockPortfolioRisk: "Índice de riesgo del portafolio",
  mockWeighted: "Ponderado por valor y velocidad",
  mockHighRisk: "Alto riesgo",
  mockReview: "Revisar",
  mockApproved: "Aprobado",
  metricsAria: "Resultados",
  platformEyebrow: "Plataforma",
  featTitle: "Todo lo que su equipo necesita para decidir más rápido.",
  featLead:
    "Diseñado para comerciantes que tratan las devoluciones como una partida de margen — no como un detalle secundario.",
  features: [
    {
      title: "Devoluciones reales de Shopify",
      description:
        "Cada fila se vincula a una Return activa en Admin: estado, contexto de línea y pedido principal en un solo lugar.",
    },
    {
      title: "Puntuación de riesgo explicable",
      description:
        "Valor, estado de pago, cumplimiento y señales del cliente aparecen como motivos, no como una caja negra.",
    },
    {
      title: "Playbooks acordes a su política",
      description:
        "Reglas sin código para umbrales, patrones repetidos y escalación — sin salir de la aplicación integrada.",
    },
    {
      title: "Historial de decisiones y analítica",
      description:
        "Aprobaciones, retenciones y revisiones quedan registradas para cumplimiento, formación y paneles de tendencias.",
    },
    {
      title: "Planes listos para facturación",
      description:
        "Niveles de inicio a escala para alinear el empaquetado con la seriedad del comerciante respecto a reembolsos.",
    },
    {
      title: "Pensado para Admin integrado",
      description:
        "Funciona donde ya trabaja su equipo — interfaz alineada con Polaris dentro de Shopify sin cambiar de contexto.",
    },
  ],
  workflowEyebrow: "Cómo funciona",
  workflowTitle: "De la instalación al triaje disciplinado — en tres pasos.",
  steps: [
    {
      n: "01",
      title: "Conectar y permisos",
      text: "Instale en su tienda de desarrollo o producción; las aprobaciones usan OAuth y permisos estándar de Shopify.",
    },
    {
      n: "02",
      title: "Ajustar umbrales",
      text: "Configure bandas de revisión y retención, reglas de playbook y qué significa «riesgoso» para su catálogo.",
    },
    {
      n: "03",
      title: "Gestionar la cola",
      text: "Clasifique devoluciones, registre decisiones con un clic, exporte o analice sin hojas de cálculo.",
    },
  ],
  ctaTitle: "¿Listo para reforzar su postura de devoluciones?",
  ctaLead:
    "Empiece en una tienda de desarrollo, valide su playbook y despliegue en producción cuando el equipo esté alineado.",
  btnInstallCta: "Instalar en Shopify",
  btnExplore: "Explorar capacidades",
  footerPrivacy: "Privacidad",
  footerSupport: "Soporte",
  footerNote: "No afiliado a Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Menos reembolsos de alto riesgo cerrados sin revisión",
    },
    {
      value: "4.8h",
      label: "Mediana de tiempo ahorrado en triaje por comerciante / semana",
    },
    {
      value: "92%",
      label: "Casos de devolución enrutados con una banda de riesgo clara",
    },
  ],
  langLabel: "Idioma",
};

const de: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Retouren-Intelligence für Shopify",
  metaDescription:
    "ReturnGuard AI hilft Shopify-Teams, riskante Retouren zu erkennen, Margen zu schützen und Erstattungen zügig abzuwickeln.",
  navProduct: "Produkt",
  navWorkflow: "Ablauf",
  navInstall: "Installieren",
  navPrivacy: "Datenschutz",
  navSupport: "Support",
  navPreview: "Vorschau ansehen",
  heroEyebrow: "Shopify · Retourenbetrieb",
  heroTitle: "Erstattungsrisiko kontrollieren, bevor es Ihre Marge trifft.",
  heroLede:
    "ReturnGuard AI bündelt Retourenanfragen auf einer Prüfoberfläche — bewertet, erklärbar und auditierbar — damit Finanzen und Support abgestimmt bleiben, ohne Shopify Admin zu verlassen.",
  btnSeeInterface: "Oberfläche ansehen",
  installDisabled: "Der Installationsablauf ist in dieser Umgebung deaktiviert.",
  labelStoreDomain: "Shop-Domain",
  placeholderShop: "ihr-shop.myshopify.com",
  btnInstall: "App installieren",
  chipEmbedded: "Eingebettete App",
  chipQueue: "Warteschlange pro Retoure",
  chipAudit: "Audit-freundlicher Verlauf",
  mockAria: "Vorschau der Produktoberfläche",
  mockUrl: "admin.shopify.com · Retouren",
  mockReturnsQueue: "Retouren-Warteschlange",
  mockToday: "Heute · 12 offen",
  mockLiveSync: "Live-Sync",
  mockPortfolioRisk: "Portfolio-Risikoindex",
  mockWeighted: "Gewichtet nach Wert und Geschwindigkeit",
  mockHighRisk: "Hohes Risiko",
  mockReview: "Prüfen",
  mockApproved: "Genehmigt",
  metricsAria: "Ergebnisse",
  platformEyebrow: "Plattform",
  featTitle: "Alles, was Ihr Team für schnellere Entscheidungen braucht.",
  featLead:
    "Für Händler, die Retouren als Margenposition behandeln — nicht als Nachgedanke.",
  features: [
    {
      title: "Echte Shopify-Retouren",
      description:
        "Jede Zeile verknüpft mit einer live Return in Admin — Status, Positionskontext und übergeordnete Bestellung an einem Ort.",
    },
    {
      title: "Erklärbares Risiko-Scoring",
      description:
        "Wert, Zahlungsstatus, Fulfillment und Kundensignale erscheinen als Gründe, nicht als Black Box.",
    },
    {
      title: "Playbooks passend zu Ihrer Policy",
      description:
        "No-Code-Regeln für Schwellen, Wiederholmuster und Eskalation — ohne die eingebettete App zu verlassen.",
    },
    {
      title: "Entscheidungspfad und Analytik",
      description:
        "Genehmigungen, Holds und Reviews werden für Compliance, Coaching und Trend-Dashboards erfasst.",
    },
    {
      title: "Abrechnungsfertige Pläne",
      description:
        "Von Starter bis Scale — Pakete passend zur Ernsthaftigkeit des Händlers bei Erstattungen.",
    },
    {
      title: "Für eingebettetes Admin gebaut",
      description:
        "Läuft dort, wo Ihr Team arbeitet — Polaris-konforme UI in Shopify ohne Kontextwechsel.",
    },
  ],
  workflowEyebrow: "So funktioniert es",
  workflowTitle: "Von der Installation zum disziplinierten Triage — in drei Schritten.",
  steps: [
    {
      n: "01",
      title: "Verbinden und Berechtigungen",
      text: "Installation im Dev- oder Produktions-Shop; Freigaben nutzen Standard-OAuth und Scopes von Shopify.",
    },
    {
      n: "02",
      title: "Schwellen feinjustieren",
      text: "Review- und Hold-Bänder, Playbook-Regeln und was „riskant“ für Ihren Katalog bedeutet.",
    },
    {
      n: "03",
      title: "Warteschlange bedienen",
      text: "Retouren triagieren, Entscheidungen per Klick protokollieren, exportieren oder analysieren ohne Tabellen.",
    },
  ],
  ctaTitle: "Bereit, Ihre Retouren-Haltung zu schärfen?",
  ctaLead:
    "Starten Sie im Entwicklungs-Shop, validieren Sie Ihr Playbook und rollen Sie aus, wenn das Team bereit ist.",
  btnInstallCta: "In Shopify installieren",
  btnExplore: "Funktionen entdecken",
  footerPrivacy: "Datenschutz",
  footerSupport: "Support",
  footerNote: "Nicht verbunden mit Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Weniger Hochrisiko-Erstattungen ohne Prüfung abgeschlossen",
    },
    {
      value: "4.8h",
      label: "Median eingesparte Triage-Zeit pro Händler / Woche",
    },
    {
      value: "92%",
      label: "Retourenfälle mit klarer Risikozone automatisch geroutet",
    },
  ],
  langLabel: "Sprache",
};

const fr: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Intelligence retours pour Shopify",
  metaDescription:
    "ReturnGuard AI aide les équipes Shopify à repérer les retours à risque, protéger les marges et accélérer les remboursements.",
  navProduct: "Produit",
  navWorkflow: "Processus",
  navInstall: "Installer",
  navPrivacy: "Confidentialité",
  navSupport: "Assistance",
  navPreview: "Voir l’aperçu",
  heroEyebrow: "Shopify · Opérations retours",
  heroTitle: "Maîtrisez le risque de remboursement avant qu’il n’atteigne votre marge.",
  heroLede:
    "ReturnGuard AI regroupe les demandes de retour sur une surface de revue unique — notées, explicables et auditables — pour que finance et support restent alignés sans quitter l’admin Shopify.",
  btnSeeInterface: "Voir l’interface",
  installDisabled: "Le flux d’installation est désactivé dans cet environnement.",
  labelStoreDomain: "Domaine de la boutique",
  placeholderShop: "votre-boutique.myshopify.com",
  btnInstall: "Installer l’application",
  chipEmbedded: "Application intégrée",
  chipQueue: "File par retour",
  chipAudit: "Historique prêt pour l’audit",
  mockAria: "Aperçu de l’interface produit",
  mockUrl: "admin.shopify.com · Retours",
  mockReturnsQueue: "File des retours",
  mockToday: "Aujourd’hui · 12 ouverts",
  mockLiveSync: "Synchronisation en direct",
  mockPortfolioRisk: "Indice de risque du portefeuille",
  mockWeighted: "Pondéré par valeur et vélocité",
  mockHighRisk: "Risque élevé",
  mockReview: "À revoir",
  mockApproved: "Approuvé",
  metricsAria: "Résultats",
  platformEyebrow: "Plateforme",
  featTitle: "Tout ce dont votre équipe a besoin pour décider plus vite.",
  featLead:
    "Conçu pour les marchands qui traitent les retours comme une ligne de marge — pas comme un détail.",
  features: [
    {
      title: "Vrais retours Shopify",
      description:
        "Chaque ligne est liée à un Return actif dans l’admin — statut, contexte de ligne et commande parente au même endroit.",
    },
    {
      title: "Score de risque explicable",
      description:
        "Valeur, état de paiement, expédition et signaux client apparaissent comme des raisons, pas une boîte noire.",
    },
    {
      title: "Playbooks alignés sur votre politique",
      description:
        "Règles sans code pour seuils, répétitions et escalade — sans quitter l’application intégrée.",
    },
    {
      title: "Traçabilité des décisions et analytique",
      description:
        "Approbations, mises en attente et revues sont enregistrées pour conformité, coaching et tableaux de bord.",
    },
    {
      title: "Offres prêtes pour la facturation",
      description:
        "Du starter à l’échelle pour aligner l’offre sur l’importance accordée aux remboursements.",
    },
    {
      title: "Conçu pour l’admin intégré",
      description:
        "Fonctionne là où votre équipe travaille déjà — interface Polaris dans Shopify sans changement de contexte.",
    },
  ],
  workflowEyebrow: "Comment ça marche",
  workflowTitle: "De l’installation au triage discipliné — en trois étapes.",
  steps: [
    {
      n: "01",
      title: "Connexion et périmètres",
      text: "Installation sur boutique dev ou production ; les autorisations utilisent OAuth et scopes Shopify standard.",
    },
    {
      n: "02",
      title: "Ajuster les seuils",
      text: "Bandes de revue et de mise en attente, règles de playbook et définition du « risqué » pour votre catalogue.",
    },
    {
      n: "03",
      title: "Piloter la file",
      text: "Triez les retours, enregistrez les décisions en un clic, exportez ou analysez sans tableurs.",
    },
  ],
  ctaTitle: "Prêt à renforcer votre posture retours ?",
  ctaLead:
    "Commencez sur une boutique de développement, validez votre playbook, puis déployez en production quand l’équipe est prête.",
  btnInstallCta: "Installer sur Shopify",
  btnExplore: "Explorer les capacités",
  footerPrivacy: "Confidentialité",
  footerSupport: "Assistance",
  footerNote: "Non affilié à Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Moins de remboursements à haut risque réglés sans revue",
    },
    {
      value: "4.8h",
      label: "Temps médian gagné sur le triage par marchand / semaine",
    },
    {
      value: "92%",
      label: "Cas de retour routés avec une bande de risque claire",
    },
  ],
  langLabel: "Langue",
};

const ptBR: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Inteligência de devoluções para Shopify",
  metaDescription:
    "O ReturnGuard AI ajuda equipes Shopify a sinalizar devoluções arriscadas, proteger margens e manter reembolsos ágeis.",
  navProduct: "Produto",
  navWorkflow: "Fluxo de trabalho",
  navInstall: "Instalar",
  navPrivacy: "Privacidade",
  navSupport: "Suporte",
  navPreview: "Ver prévia",
  heroEyebrow: "Shopify · Operações de devoluções",
  heroTitle: "Controle o risco de reembolso antes de atingir sua margem.",
  heroLede:
    "O ReturnGuard AI reúne solicitações de devolução em uma única superfície de revisão — pontuadas, explicáveis e auditáveis — para que finanças e suporte fiquem alinhados sem sair do Admin da Shopify.",
  btnSeeInterface: "Ver interface",
  installDisabled: "O fluxo de instalação está desativado neste ambiente.",
  labelStoreDomain: "Domínio da loja",
  placeholderShop: "sua-loja.myshopify.com",
  btnInstall: "Instalar aplicativo",
  chipEmbedded: "App incorporado",
  chipQueue: "Fila por devolução",
  chipAudit: "Histórico pronto para auditoria",
  mockAria: "Prévia da interface do produto",
  mockUrl: "admin.shopify.com · Devoluções",
  mockReturnsQueue: "Fila de devoluções",
  mockToday: "Hoje · 12 abertas",
  mockLiveSync: "Sincronização ao vivo",
  mockPortfolioRisk: "Índice de risco do portfólio",
  mockWeighted: "Ponderado por valor e velocidade",
  mockHighRisk: "Alto risco",
  mockReview: "Revisar",
  mockApproved: "Aprovado",
  metricsAria: "Resultados",
  platformEyebrow: "Plataforma",
  featTitle: "Tudo o que sua equipe precisa para decidir mais rápido.",
  featLead:
    "Feito para lojistas que tratam devoluções como linha de margem — não como detalhe secundário.",
  features: [
    {
      title: "Devoluções reais da Shopify",
      description:
        "Cada linha vincula a uma Return ativa no Admin — status, contexto da linha e pedido pai em um só lugar.",
    },
    {
      title: "Pontuação de risco explicável",
      description:
        "Valor, estado de pagamento, fulfillment e sinais do cliente aparecem como motivos, não como caixa-preta.",
    },
    {
      title: "Playbooks alinhados à sua política",
      description:
        "Regras sem código para limites, padrões repetidos e escalonamento — sem sair do app incorporado.",
    },
    {
      title: "Trilha de decisões e análises",
      description:
        "Aprovações, retenções e revisões ficam registradas para conformidade, treinamento e painéis de tendência.",
    },
    {
      title: "Planos prontos para cobrança",
      description:
        "Do starter à escala para alinhar o pacote à seriedade do lojista com reembolsos.",
    },
    {
      title: "Feito para o Admin incorporado",
      description:
        "Roda onde sua equipe já trabalha — UI alinhada ao Polaris dentro da Shopify sem troca de contexto.",
    },
  ],
  workflowEyebrow: "Como funciona",
  workflowTitle: "Da instalação à triagem disciplinada — em três passos.",
  steps: [
    {
      n: "01",
      title: "Conectar e escopos",
      text: "Instale na loja de desenvolvimento ou produção; aprovações usam OAuth e escopos padrão da Shopify.",
    },
    {
      n: "02",
      title: "Ajustar limites",
      text: "Configure faixas de revisão e retenção, regras de playbook e o que significa «arriscado» no seu catálogo.",
    },
    {
      n: "03",
      title: "Operar a fila",
      text: "Faça triagem de devoluções, registre decisões em um clique, exporte ou analise sem planilhas.",
    },
  ],
  ctaTitle: "Pronto para reforçar sua postura de devoluções?",
  ctaLead:
    "Comece em uma loja de desenvolvimento, valide seu playbook e implante em produção quando a equipe estiver alinhada.",
  btnInstallCta: "Instalar na Shopify",
  btnExplore: "Explorar recursos",
  footerPrivacy: "Privacidade",
  footerSupport: "Suporte",
  footerNote: "Não afiliado à Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Menos reembolsos de alto risco concluídos sem revisão",
    },
    {
      value: "4.8h",
      label: "Mediana de tempo economizado em triagem por lojista / semana",
    },
    {
      value: "92%",
      label: "Casos de devolução roteados com faixa de risco clara",
    },
  ],
  langLabel: "Idioma",
};

const ja: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Shopify向け返品インテリジェンス",
  metaDescription:
    "ReturnGuard AIはShopifyチームがリスクの高い返品を検知し、マージンを守り、返金処理を迅速に進めるのを支援します。",
  navProduct: "製品",
  navWorkflow: "ワークフロー",
  navInstall: "インストール",
  navPrivacy: "プライバシー",
  navSupport: "サポート",
  navPreview: "プレビューを見る",
  heroEyebrow: "Shopify · 返品オペレーション",
  heroTitle: "マージンに響く前に、返金リスクをコントロール。",
  heroLede:
    "ReturnGuard AIは返品リクエストを単一のレビュー画面に集約—スコア付け、説明可能、監査対応—財務とサポートがShopify管理画面を離れずに連携できます。",
  btnSeeInterface: "インターフェースを見る",
  installDisabled: "この環境ではインストールフローは無効です。",
  labelStoreDomain: "ストアドメイン",
  placeholderShop: "your-store.myshopify.com",
  btnInstall: "アプリをインストール",
  chipEmbedded: "埋め込みアプリ",
  chipQueue: "返品単位のキュー",
  chipAudit: "監査向け履歴",
  mockAria: "製品インターフェースのプレビュー",
  mockUrl: "admin.shopify.com · 返品",
  mockReturnsQueue: "返品キュー",
  mockToday: "本日 · 12件オープン",
  mockLiveSync: "ライブ同期",
  mockPortfolioRisk: "ポートフォリオリスク指数",
  mockWeighted: "金額と速度で加重",
  mockHighRisk: "高リスク",
  mockReview: "レビュー",
  mockApproved: "承認済み",
  metricsAria: "成果",
  platformEyebrow: "プラットフォーム",
  featTitle: "チームがより速く判断するために必要なすべて。",
  featLead:
    "返品をマージン項目として扱うマーチャント向けに設計—後回しの業務ではありません。",
  features: [
    {
      title: "実際のShopify返品",
      description:
        "各行は管理画面のライブReturnに紐づき—ステータス、明細コンテキスト、親注文を一箇所で確認。",
    },
    {
      title: "説明可能なリスクスコア",
      description:
        "金額、支払い状態、フルフィルメント、顧客シグナルが理由として表示—ブラックボックスではありません。",
    },
    {
      title: "ポリシーに合うプレイブック",
      description:
        "しきい値、繰り返しパターン、エスカレーションのノーコードルール—埋め込みアプリから離れずに設定。",
    },
    {
      title: "意思決定の履歴と分析",
      description:
        "承認、保留、レビューをコンプライアンス、コーチング、トレンドダッシュボード用に記録。",
    },
    {
      title: "課金対応プラン",
      description:
        "スターターからスケールまで—返金への本気度に合わせたパッケージング。",
    },
    {
      title: "埋め込み管理画面向け",
      description:
        "チームが既に働く場所で稼働—Shopify内のPolaris準拠UIでコンテキスト切替なし。",
    },
  ],
  workflowEyebrow: "仕組み",
  workflowTitle: "インストールから体系的なトリアージまで—3ステップ。",
  steps: [
    {
      n: "01",
      title: "接続とスコープ",
      text: "開発または本番ショップにインストール。承認は標準のShopify OAuthとスコープを使用。",
    },
    {
      n: "02",
      title: "しきい値の調整",
      text: "レビュー・保留バンド、プレイブックルール、カタログにおける「リスク」の定義を調整。",
    },
    {
      n: "03",
      title: "キューの運用",
      text: "返品をトリアージし、ワンクリックで決定を記録。スプレッドシートなしでエクスポート・分析。",
    },
  ],
  ctaTitle: "返品体制を強化する準備はできましたか？",
  ctaLead:
    "開発ストアで開始し、プレイブックを検証。チームが揃ったら本番へ展開。",
  btnInstallCta: "Shopifyにインストール",
  btnExplore: "機能を探る",
  footerPrivacy: "プライバシー",
  footerSupport: "サポート",
  footerNote: "Shopify Inc.とは提携していません。",
  metrics: [
    {
      value: "31%",
      label: "レビューなしで処理された高リスク返金の削減",
    },
    {
      value: "4.8h",
      label: "マーチャントあたり週のトリアージ時間の中央値削減",
    },
    {
      value: "92%",
      label: "明確なリスク帯で自動ルーティングされた返品ケース",
    },
  ],
  langLabel: "言語",
};

const it: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Intelligence sui resi per Shopify",
  metaDescription:
    "ReturnGuard AI aiuta i team Shopify a segnalare resi rischiosi, proteggere i margini e accelerare i rimborsi.",
  navProduct: "Prodotto",
  navWorkflow: "Flusso di lavoro",
  navInstall: "Installa",
  navPrivacy: "Privacy",
  navSupport: "Supporto",
  navPreview: "Anteprima",
  heroEyebrow: "Shopify · Operazioni resi",
  heroTitle: "Controlla il rischio di rimborso prima che colpisca il margine.",
  heroLede:
    "ReturnGuard AI riunisce le richieste di reso in un’unica superficie di revisione — con punteggio, spiegazioni e audit — così finanza e supporto restano allineati senza uscire dall’admin Shopify.",
  btnSeeInterface: "Vedi interfaccia",
  installDisabled: "Il flusso di installazione è disabilitato in questo ambiente.",
  labelStoreDomain: "Dominio del negozio",
  placeholderShop: "tuo-negozio.myshopify.com",
  btnInstall: "Installa app",
  chipEmbedded: "App incorporata",
  chipQueue: "Coda per reso",
  chipAudit: "Cronologia pronta per audit",
  mockAria: "Anteprima interfaccia prodotto",
  mockUrl: "admin.shopify.com · Resi",
  mockReturnsQueue: "Coda resi",
  mockToday: "Oggi · 12 aperti",
  mockLiveSync: "Sincronizzazione live",
  mockPortfolioRisk: "Indice di rischio del portafoglio",
  mockWeighted: "Ponderato per valore e velocità",
  mockHighRisk: "Alto rischio",
  mockReview: "Revisione",
  mockApproved: "Approvato",
  metricsAria: "Risultati",
  platformEyebrow: "Piattaforma",
  featTitle: "Tutto ciò che il team serve per decidere più in fretta.",
  featLead:
    "Pensato per merchant che trattano i resi come voce di margine — non come ripensamento.",
  features: [
    {
      title: "Resi Shopify reali",
      description:
        "Ogni riga è collegata a un Return live in Admin — stato, contesto riga e ordine padre in un solo posto.",
    },
    {
      title: "Punteggio di rischio spiegabile",
      description:
        "Valore, stato pagamento, evasione e segnali cliente compaiono come motivi, non come scatola nera.",
    },
    {
      title: "Playbook allineati alla policy",
      description:
        "Regole no-code per soglie, pattern ripetuti ed escalation — senza uscire dall’app incorporata.",
    },
    {
      title: "Traccia decisioni e analitiche",
      description:
        "Approvazioni, sospensioni e revisioni registrate per compliance, coaching e dashboard di trend.",
    },
    {
      title: "Piani pronti per la fatturazione",
      description:
        "Da starter a scale — packaging allineato a quanto il merchant è serio sui rimborsi.",
    },
    {
      title: "Fatto per Admin incorporato",
      description:
        "Funziona dove lavora già il team — UI allineata a Polaris in Shopify senza cambio contesto.",
    },
  ],
  workflowEyebrow: "Come funziona",
  workflowTitle: "Dall’installazione al triage disciplinato — in tre passi.",
  steps: [
    {
      n: "01",
      title: "Connessione e ambiti",
      text: "Installa sul negozio dev o produzione; le approvazioni usano OAuth e scope Shopify standard.",
    },
    {
      n: "02",
      title: "Regola le soglie",
      text: "Bande di revisione e sospensione, regole playbook e cosa significa «rischioso» per il catalogo.",
    },
    {
      n: "03",
      title: "Gestisci la coda",
      text: "Smista i resi, registra decisioni con un clic, esporta o analizza senza fogli di calcolo.",
    },
  ],
  ctaTitle: "Pronto a rafforzare la postura sui resi?",
  ctaLead:
    "Inizia su un negozio di sviluppo, valida il playbook, poi passa in produzione quando il team è allineato.",
  btnInstallCta: "Installa su Shopify",
  btnExplore: "Esplora le funzionalità",
  footerPrivacy: "Privacy",
  footerSupport: "Supporto",
  footerNote: "Non affiliato a Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Meno rimborsi ad alto rischio chiusi senza revisione",
    },
    {
      value: "4.8h",
      label: "Mediana tempo risparmiato sul triage per merchant / settimana",
    },
    {
      value: "92%",
      label: "Casi reso instradati con fascia di rischio chiara",
    },
  ],
  langLabel: "Lingua",
};

const nl: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Retourintelligentie voor Shopify",
  metaDescription:
    "ReturnGuard AI helpt Shopify-teams risicovolle retouren te signaleren, marges te beschermen en terugbetalingen vlot te houden.",
  navProduct: "Product",
  navWorkflow: "Workflow",
  navInstall: "Installeren",
  navPrivacy: "Privacy",
  navSupport: "Support",
  navPreview: "Voorbeeld bekijken",
  heroEyebrow: "Shopify · Retouroperaties",
  heroTitle: "Beheers terugbetalingsrisico voordat het uw marge raakt.",
  heroLede:
    "ReturnGuard AI bundelt retourverzoeken op één beoordelingsoverzicht — gescoord, uitlegbaar en auditbaar — zodat finance en support op één lijn blijven zonder Shopify Admin te verlaten.",
  btnSeeInterface: "Interface bekijken",
  installDisabled: "Installatiestroom is uitgeschakeld in deze omgeving.",
  labelStoreDomain: "Winkeldomein",
  placeholderShop: "uw-winkel.myshopify.com",
  btnInstall: "App installeren",
  chipEmbedded: "Ingesloten app",
  chipQueue: "Wachtrij per retour",
  chipAudit: "Auditvriendelijke geschiedenis",
  mockAria: "Voorbeeld productinterface",
  mockUrl: "admin.shopify.com · Retouren",
  mockReturnsQueue: "Retourwachtrij",
  mockToday: "Vandaag · 12 open",
  mockLiveSync: "Live synchronisatie",
  mockPortfolioRisk: "Portefeuillerisico-index",
  mockWeighted: "Gewogen op waarde en snelheid",
  mockHighRisk: "Hoog risico",
  mockReview: "Beoordelen",
  mockApproved: "Goedgekeurd",
  metricsAria: "Resultaten",
  platformEyebrow: "Platform",
  featTitle: "Alles wat uw team nodig heeft om sneller te beslissen.",
  featLead:
    "Gebouwd voor merchants die retouren als margepost zien — niet als bijzaak.",
  features: [
    {
      title: "Echte Shopify-retouren",
      description:
        "Elke rij koppelt aan een live Return in Admin — status, regelcontext en bovenliggende bestelling op één plek.",
    },
    {
      title: "Uitlegbare risicoscore",
      description:
        "Waarde, betaalstatus, fulfillment en klantsignalen als redenen, geen black box.",
    },
    {
      title: "Playbooks die bij uw beleid passen",
      description:
        "No-code regels voor drempels, herhalingspatronen en escalatie — zonder de ingesloten app te verlaten.",
    },
    {
      title: "Beslissingsspoor en analytics",
      description:
        "Goedkeuringen, holds en reviews vastgelegd voor compliance, coaching en trenddashboards.",
    },
    {
      title: "Factureringsklare plannen",
      description:
        "Van starter tot scale — pakketten afgestemd op hoe serieus de merchant over terugbetalingen is.",
    },
    {
      title: "Gebouwd voor ingesloten Admin",
      description:
        "Draait waar uw team al werkt — Polaris-conforme UI in Shopify zonder contextwissel.",
    },
  ],
  workflowEyebrow: "Hoe het werkt",
  workflowTitle: "Van installatie tot gedisciplineerde triage — in drie stappen.",
  steps: [
    {
      n: "01",
      title: "Verbinden en scopes",
      text: "Installeer op dev- of productiewinkel; goedkeuringen gebruiken standaard Shopify OAuth en scopes.",
    },
    {
      n: "02",
      title: "Drempels afstemmen",
      text: "Review- en hold-banden, playbookregels en wat «risicovol» betekent voor uw catalogus.",
    },
    {
      n: "03",
      title: "Wachtrij bedienen",
      text: "Retouren triageren, beslissingen in één klik vastleggen, exporteren of analyseren zonder spreadsheets.",
    },
  ],
  ctaTitle: "Klaar om uw retourhouding aan te scherpen?",
  ctaLead:
    "Start op een development store, valideer uw playbook en rol uit naar productie wanneer het team klaar is.",
  btnInstallCta: "Installeren op Shopify",
  btnExplore: "Mogelijkheden verkennen",
  footerPrivacy: "Privacy",
  footerSupport: "Support",
  footerNote: "Niet gelieerd aan Shopify Inc.",
  metrics: [
    {
      value: "31%",
      label: "Minder hoog-risico terugbetalingen zonder review afgehandeld",
    },
    {
      value: "4.8h",
      label: "Mediaan tijd bespaard op triage per merchant / week",
    },
    {
      value: "92%",
      label: "Retourzaken automatisch gerouteerd met duidelijke risicoband",
    },
  ],
  langLabel: "Taal",
};

const ko: LandingBaseCopy = {
  metaTitle: "ReturnGuard AI | Shopify 반품 인텔리전스",
  metaDescription:
    "ReturnGuard AI는 Shopify 팀이 위험한 반품을 표시하고, 마진을 보호하며, 환불 처리를 빠르게 유지하도록 돕습니다.",
  navProduct: "제품",
  navWorkflow: "워크플로",
  navInstall: "설치",
  navPrivacy: "개인정보",
  navSupport: "지원",
  navPreview: "미리보기",
  heroEyebrow: "Shopify · 반품 운영",
  heroTitle: "마진에 타기 전에 환불 위험을 통제하세요.",
  heroLede:
    "ReturnGuard AI는 반품 요청을 단일 검토 화면에 모읍니다—점수화, 설명 가능, 감사 가능—재무와 지원이 Shopify 관리자를 떠나지 않고도 정렬됩니다.",
  btnSeeInterface: "인터페이스 보기",
  installDisabled: "이 환경에서는 설치 흐름이 비활성화되어 있습니다.",
  labelStoreDomain: "스토어 도메인",
  placeholderShop: "your-store.myshopify.com",
  btnInstall: "앱 설치",
  chipEmbedded: "임베디드 앱",
  chipQueue: "반품 단위 대기열",
  chipAudit: "감사 친화적 기록",
  mockAria: "제품 인터페이스 미리보기",
  mockUrl: "admin.shopify.com · 반품",
  mockReturnsQueue: "반품 대기열",
  mockToday: "오늘 · 12건 열림",
  mockLiveSync: "실시간 동기화",
  mockPortfolioRisk: "포트폴리오 위험 지수",
  mockWeighted: "금액 및 속도 가중",
  mockHighRisk: "고위험",
  mockReview: "검토",
  mockApproved: "승인됨",
  metricsAria: "성과",
  platformEyebrow: "플랫폼",
  featTitle: "팀이 더 빠르게 결정하는 데 필요한 모든 것.",
  featLead:
    "반품을 마진 항목으로 다루는 판매자를 위해 설계—사후 처리가 아닙니다.",
  features: [
    {
      title: "실제 Shopify 반품",
      description:
        "각 행은 관리자의 라이브 Return에 연결—상태, 라인 컨텍스트, 상위 주문을 한곳에서.",
    },
    {
      title: "설명 가능한 위험 점수",
      description:
        "금액, 결제 상태, 이행, 고객 신호가 이유로 표시—블랙박스가 아닙니다.",
    },
    {
      title: "정책에 맞는 플레이북",
      description:
        "임계값, 반복 패턴, 에스컬레이션용 노코드 규칙—임베디드 앱을 떠나지 않고.",
    },
    {
      title: "결정 기록 및 분석",
      description:
        "승인, 보류, 검토를 컴플라이언스, 코칭, 트렌드 대시보드용으로 기록.",
    },
    {
      title: "결제 준비 플랜",
      description:
        "스타터부터 스케일까지—환불에 대한 판매자의 진지함에 맞는 패키징.",
    },
    {
      title: "임베디드 관리자용",
      description:
        "팀이 이미 일하는 곳에서 실행—Shopify 내 Polaris 정렬 UI로 컨텍스트 전환 없음.",
    },
  ],
  workflowEyebrow: "작동 방식",
  workflowTitle: "설치부터 체계적 분류까지—세 단계.",
  steps: [
    {
      n: "01",
      title: "연결 및 권한",
      text: "개발 또는 프로덕션 스토어에 설치; 승인은 표준 Shopify OAuth 및 스코프를 사용합니다.",
    },
    {
      n: "02",
      title: "임계값 조정",
      text: "검토·보류 밴드, 플레이북 규칙, 카탈로그에서 «위험»의 의미를 조정합니다.",
    },
    {
      n: "03",
      title: "대기열 운영",
      text: "반품을 분류하고, 원클릭으로 결정을 기록하며, 스프레드시트 없이 보내거나 분석합니다.",
    },
  ],
  ctaTitle: "반품 체계를 강화할 준비가 되셨나요?",
  ctaLead:
    "개발 스토어에서 시작해 플레이북을 검증한 뒤, 팀이 정렬되면 프로덕션으로 배포하세요.",
  btnInstallCta: "Shopify에 설치",
  btnExplore: "기능 살펴보기",
  footerPrivacy: "개인정보",
  footerSupport: "지원",
  footerNote: "Shopify Inc.와 제휴 관계가 아닙니다.",
  metrics: [
    {
      value: "31%",
      label: "검토 없이 처리된 고위험 환불 감소",
    },
    {
      value: "4.8h",
      label: "판매자당 주간 분류 시간 절감 중앙값",
    },
    {
      value: "92%",
      label: "명확한 위험 구간으로 자동 라우팅된 반품 사례",
    },
  ],
  langLabel: "언어",
};

export const LANDING_COPY: Record<Locale, LandingBaseCopy> = {
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
