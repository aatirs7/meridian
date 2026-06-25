import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../lib/auth/AuthContext";
import { Loading } from "../../components/primitives";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <Loading />;
  if (isSignedIn) return <Redirect href="/(app)/(tabs)" />;
  return <Slot />;
}
