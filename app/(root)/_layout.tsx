import { useUserSync } from "@/hooks/useUserSync";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Slot } from "expo-router";

export default function RootLayout() {
    
    const {isSignedIn, isLoaded} = useAuth();

    // sync Clerk user > Supabase (Build Later)
    useUserSync();

    if (!isLoaded) return null;

    if (!isSignedIn) return <Redirect href={"/sign-in"} />;

    return <Slot/>;

}