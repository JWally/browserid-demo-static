// test/setup.ts
import path from "path";
import { fileURLToPath } from "url";

// Convert ES module paths to commonjs paths for imports
// only if you actually need these lines:

// @ts-expect-error we just need this to be quite...
globalThis.__filename = fileURLToPath(import.meta.url);
globalThis.__dirname = path.dirname(globalThis.__filename);

// Place any other global test setup or mocks here...
