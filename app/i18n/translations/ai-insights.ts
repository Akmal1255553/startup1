import type { InsightCopy } from "../messages/ai-insights-copy";
import type { Locale } from "../types";

const en: InsightCopy = {
  noDataTitle: "Not enough data yet",
  noDataMessage:
    "Once your team starts moderating returns, insights about trends, anomalies, and recommended playbooks will appear here.",
  noDataCta: "Open queue",
  allClearTitle: "Operations look healthy",
  allClearMessage:
    "No anomalies, trend reversals, or unusual patterns detected in the last 30 days.",
  firstWeekTitle: "First moderation week",
  firstWeekMessage: (count) =>
    `Your team handled ${count} return decisions this week. Insights will sharpen with more history.`,
  trendUpTitle: (pct) => `Return moderation volume up ${pct}% week-over-week`,
  trendDownTitle: (pct) =>
    `Return moderation volume down ${pct}% week-over-week`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `Your team handled ${thisWeek} return decisions in the last 7 days, vs ${lastWeek} the week before. Consider adding playbooks to absorb the load.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volume has dropped from ${lastWeek} to ${thisWeek} decisions over the last 7 days — either fewer disputes or your playbooks are auto-clearing more cases.`,
  trendCta: "Open playbooks",
  approvalDropTitle: (pts) => `Approval rate dropped ${pts} points`,
  approvalRiseTitle: (pts) => `Approval rate climbed ${pts} points`,
  approvalDropMessage: (thisRate, lastRate) =>
    `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). More cases are being held or sent for review — review your hold threshold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). Either trust signals improved, or your playbooks are resolving more cases automatically.`,
  approvalCta: "Tune thresholds",
  resetTitle: "Frequent resets detected",
  resetMessage: (resets, ratio) =>
    `${resets} decisions were reset this week (${ratio}% of all actions). This may indicate your thresholds or playbooks need tuning to match real merchant intent.`,
  resetCta: "Review settings",
  anomalyTitle: "Unusual moderation spike",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} return decisions were processed on ${date} — ${multiplier}× your 30-day average of ${avg}/day. Check whether a single SKU or customer segment is driving this.`,
  anomalyCta: "Open analytics",
  holdTitle: "High hold concentration",
  holdMessage: (ratio) =>
    `${ratio}% of all actions this week were holds. If this is consistent with policy, consider creating a playbook to automate the pattern and free up support time.`,
  holdCta: "Create playbook",
};

const ru: InsightCopy = {
  noDataTitle: "Пока недостаточно данных",
  noDataMessage:
    "Когда команда начнёт модерировать возвраты, здесь появятся инсайты о трендах, аномалиях и рекомендуемых сценариях.",
  noDataCta: "Открыть очередь",
  allClearTitle: "Операции в норме",
  allClearMessage:
    "За последние 30 дней аномалий, резких изменений трендов или необычных паттернов не обнаружено.",
  firstWeekTitle: "Первая неделя модерации",
  firstWeekMessage: (count) =>
    `На этой неделе обработано ${count} решений по возвратам. С накоплением истории инсайты станут точнее.`,
  trendUpTitle: (pct) => `Объём модерации вырос на ${pct}% к прошлой неделе`,
  trendDownTitle: (pct) => `Объём модерации снизился на ${pct}% к прошлой неделе`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `За 7 дней обработано ${thisWeek} решений, на прошлой неделе было ${lastWeek}. Рассмотрите добавление сценариев для разгрузки команды.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Объём снизился с ${lastWeek} до ${thisWeek} решений за 7 дней — меньше споров или сценарии чаще закрывают кейсы автоматически.`,
  trendCta: "Открыть сценарии",
  approvalDropTitle: (pts) => `Доля одобрений снизилась на ${pts} п.п.`,
  approvalRiseTitle: (pts) => `Доля одобрений выросла на ${pts} п.п.`,
  approvalDropMessage: (thisRate, lastRate) =>
    `На этой неделе одобрено ${thisRate}% возвратов (было ${lastRate}%). Больше кейсов уходит на проверку или удержание — проверьте пороги.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `На этой неделе одобрено ${thisRate}% возвратов (было ${lastRate}%). Сигналы доверия улучшились или сценарии закрывают больше кейсов сами.`,
  approvalCta: "Настроить пороги",
  resetTitle: "Частые сбросы решений",
  resetMessage: (resets, ratio) =>
    `${resets} решений сброшено на этой неделе (${ratio}% всех действий). Возможно, пороги или сценарии не соответствуют вашей политике.`,
  resetCta: "Открыть настройки",
  anomalyTitle: "Необычный всплеск модерации",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} решений обработано ${date} — в ${multiplier}× выше среднего за 30 дней (${avg}/день). Проверьте, не связан ли всплеск с одним SKU или сегментом клиентов.`,
  anomalyCta: "Открыть аналитику",
  holdTitle: "Много удержаний",
  holdMessage: (ratio) =>
    `${ratio}% действий на этой неделе — удержания. Если это соответствует политике, автоматизируйте паттерн сценарием, чтобы разгрузить поддержку.`,
  holdCta: "Создать сценарий",
};

const es: InsightCopy = {
  noDataTitle: "Aún no hay datos suficientes",
  noDataMessage:
    "Cuando su equipo empiece a moderar devoluciones, aquí verá tendencias, anomalías y playbooks recomendados.",
  noDataCta: "Abrir cola",
  allClearTitle: "Las operaciones se ven sanas",
  allClearMessage:
    "No se detectaron anomalías, cambios bruscos de tendencia ni patrones inusuales en los últimos 30 días.",
  firstWeekTitle: "Primera semana de moderación",
  firstWeekMessage: (count) =>
    `Su equipo gestionó ${count} decisiones de devolución esta semana. Los insights mejorarán con más historial.`,
  trendUpTitle: (pct) =>
    `Volumen de moderación de devoluciones +${pct}% respecto a la semana anterior`,
  trendDownTitle: (pct) =>
    `Volumen de moderación de devoluciones −${pct}% respecto a la semana anterior`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `En los últimos 7 días gestionó ${thisWeek} decisiones frente a ${lastWeek} la semana anterior. Considere añadir playbooks para absorber la carga.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `El volumen bajó de ${lastWeek} a ${thisWeek} decisiones en 7 días: menos disputas o más casos resueltos automáticamente por playbooks.`,
  trendCta: "Abrir playbooks",
  approvalDropTitle: (pts) => `La tasa de aprobación bajó ${pts} puntos`,
  approvalRiseTitle: (pts) => `La tasa de aprobación subió ${pts} puntos`,
  approvalDropMessage: (thisRate, lastRate) =>
    `Esta semana se aprobó el ${thisRate}% de devoluciones moderadas (antes ${lastRate}%). Más casos van a revisión o retención: revise el umbral de hold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `Esta semana se aprobó el ${thisRate}% (antes ${lastRate}%). Mejoraron las señales de confianza o los playbooks resuelven más casos solos.`,
  approvalCta: "Ajustar umbrales",
  resetTitle: "Reinicios frecuentes detectados",
  resetMessage: (resets, ratio) =>
    `Se reiniciaron ${resets} decisiones esta semana (${ratio}% de todas las acciones). Puede que umbrales o playbooks no reflejen su política real.`,
  resetCta: "Revisar ajustes",
  anomalyTitle: "Pico inusual de moderación",
  anomalyMessage: (value, date, multiplier, avg) =>
    `El ${date} se procesaron ${value} decisiones — ${multiplier}× su media de 30 días (${avg}/día). Compruebe si un SKU o segmento lo impulsa.`,
  anomalyCta: "Abrir analítica",
  holdTitle: "Alta concentración de retenciones",
  holdMessage: (ratio) =>
    `El ${ratio}% de las acciones esta semana fueron retenciones. Si encaja con su política, automatice el patrón con un playbook.`,
  holdCta: "Crear playbook",
};

const de: InsightCopy = {
  noDataTitle: "Noch nicht genug Daten",
  noDataMessage:
    "Sobald Ihr Team Retouren moderiert, erscheinen hier Einblicke zu Trends, Anomalien und empfohlenen Playbooks.",
  noDataCta: "Warteschlange öffnen",
  allClearTitle: "Betrieb wirkt stabil",
  allClearMessage:
    "In den letzten 30 Tagen wurden keine Anomalien, Trendumkehrungen oder ungewöhnlichen Muster erkannt.",
  firstWeekTitle: "Erste Moderationswoche",
  firstWeekMessage: (count) =>
    `Ihr Team hat diese Woche ${count} Retourenentscheidungen bearbeitet. Mit mehr Historie werden die Insights präziser.`,
  trendUpTitle: (pct) =>
    `Retouren-Moderationsvolumen +${pct}% gegenüber Vorwoche`,
  trendDownTitle: (pct) =>
    `Retouren-Moderationsvolumen −${pct}% gegenüber Vorwoche`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `In den letzten 7 Tagen ${thisWeek} Entscheidungen vs. ${lastWeek} in der Vorwoche. Erwägen Sie Playbooks zur Entlastung.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volumen sank von ${lastWeek} auf ${thisWeek} in 7 Tagen — weniger Streitfälle oder mehr Auto-Freigaben durch Playbooks.`,
  trendCta: "Playbooks öffnen",
  approvalDropTitle: (pts) => `Genehmigungsrate um ${pts} Punkte gesunken`,
  approvalRiseTitle: (pts) => `Genehmigungsrate um ${pts} Punkte gestiegen`,
  approvalDropMessage: (thisRate, lastRate) =>
    `Diese Woche ${thisRate}% genehmigt (vorher ${lastRate}%). Mehr Fälle in Prüfung oder Hold — Hold-Schwelle prüfen.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `Diese Woche ${thisRate}% genehmigt (vorher ${lastRate}%). Bessere Vertrauenssignale oder mehr Auto-Lösungen durch Playbooks.`,
  approvalCta: "Schwellen anpassen",
  resetTitle: "Häufige Zurücksetzungen",
  resetMessage: (resets, ratio) =>
    `${resets} Entscheidungen wurden diese Woche zurückgesetzt (${ratio}% aller Aktionen). Schwellen oder Playbooks passen möglicherweise nicht zur Policy.`,
  resetCta: "Einstellungen prüfen",
  anomalyTitle: "Ungewöhnlicher Moderationsspitze",
  anomalyMessage: (value, date, multiplier, avg) =>
    `Am ${date} wurden ${value} Entscheidungen verarbeitet — ${multiplier}× Ihrem 30-Tage-Durchschnitt von ${avg}/Tag.`,
  anomalyCta: "Analytik öffnen",
  holdTitle: "Hohe Hold-Konzentration",
  holdMessage: (ratio) =>
    `${ratio}% aller Aktionen diese Woche waren Holds. Bei passender Policy: Muster per Playbook automatisieren.`,
  holdCta: "Playbook erstellen",
};

const fr: InsightCopy = {
  noDataTitle: "Pas encore assez de données",
  noDataMessage:
    "Dès que votre équipe modère des retours, des insights sur tendances, anomalies et playbooks recommandés apparaîtront ici.",
  noDataCta: "Ouvrir la file",
  allClearTitle: "Les opérations semblent saines",
  allClearMessage:
    "Aucune anomalie, inversion de tendance ou motif inhabituel détecté sur les 30 derniers jours.",
  firstWeekTitle: "Première semaine de modération",
  firstWeekMessage: (count) =>
    `Votre équipe a traité ${count} décisions de retour cette semaine. Les insights gagneront en précision avec l'historique.`,
  trendUpTitle: (pct) =>
    `Volume de modération des retours +${pct}% semaine sur semaine`,
  trendDownTitle: (pct) =>
    `Volume de modération des retours −${pct}% semaine sur semaine`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `${thisWeek} décisions sur 7 jours vs ${lastWeek} la semaine précédente. Envisagez des playbooks pour absorber la charge.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Le volume est passé de ${lastWeek} à ${thisWeek} en 7 jours — moins de litiges ou plus de cas auto-résolus.`,
  trendCta: "Ouvrir les playbooks",
  approvalDropTitle: (pts) => `Taux d'approbation en baisse de ${pts} points`,
  approvalRiseTitle: (pts) => `Taux d'approbation en hausse de ${pts} points`,
  approvalDropMessage: (thisRate, lastRate) =>
    `${thisRate}% des retours modérés approuvés cette semaine (contre ${lastRate}% avant). Plus de retenues ou de revues — vérifiez le seuil de hold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `${thisRate}% approuvés cette semaine (contre ${lastRate}%). Signaux de confiance améliorés ou playbooks plus efficaces.`,
  approvalCta: "Ajuster les seuils",
  resetTitle: "Réinitialisations fréquentes",
  resetMessage: (resets, ratio) =>
    `${resets} décisions réinitialisées cette semaine (${ratio}% des actions). Seuils ou playbooks à recaler sur votre politique.`,
  resetCta: "Voir les paramètres",
  anomalyTitle: "Pic de modération inhabituel",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} décisions le ${date} — ${multiplier}× votre moyenne sur 30 jours (${avg}/jour). Vérifiez un SKU ou segment client.`,
  anomalyCta: "Ouvrir l'analytique",
  holdTitle: "Forte concentration de retenues",
  holdMessage: (ratio) =>
    `${ratio}% des actions cette semaine étaient des holds. Si cela correspond à la politique, automatisez via un playbook.`,
  holdCta: "Créer un playbook",
};

const ptBR: InsightCopy = {
  noDataTitle: "Dados insuficientes por enquanto",
  noDataMessage:
    "Quando sua equipe começar a moderar devoluções, insights sobre tendências, anomalias e playbooks recomendados aparecerão aqui.",
  noDataCta: "Abrir fila",
  allClearTitle: "Operações parecem saudáveis",
  allClearMessage:
    "Nenhuma anomalia, reversão de tendência ou padrão incomum nos últimos 30 dias.",
  firstWeekTitle: "Primeira semana de moderação",
  firstWeekMessage: (count) =>
    `Sua equipe tratou ${count} decisões de devolução esta semana. Os insights ficarão mais precisos com mais histórico.`,
  trendUpTitle: (pct) =>
    `Volume de moderação de devoluções +${pct}% em relação à semana anterior`,
  trendDownTitle: (pct) =>
    `Volume de moderação de devoluções −${pct}% em relação à semana anterior`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `${thisWeek} decisões nos últimos 7 dias vs ${lastWeek} na semana anterior. Considere playbooks para absorver a carga.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volume caiu de ${lastWeek} para ${thisWeek} em 7 dias — menos disputas ou mais casos resolvidos automaticamente.`,
  trendCta: "Abrir playbooks",
  approvalDropTitle: (pts) => `Taxa de aprovação caiu ${pts} pontos`,
  approvalRiseTitle: (pts) => `Taxa de aprovação subiu ${pts} pontos`,
  approvalDropMessage: (thisRate, lastRate) =>
    `${thisRate}% das devoluções moderadas foram aprovadas esta semana (era ${lastRate}%). Mais casos em revisão ou retenção — revise o limite de hold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `${thisRate}% aprovadas esta semana (era ${lastRate}%). Sinais de confiança melhoraram ou playbooks resolvem mais casos sozinhos.`,
  approvalCta: "Ajustar limites",
  resetTitle: "Redefinições frequentes detectadas",
  resetMessage: (resets, ratio) =>
    `${resets} decisões foram redefinidas esta semana (${ratio}% de todas as ações). Limites ou playbooks podem precisar de ajuste.`,
  resetCta: "Revisar configurações",
  anomalyTitle: "Pico incomum de moderação",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} decisões em ${date} — ${multiplier}× sua média de 30 dias (${avg}/dia). Verifique se um SKU ou segmento impulsiona isso.`,
  anomalyCta: "Abrir análises",
  holdTitle: "Alta concentração de retenções",
  holdMessage: (ratio) =>
    `${ratio}% das ações esta semana foram retenções. Se isso reflete a política, automatize com um playbook.`,
  holdCta: "Criar playbook",
};

const ja: InsightCopy = {
  noDataTitle: "データがまだ不足しています",
  noDataMessage:
    "チームが返品のモデレーションを始めると、トレンド、異常、推奨プレイブックのインサイトがここに表示されます。",
  noDataCta: "キューを開く",
  allClearTitle: "運用は健全です",
  allClearMessage:
    "過去30日間に異常、トレンドの急変、珍しいパターンは検出されませんでした。",
  firstWeekTitle: "初めてのモデレーション週",
  firstWeekMessage: (count) =>
    `今週、チームは返品決定を${count}件処理しました。履歴が増えるほどインサイトは精緻になります。`,
  trendUpTitle: (pct) => `返品モデレーション量が前週比${pct}%増`,
  trendDownTitle: (pct) => `返品モデレーション量が前週比${pct}%減`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `過去7日間で${thisWeek}件（前週${lastWeek}件）。負荷軽減のためプレイブックの追加を検討してください。`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `7日間で${lastWeek}件から${thisWeek}件に減少 — 紛争減少かプレイブックによる自動処理増加の可能性があります。`,
  trendCta: "プレイブックを開く",
  approvalDropTitle: (pts) => `承認率が${pts}ポイント低下`,
  approvalRiseTitle: (pts) => `承認率が${pts}ポイント上昇`,
  approvalDropMessage: (thisRate, lastRate) =>
    `今週の承認率は${thisRate}%（前週${lastRate}%）。保留・レビューが増えています — 保留しきい値を確認してください。`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `今週の承認率は${thisRate}%（前週${lastRate}%）。信頼シグナルの改善かプレイブックによる自動解決の増加です。`,
  approvalCta: "しきい値を調整",
  resetTitle: "リセットが頻繁に検出されました",
  resetMessage: (resets, ratio) =>
    `今週${resets}件の決定がリセットされました（全アクションの${ratio}%）。しきい値やプレイブックの見直しが必要かもしれません。`,
  resetCta: "設定を確認",
  anomalyTitle: "異常なモデレーション急増",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${date}に${value}件処理 — 30日平均${avg}/日の${multiplier}倍。特定SKUや顧客セグメントを確認してください。`,
  anomalyCta: "分析を開く",
  holdTitle: "保留が集中しています",
  holdMessage: (ratio) =>
    `今週のアクションの${ratio}%が保留です。方針に合致するならプレイブックで自動化を検討してください。`,
  holdCta: "プレイブックを作成",
};

const it: InsightCopy = {
  noDataTitle: "Dati ancora insufficienti",
  noDataMessage:
    "Quando il team inizierà a moderare i resi, qui compariranno insight su trend, anomalie e playbook consigliati.",
  noDataCta: "Apri coda",
  allClearTitle: "Le operazioni sembrano sane",
  allClearMessage:
    "Nessuna anomalia, inversione di trend o pattern insolito negli ultimi 30 giorni.",
  firstWeekTitle: "Prima settimana di moderazione",
  firstWeekMessage: (count) =>
    `Il team ha gestito ${count} decisioni sui resi questa settimana. Gli insight miglioreranno con più storico.`,
  trendUpTitle: (pct) =>
    `Volume moderazione resi +${pct}% rispetto alla settimana precedente`,
  trendDownTitle: (pct) =>
    `Volume moderazione resi −${pct}% rispetto alla settimana precedente`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `${thisWeek} decisioni negli ultimi 7 giorni vs ${lastWeek} la settimana prima. Valuta playbook per assorbire il carico.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volume sceso da ${lastWeek} a ${thisWeek} in 7 giorni — meno contestazioni o più casi risolti automaticamente.`,
  trendCta: "Apri playbook",
  approvalDropTitle: (pts) => `Tasso di approvazione −${pts} punti`,
  approvalRiseTitle: (pts) => `Tasso di approvazione +${pts} punti`,
  approvalDropMessage: (thisRate, lastRate) =>
    `Questa settimana approvato il ${thisRate}% (era ${lastRate}%). Più hold o revisioni — controlla la soglia di hold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `Questa settimana approvato il ${thisRate}% (era ${lastRate}%). Segnali di fiducia migliorati o più risoluzioni automatiche.`,
  approvalCta: "Regola soglie",
  resetTitle: "Reset frequenti rilevati",
  resetMessage: (resets, ratio) =>
    `${resets} decisioni reimpostate questa settimana (${ratio}% delle azioni). Soglie o playbook da allineare alla policy.`,
  resetCta: "Rivedi impostazioni",
  anomalyTitle: "Picco insolito di moderazione",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} decisioni il ${date} — ${multiplier}× la media a 30 giorni (${avg}/giorno).`,
  anomalyCta: "Apri analitiche",
  holdTitle: "Alta concentrazione di hold",
  holdMessage: (ratio) =>
    `Il ${ratio}% delle azioni questa settimana erano hold. Se coerente con la policy, automatizza con un playbook.`,
  holdCta: "Crea playbook",
};

const nl: InsightCopy = {
  noDataTitle: "Nog niet genoeg gegevens",
  noDataMessage:
    "Zodra uw team retouren gaat modereren, verschijnen hier inzichten over trends, anomalieën en aanbevolen playbooks.",
  noDataCta: "Wachtrij openen",
  allClearTitle: "Operaties zien er gezond uit",
  allClearMessage:
    "Geen anomalieën, trendomkeringen of ongebruikelijke patronen in de afgelopen 30 dagen.",
  firstWeekTitle: "Eerste moderatieweek",
  firstWeekMessage: (count) =>
    `Uw team behandelde ${count} retourbeslissingen deze week. Inzichten worden scherper met meer geschiedenis.`,
  trendUpTitle: (pct) =>
    `Retourmoderatievolume +${pct}% week-op-week`,
  trendDownTitle: (pct) =>
    `Retourmoderatievolume −${pct}% week-op-week`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `${thisWeek} beslissingen in 7 dagen vs ${lastWeek} de week ervoor. Overweeg playbooks om de last te verlichten.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volume daalde van ${lastWeek} naar ${thisWeek} in 7 dagen — minder geschillen of meer auto-afhandeling.`,
  trendCta: "Playbooks openen",
  approvalDropTitle: (pts) => `Goedkeuringspercentage −${pts} punten`,
  approvalRiseTitle: (pts) => `Goedkeuringspercentage +${pts} punten`,
  approvalDropMessage: (thisRate, lastRate) =>
    `Deze week ${thisRate}% goedgekeurd (was ${lastRate}%). Meer holds of reviews — controleer de hold-drempel.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `Deze week ${thisRate}% goedgekeurd (was ${lastRate}%). Betere vertrouwenssignalen of meer automatische oplossingen.`,
  approvalCta: "Drempels afstemmen",
  resetTitle: "Frequente resets gedetecteerd",
  resetMessage: (resets, ratio) =>
    `${resets} beslissingen gereset deze week (${ratio}% van alle acties). Drempels of playbooks passen mogelijk niet bij uw beleid.`,
  resetCta: "Instellingen bekijken",
  anomalyTitle: "Ongebruikelijke moderatiespike",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} beslissingen op ${date} — ${multiplier}× uw 30-dagen gemiddelde van ${avg}/dag.`,
  anomalyCta: "Analyse openen",
  holdTitle: "Hoge hold-concentratie",
  holdMessage: (ratio) =>
    `${ratio}% van alle acties deze week waren holds. Bij passend beleid: patroon automatiseren met een playbook.`,
  holdCta: "Playbook maken",
};

const ko: InsightCopy = {
  noDataTitle: "아직 데이터가 부족합니다",
  noDataMessage:
    "팀이 반품을 조정하기 시작하면 트렌드, 이상 징후, 권장 플레이북 인사이트가 여기에 표시됩니다.",
  noDataCta: "대기열 열기",
  allClearTitle: "운영 상태가 양호합니다",
  allClearMessage:
    "지난 30일 동안 이상 징후, 추세 반전 또는 비정상 패턴이 감지되지 않았습니다.",
  firstWeekTitle: "첫 조정 주",
  firstWeekMessage: (count) =>
    `이번 주 팀이 반품 결정 ${count}건을 처리했습니다. 기록이 쌓일수록 인사이트가 정교해집니다.`,
  trendUpTitle: (pct) => `반품 조정량 전주 대비 ${pct}% 증가`,
  trendDownTitle: (pct) => `반품 조정량 전주 대비 ${pct}% 감소`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `최근 7일 ${thisWeek}건(전주 ${lastWeek}건). 부하 완화를 위해 플레이북 추가를 고려하세요.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `7일간 ${lastWeek}건에서 ${thisWeek}건으로 감소 — 분쟁 감소 또는 플레이북 자동 처리 증가일 수 있습니다.`,
  trendCta: "플레이북 열기",
  approvalDropTitle: (pts) => `승인률 ${pts}포인트 하락`,
  approvalRiseTitle: (pts) => `승인률 ${pts}포인트 상승`,
  approvalDropMessage: (thisRate, lastRate) =>
    `이번 주 승인률 ${thisRate}%(이전 ${lastRate}%). 보류·검토가 늘었습니다 — 보류 임계값을 확인하세요.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `이번 주 승인률 ${thisRate}%(이전 ${lastRate}%). 신뢰 신호 개선 또는 플레이북 자동 해결 증가입니다.`,
  approvalCta: "임계값 조정",
  resetTitle: "잦은 재설정 감지",
  resetMessage: (resets, ratio) =>
    `이번 주 ${resets}건의 결정이 재설정되었습니다(전체 작업의 ${ratio}%). 임계값이나 플레이북 조정이 필요할 수 있습니다.`,
  resetCta: "설정 검토",
  anomalyTitle: "비정상적인 조정 급증",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${date}에 ${value}건 처리 — 30일 평균 ${avg}/일의 ${multiplier}배. 특정 SKU나 고객 세그먼트를 확인하세요.`,
  anomalyCta: "분석 열기",
  holdTitle: "보류 집중도가 높음",
  holdMessage: (ratio) =>
    `이번 주 작업의 ${ratio}%가 보류였습니다. 정책과 일치한다면 플레이북으로 자동화를 검토하세요.`,
  holdCta: "플레이북 만들기",
};

export const INSIGHT_COPY: Record<Locale, InsightCopy> = {
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
