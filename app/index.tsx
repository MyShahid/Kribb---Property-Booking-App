import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function Index() {

  const {isSignedIn, isLoaded} = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) return <Redirect href={"/(root)/(tabs)" as any} />;

  return <Redirect href="/sign-up" />;
}