export const getSessionId = (): string => {
  const sessionId =
    sessionStorage.getItem("session-id") ||
    Math.random().toString().replace(/\./g, "") +
      "-" +
      Math.random().toString().replace(/\./g, "");
  sessionStorage.setItem("session-id", sessionId);
  return sessionId;
};

// // Declare the interface for our return type.
// interface BrowserInfo {
//   "x-jw-browser": string;
//   "x-jw-browser-version": string;
//   "x-jw-browser-platform": string;
// }

// // Extend the Navigator interface to include Brave's API.
// declare global {
//   interface Navigator {
//     brave?: {
//       isBrave: () => Promise<boolean>;
//     };
//     platform?: string;
//   }
// }

// export async function getBrowserInfo(): Promise<BrowserInfo> {
//   try {
//     const ua: string = navigator.userAgent;
//     let browser: string = "Unknown";
//     let version: string = "Unknown";

//     // Detect Brave first.
//     if (navigator.brave && typeof navigator.brave.isBrave === "function") {
//       try {
//         const isBrave: boolean = await navigator.brave.isBrave();
//         if (isBrave) {
//           browser = "Brave";
//           // Brave's UA is similar to Chrome's; extract the Chrome version.
//           const match = ua.match(/Chrome\/([\d.]+)/);
//           if (match && match[1]) {
//             version = match[1];
//           }
//           return {
//             "x-jw-browser": browser,
//             "x-jw-browser-version": version,
//             "x-jw-browser-platform": navigator.platform || "Unknown",
//           };
//         }
//       } catch (error) {
//         console.error("Error detecting Brave:", error);
//       }
//     }

//     // Regular expression matching for other browsers.
//     let match: RegExpMatchArray | null;
//     if ((match = ua.match(/Edg\/([\d.]+)/)) !== null) {
//       browser = "Edge";
//       version = match[1];
//     } else if ((match = ua.match(/OPR\/([\d.]+)/)) !== null) {
//       browser = "Opera";
//       version = match[1];
//     } else if ((match = ua.match(/Chrome\/([\d.]+)/)) !== null) {
//       browser = "Chrome";
//       version = match[1];
//     } else if ((match = ua.match(/Firefox\/([\d.]+)/)) !== null) {
//       browser = "Firefox";
//       version = match[1];
//     } else if ((match = ua.match(/Version\/([\d.]+).*Safari/)) !== null) {
//       // Safari includes a Version number before "Safari" in the UA string.
//       browser = "Safari";
//       version = match[1];
//     } else if ((match = ua.match(/Mullivad\/([\d.]+)/)) !== null) {
//       // Assuming Mullivad Browser includes its name in the UA.
//       browser = "Mullivad";
//       version = match[1];
//     }

//     return {
//       "x-jw-browser": browser,
//       "x-jw-browser-version": version,
//       "x-jw-browser-platform": navigator.platform || "Unknown",
//     };
//   } catch (error) {
//     console.error("Error in getBrowserInfo:", error);
//     return {
//       "x-jw-browser": "Unknown",
//       "x-jw-browser-version": "Unknown",
//       "x-jw-browser-platform": "Unknown",
//     };
//   }
// }
