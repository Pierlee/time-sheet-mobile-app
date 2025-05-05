import React from 'react';
import { SafeAreaView } from 'react-native';
import QrClockIn from '../../components/QrClockIn';

export default function ScanScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <QrClockIn />
    </SafeAreaView>
  );
}
