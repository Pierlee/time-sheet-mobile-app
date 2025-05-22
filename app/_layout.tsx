import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme } from "react-native-paper";

export default function Layout() {
  return (
    <PaperProvider theme={MD3DarkTheme}>
      <Stack />
    </PaperProvider>
  );
}
