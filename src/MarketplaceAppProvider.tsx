import React, { useEffect } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { KeyValueObj } from "./types";
import { useAppSdk } from "./hooks/useAppSdk";
import { useAppConfig } from "./hooks/useAppConfig";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";

type ProviderProps = {
  children?: React.ReactNode;
};

export const MarketplaceAppProvider: React.FC<ProviderProps> = ({ children }) => {
  console.log("[Pulse] MarketplaceAppProvider rendering");
  const [, setAppSdk] = useAppSdk();
  const [, setConfig] = useAppConfig();

  // Try SDK init in background — don't block rendering
  useEffect(() => {
    (async () => {
      try {
        const sdk: UiLocation = await ContentstackAppSDK.init();
        setAppSdk(sdk);
        const appConfig: KeyValueObj = await sdk.getConfig();
        setConfig(appConfig);
        console.log("[Pulse] SDK initialized");
      } catch (err) {
        console.warn("[Pulse] SDK init skipped — using direct CMA API");
      }
    })();
  }, [setAppSdk, setConfig]);

  // Always render children — we use direct CMA calls, not SDK
  return <>{children}</>;
};
