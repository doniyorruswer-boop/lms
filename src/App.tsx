/**
 * Root application component.
 *
 * Global providerlar (`Providers`) bilan o'ralgan holda RBAC-himoyalangan
 * marshrut daraxtini (`router`) `RouterProvider` orqali render qiladi
 * (tasklar 13.1, 13.2).
 */
import { RouterProvider } from "react-router-dom";

import { ErrorBoundary } from "./app/error-boundary";
import { Providers } from "./app/providers";
import { router } from "./app/router";

function App() {
  return (
    <ErrorBoundary level="app">
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  );
}

export default App;
