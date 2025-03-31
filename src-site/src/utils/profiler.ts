// You may already have these constants defined in a separate file:
import { SIG_TOOLKIT_URL, TMX_ORG_ID, SIG_SCRIPT_DOMAIN } from "./constants";

/**
 * We declare a global interface for `window.threatmetrix` so TypeScript
 * recognizes it and doesn't complain about missing definitions.
 */
declare global {
  interface Window {
    threatmetrix?: {
      /**
       * This `profile` function is provided by the ThreatMetrix script.
       * The arguments typically include:
       *  - domain: The domain associated with the script (SIG_SCRIPT_DOMAIN).
       *  - orgId: The organization ID (TMX_ORG_ID).
       *  - sessionId: The session ID or user token to associate with the request.
       *  - pageId: A unique ID for the page or screen within your application.
       */
      profile?: (
        domain: string,
        orgId: string,
        sessionId: string,
        pageId: number,
      ) => void;
    };
  }
}

/**
 * Handles TMX profiling by loading the ThreatMetrix script if needed
 * and then calling its `profile` method with the given parameters.
 *
 * @param sessionId A unique identifier for the user's session.
 * @param pageId    A unique ID for the page or view in your application.
 */
const handleTmxProfiling = (sessionId: string, pageId: number): void => {
  // If TMX is already loaded in the page, just call its `profile` function.
  if (window.threatmetrix?.profile) {
    window.threatmetrix.profile(
      SIG_SCRIPT_DOMAIN,
      TMX_ORG_ID,
      sessionId,
      pageId,
    );
    return;
  }

  // If the script is already being fetched (someone else started loading it),
  // we don't want to load it multiple times. Just bail out.
  if (document.querySelector(`script[src*="${SIG_TOOLKIT_URL}"]`)) {
    console.log("TMX script is already in the process of being loaded.");
    return;
  }

  // Otherwise, we need to load the ThreatMetrix script dynamically.
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = SIG_TOOLKIT_URL;

  // When the script is done loading, check if the `profile` method is available
  // and call it. Otherwise, log an error.
  script.onload = () => {
    if (window.threatmetrix?.profile) {
      window.threatmetrix.profile(
        SIG_SCRIPT_DOMAIN,
        TMX_ORG_ID,
        sessionId,
        pageId,
      );
    } else {
      console.error(
        "TMX script loaded, but window.threatmetrix.profile is not defined.",
      );
    }
  };

  // If the script fails to load (blocked by an ad blocker or network error),
  // dispatch a custom event so that React can pick it up.
  script.onerror = () => {
    console.error(
      "TMX script failed to load – likely blocked by an adblocker.",
    );
    // eslint-disable-next-line no-undef
    document.dispatchEvent(new CustomEvent("tmx-script-error"));
  };

  // Append the newly created script to the <head>, triggering the network request.
  document.head.appendChild(script);
};

/**
 * Main function to initiate profiling.
 *
 * @param sessionId A unique identifier for the user's session.
 * @param pageId    A unique ID for the page or view in your application.
 */
export const profileTMX = (sessionId: string, pageId: number): void => {
  // We call handleTmxProfiling, which will either run ThreatMetrix immediately
  // if it's already loaded, or load it if it isn't.
  handleTmxProfiling(sessionId, pageId);
};
