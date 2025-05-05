import React, { useState } from 'react';
import { Text, View, Button, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../constants/firebase';
import QrClockIn from '../../components/ui/QrClockIn';


export default function HomeScreen() {
  const [status, setStatus] = useState<'IN' | 'OUT' | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const handleClock = async (type: 'IN' | 'OUT') => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    setStatus(type);
    setTimestamp(timeString);

    try {
      await addDoc(collection(db, 'clockLogs'), {
        type,
        time: Timestamp.fromDate(now),
        userId: 'user123',
      });
      Alert.alert('Success', `Clock ${type} recorded!`);
    } catch (error) {
      console.error('Firestore Error:', error);
      Alert.alert('Error', 'Failed to save clock log.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clock In / Clock Out</Text>
      <Button title="Clock In" onPress={() => handleClock('IN')} />
      <Button title="Clock Out" onPress={() => handleClock('OUT')} />
      {status && (
        <Text style={styles.status}>
          You clocked {status.toLowerCase()} at {timestamp}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  status: { marginTop: 20, fontSize: 16 },
});
