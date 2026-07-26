import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!isLoaded || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  const handleUpdateProfileImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to update your profile picture.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const selectedImage = result.assets[0];

      if (!selectedImage.base64) {
        Alert.alert(
          "Image Error",
          "The selected image could not be processed. Please choose another image.",
        );

        return;
      }

      setIsUpdating(true);

      const uri = selectedImage.uri;
      const filename = uri.split("/").pop() || "profile.jpg";
      const extensionMatch = /\.(\w+)$/.exec(filename);

      const imageExtension = extensionMatch?.[1]?.toLowerCase();
      const mimeType =
        imageExtension === "png"
          ? "image/png"
          : imageExtension === "webp"
            ? "image/webp"
            : "image/jpeg";

      const dataUrl = `data:${mimeType};base64,${selectedImage.base64}`;

      await user.setProfileImage({
        file: dataUrl,
      });

      Alert.alert(
        "Profile Updated",
        "Your profile picture has been updated successfully.",
      );
    } catch (error) {
      console.error("Error updating profile image:", error);

      Alert.alert(
        "Update Failed",
        "We could not update your profile picture. Please try again.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSigningOut(true);

              await signOut();

              router.replace("/sign-in");
            } catch (error) {
              console.error("Error signing out:", error);

              Alert.alert(
                "Sign Out Failed",
                "Something went wrong while signing out. Please try again.",
              );
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ],
    );
  };

  const handleSupport = async () => {
    const supportUrl =
      "mailto:piyushagarwalvo@gmail.com?subject=Help%20%26%20Support%20-%20Kribb%20App";

    try {
      const supported = await Linking.canOpenURL(supportUrl);

      if (!supported) {
        Alert.alert(
          "Email Not Available",
          "No email application was found on this device.",
        );

        return;
      }

      await Linking.openURL(supportUrl);
    } catch (error) {
      console.error("Error opening email app:", error);

      Alert.alert(
        "Unable to Open Email",
        "Please try again later.",
      );
    }
  };

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

  const email =
    user.primaryEmailAddress?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    "Email not available";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: user.imageUrl }}
              style={styles.profileImage}
            />

            <TouchableOpacity
              style={[
                styles.cameraButton,
                isUpdating && styles.disabledButton,
              ]}
              disabled={isUpdating}
              onPress={handleUpdateProfileImage}
              activeOpacity={0.85}
            >
              {isUpdating ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="camera"
                  size={17}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>
            {fullName}
          </Text>

          <Text style={styles.userEmail}>
            {email}
          </Text>

          <View style={styles.accountBadge}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color="#2563EB"
            />

            <Text style={styles.accountBadgeText}>
              Verified account
            </Text>
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Account
          </Text>

          <View style={styles.menuCard}>
            <MenuItem
              icon="heart-outline"
              label="Saved Properties"
              description="View all your favourite listings"
              onPress={() =>
                router.push("/(root)/(tabs)/saved")
              }
            />

            <View style={styles.divider} />

            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              description="Manage alerts and updates"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Notification settings will be available soon.",
                )
              }
            />

            <View style={styles.divider} />

            <MenuItem
              icon="settings-outline"
              label="Settings"
              description="Manage your app preferences"
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Settings will be available soon.",
                )
              }
            />
          </View>
        </View>

        {/* Support section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Support
          </Text>

          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              description="Contact us for assistance"
              onPress={handleSupport}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[
            styles.signOutButton,
            isSigningOut && styles.disabledButton,
          ]}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.85}
        >
          {isSigningOut ? (
            <ActivityIndicator
              size="small"
              color="#EF4444"
            />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#EF4444"
            />
          )}

          <Text style={styles.signOutButtonText}>
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>
          Kribb App
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <Ionicons
          name={icon}
          size={21}
          color="#2563EB"
        />
      </View>

      <View style={styles.menuTextContainer}>
        <Text style={styles.menuLabel}>
          {label}
        </Text>

        {description && (
          <Text style={styles.menuDescription}>
            {description}
          </Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#9CA3AF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },

  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },

  profileHeader: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  imageWrapper: {
    position: "relative",
  },

  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#E5E7EB",
    borderWidth: 4,
    borderColor: "#EFF6FF",
  },

  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  userName: {
    marginTop: 16,
    color: "#111827",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  userEmail: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },

  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 13,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
  },

  accountBadgeText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },

  section: {
    marginTop: 26,
  },

  sectionTitle: {
    marginBottom: 10,
    marginLeft: 3,
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  menuItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  menuTextContainer: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  menuLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },

  menuDescription: {
    marginTop: 3,
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 17,
  },

  divider: {
    height: 1,
    marginLeft: 71,
    backgroundColor: "#F3F4F6",
  },

  signOutButton: {
    height: 54,
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 15,
  },

  signOutButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "700",
  },

  versionText: {
    marginTop: 20,
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
});