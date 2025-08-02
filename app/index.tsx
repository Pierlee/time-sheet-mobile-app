import { useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase"; // make sure this path is correct

export default function Home() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth"); // redirect to login
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Home", headerShown: false }} />
      <Text style={styles.title}>QR Code Scanner</Text>

      <View style={styles.buttonGroup}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/scanner")}
        >
          <Text style={styles.buttonText}>📷 Scan QR Code</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/scan-log")}
        >
          <Text style={styles.buttonText}>📋 View History</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 40,
  },
  buttonGroup: {
    width: "100%",
    gap: 20,
  },
  button: {
    backgroundColor: "#0E7AFE",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
});
