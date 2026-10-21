import { SiteNav } from "@/components/SiteNav";
import EarHero from "@/components/home/EarHero";

export function ClassicHome() {
  return (
    <div className="am-home min-h-screen text-foreground">
      <section className="relative isolate">
        <SiteNav transparent />
        <EarHero />
      </section>
    </div>
  );
}
