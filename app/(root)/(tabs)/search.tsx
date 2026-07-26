import FilterModal from "@/components/FilterModal";
import PropertyCard from "@/components/PropertyCard";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { useFilterStore } from "@/store/filterStore";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Search() {
  const [results, setResults] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const {
    search,
    type,
    bedrooms,
    minPrice,
    maxPrice,
    setSearch,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice,
  } = useFilterStore();

  const activeFilterCount = [
    type !== null,
    bedrooms !== null,
    minPrice !== null,
    maxPrice !== null,
  ].filter(Boolean).length;

  const fetchResults = async () => {
    try {
      setLoading(true);

      let query = supabase.from("properties").select("*");

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`,
        );
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (bedrooms !== null) {
        if (bedrooms === 4) {
          query = query.gte("bedrooms", 4);
        } else {
          query = query.eq("bedrooms", bedrooms);
        }
      }

      if (minPrice !== null) {
        query = query.gte("price", minPrice);
      }

      if (maxPrice !== null) {
        query = query.lte("price", maxPrice);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setResults(data ?? []);
    } catch (error) {
      console.log("Error fetching search results:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [search, type, bedrooms, minPrice, maxPrice]);

  const { openFilters } = useLocalSearchParams<{
    openFilters?: string;
  }>();

  useEffect(() => {
    if (openFilters === "true") {
      setShowFilters(true);
    }
  }, [openFilters]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Find Property</Text>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={19}
              color="#9CA3AF"
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or city"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilterCount > 0 && styles.activeFilterButton,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFilterCount > 0 ? "#FFFFFF" : "#374151"}
            />

            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeFilterCount > 0 && (
          <View style={styles.chipsContainer}>
            {type && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{type}</Text>

                <TouchableOpacity onPress={() => setType(null)}>
                  <Ionicons name="close" size={13} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}

            {bedrooms !== null && (
              <View style={styles.filterChip}>
                <Ionicons
                  name="bed-outline"
                  size={13}
                  color="#1D4ED8"
                />

                <Text style={styles.filterChipText}>
                  {bedrooms === 4
                    ? "4+ Beds"
                    : `${bedrooms} bed${bedrooms > 1 ? "s" : ""}`}
                </Text>

                <TouchableOpacity onPress={() => setBedrooms(null)}>
                  <Ionicons name="close" size={13} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}

            {(minPrice !== null || maxPrice !== null) && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {minPrice !== null && maxPrice !== null
                    ? `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                    : minPrice !== null
                      ? `From ${formatPrice(minPrice)}`
                      : `Up to ${formatPrice(maxPrice!)}`}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setMinPrice(null);
                    setMaxPrice(null);
                  }}
                >
                  <Ionicons name="close" size={13} color="#1D4ED8" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PropertyCard property={item} />
        )}
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {loading
              ? "Searching..."
              : `${results.length} ${
                  results.length === 1 ? "property" : "properties"
                } found`}
          </Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color="#D1D5DB"
              />

              <Text style={styles.emptyTitle}>
                No properties found
              </Text>

              <Text style={styles.emptySubtitle}>
                Try a different search or adjust filters
              </Text>
            </View>
          ) : (
            <ActivityIndicator
              size="large"
              color="#2563EB"
              style={styles.loader}
            />
          )
        }
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  searchInput: {
    flex: 1,
    marginHorizontal: 9,
    fontSize: 14,
    color: "#111827",
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  activeFilterButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  filterBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },

  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
  },

  filterChipText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  listContent: {
    padding: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },

  resultCount: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 16,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
  },

  emptyTitle: {
    color: "#9CA3AF",
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
  },

  emptySubtitle: {
    color: "#D1D5DB",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },

  loader: {
    paddingVertical: 70,
  },
});