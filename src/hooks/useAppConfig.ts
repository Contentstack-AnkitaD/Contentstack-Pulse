import { useAtom } from "jotai";
import { appConfigAtom } from "../store";
import { KeyValueObj } from "../types";

export const useAppConfig = (): [KeyValueObj, Function] => {
  return useAtom(appConfigAtom);
};
