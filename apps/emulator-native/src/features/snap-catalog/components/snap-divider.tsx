import { StyleSheet, View } from "react-native";

export function SnapDivider() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    width: "100%",
    height: 1,
    backgroundColor: "#d1d5db",
    marginVertical: 8,
  },
});
