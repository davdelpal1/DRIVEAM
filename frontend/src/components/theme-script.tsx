const SCRIPT = `
try {
  var t = window.localStorage.getItem("driveam-theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

/** Aplica el tema guardado antes de pintar, para evitar el parpadeo claro→oscuro. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
