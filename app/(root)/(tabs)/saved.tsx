import PropertyCard from "@/components/PropertyCard";
import { useSupabase } from "@/hooks/useSupabase";
import { Property } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SavedProperty {
  id: string;
  property_id: string;
  properties: Property;
}

export default function Saved() {
  const { userId } = useAuth();
  const authSupabase = useSupabase();

  const [saved, setSaved] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSaved = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await authSupabase
        .from("saved_properties")
        .select("id, property_id, properties(*)")
        .eq("user_clerk_id", userId)
        .order("id", { ascending: false });

      if (fetchError) throw fetchError;

      setSaved((data as unknown as SavedProperty[]) ?? []);
    } catch (err: any) {
      console.log("Error fetching saved properties:", err);

      setError(
        err?.message || "Something went wrong while loading your saved properties.",
      );

      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved]),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>

        {!loading && !error && (
          <Text style={styles.headerSubtitle}>
            {saved.length} {saved.length === 1 ? "Property" : "Properties"}{" "}
            Saved
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />

          <Text style={styles.errorTitle}>Couldn't load saved properties</Text>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={fetchSaved}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PropertyCard
              property={item.properties}
              onUnsave={() =>
                setSaved((prev) => prev.filter((s) => s.id !== item.id))
              }
              showSave
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={36} color="#EF4444" />
              </View>

              <Text style={styles.emptyTitle}>No Saved Properties</Text>

              <Text style={styles.emptyText}>
                Tap the heart icon on any property to save it here!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  headerTitle: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  errorTitle: {
    marginTop: 14,
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },

  errorText: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 16,
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 6,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});