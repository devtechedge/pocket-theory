export function ThemeScript() {
  const bootCode = `
    (function () {
      try {
        var stored = window.localStorage.getItem("pt-theme");
        var theme = stored === "dark" || stored === "light" ? stored : "light";
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.colorScheme = "light";
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: bootCode }} />;
}
