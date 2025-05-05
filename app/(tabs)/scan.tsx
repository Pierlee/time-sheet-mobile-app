import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import QrClockIn from '../../components/ui/QrClockIn';

export default function ScanScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <QrClockIn />
    </SafeAreaView>
  );
}
