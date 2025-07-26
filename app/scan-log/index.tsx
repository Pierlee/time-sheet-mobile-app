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
  Button,
} from "react-native-paper";
import { Stack } from "expo-router";
import { onValue, ref } from "firebase/database";
import { db } from "../../constants/firebase";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Types
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

      Object.entries(data).forEach(([userId, dates]) => {
        Object.entries(dates as Record<string, any>).forEach(
          ([dateKey, dayData]) => {
            const sessionList = dayData.sessions || [];

            sessionList.forEach((s: any, index: number) => {
              sessions.push({
                id: `${userId}-${dateKey}-${index}`,
                userId,
                status: s.type,
                timestamp: s.timestamp,
              });
            });
          }
        );
      });

      sessions.sort((a, b) => b.timestamp - a.timestamp);

      const grouped: { [key: string]: Session[] } = {};
      sessions.forEach((session) => {
        const dateKey = new Date(session.timestamp).toLocaleDateString(
          undefined,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        );

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

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

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

  const handleExportCSV = async () => {
    const csvRows = prepareCSVData(sections);
    const csvString = generateCSV(csvRows);
    await saveAndShareCSV(csvString);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Scan History" }} />
      <Text variant="titleLarge" style={styles.title}>
        Scan Log
      </Text>

      <Button
        mode="contained"
        onPress={handleExportCSV}
        style={{ margin: 10 }}
      >
        Export Timesheet (CSV)
      </Button>

      {loading ? (
        <ActivityIndicator animating color="#0E7AFE" size="large" />
      ) : (
        <SectionList
          sections={sections.map((section) => ({
            title: section.title,
            data: expandedDates.includes(section.title) ? section.data : [],
          }))}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => {
            const clockIn = section.data.find((s) => s.status === "clockIn");
            const clockOut = section.data.find((s) => s.status === "clockOut");

            let duration = null;
            if (clockIn && clockOut) {
              const diffMs = clockOut.timestamp - clockIn.timestamp;
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const minutes = Math.floor(
                (diffMs % (1000 * 60 * 60)) / (1000 * 60)
              );
              duration = `${hours}h ${minutes}m`;
            }

            return (
              <>
                <List.Accordion
                  title={`${section.title}${
                    duration ? ` • Worked ${duration}` : ""
                  }`}
                  expanded={expandedDates.includes(section.title)}
                  onPress={() => toggleExpand(section.title)}
                  titleStyle={{ color: "#0E7AFE" }}
                  left={() => (
                    <List.Icon
                      icon={
                        expandedDates.includes(section.title)
                          ? "chevron-down"
                          : "chevron-right"
                      }
                    />
                  )}
                >
                  <View /> {/* FIX: to satisfy required children */}
                </List.Accordion>
                <Divider />
              </>
            );
          }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={`${getStatusEmoji(item.status)} ${item.status.toUpperCase()}`}
                subtitle={`ID: ${item.id}`}
                titleStyle={{ fontWeight: "bold" }}
              />
              <Card.Content>
                <Text>User: {item.userId}</Text>
                <Text>
                  ⏱{" "}
                  {new Date(item.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

// 🔧 Helper functions

const prepareCSVData = (
  sections: Section[]
): { date: string; clockIn?: string; clockOut?: string; duration?: string }[] => {
  const rows: { date: string; clockIn?: string; clockOut?: string; duration?: string }[] = [];

  sections.forEach((section) => {
    const date = section.title;

    const clockIn = section.data.find((s) => s.status === "clockIn");
    const clockOut = section.data.find((s) => s.status === "clockOut");

    const clockInTime = clockIn
      ? new Date(clockIn.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const clockOutTime = clockOut
      ? new Date(clockOut.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    let duration = "";
    if (clockIn && clockOut) {
      const diffMs = clockOut.timestamp - clockIn.timestamp;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${minutes}m`;
    }

    rows.push({ date, clockIn: clockInTime, clockOut: clockOutTime, duration });
  });

  return rows;
};

const generateCSV = (
  rows: { date: string; clockIn?: string; clockOut?: string; duration?: string }[]
) => {
  let csv = "Date,Clock In,Clock Out,Duration\n";

  rows.forEach((row) => {
    csv += `${row.date},${row.clockIn || ""},${row.clockOut || ""},${row.duration || ""}\n`;
  });

  return csv;
};

const saveAndShareCSV = async (csvString: string) => {
  const fileUri = FileSystem.documentDirectory + "timesheet.csv";
  await FileSystem.writeAsStringAsync(fileUri, csvString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri);
};

// 🔧 Styles

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
