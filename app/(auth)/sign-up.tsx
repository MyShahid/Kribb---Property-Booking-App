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
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";

export default function SignUp() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    code: "",
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
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      code: "",
      general: "",
    };

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);

    return (
      !newErrors.firstName &&
      !newErrors.lastName &&
      !newErrors.email &&
      !newErrors.password
    );
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp) return;

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setPendingVerification(true);
    } catch (err: any) {
      const clerkError = err.errors?.[0];

      setErrors((prev) => ({
        ...prev,
        general: clerkError?.message || "Something went wrong",
      }));

      console.log(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || !signUp) return;

    if (!code.trim()) {
      setErrors((prev) => ({
        ...prev,
        code: "Verification code is required",
      }));
      return;
    }

    try {
      setIsLoading(true);

      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(root)/(tabs)" as any);
      } else {
        setErrors((prev) => ({
          ...prev,
          code: "Verification is not complete. Please try again.",
        }));
      }
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        code:
          err.errors?.[0]?.message ||
          "Invalid verification code. Please try again.",
      }));

      console.log(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setIsResending(true);

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setErrors((prev) => ({
        ...prev,
        general: "A new verification code has been sent.",
      }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        general:
          err.errors?.[0]?.message || "Could not resend verification code.",
      }));
    } finally {
      setIsResending(false);
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

          <Text style={styles.title}>
            {pendingVerification ? "Verify Email" : "Create Account"}
          </Text>

          <Text style={styles.subtitle}>
            {pendingVerification
              ? "Enter the code sent to your email"
              : "Find your perfect stay with Kribb!"}
          </Text>

          <View style={styles.inputContainer}>
            {!pendingVerification ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    clearFieldError("firstName");
                  }}
                />
                {errors.firstName ? (
                  <Text style={styles.error}>{errors.firstName}</Text>
                ) : null}

                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    clearFieldError("lastName");
                  }}
                />
                {errors.lastName ? (
                  <Text style={styles.error}>{errors.lastName}</Text>
                ) : null}

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
                  onPress={onSignUpPress}
                  disabled={isLoading}
                  style={[
                    styles.signUpButton,
                    isLoading && styles.disabledButton,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.linkContainer}>
                  <Text>
                    Already have an account?{" "}
                    <Link href="/sign-in">
                      <Text style={styles.linkText}>Log in</Text>
                    </Link>
                  </Text>
                </View>

                <View nativeID="clerk-captcha" />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Verification Code"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    clearFieldError("code");
                  }}
                />

                {errors.code ? (
                  <Text style={styles.error}>{errors.code}</Text>
                ) : null}

                {errors.general ? (
                  <Text style={styles.infoText}>{errors.general}</Text>
                ) : null}

                <TouchableOpacity
                  onPress={onVerifyPress}
                  disabled={isLoading}
                  style={[
                    styles.signUpButton,
                    isLoading && styles.disabledButton,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Email</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={resendVerificationCode}
                  disabled={isResending}
                  style={[
                    styles.secondaryButton,
                    isResending && styles.disabledButton,
                  ]}
                >
                  {isResending ? (
                    <ActivityIndicator color="#007BFF" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      I need a new code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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

  signUpButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#007BFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 12,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

  secondaryButtonText: {
    color: "#007BFF",
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