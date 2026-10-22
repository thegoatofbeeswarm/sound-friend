import { useEffect, type ReactNode } from "react";

export type Theme = "light";

/** Runs before hydration so the light theme is applied without a flash. */
export const themeBootstrapScript = `(function(){try{document.documentElement.classList.remove("dark");document.documentElement.dataset['theme']="light";}catch(e){}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.dataset['theme'] = "light";
  }, []);

  return <>{children}</>;
}

export function useTheme() {
  return {
    theme: "light" as Theme,
    setTheme: () => {},
    toggleTheme: () => {},
  };
}
