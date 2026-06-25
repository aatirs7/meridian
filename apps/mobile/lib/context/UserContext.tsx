import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import type { Identity, SyncResponse } from "@meridian/shared";
import { useApi } from "../useApi";

interface UserContextValue {
  me: Identity | null;
  other: Identity | null;
  today: string | null;
  neutralDaysEnabled: boolean;
  /** True once sync has succeeded at least once this session. */
  ready: boolean;
  /** True while the first sync is in flight. */
  isLoading: boolean;
  /** Non-null when the signed-in user is not on the allowlist (403). */
  rejected: boolean;
  refresh: () => Promise<void>;
  reset: () => void;
}

const UserContext = createContext<UserContextValue>({
  me: null,
  other: null,
  today: null,
  neutralDaysEnabled: false,
  ready: false,
  isLoading: false,
  rejected: false,
  refresh: async () => {},
  reset: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const call = useApi();

  const [me, setMe] = useState<Identity | null>(null);
  const [other, setOther] = useState<Identity | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [neutralDaysEnabled, setNeutralDaysEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rejected, setRejected] = useState(false);

  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    try {
      const res = await call<SyncResponse>("/api/auth/sync", {
        method: "POST",
        body: JSON.stringify({}),
        timeoutMs: 20000,
        retries: 1,
      });
      setMe(res.me);
      setOther(res.other);
      setToday(res.today);
      setNeutralDaysEnabled(res.neutralDaysEnabled);
      setReady(true);
      setRejected(false);
    } catch (err) {
      // A 403 means this Apple account isn't one of the two allowed users.
      if ((err as { status?: number })?.status === 403) {
        setRejected(true);
      }
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [call]);

  const reset = useCallback(() => {
    setMe(null);
    setOther(null);
    setToday(null);
    setReady(false);
    setRejected(false);
  }, []);

  // Sync once when the user becomes signed in.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && !ready && !inFlight.current) {
      void refresh();
    }
    if (!isSignedIn && (ready || me)) {
      reset();
    }
  }, [isLoaded, isSignedIn, ready, me, refresh, reset]);

  return (
    <UserContext.Provider
      value={{
        me,
        other,
        today,
        neutralDaysEnabled,
        ready,
        isLoading,
        rejected,
        refresh,
        reset,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(UserContext);
}
