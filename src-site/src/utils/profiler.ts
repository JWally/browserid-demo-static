export const loadProfiler = (sessionId: string) => {
  const script = document.createElement("script");
  script.src = `https://static.browserid.info/dev-jw.loader.js?sessionId=${sessionId}&version=dev-jw.lite&profile=true`;
  document.head.appendChild(script);
  script.onload = () => document.head.removeChild(script);
};
