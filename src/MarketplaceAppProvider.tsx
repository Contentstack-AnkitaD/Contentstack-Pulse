import React, { useEffect, useState } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { KeyValueObj } from "./types";
import { getAppLocation } from "./common/utils";
import { isNull } from "lodash";
import { useAppSdk } from "./hooks/useAppSdk";
import { useAppConfig } from "./hooks/useAppConfig";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";

type ProviderProps = {
  children?: React.ReactNode;
};

export const MarketplaceAppProvider: React.FC<ProviderProps> = ({ children }) => {
  const [failed, setFailed] = useState<boolean>(false);
  const [appSdk, setAppSdk] = useAppSdk();
  const [, setConfig] = useAppConfig();

  useEffect(() => {
    (async () => {
      try {
        const sdk: UiLocation = await ContentstackAppSDK.init();
        const region = sdk.getCurrentRegion() as string;
        sessionStorage.setItem("region", region);
        setAppSdk(sdk);

        const appConfig: KeyValueObj = await sdk.getConfig();
        setConfig(appConfig);

        localStorage.setItem(`cs_key_${region}`, sdk?.stack._data.api_key || "");
        const branchName = sdk?.stack.getCurrentBranch()?.uid;
        localStorage.setItem(`branch_name_${region}`, branchName || "main");
        sessionStorage.setItem("org_uid", sdk?.stack._data.org_uid || "");
        sessionStorage.setItem("user_id", sdk?.currentUser?.uid || "");

        const appLocation: string = getAppLocation(sdk);
        console.log("[Pulse] SDK initialized:", { region, appLocation });
      } catch (err) {
        console.error("[Pulse] SDK initialization failed:", err);
        setFailed(true);
      }
    })();
  }, [setAppSdk, setConfig]);

  if (!failed && isNull(appSdk)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-gray-500">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-pulse-primary rounded-full animate-spin-slow" />
        <p className="text-sm">Initializing Pulse...</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2 text-red-500">
        <h2 className="text-lg font-semibold">Failed to load Pulse</h2>
        <p className="text-sm text-gray-500">Please ensure this app is running inside Contentstack.</p>
      </div>
    );
  }

  return <>{children}</>;
};
