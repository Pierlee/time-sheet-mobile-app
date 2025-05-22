import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
} from "react-native";
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
    const sessionsRef = ref(db, "qrSessions");

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setSections([]);
        setLoading(false);
        return;
      }

      const sessions: Session[] = Object.entries(data)
        .map(([id, value]: [string, any]) => ({
          id,
          userId: value.userId || "unknown",
          status: value.status || "unknown",
          timestamp: value.timestamp || 0,
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      const grouped: { [key: string]: Session[] } = {};
      sessions.forEach((session) => {
        const dateKey = new Date(session.timestamp).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(session);
      });

      const sectionList: Section[] = Object.entries(grouped)
        .map(([title, data]) => ({ title, data }))
        .sort((a, b) =>
          new Date(b.data[0].timestamp).getTime() -
          new Date(a.data[0].timestamp).getTime()
        );

      setSections(sectionList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "success":
        return "✅";
      case "used":
        return "⚠️";
      case "invalid":
        return "❌";
      case "error":
        return "🛑";
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
      <Text style={styles.title}>📋 Scan Log</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0E7AFE" />
      ) : sections.length === 0 ? (
        <Text style={styles.empty}>No scans found.</Text>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Pressable onPress={() => toggleExpand(section.title)}>
              <Text style={styles.sectionHeader}>
                {expandedDates.includes(section.title) ? "🔽" : "▶️"} {section.title}
              </Text>
            </Pressable>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.status}>
                {getStatusEmoji(item.status)} {item.status.toUpperCase()}
              </Text>
              <Text style={styles.id}>ID: {item.id}</Text>
              <Text>User: {item.userId}</Text>
              <Text>
                ⏱ {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionHeader: {
    color: "#0E7AFE",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  id: {
    color: "#0E7AFE",
    marginBottom: 6,
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
  },
  empty: {
    color: "gray",
    textAlign: "center",
    marginTop: 40,
  },
});
