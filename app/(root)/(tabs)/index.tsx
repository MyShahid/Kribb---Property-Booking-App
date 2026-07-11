import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";

import { Property } from "@/types";
import { supabase } from "@/lib/supabase";

import PropertyCard from "@/components/PropertyCard";
import FeaturedCard from "@/components/FeaturedCard";

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [featured, setFeatured] = useState<Property[]>([]);
  const [recommended, setRecommended] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: featuredData, error: featuredError } = await supabase
        .from("properties")
        .select("*")
        .eq("is_featured", true)
        .order("created_at", { ascending: false });

      if (featuredError) throw featuredError;

      const { data: recommendedData, error: recommendedError } = await supabase
        .from("properties")
        .select("*")
        .eq("is_featured", false)
        .order("created_at", { ascending: false });

      if (recommendedError) throw recommendedError;

      setFeatured(featuredData ?? []);
      setRecommended(recommendedData ?? []);
    } catch (err: any) {
      console.log("Error fetching properties:", err);

      setError(err.message || "Something went wrong while loading properties.");

      setFeatured([]);
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [fetchProperties]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={recommended}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require("../../../assets/images/kribb.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>Good morning 👋</Text>

                <Text style={styles.userName}>{user?.firstName ?? "User"}</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TouchableOpacity
                style={styles.searchButton}
                activeOpacity={0.8}
                onPress={() => router.push("/(root)/(tabs)/search")}
              >
                <Ionicons name="search-outline" size={18} color="#9CA3AF" />

                <Text style={styles.searchText}>
                  Search properties, cities...
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.8}
                onPress={() =>
                  router.push("/(root)/(tabs)/search?openFilters=true")
                }
              >
                <Ionicons name="options-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>

                <TouchableOpacity onPress={fetchProperties}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Featured Section */}
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured</Text>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                  style={styles.loader}
                />
              ) : featured.length > 0 ? (
                <FlatList
                  data={featured}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    console.log("Rendering featured:", item.title);

                    return <FeaturedCard property={item} />;
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                />
              ) : (
                <Text style={styles.emptyFeaturedText}>
                  No featured properties available
                </Text>
              )}
            </View>

            {/* Recommended Header */}
            <Text style={styles.recommendedTitle}>Recommended</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.propertyCardContainer}>
            <PropertyCard property={item} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color="#2563EB"
              style={styles.recommendedLoader}
            />
          ) : !error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  listContent: {
    paddingBottom: 100,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  logo: {
    width: 90,
    height: 36,
  },

  greetingContainer: {
    alignItems: "flex-end",
  },

  greetingText: {
    color: "#6B7280",
    fontSize: 12,
  },

  userName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  searchButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchText: {
    flex: 1,
    color: "#9CA3AF",
    fontSize: 14,
  },

  filterButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },

  retryText: {
    color: "#2563EB",
    fontWeight: "600",
    marginTop: 8,
  },

  featuredSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  loader: {
    paddingVertical: 40,
  },

  featuredList: {
    paddingHorizontal: 20,
  },

  emptyFeaturedText: {
    color: "#9CA3AF",
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  recommendedTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  propertyCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  recommendedLoader: {
    paddingVertical: 40,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});
