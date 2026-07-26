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
import useSavedProperty from "@/hooks/useSavedProperty";

export default function PropertyCard({
  property,
  onUnsave,
  showSave = false,
}: {
  property: Property;
  onUnsave?: () => void;
  showSave?: boolean;
}) {
  const router = useRouter();

  const {isSaved, saveLoading, toggleSave} = useSavedProperty(property.id, onUnsave)

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          opacity: property.is_sold ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.85}
      disabled={property.is_sold}
      onPress={() => router.push(`/(root)/property/${property.id}`)}
    >
      <Image
        source={{ uri: property.images[0] }}
        resizeMode="cover"
        style={styles.image}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.type}>{property.type}</Text>

          {property.is_sold && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldText}>Sold</Text>
            </View>
          )}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#6B7280"
          />

          <Text numberOfLines={1} style={styles.location}>
            {property.address}, {property.city}
          </Text>
        </View>

        <Text style={styles.price}>
          {formatPrice(property.price)}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.feature}>
            <Ionicons
              name="bed-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.featureText}>
              {property.bedrooms}
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons
              name="water-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.featureText}>
              {property.bathrooms}
            </Text>
          </View>
        </View>
      </View>

        <TouchableOpacity 
        onPress={toggleSave}
        disabled={saveLoading}
        style={styles.heartButton}>
            <Ionicons
            name={isSaved ? "heart" : "heart-outline"}
            size={18}
            color={isSaved ? "#EF4444" : "#9CA3AF"}
            />    
        </TouchableOpacity>  
          
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  image: {
    width: 120,
    height: 150,
  },

  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  type: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 12,
  },

  soldBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  soldText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  location: {
    marginLeft: 4,
    color: "#6B7280",
    fontSize: 12,
    flex: 1,
  },

  price: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },

  bottomRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },

  featureText: {
    marginLeft: 4,
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "500",
  },

  heartButton: {
  position: "absolute",
  top: 12,
  right: 12,
  zIndex: 10,
},
});