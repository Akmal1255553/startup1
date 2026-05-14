import type { ReactNode } from "react";

/**
 * Public-facing layout for legal/support pages. These pages are reached
 * directly from the App Store listing (Privacy policy URL, Support URL),
 * so they must render without any Shopify auth and look reasonable on
 * mobile. We keep styling inline so we don't have to wire up another
 * stylesheet outside of `_index`.
 */
export function LegalLayout({
  title,
  intro,
  updated,
  privacyLabel,
  supportLabel,
  headerExtra,
  children,
}: {
  title: string;
  intro?: string;
  updated: string;
  privacyLabel: string;
  supportLabel: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <a href="/" style={styles.brand}>
          ReturnGuard AI
        </a>
        <nav style={styles.nav}>
          <a href="/privacy" style={styles.navLink}>
            {privacyLabel}
          </a>
          <a href="/support" style={styles.navLink}>
            {supportLabel}
          </a>
          {headerExtra ? <div style={styles.navExtra}>{headerExtra}</div> : null}
        </nav>
      </header>

      <main style={styles.main}>
        <p style={styles.eyebrow}>Last updated · {updated}</p>
        <h1 style={styles.h1}>{title}</h1>
        {intro ? <p style={styles.lede}>{intro}</p> : null}
        <div style={styles.body}>{children}</div>
      </main>

      <footer style={styles.footer}>
        <span>ReturnGuard AI · Not affiliated with Shopify Inc.</span>
        <span>
          <a href="/privacy" style={styles.footerLink}>
            {privacyLabel}
          </a>
          {" · "}
          <a href="/support" style={styles.footerLink}>
            {supportLabel}
          </a>
        </span>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
    color: "#1a1c20",
    background: "#fafafa",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 32px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  brand: {
    fontWeight: 600,
    fontSize: 18,
    color: "#1a1c20",
    textDecoration: "none",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-end",
  },
  navExtra: {
    marginLeft: 4,
  },
  navLink: {
    color: "#4b5563",
    textDecoration: "none",
    fontSize: 14,
  },
  main: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "56px 32px",
    flex: 1,
    width: "100%",
    boxSizing: "border-box",
  },
  eyebrow: {
    color: "#6b7280",
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    margin: 0,
  },
  h1: {
    fontFamily: "'Fraunces', Georgia, serif",
    fontWeight: 600,
    fontSize: 40,
    lineHeight: 1.15,
    margin: "12px 0 16px",
    color: "#0d1117",
  },
  lede: {
    fontSize: 18,
    lineHeight: 1.55,
    color: "#374151",
    margin: "0 0 32px",
  },
  body: {
    fontSize: 16,
    lineHeight: 1.65,
    color: "#1f2937",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderTop: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: 13,
    background: "#ffffff",
  },
  footerLink: {
    color: "#4b5563",
    textDecoration: "none",
  },
};
