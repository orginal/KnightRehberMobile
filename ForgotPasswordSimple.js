import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ForgotPasswordSimple({ onBack }) {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen email adresinizi girin!");
      return;
    }

    const usersRaw = await AsyncStorage.getItem("users");
    const users = usersRaw ? JSON.parse(usersRaw) : [];

    const found = users.find(u => u.email === email);

    if (!found) {
      Alert.alert("Bulunamadı", "Bu email ile kayıtlı hesap yok.");
      return;
    }

    Alert.alert(
      "Şifre Hatırlatma",
      `Bu email için kayıtlı şifre: ${found.password}`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔑 Şifremi Unuttum</Text>

      <TextInput
        style={styles.input}
        placeholder="Email adresiniz"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Şifreyi Göster</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>◀ Geri Dön</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:"center", alignItems:"center", padding:20, backgroundColor:"#0B0B0B" },
  title: { fontSize:24, color:"#fff", marginBottom:20 },
  input: { width:"90%", backgroundColor:"#1A1A1A", padding:15, borderRadius:10, color:"#fff" },
  button: { backgroundColor:"#FFD66B", padding:15, borderRadius:10, width:"90%", marginTop:15 },
  buttonText: { textAlign:"center", fontWeight:"bold", color:"#000" },
  backText: { marginTop:20, color:"#FFD66B", fontSize:16 }
});
