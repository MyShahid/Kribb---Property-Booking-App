import useSavedProperty from "@/hooks/useSavedProperty";
import { useSupabase } from "@/hooks/useSupabase";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import ImageViewing from "react-native-image-viewing";

const { width } = Dimensions.get("window");

// Replace this with the actual WhatsApp number.
const ADMIN_PHONE = "919999999999";

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const isAdmin = useUserStore((state) => state.isAdmin);
  const authSupabase = useSupabase();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const { isSaved, saveLoading, toggleSave } = useSavedProperty(id ?? "");

  const fetchProperty = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setProperty(data);
    } catch (err: any) {
      console.log("Error fetching property:", err);

      setError(
        err?.message || "Something went wrong while loading the property.",
      );

      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const onScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / width,
    );

    setActiveIndex(index);
  };

  const handleContact = async () => {
    if (!property) return;

    const message = `Hi! I'm interested in the property: ${property.title}`;

    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
      message,
    )}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Unable to open WhatsApp",
          "Please make sure WhatsApp is installed.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch (err) {
      console.log("Error opening WhatsApp:", err);

      Alert.alert(
        "Unable to open WhatsApp",
        "Please try again later.",
      );
    }
  };

  const handleMarkSold = () => {
    Alert.alert(
      "Mark as Sold",
      "Are you sure you want to mark this property as sold?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark Sold",
          onPress: async () => {
            try {
              setAdminActionLoading(true);

              const { error: updateError } = await authSupabase
                .from("properties")
                .update({ is_sold: true })
                .eq("id", id);

              if (updateError) throw updateError;

              setProperty((previousProperty) =>
                previousProperty
                  ? {
                      ...previousProperty,
                      is_sold: true,
                    }
                  : previousProperty,
              );

              Alert.alert(
                "Property updated",
                "The property has been marked as sold.",
              );
            } catch (err: any) {
              console.log("Error marking property as sold:", err);

              Alert.alert(
                "Update failed",
                err?.message || "Unable to update the property.",
              );
            } finally {
              setAdminActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Property",
      "This action cannot be undone. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setAdminActionLoading(true);

              const { error: deleteError } = await authSupabase
                .from("properties")
                .delete()
                .eq("id", id);

              if (deleteError) throw deleteError;

              router.replace("/(root)/(tabs)");
            } catch (err: any) {
              console.log("Error deleting property:", err);

              Alert.alert(
                "Delete failed",
                err?.message || "Unable to delete the property.",
              );
            } finally {
              setAdminActionLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>
          Loading property...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={54}
          color="#9CA3AF"
        />

        <Text style={styles.notFoundTitle}>
          Property not found
        </Text>

        <Text style={styles.notFoundText}>
          {error || "This property may no longer be available."}
        </Text>

        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=` +
    `${property.longitude - 0.003}%2C` +
    `${property.latitude - 0.003}%2C` +
    `${property.longitude + 0.003}%2C` +
    `${property.latitude + 0.003}` +
    `&layer=mapnik` +
    `&marker=${property.latitude}%2C${property.longitude}`;

  const isLongDescription =
    (property.description?.length ?? 0) > 150;

  const displayedDescription =
    expanded || !isLongDescription
      ? property.description
      : `${property.description?.slice(0, 150)}...`;

  const imageViewerImages = property.images.map((uri) => ({
    uri,
  }));     

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image gallery */}
        <View style={styles.galleryContainer}>
          {property.images.length > 0 ? (
            <FlatList
              data={property.images}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.95}
                  onPress={() => setImageViewerVisible(true)}
                >
                  <Image
                    source={{ uri: item }}
                    style={[
                      styles.propertyImage,
                      {
                        opacity: property.is_sold ? 0.65 : 1,
                      },
                    ]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              horizontal
              pagingEnabled
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={48}
                color="#9CA3AF"
              />

              <Text style={styles.imagePlaceholderText}>
                No images available
              </Text>
            </View>
          )}

          {/* Floating navigation */}
          <SafeAreaView
            edges={["top"]}
            style={styles.floatingHeader}
          >
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#111827"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleSave}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                />
              ) : (
                <Ionicons
                  name={isSaved ? "heart" : "heart-outline"}
                  size={23}
                  color={isSaved ? "#EF4444" : "#111827"}
                />
              )}
            </TouchableOpacity>
          </SafeAreaView>

          {property.images.length > 0 && (
            <View style={styles.imageCountBadge}>
              <Ionicons
                name="images-outline"
                size={13}
                color="#FFFFFF"
              />

              <Text style={styles.imageCountText}>
                {activeIndex + 1}/{property.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Property information */}
        <View
          style={[
            styles.content,
            {
              opacity: property.is_sold ? 0.7 : 1,
            },
          ]}
        >
          {/* Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {property.type}
              </Text>
            </View>

            {property.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons
                  name="star"
                  size={13}
                  color="#D97706"
                />

                <Text style={styles.featuredBadgeText}>
                  Featured
                </Text>
              </View>
            )}

            {property.is_sold && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>
                  Sold
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>
            {property.title}
          </Text>

          <Text style={styles.price}>
            {formatPrice(property.price)}
          </Text>

          {/* Specifications */}
          <View style={styles.specificationsContainer}>
            <SpecItem
              icon="bed-outline"
              value={`${property.bedrooms}`}
              label="Beds"
            />

            <SpecItem
              icon="water-outline"
              value={`${property.bathrooms}`}
              label="Baths"
            />

            <SpecItem
              icon="expand-outline"
              value={`${property.area_sqft}`}
              label="Sq. ft."
            />

            <SpecItem
              icon="home-outline"
              value={property.type}
              label="Type"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Description
            </Text>

            <Text style={styles.description}>
              {displayedDescription || "No description available."}
            </Text>

            {isLongDescription && (
              <TouchableOpacity
                onPress={() => setExpanded((current) => !current)}
              >
                <Text style={styles.readMoreText}>
                  {expanded ? "Show Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Location
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#6B7280"
              />

              <Text style={styles.locationText}>
                {property.address}, {property.city}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.mapContainer}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(root)/property/map",
                  params: {
                    latitude: String(property.latitude),
                    longitude: String(property.longitude),
                    title: property.title,
                    address: `${property.address}, ${property.city}`,
                  },
                })
              }
            >
              <WebView
                source={{ uri: mapUrl }}
                style={styles.map}
                scrollEnabled={false}
                pointerEvents="none"
              />

              <View style={styles.expandMapBadge}>
                <Ionicons
                  name="expand-outline"
                  size={13}
                  color="#374151"
                />

                <Text style={styles.expandMapText}>
                  Tap to expand
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContact}
            activeOpacity={0.85}
          >
            <Ionicons
              name="logo-whatsapp"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.contactButtonText}>
              Contact Agent
            </Text>
          </TouchableOpacity>

          {/* Admin actions */}
          {isAdmin && (
            <View style={styles.adminSection}>
              <Text style={styles.adminTitle}>
                Admin Actions
              </Text>

              {adminActionLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#2563EB"
                  style={styles.adminLoader}
                />
              ) : (
                <View style={styles.adminButtons}>
                  {!property.is_sold && (
                    <TouchableOpacity
                      style={styles.markSoldButton}
                      onPress={handleMarkSold}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color="#D97706"
                      />

                      <Text style={styles.markSoldText}>
                        Mark as Sold
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#EF4444"
                    />

                    <Text style={styles.deleteButtonText}>
                      Delete Property
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <ImageViewing
        images={imageViewerImages}
        imageIndex={activeIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
      />
    </View>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.specItem}>
      <View style={styles.specIconContainer}>
        <Ionicons
          name={icon}
          size={20}
          color="#2563EB"
        />
      </View>

      <Text
        style={styles.specValue}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text style={styles.specLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  notFoundTitle: {
    marginTop: 14,
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },

  notFoundText: {
    marginTop: 7,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },

  goBackButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  goBackButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  galleryContainer: {
    position: "relative",
    backgroundColor: "#E5E7EB",
  },

  propertyImage: {
    width,
    height: 320,
  },

  imagePlaceholder: {
    width,
    height: 320,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },

  imagePlaceholderText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
  },

  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },

  imageCountBadge: {
    position: "absolute",
    right: 16,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(17,24,39,0.76)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },

  imageCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  content: {
    padding: 20,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  typeBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },

  typeBadgeText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },

  featuredBadgeText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "700",
  },

  soldBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },

  soldBadgeText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },

  title: {
    color: "#111827",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 32,
  },

  price: {
    marginTop: 8,
    color: "#2563EB",
    fontSize: 25,
    fontWeight: "800",
  },

  specificationsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  specItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  specIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  specValue: {
    maxWidth: "100%",
    marginTop: 8,
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  specLabel: {
    marginTop: 2,
    color: "#9CA3AF",
    fontSize: 11,
  },

  section: {
    marginTop: 26,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  description: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 23,
  },

  readMoreText: {
    marginTop: 8,
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginBottom: 14,
  },

  locationText: {
    flex: 1,
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
  },

  mapContainer: {
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  map: {
    flex: 1,
  },

  expandMapBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },

  expandMapText: {
    color: "#374151",
    fontSize: 11,
    fontWeight: "600",
  },

  contactButton: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 15,
  },

  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  adminSection: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  adminTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },

  adminLoader: {
    paddingVertical: 20,
  },

  adminButtons: {
    gap: 11,
  },

  markSoldButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingVertical: 13,
    borderRadius: 13,
  },

  markSoldText: {
    color: "#B45309",
    fontSize: 14,
    fontWeight: "700",
  },

  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 13,
    borderRadius: 13,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});