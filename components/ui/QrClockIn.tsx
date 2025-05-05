// components/QrClockIn.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { ref, update } from 'firebase/database';
import { db } from '../../constants/firebase'; // check if path is correct

export default function QrClockIn() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    const sessionId = data;
    const userId = "user123"; // you can replace this with real user info

    try {
      const sessionRef = ref(db, `qrSessions/${sessionId}`);
      await update(sessionRef, {
        status: 'read',
        userId,
        timestamp: Date.now(),
      });

      Alert.alert('Success', `Clock-in sent for ${userId}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to clock in.');
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
