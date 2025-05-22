import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function ScanResultScreen() {
  const { status, userId } = useLocalSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.back();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const isSuccess = status === "success";

  return (
    <View style={[styles.container, { backgroundColor: isSuccess ? "#d4edda" : "#f8d7da" }]}>
      <Text style={[styles.icon, { color: isSuccess ? "#155724" : "#721c24" }]}>
        {isSuccess ? "✅" : "❌"}
      </Text>
      <Text style={[styles.message, { color: isSuccess ? "#155724" : "#721c24" }]}>
        {isSuccess
          ? `Scan successful for ${userId}`
          : `Scan failed or already used`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  message: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});
