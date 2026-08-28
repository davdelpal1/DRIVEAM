import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Con `globals: false` hay que registrar la limpieza del DOM entre tests a mano.
afterEach(() => {
  cleanup();
});
