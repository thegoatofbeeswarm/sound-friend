import { SiteNav } from "@/components/SiteNav";
import EarHero from "@/components/home/EarHero";
import HomeSections from "@/components/home/HomeSections";

export function ClassicHome() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteNav />
      <EarHero />
      <HomeSections />
    </div>
  );
}
