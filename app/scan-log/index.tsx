import { useEffect, useState } from "react";
import {
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import {
  Text,
  List,
  ActivityIndicator,
  Divider,
  Card,
} from "react-native-paper";
import { Stack } from "expo-router";
import { onValue, ref } from "firebase/database";
import { db } from "../../constants/firebase";

type Session = {
  id: string;
  userId: string;
  status: string;
  timestamp: number;
};

type Section = {
  title: string;
  data: Session[];
};

export default function ScanLog() {
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const timesheetsRef = ref(db, "timesheets");

  const unsubscribe = onValue(timesheetsRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      setSections([]);
      setLoading(false);
      return;
    }

    const sessions: Session[] = [];

    // Loop through users
    Object.entries(data).forEach(([userId, dates]) => {
      // Loop through each date
      Object.entries(dates as Record<string, any>).forEach(([dateKey, times]) => {
        if (times.clockIn) {
          sessions.push({
            id: `${userId}-${dateKey}-in`,
            userId,
            status: "clockIn",
            timestamp: times.clockIn,
          });
        }

        if (times.clockOut) {
          sessions.push({
            id: `${userId}-${dateKey}-out`,
            userId,
            status: "clockOut",
            timestamp: times.clockOut,
          });
        }
      });
    });

    // Sort by time, newest first
    sessions.sort((a, b) => b.timestamp - a.timestamp);

    // Group by dateKey again for UI sectioning
    const grouped: { [key: string]: Session[] } = {};
    sessions.forEach((session) => {
      const dateKey = new Date(session.timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(session);
    });

    const sectionList: Section[] = Object.entries(grouped)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => b.data[0].timestamp - a.data[0].timestamp);

    setSections(sectionList);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);


const getStatusEmoji = (status: string) => {
  switch (status) {
    case "clockIn":
      return "🟢";
    case "clockOut":
      return "🔴";
    default:
      return "🤔";
  }
};


  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date)
        ? prev.filter((d) => d !== date)
        : [...prev, date]
    );
  };

  const filteredSections = sections.map((section) => ({
    title: section.title,
    data: expandedDates.includes(section.title) ? section.data : [],
  }));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Scan History" }} />
      <Text variant="titleLarge" style={styles.title}>
        📋 Scan Log
      </Text>

      {loading ? (
        <ActivityIndicator animating color="#0E7AFE" size="large" />
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <>
              <List.Accordion
                title={section.title}
                expanded={expandedDates.includes(section.title)}
                onPress={() => toggleExpand(section.title)}
                titleStyle={{ color: "#0E7AFE" }}
                left={() => (
                  <List.Icon icon={expandedDates.includes(section.title) ? "chevron-down" : "chevron-right"} />
                )}
              />
              <Divider />
            </>
          )}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={`${getStatusEmoji(item.status)} ${item.status.toUpperCase()}`}
                subtitle={`ID: ${item.id}`}
                titleStyle={{ fontWeight: "bold" }}
              />
              <Card.Content>
                <Text>User: {item.userId}</Text>
                <Text>⏱ {new Date(item.timestamp).toLocaleTimeString()}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  title: {
    color: "white",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  card: {
    marginVertical: 8,
    backgroundColor: "#1a1a1a",
  },
});
