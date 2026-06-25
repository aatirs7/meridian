import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import type { Identity } from "@meridian/shared";
import { API_BASE_URL } from "../api";

/**
 * Auth without a third-party service. The native Sign in with Apple sheet gives
 * us an Apple identity token; we hand it to the API once (/api/auth/apple),
 * which verifies it and returns a Meridian session token. We persist that token
 * in the keychain and send it as the Bearer on every request thereafter.
 */

const TOKEN_KEY = "meridian_session_token";

export class SignInError extends Error {}

interface AuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  me: Identity | null;
  /** Returns the stored session token (or null). Used by useApi. */
  getToken: () => Promise<string | null>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoaded: false,
  isSignedIn: false,
  me: null,
  getToken: async () => null,
  signInWithApple: async () => {},
  signOut: async () => {},
});

interface AppleAuthResponse {
  token: string;
  me: Identity;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [me, setMe] = useState<Identity | null>(null);
  // Held in a ref so getToken is stable and always reads the latest value.
  const tokenRef = useRef<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          tokenRef.current = stored;
          setHasToken(true);
        }
      } catch {
        // ignore — treated as signed out
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const getToken = useCallback(async () => tokenRef.current, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== "ios") {
      throw new SignInError("Sign in with Apple is only available on iOS.");
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const identityToken = credential.identityToken;
    if (!identityToken) {
      throw new SignInError("Apple didn't return an identity token.");
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/apple`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identityToken }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new SignInError(body.error ?? "Sign-in failed. Please try again.");
    }
    const data = (await res.json()) as AppleAuthResponse;
    await SecureStore.setItemAsync(TOKEN_KEY, data.token).catch(() => {});
    tokenRef.current = data.token;
    setHasToken(true);
    setMe(data.me);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    tokenRef.current = null;
    setHasToken(false);
    setMe(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: hasToken,
      me,
      getToken,
      signInWithApple,
      signOut,
    }),
    [isLoaded, hasToken, me, getToken, signInWithApple, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
