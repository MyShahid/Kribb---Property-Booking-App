import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";

export default function SignIn() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors((prev) => ({
      ...prev,
      [field]: "",
      general: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return !newErrors.email && !newErrors.password;
  };

  const onSignInPress = async () => {
    if (!isLoaded || !signIn) return;

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(root)/(tabs)" as any);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Sign in is not complete. Please try again.",
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general:
          err.errors?.[0]?.message ||
          "Invalid email or password. Please try again.",
      }));

      console.log(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require("../../assets/images/kribb.png")}
            resizeMode="contain"
            style={styles.logo}
          />

          <Text style={styles.title}>Welcome Back!</Text>

          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError("email");
              }}
            />

            {errors.email ? (
              <Text style={styles.error}>{errors.email}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError("password");
              }}
            />

            {errors.password ? (
              <Text style={styles.error}>{errors.password}</Text>
            ) : null}

            {errors.general ? (
              <Text style={styles.infoText}>{errors.general}</Text>
            ) : null}

            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              style={[
                styles.signInButton,
                isLoading && styles.disabledButton,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linkContainer}>
              <Text>
                Don't have an account?{" "}
                <Link href="/sign-up">
                  <Text style={styles.linkText}>Sign Up</Text>
                </Link>
              </Text>
            </View>

            <View nativeID="clerk-captcha" />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  logo: {
    width: 100,
    height: 50,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },

  subtitle: {
    marginTop: 5,
    marginBottom: 20,
    color: "#555",
  },

  inputContainer: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "column",
    marginBottom: 20,
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
  },

  signInButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  error: {
    color: "red",
    fontSize: 13,
    marginTop: 4,
  },

  infoText: {
    color: "#555",
    fontSize: 13,
    marginTop: 8,
  },

  linkContainer: {
    flexDirection: "row",
    gap: 5,
    marginTop: 10,
    justifyContent: "center",
  },

  linkText: {
    color: "blue",
  },
});