import { useSupabase } from "@/hooks/useSupabase";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES = ["apartment", "house", "villa", "studio"] as const;

type PropertyType = (typeof TYPES)[number];

const MIN_PRICE = 1;
const MAX_PRICE = 999_999_999;
const MAX_IMAGES = 6;

interface FormState {
  title: string;
  description: string;
  price: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqft: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  isFeatured: boolean;
  images: string[];
  localImages: string[];
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  price: "",
  type: "apartment",
  bedrooms: 1,
  bathrooms: 1,
  areaSqft: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  isFeatured: false,
  images: [],
  localImages: [],
};

export default function CreatePropertyScreen() {
  const router = useRouter();
  const authSupabase = useSupabase();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const updateForm = (fields: Partial<FormState>) => {
    setForm((previousForm) => ({
      ...previousForm,
      ...fields,
    }));
  };

  const handlePickImages = async () => {
    try {
      const remainingSlots = MAX_IMAGES - form.localImages.length;

      if (remainingSlots <= 0) {
        Alert.alert(
          "Image Limit Reached",
          `You can upload a maximum of ${MAX_IMAGES} images.`,
        );

        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: remainingSlots,
      });

      if (result.canceled) {
        return;
      }

      setUploadingImages(true);

      const uploadedUrls: string[] = [];
      const previewUris: string[] = [];

      for (const asset of result.assets) {
        try {
          const fileExtension =
            asset.fileName?.split(".").pop()?.toLowerCase() || "jpg";

          const safeExtension =
            fileExtension === "png" ||
            fileExtension === "webp" ||
            fileExtension === "jpeg"
              ? fileExtension
              : "jpg";

          const contentType =
            asset.mimeType ||
            (safeExtension === "png"
              ? "image/png"
              : safeExtension === "webp"
                ? "image/webp"
                : "image/jpeg");

          const filename = `property_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}.${safeExtension}`;

          const imageResponse = await fetch(asset.uri);
          const imageArrayBuffer = await imageResponse.arrayBuffer();

          const { error: uploadError } = await authSupabase.storage
            .from("property-images")
            .upload(filename, imageArrayBuffer, {
              contentType,
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = authSupabase.storage
            .from("property-images")
            .getPublicUrl(filename);

          uploadedUrls.push(publicUrlData.publicUrl);
          previewUris.push(asset.uri);
        } catch (error) {
          console.error("Individual image upload error:", error);
        }
      }

      if (uploadedUrls.length === 0) {
        Alert.alert(
          "Upload Failed",
          "The selected images could not be uploaded.",
        );

        return;
      }

      setForm((previousForm) => ({
        ...previousForm,
        images: [...previousForm.images, ...uploadedUrls],
        localImages: [...previousForm.localImages, ...previewUris],
      }));

      if (uploadedUrls.length < result.assets.length) {
        Alert.alert(
          "Some Images Failed",
          "Some selected images could not be uploaded.",
        );
      }
    } catch (error) {
      console.error("Image picker error:", error);

      Alert.alert(
        "Upload Failed",
        "Something went wrong while selecting or uploading images.",
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((previousForm) => ({
      ...previousForm,

      images: previousForm.images.filter(
        (_, imageIndex) => imageIndex !== index,
      ),

      localImages: previousForm.localImages.filter(
        (_, imageIndex) => imageIndex !== index,
      ),
    }));
  };

  const handleDetectLocation = async () => {
    try {
      setDetectingLocation(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect coordinates.",
        );

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      updateForm({
        latitude: String(location.coords.latitude),
        longitude: String(location.coords.longitude),
      });

      Alert.alert(
        "Location Detected",
        "Latitude and longitude have been added.",
      );
    } catch (error) {
      console.error("Location detection error:", error);

      Alert.alert(
        "Location Error",
        "Could not detect your location. Please enter it manually.",
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert("Validation", "Title is required.");
      return;
    }

    if (!form.description.trim()) {
      Alert.alert("Validation", "Description is required.");
      return;
    }

    if (!form.price.trim()) {
      Alert.alert("Validation", "Price is required.");
      return;
    }

    const priceNumber = Number(form.price);

    if (Number.isNaN(priceNumber) || priceNumber < MIN_PRICE) {
      Alert.alert(
        "Validation",
        "Price must be a valid number greater than ₹0.",
      );

      return;
    }

    if (priceNumber > MAX_PRICE) {
      Alert.alert(
        "Validation",
        `Price cannot exceed ₹${MAX_PRICE.toLocaleString("en-IN")}.`,
      );

      return;
    }

    let areaNumber: number | null = null;

    if (form.areaSqft.trim()) {
      areaNumber = Number(form.areaSqft);

      if (Number.isNaN(areaNumber) || areaNumber <= 0) {
        Alert.alert(
          "Validation",
          "Area must be a valid number greater than zero.",
        );

        return;
      }
    }

    let latitudeNumber: number | null = null;

    if (form.latitude.trim()) {
      latitudeNumber = Number(form.latitude);

      if (
        Number.isNaN(latitudeNumber) ||
        latitudeNumber < -90 ||
        latitudeNumber > 90
      ) {
        Alert.alert(
          "Validation",
          "Latitude must be between -90 and 90.",
        );

        return;
      }
    }

    let longitudeNumber: number | null = null;

    if (form.longitude.trim()) {
      longitudeNumber = Number(form.longitude);

      if (
        Number.isNaN(longitudeNumber) ||
        longitudeNumber < -180 ||
        longitudeNumber > 180
      ) {
        Alert.alert(
          "Validation",
          "Longitude must be between -180 and 180.",
        );

        return;
      }
    }

    if (!form.address.trim()) {
      Alert.alert("Validation", "Address is required.");
      return;
    }

    if (!form.city.trim()) {
      Alert.alert("Validation", "City is required.");
      return;
    }

    if (form.images.length === 0) {
      Alert.alert(
        "Validation",
        "Please upload at least one property image.",
      );

      return;
    }

    try {
      setSubmitting(true);

      const { error: insertError } = await authSupabase
        .from("properties")
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          price: priceNumber,
          type: form.type,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          area_sqft: areaNumber,
          address: form.address.trim(),
          city: form.city.trim(),
          latitude: latitudeNumber,
          longitude: longitudeNumber,
          images: form.images,
          is_featured: form.isFeatured,
          is_sold: false,
        });

      if (insertError) {
        throw insertError;
      }

      setForm(INITIAL_FORM);

      Alert.alert(
        "Property Created",
        "The property has been listed successfully.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/(root)/(tabs)" as any),
          },
        ],
      );
    } catch (error) {
      console.error("Property creation error:", error);

      Alert.alert(
        "Creation Failed",
        "The property could not be created. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#111827"
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Add Property
            </Text>

            <Text style={styles.headerSubtitle}>
              Create a new property listing
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <FormSection
            icon="images-outline"
            title="Property Photos"
            description={`Upload up to ${MAX_IMAGES} images`}
          >
            <View style={styles.imagesContainer}>
              {form.localImages.map((uri, index) => (
                <View
                  key={`${uri}-${index}`}
                  style={styles.imageWrapper}
                >
                  <Image
                    source={{ uri }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />

                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>
                        COVER
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="close"
                      size={13}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ))}

              {form.localImages.length < MAX_IMAGES && (
                <TouchableOpacity
                  style={[
                    styles.addImageButton,
                    uploadingImages
                      ? styles.disabledButton
                      : undefined,
                  ]}
                  onPress={handlePickImages}
                  disabled={uploadingImages}
                  activeOpacity={0.8}
                >
                  {uploadingImages ? (
                    <ActivityIndicator
                      size="small"
                      color="#2563EB"
                    />
                  ) : (
                    <>
                      <View style={styles.addImageIcon}>
                        <Ionicons
                          name="camera-outline"
                          size={22}
                          color="#2563EB"
                        />
                      </View>

                      <Text style={styles.addImageText}>
                        Add Photos
                      </Text>

                      <Text style={styles.imageCountText}>
                        {form.localImages.length}/{MAX_IMAGES}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </FormSection>

          <FormSection
            icon="information-circle-outline"
            title="Basic Information"
            description="Enter the main property details"
          >
            <FormField label="Title" required>
              <TextInput
                style={styles.input}
                placeholder="e.g. Modern 3BHK in Bandra"
                placeholderTextColor="#9CA3AF"
                value={form.title}
                onChangeText={(value) =>
                  updateForm({ title: value })
                }
              />
            </FormField>

            <FormField label="Description" required>
              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
                placeholder="Describe the property, nearby places and key features..."
                placeholderTextColor="#9CA3AF"
                value={form.description}
                onChangeText={(value) =>
                  updateForm({ description: value })
                }
                multiline
                textAlignVertical="top"
                maxLength={1500}
              />

              <Text style={styles.characterCount}>
                {form.description.length}/1500
              </Text>
            </FormField>

            <FormField label="Price" required>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.currencyPrefix}>₹</Text>

                <TextInput
                  style={styles.prefixedInput}
                  placeholder="5000000"
                  placeholderTextColor="#9CA3AF"
                  value={form.price}
                  onChangeText={(value) =>
                    updateForm({
                      price: value.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="number-pad"
                />
              </View>

              <Text style={styles.helperText}>
                Maximum ₹{MAX_PRICE.toLocaleString("en-IN")}
              </Text>
            </FormField>

            <FormField label="Property Type" required>
              <View style={styles.typeContainer}>
                {TYPES.map((type, index) => {
                  const isSelected = form.type === type;

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        index < TYPES.length - 1
                          ? styles.typeButtonSpacing
                          : undefined,
                        isSelected
                          ? styles.selectedTypeButton
                          : undefined,
                      ]}
                      onPress={() => updateForm({ type })}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={getPropertyTypeIcon(type)}
                        size={17}
                        color={
                          isSelected ? "#FFFFFF" : "#4B5563"
                        }
                      />

                      <Text
                        style={[
                          styles.typeButtonText,
                          isSelected
                            ? styles.selectedTypeButtonText
                            : undefined,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FormField>
          </FormSection>

          <FormSection
            icon="home-outline"
            title="Property Specifications"
            description="Add size and room information"
          >
            <View style={styles.counterRow}>
              <Counter
                label="Bedrooms"
                icon="bed-outline"
                value={form.bedrooms}
                onChange={(value) =>
                  updateForm({ bedrooms: value })
                }
              />

              <View style={styles.counterHorizontalSpacing} />

              <Counter
                label="Bathrooms"
                icon="water-outline"
                value={form.bathrooms}
                onChange={(value) =>
                  updateForm({ bathrooms: value })
                }
              />
            </View>

            <FormField label="Area">
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={styles.suffixedInput}
                  placeholder="1200"
                  placeholderTextColor="#9CA3AF"
                  value={form.areaSqft}
                  onChangeText={(value) =>
                    updateForm({
                      areaSqft: value.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="number-pad"
                />

                <Text style={styles.inputSuffix}>
                  sq ft
                </Text>
              </View>
            </FormField>
          </FormSection>

          <FormSection
            icon="location-outline"
            title="Location"
            description="Enter the property's address and coordinates"
          >
            <FormField label="Address" required>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor="#9CA3AF"
                value={form.address}
                onChangeText={(value) =>
                  updateForm({ address: value })
                }
              />
            </FormField>

            <FormField label="City" required>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mumbai"
                placeholderTextColor="#9CA3AF"
                value={form.city}
                onChangeText={(value) =>
                  updateForm({ city: value })
                }
              />
            </FormField>

            <View style={styles.coordinateHeader}>
              <View style={styles.coordinateHeaderText}>
                <Text style={styles.fieldLabel}>
                  Coordinates
                </Text>

                <Text style={styles.coordinateDescription}>
                  Optional, but required for map preview
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.detectLocationButton,
                  detectingLocation
                    ? styles.disabledButton
                    : undefined,
                ]}
                onPress={handleDetectLocation}
                disabled={detectingLocation}
                activeOpacity={0.8}
              >
                {detectingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color="#2563EB"
                  />
                ) : (
                  <Ionicons
                    name="locate-outline"
                    size={15}
                    color="#2563EB"
                  />
                )}

                <Text style={styles.detectLocationText}>
                  {detectingLocation
                    ? "Detecting"
                    : "Use Current"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.coordinateRow}>
              <View style={styles.coordinateInputContainer}>
                <Text style={styles.coordinateLabel}>
                  Latitude
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="19.0760"
                  placeholderTextColor="#9CA3AF"
                  value={form.latitude}
                  onChangeText={(value) =>
                    updateForm({ latitude: value })
                  }
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.coordinateHorizontalSpacing} />

              <View style={styles.coordinateInputContainer}>
                <Text style={styles.coordinateLabel}>
                  Longitude
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="72.8777"
                  placeholderTextColor="#9CA3AF"
                  value={form.longitude}
                  onChangeText={(value) =>
                    updateForm({ longitude: value })
                  }
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </FormSection>

          <FormSection
            icon="sparkles-outline"
            title="Listing Options"
            description="Control how this property appears"
          >
            <Toggle
              label="Featured Property"
              description="Show this listing in the Featured section on the home screen."
              value={form.isFeatured}
              onChange={(value) =>
                updateForm({ isFeatured: value })
              }
            />
          </FormSection>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting || uploadingImages
                ? styles.submitButtonDisabled
                : undefined,
            ]}
            onPress={handleSubmit}
            disabled={submitting || uploadingImages}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.submitButtonText}>
                  List Property
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function FormSection({
  icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color="#2563EB"
          />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          {description ? (
            <Text style={styles.sectionDescription}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {children}
    </View>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({
  label,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}

        {required ? (
          <Text style={styles.requiredIndicator}> *</Text>
        ) : null}
      </Text>

      {children}
    </View>
  );
}

interface CounterProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onChange: (value: number) => void;
}

function Counter({
  label,
  icon,
  value,
  onChange,
}: CounterProps) {
  return (
    <View style={styles.counterContainer}>
      <View style={styles.counterTitleRow}>
        <Ionicons
          name={icon}
          size={17}
          color="#2563EB"
        />

        <Text style={styles.counterLabel}>
          {label}
        </Text>
      </View>

      <View style={styles.counterControl}>
        <TouchableOpacity
          style={styles.counterButton}
          onPress={() =>
            onChange(Math.max(1, value - 1))
          }
          activeOpacity={0.75}
        >
          <Ionicons
            name="remove"
            size={18}
            color="#374151"
          />
        </TouchableOpacity>

        <Text style={styles.counterValue}>
          {value}
        </Text>

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => onChange(value + 1)}
          activeOpacity={0.75}
        >
          <Ionicons
            name="add"
            size={18}
            color="#374151"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

function Toggle({
  label,
  value,
  onChange,
  description,
}: ToggleProps) {
  return (
    <TouchableOpacity
      style={[
        styles.toggleContainer,
        value ? styles.toggleContainerActive : undefined,
      ]}
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
    >
      <View style={styles.toggleTextContainer}>
        <Text
          style={[
            styles.toggleLabel,
            value ? styles.toggleLabelActive : undefined,
          ]}
        >
          {label}
        </Text>

        {description ? (
          <Text style={styles.toggleDescription}>
            {description}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.switchTrack,
          value ? styles.switchTrackActive : undefined,
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            value ? styles.switchThumbActive : undefined,
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

function getPropertyTypeIcon(
  type: PropertyType,
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "house":
      return "home-outline";

    case "villa":
      return "business-outline";

    case "studio":
      return "bed-outline";

    default:
      return "layers-outline";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },

  keyboardContainer: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "800",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 12,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 50,
  },

  sectionCard: {
    marginBottom: 18,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  sectionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  sectionHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },

  sectionDescription: {
    marginTop: 3,
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 17,
  },

  formField: {
    marginBottom: 18,
  },

  fieldLabel: {
    marginBottom: 7,
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },

  requiredIndicator: {
    color: "#EF4444",
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: "#111827",
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
  },

  descriptionInput: {
    height: 120,
  },

  characterCount: {
    marginTop: 6,
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "right",
  },

  helperText: {
    marginTop: 6,
    marginLeft: 3,
    color: "#9CA3AF",
    fontSize: 11,
  },

  inputWithPrefix: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
  },

  currencyPrefix: {
    paddingLeft: 15,
    paddingRight: 8,
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "800",
  },

  prefixedInput: {
    flex: 1,
    paddingRight: 15,
    paddingVertical: 13,
    color: "#111827",
    fontSize: 14,
  },

  inputWithSuffix: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
  },

  suffixedInput: {
    flex: 1,
    paddingLeft: 15,
    paddingVertical: 13,
    color: "#111827",
    fontSize: 14,
  },

  inputSuffix: {
    paddingHorizontal: 15,
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
  },

  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  imageWrapper: {
    position: "relative",
    marginRight: 12,
    marginBottom: 12,
  },

  propertyImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },

  coverBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  coverBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  removeImageButton: {
    position: "absolute",
    top: -7,
    right: -7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  addImageButton: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#93C5FD",
    borderRadius: 16,
    marginBottom: 12,
  },

  addImageIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  addImageText: {
    marginTop: 5,
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },

  imageCountText: {
    marginTop: 2,
    color: "#9CA3AF",
    fontSize: 9,
  },

  disabledButton: {
    opacity: 0.6,
  },

  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    marginBottom: 9,
  },

  typeButtonSpacing: {
    marginRight: 9,
  },

  selectedTypeButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  typeButtonText: {
    marginLeft: 6,
    color: "#4B5563",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  selectedTypeButtonText: {
    color: "#FFFFFF",
  },

  counterRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  counterHorizontalSpacing: {
    width: 12,
  },

  counterContainer: {
    flex: 1,
  },

  counterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  counterLabel: {
    marginLeft: 5,
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },

  counterControl: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    overflow: "hidden",
  },

  counterButton: {
    width: 43,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  counterValue: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  coordinateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  coordinateHeaderText: {
    flex: 1,
    marginRight: 10,
  },

  coordinateDescription: {
    marginTop: -3,
    color: "#9CA3AF",
    fontSize: 10,
  },

  detectLocationButton: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
  },

  detectLocationText: {
    marginLeft: 5,
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },

  coordinateRow: {
    flexDirection: "row",
  },

  coordinateHorizontalSpacing: {
    width: 10,
  },

  coordinateInputContainer: {
    flex: 1,
  },

  coordinateLabel: {
    marginBottom: 6,
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "600",
  },

  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
  },

  toggleContainerActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  toggleTextContainer: {
    flex: 1,
    marginRight: 15,
  },

  toggleLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },

  toggleLabelActive: {
    color: "#1D4ED8",
  },

  toggleDescription: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 17,
  },

  switchTrack: {
    width: 46,
    height: 26,
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: "#D1D5DB",
    borderRadius: 13,
  },

  switchTrackActive: {
    backgroundColor: "#2563EB",
  },

  switchThumb: {
    width: 20,
    height: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },

  switchThumbActive: {
    alignSelf: "flex-end",
  },

  submitButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderRadius: 16,
    shadowColor: "#2563EB",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitButtonText: {
    marginLeft: 9,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});