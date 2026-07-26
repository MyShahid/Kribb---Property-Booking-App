import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { PropertyType, useFilterStore } from "@/store/filterStore";
import { Ionicons } from "@expo/vector-icons";

const TYPES: { label: string; value: PropertyType }[] = [
  { label: "All", value: null },
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Villa", value: "villa" },
  { label: "Studio", value: "studio" },
];

const BEDS = [
  { label: "Any", value: null },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4+", value: 4 },
];

const PRICE_PRESETS = [
  { label: "Under ₹50L", min: null, max: 5000000 },
  { label: "₹50L – ₹1Cr", min: 5000000, max: 10000000 },
  { label: "₹1Cr – ₹2Cr", min: 10000000, max: 20000000 },
  { label: "Above ₹2Cr", min: 20000000, max: null },
];

export default function FilterModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    type,
    bedrooms,
    minPrice,
    maxPrice,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice,
    resetFilters,
  } = useFilterStore();

  const [localMin, setLocalMin] = useState(
    minPrice ? String(minPrice) : "",
  );

  const [localMax, setLocalMax] = useState(
    maxPrice ? String(maxPrice) : "",
  );

  const activeCount = [type, bedrooms, minPrice, maxPrice].filter(
    (value) => value !== null,
  ).length;

  const handleApply = () => {
    setMinPrice(localMin ? Number(localMin) : null);
    setMaxPrice(localMax ? Number(localMax) : null);
    onClose();
  };

  const handleReset = () => {
    setLocalMin("");
    setLocalMax("");
    resetFilters();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={23} color="#374151" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Filters</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleReset}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Property Type */}
          <Text style={styles.sectionTitle}>Property Type</Text>

          <View style={styles.chipContainer}>
            {TYPES.map((item) => {
              const active = type === item.value;

              return (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[
                    styles.chip,
                    active && styles.activeChip,
                  ]}
                  onPress={() => setType(item.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.activeChipText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bedrooms */}
          <Text style={styles.sectionTitle}>Bedrooms</Text>

          <View style={styles.chipContainer}>
            {BEDS.map((item) => {
              const active = bedrooms === item.value;

              return (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[
                    styles.chip,
                    active && styles.activeChip,
                  ]}
                  onPress={() => setBedrooms(item.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.activeChipText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price Inputs */}
          <Text style={styles.sectionTitle}>Price Range (₹)</Text>

          <View style={styles.priceInputRow}>
            {[
              {
                label: "Min Price",
                value: localMin,
                onChange: setLocalMin,
                placeholder: "0",
              },
              {
                label: "Max Price",
                value: localMax,
                onChange: setLocalMax,
                placeholder: "0",
              },
            ].map(({ label, value, onChange, placeholder }) => (
              <View key={label} style={styles.priceInputWrapper}>
                <Text style={styles.inputLabel}>{label}</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.currency}>₹</Text>

                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Price Presets */}
          <View style={styles.chipContainer}>
            {PRICE_PRESETS.map((preset) => {
              const active =
                minPrice === preset.min &&
                maxPrice === preset.max;

              return (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.chip,
                    active && styles.activeChip,
                  ]}
                  onPress={() => {
                    setLocalMin(
                      preset.min ? String(preset.min) : "",
                    );

                    setLocalMax(
                      preset.max ? String(preset.max) : "",
                    );

                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.activeChipText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters
              {activeCount > 0 ? ` (${activeCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerButton: {
    minWidth: 50,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  resetText: {
    textAlign: "right",
    color: "#2563EB",
    fontWeight: "600",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  activeChip: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },

  activeChipText: {
    color: "#FFFFFF",
  },

  priceInputRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  priceInputWrapper: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 7,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
  },

  currency: {
    fontSize: 16,
    color: "#374151",
    marginRight: 5,
  },

  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  applyButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});