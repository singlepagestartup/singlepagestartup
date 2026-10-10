import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  createHostStudioState,
  type IHostStudioState,
} from "../../../../../../workspace/utils/host-studio/index";

export interface IHostStudioProviderProps {
  children: ReactNode;
  state?: IHostStudioState;
  initialState?: IHostStudioState;
  onStateChange?: (state: IHostStudioState) => void;
}
interface IHostStudioContext {
  state: IHostStudioState;
  update: (change: (state: IHostStudioState) => IHostStudioState) => void;
}
const HostStudioContext = createContext<IHostStudioContext | null>(null);
export function HostStudioProvider({
  children,
  state: controlled,
  initialState,
  onStateChange,
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
    <HostStudioContext.Provider value={{ state, update }}>
      {children}
    </HostStudioContext.Provider>
  );
}
export function useHostStudio() {
  const context = useContext(HostStudioContext);
  if (!context) throw new Error("Host components require HostStudioProvider.");
  return context;
}
