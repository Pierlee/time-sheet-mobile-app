import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme, ActivityIndicator } from "react-native-paper";
import { useEffect, useState } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"; // adjust path if needed
import { View } from "react-native-reanimated/lib/typescript/Animated";

export default function Layout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    console.log("Auth state changed:", user);
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "black",
        }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
  );

  return (
    <PaperProvider theme={MD3DarkTheme}>
      <Stack />
    </PaperProvider>
  );
}
