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
import { useEffect, useRef, useState } from "react";
import { get, set, ref, update } from "firebase/database";
import { db } from "../../constants/firebase";

export default function Scanner() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (qrLock.current || !data) return;

    qrLock.current = true;
    setScanned(true);

    try {
      const sessionId = data;
      const userId = "user123";
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;

      const dateKey = new Date().toISOString().split("T")[0];
      const timesheetRef = ref(db, `timesheets/${userId}/${dateKey}`);
      const timesheetSnap = await get(timesheetRef);

      let newSessionType = "clockIn";

      if (!timesheetSnap.exists()) {
        // First entry of the day
        await set(timesheetRef, {
          sessions: [{ type: "clockIn", timestamp: now }],
        });
        alert(`Clock-in successful at ${new Date(now).toLocaleTimeString()}`);

        
      } else {
        const data = timesheetSnap.val();
        const sessions = data.sessions || [];

        const lastSession = sessions[sessions.length - 1];

        if (lastSession?.type === "clockIn") {
          // Last was clock-in, now clock-out
          newSessionType = "clockOut";
        } else if (lastSession?.type === "clockOut") {
          // Last was clock-out, check time gap
          const timeSinceLastOut = now - lastSession.timestamp;
          if (timeSinceLastOut < sixHours) {
            alert("You need to wait at least 6 hours before clocking in again.");
            router.push({
              pathname: "/scan-result",
              params: { status: "error", userId },
            });
            return;
          }
          newSessionType = "clockIn";
        }

        const updatedSessions = [...sessions, { type: newSessionType, timestamp: now }];
        await update(timesheetRef, { sessions: updatedSessions });

        alert(
          `${newSessionType === "clockIn" ? "Clock-in" : "Clock-out"} successful at ${new Date(now).toLocaleTimeString()}`
        );
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

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
        setScanned(false);
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
