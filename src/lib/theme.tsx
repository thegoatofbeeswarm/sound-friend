import { useEffect, type ReactNode } from "react";

export type Theme = "dark";

/** Runs before hydration so the dark theme is applied without a flash. */
export const themeBootstrapScript = `(function(){try{document.documentElement.classList.add("dark");document.documentElement.dataset['theme']="dark";}catch(e){}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.dataset['theme'] = "dark";
  }, []);

  return <>{children}</>;
}

export function useTheme() {
  return {
    theme: "dark" as Theme,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
