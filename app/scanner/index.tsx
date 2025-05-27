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
import { get, set, ref, update } from "firebase/database";
import { db } from "../../constants/firebase";

export default function Scanner() {
  const qrLock = useRef(false); // ✅ Controls if scanning is allowed
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const [scanned, setScanned] = useState(false); // ✅ Used to stop showing the camera after scan

const handleBarcodeScanned = async ({ data }: { data: string }) => {
  if (qrLock.current || !data) return;

  qrLock.current = true;
  setScanned(true);

  try {
    const sessionId = data;
    const userId = "user123";
    const now = Date.now();

    // 📅 Get date key like "2025-05-23"
    const dateKey = new Date().toISOString().split("T")[0];
    const timesheetRef = ref(db, `timesheets/${userId}/${dateKey}`);
    const timesheetSnap = await get(timesheetRef);

    if (!timesheetSnap.exists()) {
      // ✅ First scan today
      await set(timesheetRef, { clockIn: now });
      alert(`Clock-in successful at ${new Date(now).toLocaleTimeString()}`);
    } else {
      const sheet = timesheetSnap.val();

      if (!sheet.clockOut) {
        // ✅ Second scan today
        await update(timesheetRef, { clockOut: now });
        alert(`Clock-out successful at ${new Date(now).toLocaleTimeString()}`);
      } else {
        // ❌ Already completed
        alert("You've already clocked in and out today.");
      }
    }

    router.push({
      pathname: "/scan-result",
      params: { status: "success", userId },
    });
  } catch (err) {
    console.error("Error handling scan:", err);
    alert("Something went wrong.");
    router.push({
      pathname: "/scan-result",
      params: { status: "error", userId: "user123" },
    });
  } finally {
    qrLock.current = false;
  }
};

  //Reset lock when app comes back to foreground
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
        {/* Only show camera if scanning hasn't happened */}
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
