import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from "@clerk/clerk-expo"
import { useRouter } from 'expo-router';
 
export default function Profile() {

  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try{
      await signOut();
      router.replace("/sign-in" as any);
    } catch(err){

    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
  <View style={styles.container}>
    <Text style={styles.title}>Profile</Text>

    <Text style={styles.subtitle}>
      Logged in successfully.
    </Text>

    <TouchableOpacity
      style={styles.button}
      onPress={handleSignOut}
    >
      <Text style={styles.buttonText}>
        Sign Out
      </Text>
    </TouchableOpacity>
  </View>
</SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#222",
  },

  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#FF5A5F",
    width: "100%",
    maxWidth: 300,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});