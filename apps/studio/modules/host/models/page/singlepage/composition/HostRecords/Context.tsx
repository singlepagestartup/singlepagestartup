import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import type { IHostRelationManagerProps } from "./Relations";
import {
  createHostStudioState,
  type IHostStudioState,
} from "../../../../../../../workspace/utils/host-studio/index";

export interface IHostStudioProviderProps {
  children: ReactNode;
  state?: IHostStudioState;
  initialState?: IHostStudioState;
  onStateChange?: (state: IHostStudioState) => void;
  RelationManager?: ComponentType<IHostRelationManagerProps>;
}
interface IHostStudioContext {
  state: IHostStudioState;
  update: (change: (state: IHostStudioState) => IHostStudioState) => void;
  RelationManager?: ComponentType<IHostRelationManagerProps>;
}
const HostStudioContext = createContext<IHostStudioContext | null>(null);
export function HostStudioProvider({
  children,
  state: controlled,
  initialState,
  onStateChange,
  RelationManager,
}: IHostStudioProviderProps) {
  const [local, setLocal] = useState(
    () => initialState ?? createHostStudioState(),
  );
  const state = controlled ?? local;
  const update = useCallback(
    (change: (state: IHostStudioState) => IHostStudioState) => {
      // Controlled stories hand ownership to their caller; local stories use React's updater.
      if (controlled) onStateChange?.(change(controlled));
      else setLocal(change);
    },
    [controlled, onStateChange],
  );
  return (
    <HostStudioContext.Provider value={{ state, update, RelationManager }}>
      {children}
    </HostStudioContext.Provider>
  );
}
export function useHostStudio() {
  const context = useContext(HostStudioContext);
  if (!context) throw new Error("Host components require HostStudioProvider.");
  return context;
}
