import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";

export default function useSavedProperty(
  propertyId: string,
  onUnsave?: () => void,
) {
  const { userId } = useAuth();
  const authSupabase = useSupabase();

  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");

  const checkIfSaved = async () => {
    if (!userId) return;

    try {
      const { data, error: checkError } = await authSupabase
        .from("saved_properties")
        .select("id")
        .eq("user_clerk_id", userId)
        .eq("property_id", propertyId)
        .single();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

      setIsSaved(!!data);
    } catch (err: any) {
      console.log("Error checking saved status:", err);
      setError(err?.message || "Unable to check saved status.");
    }
  };

  useEffect(() => {
    checkIfSaved();
  }, [propertyId, userId]);

  const toggleSave = async () => {
    if (!userId || saveLoading) return;

    try {
      setSaveLoading(true);
      setError("");

      if (isSaved) {
        const { error: deleteError } = await authSupabase
          .from("saved_properties")
          .delete()
          .eq("user_clerk_id", userId)
          .eq("property_id", propertyId);

        if (deleteError) throw deleteError;

        setIsSaved(false);
        onUnsave?.();
      } else {
        const { error: insertError } = await authSupabase
          .from("saved_properties")
          .insert({
            user_clerk_id: userId,
            property_id: propertyId,
          });

        if (insertError) throw insertError;

        setIsSaved(true);
      }
    } catch (err: any) {
      console.log("Error toggling saved property:", err);
      setError(err?.message || "Unable to update saved status.");
    } finally {
      setSaveLoading(false);
    }
  };

  return { isSaved, saveLoading, toggleSave, error };
}