import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth/AuthContext";
import { Loading } from "../components/primitives";

/** Auth redirect hub. Sends signed-in users into the app, everyone else to
 * sign-in. Kept deliberately thin — the layouts do the real guarding. */
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <Loading />;
  return <Redirect href={isSignedIn ? "/(app)/(tabs)" : "/(auth)/sign-in"} />;
}
