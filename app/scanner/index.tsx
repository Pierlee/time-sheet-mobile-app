import { useRouter } from "expo-router";
import { Camera, CameraView } from "expo-camera";
import { Stack } from "expo-router";
import {
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  Button,
  View,
} from "react-native";
import { Overlay } from "./Overlay";
import { useEffect, useRef } from "react";
import { getDatabase, ref, update } from 'firebase/database';
import { db } from '../../constants/firebase';

export default function Home() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const router = useRouter()

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (data && !qrLock.current) {
      qrLock.current = true;
      try {
        const sessionId = data;
        const userId = 'user123';
        const sessionRef = ref(db, `qrSessions/${sessionId}`);
  
        await update(sessionRef, {
          status: 'read',
          userId,
          timestamp: Date.now(),
        });
  
        Alert.alert('Success', `Clock-in sent for ${userId}`);
      } catch (err) {
        console.error('Error updating QR status:', err);
        Alert.alert('Error', 'Failed to update the QR code status.');
      }
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
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
          title: "Overview",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        />
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
