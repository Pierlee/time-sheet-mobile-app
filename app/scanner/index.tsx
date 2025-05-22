import { useRouter } from "expo-router";
import { CameraView } from "expo-camera";
import { Stack } from "expo-router";
import {
  AppState,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Button,
  View,
} from "react-native";
import { Overlay } from "./Overlay";
import { useEffect, useRef, useState } from "react"; // ✅ Added useState here
import { get, ref, update } from "firebase/database";
import { db } from "../../constants/firebase";

export default function Scanner() {
  const qrLock = useRef(false); // ✅ Controls if scanning is allowed
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const [scanned, setScanned] = useState(false); // ✅ Used to stop showing the camera after scan

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    // ✅ Prevent multiple scans by exiting early if locked
    if (qrLock.current) return;

    if (data) {
      qrLock.current = true;
      setScanned(true); // ✅ Visually hide camera so user knows it's handled

      try {
        const sessionId = data;
        const userId = "user123"; // Replace with actual user ID later
        const sessionRef = ref(db, `qrSessions/${sessionId}`);
        const snapshot = await get(sessionRef);

        if (!snapshot.exists()) {
          router.push({
            pathname: "/scan-result" as const,
            params: { status: "invalid", userId },
          });
          return;
        }

        const sessionData = snapshot.val();

        if (sessionData.status === "read") {
          router.push({
            pathname: "/scan-result" as const,
            params: { status: "used", userId },
          });
          return;
        }

        await update(sessionRef, {
          status: "read",
          userId,
          timestamp: Date.now(),
        });

        router.push({
          pathname: "/scan-result" as const,
          params: { status: "success", userId },
        });
      } catch (err) {
        console.error("Error updating QR status:", err);
        router.push({
          pathname: "/scan-result" as const,
          params: { status: "error", userId: "user123" },
        });
      }
    }
  };

  // ✅ Reset lock when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
        setScanned(false); // ✅ Also allow scanner to appear again
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Scanner",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      <View style={styles.cameraContainer}>
        {/* ✅ Only show camera if scanning hasn't happened */}
        {!scanned && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}
        <View style={styles.buttonContainer}>
          <Button title="Go Back" onPress={() => router.replace("/")} />
        </View>
      </View>
      <Overlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  buttonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 5,
  },
});
