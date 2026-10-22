import { Link } from "@tanstack/react-router";
import { Coil } from "@/components/brand/Coil";
import { useI18n } from "@/lib/i18n";
import { PICTURE_CREDITS } from "@/lib/credits";

type FooterPath = "/test" | "/speech" | "/profile" | "/history" | "/report" | "/data" | "/train" | "/science" | "/auditory-pathway" | "/risks" | "/team" | "/research" | "/validation";

/** The close of every page: the coil and the name built large, then the map of the site. */
export function SiteFooter() {
  const { t } = useI18n();
  const columns: { label: string; links: { to: FooterPath; label: string }[] }[] = [
    { label: t("nav.testGroup"), links: [{ to: "/test", label: t("nav.tone") }, { to: "/speech", label: t("nav.speech") }, { to: "/train", label: t("nav.train") }] },
    { label: t("nav.profile"), links: [{ to: "/profile", label: t("nav.profileMain") }, { to: "/history", label: t("nav.history") }, { to: "/report", label: t("nav.report") }, { to: "/data", label: t("nav.data") }] },
    { label: t("nav.learn"), links: [{ to: "/science", label: t("nav.science") }, { to: "/auditory-pathway", label: t("nav.pathway") }, { to: "/risks", label: t("nav.risks") }] },
    { label: t("nav.about"), links: [{ to: "/team", label: t("nav.team") }, { to: "/research", label: t("nav.research") }, { to: "/validation", label: t("nav.validation") }] },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-mark" aria-hidden>
          <Coil className="site-footer-coil" />
          <span className="site-footer-word" translate="no">Audiomaxxer</span>
        </div>

        <div className="site-footer-grid">
          <nav className="site-footer-links" aria-label={t("foot.map")}>
            {columns.map((c) => (
              <div key={c.label}>
                <h2>{c.label}</h2>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="site-footer-note">
            <p>{t("hero.fine")}</p>
            <Link to="/test" className="site-footer-cta">
              {t("hero.cta.test")}
            </Link>
          </div>
        </div>

        <div className="site-footer-base">
          <p>
            © {new Date().getFullYear()} <span translate="no">Audiomaxxer</span>
          </p>
          <p className="site-footer-credits">
            {t("foot.pictures")}{" "}
            {PICTURE_CREDITS.map((c, i) => (
              <span key={c.src}>
                {i > 0 ? " · " : ""}
                <a href={c.page} target="_blank" rel="noreferrer">
                  {c.title}
                </a>
                , {c.credit}, {c.licence}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
