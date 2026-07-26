import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import React from "react";
import { Property } from "@/types";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/lib/utils";

export default function FeaturedCard({
  property,
}: {
  property: Property;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          opacity: property.is_sold ? 0.5 : 1,
        },
      ]}
      onPress={() => router.push(`/(root)/property/${property.id}`)}
      disabled={property.is_sold}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: property.images[0] }}
          resizeMode="cover"
          style={styles.image}
        />

        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{property.type}</Text>
        </View>

        {property.is_sold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldText}>Sold</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#6B7280"
          />

          <Text style={styles.locationText} numberOfLines={1}>
            {property.address}, {property.city}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <Ionicons name="bed-outline" size={17} color="#6B7280" />
              <Text style={styles.featureText}>{property.bedrooms}</Text>
            </View>

            <View style={styles.feature}>
              <Ionicons name="water-outline" size={17} color="#6B7280" />
              <Text style={styles.featureText}>{property.bathrooms}</Text>
            </View>
          </View>

          <Text style={styles.price}>{formatPrice(property.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
  },

  imageContainer: {
    position: "relative",
  },

  image: {
    width: "100%",
    height: 170,
  },

  typeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  typeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  soldBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  soldText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  content: {
    padding: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 7,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },

  locationText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  featuresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  featureText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },

  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
  },
});