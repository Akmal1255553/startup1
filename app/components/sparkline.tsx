type SparklineTone = "success" | "critical" | "attention" | "info";

const TONE_TO_BACKGROUND: Record<SparklineTone, string> = {
  success: "var(--p-color-bg-fill-success)",
  critical: "var(--p-color-bg-fill-critical)",
  attention: "var(--p-color-bg-fill-warning)",
  info: "var(--p-color-bg-fill-info)",
};

/**
 * Lightweight, dependency-free sparkline used for activity trends.
 * Bars are rendered with Polaris CSS variables so the visual stays
 * consistent with the rest of the admin theme.
 */
export function Sparkline({
  values,
  tone = "info",
  height = 36,
  barWidth = 6,
  gap = 2,
  ariaLabel,
}: {
  values: number[];
  tone?: SparklineTone;
  height?: number;
  barWidth?: number;
  gap?: number;
  ariaLabel?: string;
}) {
  const peak = Math.max(1, ...values);
  const background = TONE_TO_BACKGROUND[tone];

  return (
    <div
      role="img"
      aria-label={ariaLabel || `${values.length}-point trend`}
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: `${gap}px`,
        height: `${height}px`,
      }}
    >
      {values.map((value, index) => {
        const ratio = value / peak;
        const barHeight = Math.max(2, Math.round(ratio * height));
        return (
          <div
            key={index}
            title={`${value}`}
            style={{
              width: `${barWidth}px`,
              height: `${barHeight}px`,
              borderRadius: 2,
              background,
              opacity: value === 0 ? 0.25 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
