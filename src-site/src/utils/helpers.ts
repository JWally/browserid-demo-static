export const getSessionId = () => {
  const sessionId =
    sessionStorage.getItem("session-id") ||
    Math.random().toString().replace(/\./g, "") +
      "-" +
      Math.random().toString().replace(/\./g, "");
  sessionStorage.setItem("session-id", sessionId);
  return sessionId;
};
