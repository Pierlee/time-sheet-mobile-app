import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { BarCodeScanningResult } from 'expo-camera/build/Camera.types';
import { ref, update } from 'firebase/database';
import { db } from '../constants/firebase'; // adjust if needed

export default function QrClockIn() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async (scanningResult: BarCodeScanningResult) => {
    if (!scanningResult?.data || scanned) return;

    const sessionId = scanningResult.data;
    const userId = "user123"; // replace with real logic
    setScanned(true);

    try {
      const sessionRef = ref(db, `qrSessions/${sessionId}`);
      await update(sessionRef, {
        status: 'read',
        userId,
        timestamp: Date.now(),
      });

      Alert.alert('Success', `Clock-in sent for ${userId}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update QR session.');
    }
  };

  if (hasPermission === null) return <Text>Requesting permission...</Text>;
  if (hasPermission === false) return <Text>No camera access</Text>;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        type={CameraType.back}
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={{ barCodeTypes: ['qr'] }}
      />
      {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
