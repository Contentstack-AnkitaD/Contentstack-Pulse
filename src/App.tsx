import React, { Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MarketplaceAppProvider } from "./MarketplaceAppProvider";
import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const FullPageApp = React.lazy(() => import("./routes/FullPageApp"));
const AppConfigurationExtension = React.lazy(() => import("./routes/AppConfiguration"));

const loadingFallback = (
  <div className="pulse-loader">
    <div className="pulse-loader__spinner" />
    <p>Loading Pulse...</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MarketplaceAppProvider>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={loadingFallback}>
                  <FullPageApp />
                </Suspense>
              }
            />
            <Route
              path="/full-page"
              element={
                <Suspense fallback={loadingFallback}>
                  <FullPageApp />
                </Suspense>
              }
            />
            <Route
              path="/app-configuration"
              element={
                <Suspense fallback={loadingFallback}>
                  <AppConfigurationExtension />
                </Suspense>
              }
            />
          </Routes>
        </MarketplaceAppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
