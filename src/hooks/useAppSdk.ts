import { atom, useAtom } from "jotai";
import UiLocation from "@contentstack/app-sdk/dist/src/uiLocation";

export const appSdkRefAtom = atom<UiLocation | null>(null);

export const useAppSdk = (): [UiLocation | null, Function] => {
  return useAtom(appSdkRefAtom);
};
