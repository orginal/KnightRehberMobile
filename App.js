import React, { useState, useEffect, useContext, createContext } from 'react'; 
import ForgotPasswordSimple from "./ForgotPasswordSimple";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Linking,
  AppState
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Auth Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // AsyncStorage kullanarak kullanıcı bilgilerini kaydet
  const saveUserToStorage = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.log('Kullanıcı bilgileri kaydedilemedi:', error);
    }
  };

  // AsyncStorage'dan kullanıcı bilgilerini yükle
  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.log('Kullanıcı bilgileri yüklenemedi:', error);
    }
    return null;
  };

  // Sorumluluk reddi durumunu kaydet
  const saveDisclaimerStatus = async (accepted) => {
    try {
      await AsyncStorage.setItem('disclaimerAccepted', JSON.stringify(accepted));
    } catch (error) {
      console.log('Sorumluluk reddi durumu kaydedilemedi:', error);
    }
  };

  // Sorumluluk reddi durumunu yükle
  const loadDisclaimerStatus = async () => {
    try {
      const status = await AsyncStorage.getItem('disclaimerAccepted');
      return status ? JSON.parse(status) : false;
    } catch (error) {
      console.log('Sorumluluk reddi durumu yüklenemedi:', error);
    }
    return false;
  };

  // Alarmları kaydet
  const saveAlarmsToStorage = async (userId, alarms) => {
    try {
      await AsyncStorage.setItem(`alarms_${userId}`, JSON.stringify(alarms));
    } catch (error) {
      console.log('Alarmlar kaydedilemedi:', error);
    }
  };

  // Alarmları yükle
  const loadAlarmsFromStorage = async (userId) => {
    try {
      const alarms = await AsyncStorage.getItem(`alarms_${userId}`);
      return alarms ? JSON.parse(alarms) : {};
    } catch (error) {
      console.log('Alarmlar yüklenemedi:', error);
    }
    return {};
  };

  // Kullanıcıları kaydet
  const saveUsersToStorage = async (usersData) => {
    try {
      await AsyncStorage.setItem('users', JSON.stringify(usersData));
    } catch (error) {
      console.log('Kullanıcılar kaydedilemedi:', error);
    }
  };

  // Kullanıcıları yükle
  const loadUsersFromStorage = async () => {
    try {
      const usersData = await AsyncStorage.getItem('users');
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.log('Kullanıcılar yüklenemedi:', error);
    }
    return [];
  };

  // Uygulama başlangıcında kayıtlı kullanıcıyı yükle
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        const savedUsers = await loadUsersFromStorage();
        const savedUser = await loadUserFromStorage();
        const savedDisclaimer = await loadDisclaimerStatus();
        
        if (savedUsers.length > 0) {
          setUsers(savedUsers);
        } else {
          // Varsayılan test kullanıcısını ekle
          const defaultUsers = [
            {
              id: '1',
              email: 'test@test.com',
              password: '123456',
              username: 'TestUser',
              phone: '5551234567',
              createdAt: new Date(),
              favorites: [],
              alarms: {},
              premium: false
            }
          ];
          setUsers(defaultUsers);
          await saveUsersToStorage(defaultUsers);
        }
        
        if (savedUser) {
          setUser(savedUser);
        }
        
        setDisclaimerAccepted(savedDisclaimer);
        setShowDisclaimer(!savedDisclaimer);
        
      } catch (error) {
        console.log('Uygulama başlatılırken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const register = async (email, password, username, phone) => {
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return { success: false, error: 'Bu email zaten kayıtlı!' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Şifre en az 6 karakter olmalı!' };
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      username,
      phone,
      createdAt: new Date(),
      favorites: [],
      alarms: {},
      premium: false
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setUser(newUser);
    await saveUserToStorage(newUser);
    await saveUsersToStorage(updatedUsers);
    return { success: true, user: newUser };
  };

  const login = async (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      await saveUserToStorage(foundUser);
      return { success: true, user: foundUser };
    }
    return { success: false, error: 'Geçersiz email veya şifre!' };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('userData');
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    await saveUserToStorage(updatedUser);
    await saveUsersToStorage(updatedUsers);
  };

  const continueWithoutRegister = async () => {
    const guestUser = {
      id: 'guest',
      email: 'guest@guest.com',
      username: 'Misafir',
      phone: '',
      createdAt: new Date(),
      favorites: [],
      alarms: {},
      premium: false,
      isGuest: true
    };
    setUser(guestUser);
    await saveUserToStorage(guestUser);
  };

  const acceptDisclaimer = async () => {
    setDisclaimerAccepted(true);
    setShowDisclaimer(false);
    await saveDisclaimerStatus(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      register, 
      login, 
      logout, 
      updateUser,
      users,
      showDisclaimer,
      setShowDisclaimer,
      continueWithoutRegister,
      disclaimerAccepted,
      acceptDisclaimer,
      saveAlarmsToStorage,
      loadAlarmsFromStorage,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Splash Screen - KAPAK.JPG EKLENDİ
const SplashScreen = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#07070C" }}>
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "#07070C"}}>
      <Image 
        source={require('./assets/kapak.jpg')} 
        style={{width: '100%', height: '100%', resizeMode: 'cover'}}
      />
    </View>
  </SafeAreaView>
);

// Header Component
const Header = ({ onOpenSettings }) => {
  const { user } = useAuth();
  
  return (
    <View style={styles.header}>
      <Text style={styles.title}>KNIGHT REHBER</Text>
      <TouchableOpacity style={styles.settingsWrap} onPress={onOpenSettings}>
        <View style={styles.settingsCircle}>
          <Text style={styles.settingsEmoji}>⚙️</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Settings Modal
const SettingsModal = ({ visible, onClose }) => {
  const { user, logout } = useAuth();
  const [text, setText] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alarmType, setAlarmType] = useState('notification'); // 'notification' veya 'phone'

  const sendFeedback = () => {
    if (!text.trim()) return Alert.alert("Boş", "Mesaj yazmalısınız.");
    Alert.alert("Teşekkürler", "Öneriniz gönderildi!");
    setText("");
    onClose();
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Bildirim Ayarları',
      `Bildirimler ${!notificationsEnabled ? 'açıldı' : 'kapatıldı'}`,
      [{ text: 'Tamam' }]
    );
  };

  const handleAlarmTypeChange = (type) => {
    setAlarmType(type);
    Alert.alert(
      'Alarm Tipi',
      `Alarm tipi ${type === 'notification' ? 'bildirim' : 'telefon alarmı'} olarak ayarlandı`,
      [{ text: 'Tamam' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const openEmail = (subject = '', body = '') => {
    const email = 'info@knightrehber.com';
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto).catch(err => Alert.alert('Hata', 'E-posta uygulaması açılamadı.'));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          
          {/* GERİ BUTONU */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>⬅ Geri</Text>
          </TouchableOpacity>

          {/* PROFİL BÖLÜMÜ */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <View style={styles.avatarImage}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <Text style={styles.profileName}>{user?.username || 'Kullanıcı'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>

            {user?.premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ PREMIUM</Text>
              </View>
            )}
            {user?.isGuest && (
              <View style={styles.guestBadge}>
                <Text style={styles.guestText}>👤 MİSAFİR KULLANICI</Text>
              </View>
            )}
          </View>

          {/* AYARLAR */}
          <Text style={[styles.small, { marginTop: 18 }]}>AYARLAR</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Bildirimler</Text>
              <Text style={styles.settingDescription}>
                Etkinlik alarmları ve güncellemeler için bildirim al
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#475467', true: '#FFD66B' }}
              thumbColor={notificationsEnabled ? '#0B0B0B' : '#f4f3f4'}
            />
          </View>

          {/* ALARM TİPİ SEÇİMİ */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Alarm Tipi</Text>
              <Text style={styles.settingDescription}>
                Bildirim veya telefon alarmı seçebilirsiniz
              </Text>
            </View>
            <View style={styles.alarmTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.alarmTypeButton, 
                  alarmType === 'notification' && styles.alarmTypeButtonActive
                ]}
                onPress={() => handleAlarmTypeChange('notification')}
              >
                <Text style={[
                  styles.alarmTypeText,
                  alarmType === 'notification' && styles.alarmTypeTextActive
                ]}>
                  📢
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.alarmTypeButton, 
                  alarmType === 'phone' && styles.alarmTypeButtonActive
                ]}
                onPress={() => handleAlarmTypeChange('phone')}
              >
                <Text style={[
                  styles.alarmTypeText,
                  alarmType === 'phone' && styles.alarmTypeTextActive
                ]}>
                  ⏰
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SORUMLULUK REDDİ */}
          <Text style={[styles.small, { marginTop: 18 }]}>SORUMLULUK REDDİ</Text>
          <TouchableOpacity 
            style={styles.disclaimerSetting}
            onPress={() => {
              Alert.alert(
                'Genel Sorumluluk Reddi Beyanı',
                "Knight Online'ın tüm hakları Mgame Corp.'a aittir ve Game Cafe Services, Inc. tarafından yayımlanır. Knight Rehber uygulaması, Mgame ve NTTGame'den bağımsızdır.Uygulama da bulunan bilgiler internet ortamından ve oyun içinden toplanan verilerle oluşturulmuştur. Verilerin doğruluğu garantisi verilmemektedir.Uygulamadaki verilere dayanarak oyun içi ya da dışı oluşabilecek sorunlardan KNIGHT REHBER uygulaması sorumlu tutulamaz.",
                [{ text: 'Tamam' }]
              );
            }}
          >
            <Text style={styles.disclaimerSettingText}>📄 Sorumluluk Reddi Beyanını Oku</Text>
          </TouchableOpacity>

          {/* GERİ BİLDİRİM */}
          <Text style={[styles.small, { marginTop: 18 }]}>ÖNERİ / GERİ BİLDİRİM</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Görüşünüzü yazın..."
            placeholderTextColor="#8E97A8"
            multiline
            value={text}
            onChangeText={setText}
          />

          {/* HIZLI İLETİŞİM BUTONLARI */}
          <Text style={[styles.small, { marginTop: 18 }]}>HIZLI İLETİŞİM</Text>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => openEmail('Üye Olma İsteği', 'Merhaba, Knight Rehber uygulamasına üye olmak istiyorum.')}
            >
              <Text style={styles.contactButtonText}>📝 Üye Ol</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => {
  setShowForgotPassword(true);
  setSettingsVisible(false); // eğer modal açıksa settings'i kapat
}}
            >
              <Text style={styles.contactButtonText}>🔑 Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => openEmail('Şikayet/Öneri', 'Merhaba, Knight Rehber uygulaması hakkında şikayet/önerim var:')}
            >
              <Text style={styles.contactButtonText}>💡 Şikayet/Öneri</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => openEmail('Fotoğraf Gönderme', 'Merhaba, Knight Rehber uygulaması için fotoğraf göndermek istiyorum.')}
            >
              <Text style={styles.contactButtonText}>📸 Fotoğraf Gönder</Text>
            </TouchableOpacity>
          </View>

          {/* BUTONLAR */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>🚪 Çıkış Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendBtn} onPress={sendFeedback}>
              <Text style={styles.sendBtnText}>Gönder</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

// Genel Sorumluluk Reddi Beyanı
const DisclaimerModal = ({ visible, onAccept }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.disclaimerContainer}>
        <View style={styles.disclaimerContent}>
          <Text style={styles.disclaimerTitle}>Genel Sorumluluk Reddi Beyanı</Text>
          
          <ScrollView style={styles.disclaimerScroll}>
            <Text style={styles.disclaimerText}>
              Knight Online'ın tüm hakları Mgame Corp.'a aittir ve Game Cafe Services, Inc. tarafından yayımlanır. Knight Rehber uygulaması, Mgame ve NTTGame'den bağımsızdır.Uygulama da bulunan bilgiler internet ortamından ve oyun içinden toplanan verilerle oluşturulmuştur. Verilerin doğruluğu garantisi verilmemektedir.Uygulamadaki verilere dayanarak oyun içi ya da dışı oluşabilecek sorunlardan KNIGHT REHBER uygulaması sorumlu tutulamaz.
            </Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.disclaimerButton}
            onPress={onAccept}
          >
            <Text style={styles.disclaimerButtonText}>Anladım ve Kabul Ediyorum</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Kayıt Olmadan Devam Et Modal'ı
const GuestWarningModal = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.disclaimerContainer}>
        <View style={styles.guestWarningContent}>
          <Text style={styles.guestWarningTitle}>Dikkat!</Text>
          <Text style={styles.guestWarningText}>
            Kayıt olmadan devam ediyorsunuz. Bu durumda çekilişlere katılamaz ve alarm ayarlarınız kaydedilmez. Kayıt olmanız bu özelliklerden faydalanabilmeniz için önemlidir.
          </Text>
          
          <View style={styles.guestWarningButtons}>
            <TouchableOpacity 
              style={[styles.guestWarningButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Geri Dön</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.guestWarningButton, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>Anladım, Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Giriş/Kayıt Bileşenleri
const LoginScreen = ({ onLogin, onSwitchToRegister }) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { continueWithoutRegister, acceptDisclaimer } = useAuth();
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun!');
      return;
    }

    setLoading(true);
    const result = await onLogin(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Giriş Başarısız', result.error);
    } else {
      acceptDisclaimer();
    }
  };

  const handleGuestContinue = () => {
    setShowGuestWarning(true);
  };

  const confirmGuestContinue = () => {
    setShowGuestWarning(false);
    continueWithoutRegister();
    acceptDisclaimer();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <GuestWarningModal 
        visible={showGuestWarning}
        onConfirm={confirmGuestContinue}
        onCancel={() => setShowGuestWarning(false)}
      />
      
      <ScrollView contentContainerStyle={styles.authScroll}>
        <View style={styles.authHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logo}>⚔️</Text>
            </View>
            <Text style={styles.authTitle}>KnightRehber</Text>
          </View>
          <Text style={styles.authSubtitle}>Hesabınıza giriş yapın</Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="email@example.com"
              placeholderTextColor="#8E97A8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Şifrenizi girin"
              placeholderTextColor="#8E97A8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestButton}
            onPress={handleGuestContinue}
          >
            <Text style={styles.guestButtonText}>Kayıt Olmadan Devam Et</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchAuthButton}
            onPress={onSwitchToRegister}
          >
            <Text style={styles.switchAuthText}>
              Hesabınız yok mu? <Text style={styles.switchAuthHighlight}>Kayıt Olun</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.testAccount}>
            <Text style={styles.testAccountTitle}>Test Hesabı:</Text>
            <Text style={styles.testAccountText}>Email: test@test.com</Text>
            <Text style={styles.testAccountText}>Şifre: 123456</Text>
          </View>
          {showForgotPassword && (
  <ForgotPasswordSimple onClose={() => setShowForgotPassword(false)} />
)}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.confirmPassword || !form.username) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun!');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor!');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı!');
      return;
    }

    setLoading(true);
    const result = await onRegister(form.email, form.password, form.username, form.phone);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Kayıt Başarısız', result.error);
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.authContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.authScroll}>
        <View style={styles.authHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logo}>⚔️</Text>
            </View>
            <Text style={styles.authTitle}>Kayıt Ol</Text>
          </View>
          <Text style={styles.authSubtitle}>Yeni hesap oluşturun</Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Kullanıcı adınız"
              placeholderTextColor="#8E97A8"
              value={form.username}
              onChangeText={(text) => updateForm('username', text)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="email@example.com"
              placeholderTextColor="#8E97A8"
              value={form.email}
              onChangeText={(text) => updateForm('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telefon (Opsiyonel)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="5551234567"
              placeholderTextColor="#8E97A8"
              value={form.phone}
              onChangeText={(text) => updateForm('phone', text)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <TextInput
              style={styles.textInput}
              placeholder="En az 6 karakter"
              placeholderTextColor="#8E97A8"
              value={form.password}
              onChangeText={(text) => updateForm('password', text)}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre Tekrar</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor="#8E97A8"
              value={form.confirmPassword}
              onChangeText={(text) => updateForm('confirmPassword', text)}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol'}
            </Text>
          </TouchableOpacity>
<TouchableOpacity 
  style={{ marginTop: 10, alignSelf: "center" }}
  onPress={() => setShowForgotPassword(true)}
>
  <Text style={{ color: "#FFD66B", fontSize: 15 }}>
    🔑 Şifremi Unuttum
  </Text>
</TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchAuthButton}
            onPress={onSwitchToLogin}
          >
            <Text style={styles.switchAuthText}>
              Zaten hesabınız var mı? <Text style={styles.switchAuthHighlight}>Giriş Yapın</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Geliştirilmiş Alarm Sistemi
const useAlarmSystem = () => {
  const { user, saveAlarmsToStorage, loadAlarmsFromStorage } = useAuth();
  const [alarms, setAlarms] = useState({});
  const [alarmType, setAlarmType] = useState('notification');

  // Alarmları yükle
  useEffect(() => {
    const loadAlarms = async () => {
      if (user && !user.isGuest) {
        const savedAlarms = await loadAlarmsFromStorage(user.id);
        setAlarms(savedAlarms);
      }
    };
    loadAlarms();
  }, [user]);

  // Bildirim izinlerini kontrol et
  const checkNotificationPermissions = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  };

  // Telefon alarmı oluştur
  const createPhoneAlarm = async (etkinlik, triggerDate) => {
    // Bu kısım cihazın alarm API'sine bağlı olarak değişir
    // Örnek olarak konsola yazdırıyoruz
    console.log(`Telefon alarmı ayarlandı: ${etkinlik.name} - ${triggerDate}`);
    
    // Gerçek uygulamada cihazın alarm API'sini kullanmanız gerekir
    Alert.alert(
      'Telefon Alarmı',
      `${etkinlik.name} için telefon alarmı ayarlandı: ${triggerDate.toLocaleTimeString('tr-TR')}`
    );
  };

  // Bildirim alarmı oluştur
  const createNotificationAlarm = async (etkinlik, triggerDate, identifier) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${etkinlik.name}`,
          body: `${etkinlik.name} ${triggerDate.getMinutes() === 0 ? 'başladı!' : '5 dakika sonra başlayacak!'}`,
          sound: 'default',
          data: { etkinlikId: etkinlik.id, type: 'alarm' },
        },
        trigger: {
          date: triggerDate,
        },
      });
    } catch (error) {
      console.log('Bildirim oluşturma hatası:', error);
    }
  };

  // Alarm ayarla
  const scheduleAlarm = async (etkinlikId, etkinlik) => {
    if (!user || user.isGuest) {
      Alert.alert('Uyarı', 'Alarm özelliğini kullanmak için giriş yapmalısınız.');
      return false;
    }

    try {
      // Mevcut alarmları temizle
      await cancelAlarm(etkinlikId);

      const now = new Date();
      
      for (const timeStr of etkinlik.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // 5 dakika önce alarm
        const fiveMinutesBefore = new Date();
        fiveMinutesBefore.setHours(hours, minutes - 5, 0, 0);
        if (fiveMinutesBefore > now) {
          const alarmId = `${etkinlikId}_5min_${timeStr}`;
          if (alarmType === 'phone') {
            await createPhoneAlarm(etkinlik, fiveMinutesBefore);
          } else {
            await createNotificationAlarm(etkinlik, fiveMinutesBefore, alarmId);
          }
        }

        // Tam saatinde alarm
        const exactTime = new Date();
        exactTime.setHours(hours, minutes, 0, 0);
        if (exactTime > now) {
          const alarmId = `${etkinlikId}_exact_${timeStr}`;
          if (alarmType === 'phone') {
            await createPhoneAlarm(etkinlik, exactTime);
          } else {
            await createNotificationAlarm(etkinlik, exactTime, alarmId);
          }
        }
      }

      // Alarm durumunu kaydet
      const newAlarms = {
        ...alarms,
        [etkinlikId]: { 
          active: true, 
          type: alarmType,
          lastScheduled: new Date().toISOString()
        }
      };
      setAlarms(newAlarms);
      if (user && !user.isGuest) {
        await saveAlarmsToStorage(user.id, newAlarms);
      }

      return true;
    } catch (error) {
      console.log('Alarm ayarlama hatası:', error);
      return false;
    }
  };

  // Alarmı kaldır
  const cancelAlarm = async (etkinlikId) => {
    try {
      // Bildirim alarmlarını kaldır
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const notificationsToCancel = scheduledNotifications.filter(
        notification => notification.content.data?.etkinlikId === etkinlikId
      );

      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }

      // Alarm durumunu güncelle
      const newAlarms = { ...alarms };
      delete newAlarms[etkinlikId];
      setAlarms(newAlarms);
      if (user && !user.isGuest) {
        await saveAlarmsToStorage(user.id, newAlarms);
      }

      return true;
    } catch (error) {
      console.log('Alarm kaldırma hatası:', error);
      return false;
    }
  };

  // Alarm durumunu değiştir
  const toggleAlarm = async (etkinlikId, etkinlik) => {
    const isActive = alarms[etkinlikId]?.active;

    if (isActive) {
      const success = await cancelAlarm(etkinlikId);
      if (success) {
        Alert.alert('Alarm Kapatıldı', `${etkinlik.name} alarmları kapatıldı.`);
      }
    } else {
      const hasPermission = await checkNotificationPermissions();
      if (!hasPermission && alarmType === 'notification') {
        Alert.alert('Bildirim İzni Gerekli', 'Alarmları kullanmak için bildirim izni vermelisiniz.');
        return;
      }

      const success = await scheduleAlarm(etkinlikId, etkinlik);
      if (success) {
        Alert.alert(
          'Alarm Ayarlandı 🎯', 
          `${etkinlik.name} için alarmlar ayarlandı!\n\n⏰ Saatler: ${etkinlik.times.join(', ')}\n\n5 dakika önce ve tam saatinde ${alarmType === 'phone' ? 'telefon alarmı' : 'bildirim'} alacaksınız.`
        );
      } else {
        Alert.alert('Hata', 'Alarm ayarlanırken bir hata oluştu.');
      }
    }
  };

  return {
    alarms,
    alarmType,
    setAlarmType,
    toggleAlarm,
    scheduleAlarm,
    cancelAlarm
  };
};

// KnightNostalji Bileşeni
const KnightNostaljiScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nostaljiFotograflar = [
    { 
      id: 'k1', 
      title: 'Eski Knight Online 1', 
      image: require('./assets/ko1.jpg')
    },
    { 
      id: 'k2', 
      title: 'Eski Knight Online 2', 
      image: require('./assets/ko2.jpg')
    },
    { 
      id: 'k3', 
      title: 'Eski Knight Online 3', 
      image: require('./assets/ko3.jpg')
    },
    { 
      id: 'k4', 
      title: 'Eski Knight Online 4', 
      image: require('./assets/ko4.jpg')
    },
    { 
      id: 'k5', 
      title: 'Eski Knight Online 5', 
      image: require('./assets/ko5.jpg')
    },
    { 
      id: 'k6', 
      title: 'Eski Knight Online 6', 
      image: require('./assets/ko6.jpg')
    },
  ];

  const openImage = (foto, index) => {
    setSelectedImage(foto);
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % nostaljiFotograflar.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(nostaljiFotograflar[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (currentImageIndex - 1 + nostaljiFotograflar.length) % nostaljiFotograflar.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(nostaljiFotograflar[prevIndex]);
  };

  const renderImage = (foto, index) => {
    return (
      <TouchableOpacity 
        key={foto.id}
        style={styles.nostaljiImageContainer}
        onPress={() => openImage(foto, index)}
      >
        <Image 
          source={foto.image} 
          style={styles.nostaljiImage}
          resizeMode="cover"
        />
        <View style={styles.nostaljiImageInfo}>
          <Text style={styles.nostaljiImageTitle}>{foto.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.tabContent}>
        <Text style={styles.homeTitle}>📸 KnightNostalji</Text>
        
        <View style={styles.card}>
          <Text style={styles.sectionDescription}>
            Knight Online'ın unutulmaz eski günlerinden nostaljik fotoğraflar
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Sizde paylaşmamızı istediğiniz eski Knight Online görsellerinizi info@knightrehber.com adresine gönderebilirsiniz.
            </Text>
          </View>

          <View style={styles.nostaljiGrid}>
            {nostaljiFotograflar.map(renderImage)}
          </View>
        </View>
      </View>

      {/* Modal for full screen image view */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.fullScreenImageContainer}>
            <TouchableOpacity 
              style={styles.navButtonLeft}
              onPress={prevImage}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.fullScreenImageTouchable}
              activeOpacity={1}
            >
              <Image 
                source={selectedImage?.image} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButtonRight}
              onPress={nextImage}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.imageInfoOverlay}>
            <Text style={styles.fullImageTitle}>{selectedImage?.title}</Text>
            <Text style={styles.imageCounter}>
              {currentImageIndex + 1} / {nostaljiFotograflar.length}
            </Text>
            <Text style={styles.nostaljiWatermark}>
              KnightRehber Nostalji Arşivi
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Güncelleme Notları Bileşeni
const GuncellemeNotlariScreen = () => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.tabContent}>
        <Text style={styles.homeTitle}>🔄 Güncelleme Notları</Text>
        
<View style={styles.card}>
  <Text style={styles.eventName}>13.11.2025 Güncelleme Notları</Text>
  
  {/* Link butonu */}
  <View style={styles.linkContainer}>
    <Text style={styles.linkText}>🔗 Resmi Güncelleme Detayları:</Text>
    <Text 
      style={styles.urlText}
      onPress={() => Linking.openURL('https://www.nttgame.com/knight/TR/news/noticeview/2/4030')}
    >
      https://www.nttgame.com/knight/TR/news/noticeview/2/4030
    </Text>
  </View>
  
  <Text style={styles.subHeader}>Yeni Etkinlikler</Text>
  <Text style={styles.muted}>• Knight Marble Etkinliği (4 Hafta)</Text>
  <Text style={styles.muted}>• Manes'in Arenası (4 Hafta)</Text>
  <Text style={styles.muted}>• Altın Domuzu Yakala (4 Hafta)</Text>
  
  <Text style={styles.subHeader}>Aset NPC Güncellemeleri</Text>
  <Text style={styles.muted}>• Pathos Gloves satışı başladı</Text>
  <Text style={styles.muted}>• HP/Armor/Attack Scroll paketleri eklendi</Text>
  
  <Text style={styles.subHeader}>Sistem Değişiklikleri</Text>
  <Text style={styles.muted}>• Genie'ye Combo özelliği eklendi</Text>
  <Text style={styles.muted}>• Otomatik Transform Scroll/Totem kullanımı</Text>
  <Text style={styles.muted}>• Genie Hammer seçenekleri geliştirildi</Text>
  <Text style={styles.muted}>• Forgotten Temple Captcha sistemi eklendi</Text>
  
  <Text style={styles.subHeader}>Hata Düzeltmeleri</Text>
  <Text style={styles.muted}>• Rabbit Pet modelleri düzeltildi</Text>
  <Text style={styles.muted}>• Border Defense War düzeltmeleri</Text>
  <Text style={styles.muted}>• Familiar Hatching arayüz sorunu çözüldü</Text>
  
  <Text style={styles.subHeader}>Sona Eren Etkinlikler</Text>
  <Text style={styles.muted}>• Günlük Giriş Etkinliği</Text>
  <Text style={styles.muted}>• Ultima's Dungeon</Text>
  <Text style={styles.muted}>• Cadılar Bayramı etkinlikleri</Text>
  <Text style={styles.muted}>• Firari Ay Tavşanları</Text>
</View>
      </View>
    </ScrollView>
  );
};

// Skill-Stat Reset Tablosu Bileşeni
const SkillStatResetScreen = () => {
  const resetData = [
    { level: 1, skill: 0, stat: 0 },
  { level: 2, skill: 60, stat: 40 },
  { level: 3, skill: 240, stat: 160 },
  { level: 4, skill: 660, stat: 440 },
  { level: 5, skill: 1500, stat: 1000 },
  { level: 6, skill: 2760, stat: 1840 },
  { level: 7, skill: 4680, stat: 3120 },
  { level: 8, skill: 7440, stat: 4960 },
  { level: 9, skill: 11100, stat: 7400 },
  { level: 10, skill: 15900, stat: 10600 },
  { level: 11, skill: 21960, stat: 14640 },
  { level: 12, skill: 29520, stat: 19680 },
  { level: 13, skill: 38820, stat: 25880 },
  { level: 14, skill: 49920, stat: 33280 },
  { level: 15, skill: 63120, stat: 42080 },
  { level: 16, skill: 78600, stat: 52400 },
  { level: 17, skill: 96600, stat: 64400 },
  { level: 18, skill: 117360, stat: 78240 },
  { level: 19, skill: 141060, stat: 94040 },
  { level: 20, skill: 167940, stat: 111960 },
  { level: 21, skill: 198240, stat: 132160 },
  { level: 22, skill: 232200, stat: 154800 },
  { level: 23, skill: 270060, stat: 180040 },
  { level: 24, skill: 312120, stat: 208080 },
  { level: 25, skill: 358620, stat: 239080 },
  { level: 26, skill: 409740, stat: 273160 },
  { level: 27, skill: 465840, stat: 310560 },
  { level: 28, skill: 527160, stat: 351440 },
  { level: 29, skill: 594000, stat: 396000 },
  { level: 30, skill: 1666500, stat: 1111000 },
  { level: 31, skill: 1863000, stat: 1242000 },
  { level: 32, skill: 2075000, stat: 1383600 },
  { level: 33, skill: 2304300, stat: 1536200 },
  { level: 34, skill: 2550450, stat: 1700300 },
  { level: 35, skill: 2814600, stat: 1876400 },
  { level: 36, skill: 3097500, stat: 2065000 },
  { level: 37, skill: 3399000, stat: 2266600 },
  { level: 38, skill: 3722550, stat: 2481700 },
  { level: 39, skill: 4066350, stat: 2710900 },
  { level: 40, skill: 4431900, stat: 2954600 },
  { level: 41, skill: 4820100, stat: 3213400 },
  { level: 42, skill: 5231550, stat: 3487700 },
  { level: 43, skill: 5667300, stat: 3778200 },
  { level: 44, skill: 6128100, stat: 4085400 },
  { level: 45, skill: 6614700, stat: 4409800 },
  { level: 46, skill: 7128000, stat: 4752000 },
  { level: 47, skill: 7668750, stat: 5112500 },
  { level: 48, skill: 8237700, stat: 5491800 },
  { level: 49, skill: 8836050, stat: 5890700 },
  { level: 50, skill: 9464250, stat: 6309500 },
  { level: 51, skill: 10123500, stat: 6749000 },
  { level: 52, skill: 10814400, stat: 7209600 },
  { level: 53, skill: 11538000, stat: 7692000 },
  { level: 54, skill: 12295050, stat: 8196700 },
  { level: 55, skill: 13086450, stat: 8724300 },
  { level: 56, skill: 13913250, stat: 9275500 },
  { level: 57, skill: 14776350, stat: 9850900 },
  { level: 58, skill: 15676350, stat: 10450900 },
  { level: 59, skill: 16614600, stat: 11076400 },
  { level: 60, skill: 26387325, stat: 17591550 },
  { level: 61, skill: 27912825, stat: 18608550 },
  { level: 62, skill: 29499525, stat: 19666350 },
  { level: 63, skill: 31148775, stat: 20765850 },
  { level: 64, skill: 32862150, stat: 21908100 },
  { level: 65, skill: 34640775, stat: 23093850 },
  { level: 66, skill: 36486450, stat: 24324300 },
  { level: 67, skill: 38400525, stat: 25600350 },
  { level: 68, skill: 40384350, stat: 26922900 },
  { level: 69, skill: 42439500, stat: 28293000 },
  { level: 70, skill: 44567325, stat: 29711550 },
  { level: 71, skill: 46769400, stat: 31179600 },
  { level: 72, skill: 49047075, stat: 32698050 },
  { level: 73, skill: 51402150, stat: 34268100 },
  { level: 74, skill: 53835750, stat: 35890500 },
  { level: 75, skill: 56349675, stat: 37566450 },
  { level: 76, skill: 58945500, stat: 39297000 },
  { level: 77, skill: 61624350, stat: 41082900 },
  { level: 78, skill: 64388025, stat: 42925350 },
  { level: 79, skill: 67238100, stat: 44825400 },
  { level: 80, skill: 70176150, stat: 46784100 },
  { level: 81, skill: 73203750, stat: 48802500 },
  { level: 82, skill: 76322250, stat: 50881500 },
  { level: 83, skill: 79533450, stat: 53022300 }
];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.tabContent}>
        <Text style={styles.homeTitle}>📊 Skill-Stat Reset</Text>
        <Text style={styles.sectionDescription}>
          Skill ve Stat reset maliyetleri
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.eventName}>Reset Maliyet Tablosu</Text>
          
          {/* Tablo Başlığı */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Level</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Skill</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Stat</Text>
          </View>

          {/* Tablo İçeriği */}
          {resetData.map((item, index) => (
            <View key={index} style={[
              styles.tableRow,
              index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
            ]}>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>
                {item.level}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {item.skill.toLocaleString()}
              </Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {item.stat.toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.resetInfo}>
            <Text style={styles.resetInfoTitle}>💡 Bilgiler:</Text>
            <Text style={styles.resetInfoText}>• Skill Reset: Skill puanlarını sıfırlar</Text>
            <Text style={styles.resetInfoText}>• Stat Reset: Stat puanlarını sıfırlar</Text>
            <Text style={styles.resetInfoText}>• NPC: Moradon - Reset NPC</Text>
            <Text style={styles.resetInfoText}>• Ücret: Noah</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Achievements Bileşeni
const AchievementsScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState('Tümü');
  
 const achievementsData = [
    { id: 1, name: "Beginning of an Honor", title: "Trainee Soldier", effect: "Attack power +10", description: "Defeat 100 enemy users", reward: "", category: "War -> Common -> Page 1" },
    { id: 2, name: "Battlefield Soldier", title: "Soldier", effect: "Attack power +10, Defense +20", description: "Defeat 500 enemy users", reward: "", category: "War -> Common -> Page 1" },
    { id: 3, name: "Battlefield General", title: "General", effect: "Attack power +13, Defense +1", description: "Defeat 1'000 enemy users", reward: "", category: "War -> Common -> Page 1" },
    { id: 4, name: "Battlefield Commander", title: "Berserker", effect: "Attack power +26", description: "Defeat 5'000 enemy users", reward: "", category: "War -> Common -> Page 2" },
    { id: 5, name: "Battlefield Warrior", title: "God of War", effect: "Short sword defense +1, Sword defense +1, Jamadar defense +1, Spear defense +1", description: "Defeat 10'000 enemy users", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Common -> Page 2" },
    { id: 6, name: "Battlefield Hero", title: "Over God", effect: "Defense +10, Short sword defense +1, Sword defense +1, Arrow defense +1, Axe defense +1", description: "Defeat 20'000 enemy users", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Common -> Page 2" },
    { id: 7, name: "Corps Hero", title: "Overmind", effect: "Attack power +13, Strength +1, Health +2, Intelligence +1, Magic power +1, Dexterity +1", description: "Defeat 30'000 enemy users", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Common -> Page 2" },
    { id: 8, name: "You know who I am?", title: "Can't Lose", effect: "Attack power +20", description: "Succeed in Revenge 100x", reward: "", category: "War -> Common -> Page 3" },
    { id: 9, name: "Revenge expert", title: "Revenger", effect: "Defense +70", description: "Succeed in Revenge 500x", reward: "", category: "War -> Common -> Page 3" },
    { id: 10, name: "Nemesis!", title: "Hatred", effect: "Attack power +20, Defense +40", description: "Succeed in Revenge 1'000x", reward: "", category: "War -> Common -> Page 3" },
    { id: 11, name: "I'm the best here!", title: "Fighter", effect: "Attack power +4, Health +4", description: "Win 100 duels in Moradon", reward: "", category: "War -> Moradon -> Page 1" },
    { id: 12, name: "Neverending Match", title: "Undaunted", effect: "Strength +1, Health +3, Intelligence +1, Magic power +1, Dexterity +1", description: "Win 1'000 duels in Moradon", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Moradon -> Page 1" },
    { id: 13, name: "Legend of the Arena", title: "Arena Legend", effect: "Strength +9", description: "Win 10'000 duels in Moradon", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Moradon -> Page 1" },
    { id: 14, name: "Warrior of an Ardream", title: "Ardream Veteran", effect: "Ice bonus +6", description: "Defeat 100 enemies at Ardream", reward: "", category: "War -> Pioneer Area -> Page 1" },
    { id: 15, name: "Revenger of Ardream", title: "Ardream's Revenger", effect: "Strength +6", description: "Succeed 100 times in revenge at Ardream", reward: "", category: "War -> Pioneer Area -> Page 1" },
    { id: 16, name: "Legend of Ronarkland", title: "Military Base Veteran", effect: "Health +6", description: "Defeat 100 enemies at Ronarkland base", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 2" },
    { id: 17, name: "Revenger of Ronarkland", title: "Military Base Revenger", effect: "Dexterity +6", description: "Succeed 100 times in revenge at Ronarkland base", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 2" },
    { id: 18, name: "Ronarkland Warrior", title: "Ronarkland Soldier", effect: "Attack power +5, Defense +5, Health +2", description: "Defeat 100 enemies in Ronarkland", reward: "Monster stone", category: "War -> Pioneer Area -> Page 3" },
    { id: 19, name: "Ronarkland Soldier", title: "Ronarkland Warrior", effect: "Health +1, Dexterity +5", description: "Defeat 500 enemies in Ronarkland", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 3" },
    { id: 20, name: "Ronarkland Warrior", title: "Ronarkland Veteran", effect: "Attack power +20, Defense +10", description: "Defeat 1'000 enemies in Ronarkland", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 3" },
    { id: 21, name: "Legend of Ronarkland", title: "Ronarkland Legend", effect: "Attack power +33", description: "Defeat 10'000 enemy users in Ronarkland", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 4" },
    { id: 22, name: "Ronarkland Revenger", title: "Ronarkland Revenger", effect: "Magic power +10", description: "Succeed 100 times in revenge at Ronarkland", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Pioneer Area -> Page 4" },
    { id: 23, name: "Lunar War's Warrior", title: "Lunar War Soldier", effect: "Strength +4, Health +1", description: "Defeat 100 enemies in Lunar war", reward: "Monster stone", category: "War -> Lunar -> Page 1" },
    { id: 24, name: "Lunar War's Soldier", title: "Lunar War Warrior", effect: "Strength +5, Health +1", description: "Defeat 500 enemy users in Lunar war", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Lunar -> Page 1" },
    { id: 25, name: "Lunar War's Warrior", title: "Lunar War Veteran", effect: "Attack power +15, Defense +15, Exp bonus +1%", description: "Defeat 1'000 enemy users in Lunar war", reward: "", category: "War -> Lunar -> Page 1" },
    { id: 26, name: "Legend of Lunar War", title: "Lunar War Legend", effect: "Intelligence +20", description: "Defeat 10'000 enemy users in Lunar war", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Lunar -> Page 2" },
    { id: 27, name: "Lunar War's Revenger", title: "Lunar War Revenger", effect: "Dexterity +10", description: "Succeed 100 times in revenge at Lunar War", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Lunar -> Page 2" },
    { id: 28, name: "Follow me!", title: "Commander", effect: "Health +9", description: "Win 100 times in Lunar War", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Lunar -> Page 3" },
    { id: 29, name: "Fortress of Defense", title: "Impregnable", effect: "Defense +90", description: "Win 100 Border Defense Wars", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Border Defense -> Page 1" },
    { id: 30, name: "Piece of Cake", title: "The Best", effect: "Intelligence +2, Magic power +4", description: "Win first place 10 times in Chaos event", reward: "", category: "War -> Chaos -> Page 1" },
    { id: 31, name: "I'm the best", title: "Most Popular", effect: "Strength +5, Health +4", description: "Win first place 100 times in Chaos event", reward: "", category: "War -> Chaos -> Page 1" },
    { id: 32, name: "So Close!", title: "2nd Best", effect: "Magic power +7", description: "Win second place 10 times in Chaos event", reward: "", category: "War -> Chaos -> Page 1" },
    { id: 33, name: "Next time I'll be #1", title: "3rd Best", effect: "Health +2, Dexterity +3", description: "Win third place 10 times in Chaos event", reward: "", category: "War -> Chaos -> Page 2" },
    { id: 34, name: "Commander of Battle", title: "Commander of Chaos", effect: "Short sword defense +1, Jamadar defense +1", description: "30 or more kills in Chaos event", reward: "", category: "War -> Chaos -> Page 2" },
    { id: 35, name: "Strong Excitement", title: "Gone Mad", effect: "Intelligence +14", description: "40 or more kills in Chaos event", reward: "", category: "War -> Chaos -> Page 3" },
    { id: 36, name: "Appearance of Legend", title: "For better or worse", effect: "Attack power +13, Contribution (NP per kill) +1", description: "50 or more kills in Chaos event", reward: "", category: "War -> Chaos -> Page 3" },
    { id: 37, name: "Juraid Commander", title: "King of Evil Spirit", effect: "Health +5, Intelligence +10", description: "Win 100 times at Juraid event", reward: "", category: "War -> Juraid -> Page 1" },
    { id: 38, name: "Magical Castle", title: "Crown Prince", effect: "Exp bonus +1%, Contribution (NP per kill) +1", description: "Cumulative Win x10 at Castle Siege War", reward: "", category: "War -> Castle Siege -> Page 1" },
    { id: 39, name: "Castle of War", title: "King", effect: "Attack power +20, Contribution (NP per kill) +2", description: "Cumulative Win x50 at Castle Siege War", reward: "", category: "War -> Castle Siege -> Page 1" },
    { id: 40, name: "Castle of King's Throne", title: "Emperor", effect: "Contribution (NP per kill) +2", description: "Cumulative Win x100 at Castle Siege War", reward: "", category: "War -> Castle Siege -> Page 1" },
    { id: 41, name: "Ronarkland Hunter", title: "Novice Hunter", effect: "Attack power +3", description: "Defeat 100 Ronarkland monsters", reward: "", category: "Adventure -> Common -> Page 1" },
    { id: 42, name: "Step by Step", title: "Noob", effect: "Health +2", description: "Defeat 1'000 Ronarkland monsters", reward: "Monster stone", category: "Adventure -> Common -> Page 1" },
    { id: 43, name: "Expert Hunter", title: "Novice Archer", effect: "Attack power +5, Defense +5, Exp bonus +1%", description: "Defeat 5'000 Ronarkland monsters", reward: "", category: "Adventure -> Common -> Page 1" },
    { id: 44, name: "Monster Chaser", title: "Chaser", effect: "Magic power +6, Exp bonus +2%", description: "Defeat 10'000 Ronarkland monsters", reward: "", category: "Adventure -> Common -> Page 1" },
    { id: 45, name: "Monster's King", title: "Beast Master", effect: "Ice bonus +8", description: "Defeat 30'000 Ronarkland monsters", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Common -> Page 1" },
    { id: 46, name: "Life is Precious", title: "Previous Life", effect: "Attack power +2, Defense +4", description: "Do not get killed and defeat 100 monsters", reward: "", category: "Adventure -> Common -> Page 2" },
    { id: 47, name: "Never Die", title: "Proficient", effect: "Intelligence +4", description: "Do not get killed and defeat 1000 monsters", reward: "Monster stone", category: "Adventure -> Common -> Page 2" },
    { id: 48, name: "Skilled in Hunting", title: "Expert", effect: "Defense +40", description: "Do not get killed and defeat 10000 monsters", reward: "", category: "Adventure -> Common -> Page 2" },
    { id: 49, name: "Secret of Immportality", title: "Four Phases of Life", effect: "Attack power +10, Exp bonus +3%", description: "Do not get killed and defeat 20'000 monsters", reward: "", category: "Adventure -> Common -> Page 2" },
    { id: 50, name: "I'm the Legend", title: "Immortal", effect: "Attack power +25, Defense +5", description: "Do not get killed and defeat 30'000 monsters", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Common -> Page 2" },
    { id: 51, name: "[Level 10] Piece of Cake", title: "Level 10", effect: "", description: "Reach level 10", reward: "Monster stone", category: "Normal -> Character -> Page 4" },
    { id: 52, name: "It's just the beginning", title: "Sprout", effect: "Health +1", description: "Defeat 1 Worm in Moradon", reward: "", category: "Adventure -> Field -> Page 1" },
    { id: 53, name: "Chief Hunting I", title: "Street Smart", effect: "", description: "Defeat [Chief] Hideous and [Chief] Bendiking in Moradon", reward: "Monster stone", category: "Adventure -> Field -> Page 1" },
    { id: 54, name: "Battle with Fog", title: "Ignorant", effect: "Magic power +3", description: "Complete Wings in the Fog 1 and 2 in Moradon\nWing of Fog I: Defeat 100 Gavolts or Giant Gavolts in Moradon\nWing of Fog II: Defeat 100 Gloomwing or Spoiler in Moradon", reward: "Monster stone", category: "Adventure -> Field -> Page 2" },
    { id: 55, name: "Violent Herbivore", title: "Patience", effect: "Strength +1, Health +1", description: "Defeat 100 Gliptodont", reward: "", category: "Adventure -> Field -> Page 3" },
    { id: 56, name: "Dance with the Wolves", title: "Wolf Hunter", effect: "Health +1, Dexterity +1", description: "Defeat 100 Dire wolves, Shadow Seekers, Loup-garous or Lycans", reward: "", category: "Adventure -> Field -> Page 3" },
    { id: 57, name: "Scorpion?", title: "Deadly Poisonus", effect: "Dexterity +2", description: "Defeat 100 Pincers, Paralyzers or Scorpions", reward: "", category: "Adventure -> Field -> Page 4" },
    { id: 58, name: "Walking Dead", title: "Undead Hunter", effect: "Magic power +2", description: "Defeat 100 Rotten Eyes and 100 Undying", reward: "", category: "Adventure -> Field -> Page 4" },
    { id: 59, name: "Crack in Resources", title: "All Resource Guardian", effect: "", description: "Defeat 100 Shadow Rifts in Moradon", reward: "", category: "Adventure -> Field -> Page 5" },
    { id: 60, name: "Troll's Friend", title: "Troller", effect: "", description: "Defeat 200 Gafs or Trolls in Luferson/El Morad castle", reward: "", category: "Adventure -> Field -> Page 6" },
    { id: 61, name: "Grave Guard", title: "Bony", effect: "Dexterity +3", description: "Abandoned Bones I & II\nAbandoned Bones I: Defeat 300 Skeleton Knights and 300 Skeleton Champions\nAbandoned Bones II: Defeat 300 Skeleton Warriors", reward: "Monster stone", category: "Adventure -> Field -> Page 9" },
    { id: 62, name: "Big Goblin Family", title: "Goblin's Enemy", effect: "Intelligence +6, Magic power +2", description: "Complete Goblin Family I & II\nGoblin Family I: Defeat 300 Pooka and 300 Goblin Bouncer\nGoblin Family II: Defeat 300 Bugbears and 300 Kobolds", reward: "", category: "Adventure -> Field -> Page 11" },
    { id: 63, name: "I like cure Aif", title: "Awesome Expert", effect: "Strength +1, Health +1, Intelligence +2, Magic power +1, Dexterity +1", description: "Defeat 2'000 Apes in Luferson/El Morad Castle", reward: "", category: "Adventure -> Field -> Page 13" },
    { id: 64, name: "The Burning", title: "Fireworks", effect: "Flame bonus +4", description: "Complete Extreme Pain and Flaming Heart\nExtreme Pain: Defeat 200 Burning Skeletons\nFlaming Heart: Defeat 100 Burning Stones and 100 Flame Rocks", reward: "Monster stone", category: "Adventure -> Field -> Page 17" },
    { id: 65, name: "Vindictive Spirit Liberator", title: "Skull King", effect: "Health +5", description: "Defeat 200 Dragon Tooth Commanders and 200 Dragon Tooth Knights", reward: "", category: "Adventure -> Field -> Page 18" },
    { id: 66, name: "Fat and Stupid", title: "Orc's Enemy", effect: "Strength +3", description: "Complete Orc Slayer I & II\nOrc Slayer I: Defeat 100 Uruk Hais and 100 Uruk Blades\nOrc Slayer II: Defeat 100 Uruk Trons", reward: "Monster stone", category: "Adventure -> Field -> Page 19" },
    { id: 67, name: "Storm's coming", title: "Blitz", effect: "Electric bonus +2", description: "Defeat 100 Storming Apostles", reward: "", category: "Adventure -> Field -> Page 25" },
    { id: 68, name: "Avoiding Whip", title: "Whipped", effect: "", description: "Defeat 100 Balogs", reward: "", category: "Adventure -> Field -> Page 26" },
    { id: 69, name: "Heat Hunting", title: "Flame", effect: "Flame bonus +2", description: "Defeat 100 Apostles of Flames", reward: "", category: "Adventure -> Field -> Page 29" },
    { id: 70, name: "Never ending Power", title: "Solid", effect: "Defense +20", description: "Defeat 200 Titans or Dark Stones", reward: "", category: "Adventure -> Field -> Page 29" },
    { id: 71, name: "Bitter Hunting", title: "Chill", effect: "Ice bonus +2", description: "Defeat 100 Apostles of Piercing Cold", reward: "", category: "Adventure -> Field -> Page 30" },
    { id: 72, name: "Sons of Darkness", title: "Blue Skin", effect: "Attack power +3, Defense +1", description: "Defeat 100 Forwird or Forwird Warriors and 100 Forwird Knights", reward: "", category: "Adventure -> Field -> Page 32" },
    { id: 73, name: "Invisible Attack", title: "Phantom", effect: "Strength +1, Exp bonus +1%", description: "Defeat 1'000 Phantoms in Desperation Abyss", reward: "", category: "Adventure -> Dungeon -> Page 2" },
    { id: 74, name: "Abyss Commander", title: "Queen", effect: "Strength +2, Health +2", description: "Complete Server of the Queen and For Knights in Hell Abyss\nServer of the Queen: Defeat 100 Servants of Isiloon in Hell Abyss\nFor Knights: Defeat Isiloon in Hell Abyss", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 4" },
    { id: 75, name: "Spider Massacre", title: "Hate Spider", effect: "Dexterity +1, Exp bonus +1%", description: "Defeat 1000 Tarantula in Delos Basement", reward: "", category: "Adventure -> Dungeon -> Page 5" },
    { id: 76, name: "Commander of the Base Castle", title: "Underworld", effect: "Health +1, Dexterity +3", description: "Complete Testing the King and Nightmare of Spiderman\nTesting the King: Defeat Krowaz in Red Blood in Delos Basement\nNightmare of Spiderman: Defeat Tarantula in Red Blood in Delos Basement", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 5" },
    { id: 77, name: "Draki", title: "Archeologist", effect: "Intelligence +10", description: "Complete Draki's Trace and Tracks in Ronarkland\nDraki's Tracks: Collect 100 Dragon's Dreadium Fossils\nDraki's Trace: Collect 100 Draki's Dragon Fossils", reward: "", category: "Adventure -> Field -> Page 33" },
    { id: 78, name: "Guardian", title: "Guardian", effect: "Strength +4", description: "Complete Guardian of the Guardian Tower I & II\nGuardian of the Guardian Tower I: Defeat 200 Lyots in Ronarkland\nGuardian of the Guardian Tower II: Defeat 200 Atrosses in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 34" },
    { id: 79, name: "Ronarkland Guardian", title: "Elder", effect: "Health +3, Intelligence +4", description: "Complete Ronarkland Elder I and II in Ronarkland\nRonarkland Elder I: Defeat 100 Enigmas and 100 Cruels in Ronarkland\nRonarkland Elder II: Defeat 100 Havocs and 100 Hell Fires in Ronarkland", reward: "", category: "Adventure -> Field -> Page 36" },
    { id: 80, name: "Working Expert", title: "Task Expert", effect: "Health +4, Intelligence +2", description: "Complete Work Procedure I and II in Ronarkland\nWork Procedure I: Defeat 1000 Enigmas or Cruels in Ronarkland\nWork Procedure II: Defeat 1000 Havoc or Hell Fires in Ronarkland", reward: "", category: "Adventure -> Field -> Page 36" },
    { id: 81, name: "Dragon Massacre", title: "Dragon Slayer", effect: "Flame bonus +9", description: "Defeat 100 Felankors in Ronarkland", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Field -> Page 36" },
    { id: 82, name: "Ruler of the Gate", title: "Most Speedy", effect: "Attack power +10, Defense +60", description: "Destroy 100 Chaos Stones in Ronarkland", reward: "", category: "Adventure -> Field -> Page 37" },
    { id: 83, name: "Abracadabra", title: "Like a Dog", effect: "Flame bonus +5", description: "Defeat 1000 Goloras in Ronarkland", reward: "", category: "Adventure -> Field -> Page 37" },
    { id: 84, name: "Sweeping Bandits", title: "Orc Slayer", effect: "Sword defense +2, Arrow defense +1", description: "Complete In Between the Arrow and Magic and In Between two Swords\nIn Between the Arrow and Magic: Defeat 100 Orc Bandit Archers and 100 Orc Bandit Officers (Archers) and 100 Orc Bandit Sorcerers and 100 Or Bandit Officers (Sorcerers)\nIn Between two Swords: Defeat 100 Orc Bandit Warriors and 100 Orc Bandit Officers (Warriors) and 100 Orc Bandit Leaders", reward: "", category: "Adventure -> Field -> Page 39" },
    { id: 85, name: "7 Sins", title: "Not a Sinner", effect: "Flame resistance +2, Ice resistance +1, Lighting resistance +2, Magic resistance +1, Spell resistance +1, Poison resistance +2", description: "Complete 4 Sins and 3 Sins in Ronarkland\n4 Sins: Defeat 100 Prides and 100 Gluttons and 100 Envy and 100 Greeds in Ronarkland\n3 Sins: Defeat 100 Sloths and 100 Lusts and 100 Wraths in Ronarkland", reward: "", category: "Adventure -> Field -> Page 41" },
    { id: 86, name: "Chaos Commander", title: "Chaos Domination", effect: "Ice bonus +3, Flame bonus +2, Electric bonus +3", description: "Complete Monster born in Chaos I and II in Ronarkland\nMonster born in Chaos I: Defeat 100x Jersey or Reepers and 100x Dulian or Samma in Ronarkland\nMonster born in Chaos II: Defeat 100x Javana or Barrkk and 100x Query or Raxton in Ronarkland", reward: "", category: "Adventure -> Field -> Page 42" },
    { id: 87, name: "Dragon Slayer", title: "Slayer", effect: "Jamadar defense +1, Health +2", description: "Defeat Red Dragon (Felankor) and Dark Dragon (Delos)", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Common -> Page 3" },
    { id: 88, name: "Juraid Knight", title: "Juraid Knight", effect: "Electric bonus +6", description: "Complete Juraid Monster III and Seed of Evil in Juraid\nJuraid Monster III: Defeat 100 Lich Kings and 100 Kocatris and 100 Lirimu and 100 Bone Dragons in Juraid\nSeed of Evil: Defeat 10 Deva in Juraid", reward: "", category: "Adventure -> Dungeon -> Page 7" },
    { id: 89, name: "New Owner of Krowaz Land", title: "Magican", effect: "Flame resistance +8", description: "Defeat Krowaz in Krowaz's Dominion", reward: "", category: "Adventure -> Field -> Page 43" },
    { id: 90, name: "Day to Catch Cows", title: "Ursa", effect: "Magic power +1, Exp bonus +1%", description: "Defeat 100 Minotaur in Krowaz's Dominion", reward: "", category: "Adventure -> Field -> Page 43" },
    { id: 91, name: "Treasure's all mine!", title: "Treasure Hunter", effect: "Dexterity +4", description: "Defeat 10 Treasure Boxes in Krowaz Dominion", reward: "Monster stone", category: "Adventure -> Field -> Page 44" },
    { id: 92, name: "Emperor of 1000 years", title: "Castle Destroyer", effect: "Electric bonus +7", description: "Do not get killed and defeat [Emperor]Mammoth the 3rd and [Machine Golem]Crasher Mimmick", reward: "", category: "Adventure -> Dungeon -> Page 9" },
    { id: 93, name: "Darkness, Snakes and Magic", title: "Kimera", effect: "Dexterity +7, Contribution (NP per kill) +1", description: "Do not get killed and defeat Purious", reward: "", category: "Adventure -> Dungeon -> Page 9" },
    { id: 94, name: "Blocking of Consciousness", title: "Saved from the Flame", effect: "Health +7, Contribution (NP per kill) +1", description: "Do not get killed and defeat [Emperor] Mammoth the 3rd and [Shackled Lord] Pluwitoon", reward: "", category: "Adventure -> Dungeon -> Page 10" },
    { id: 95, name: "Flame Destroyer", title: "Fire Destroyer", effect: "Strength +7, Contribution (NP per kill) +1", description: "Do not get killed and defeat [Emperor] Mammoth the 3rd and [Lord of Destruction]", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Dungeon -> Page 10" },
    { id: 96, name: "True Owner of the Castle", title: "Castle King", effect: "Health +3, Contribution (NP per kill) +1", description: "Complete Immportal of Under the Castle I and II\nImmportal of Under the Castle I: Do not get killed and defeat Purious\nImmportal of Under the Castle II: Do not get killed and defeat [Emperor]Mammoth the 3rd and [Machine Golem]Crasher Mimmick", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Dungeon -> Page 10" },
    { id: 97, name: "KNIGHT 11TH", title: "KNIGHT 11TH", effect: "Strength +1, Intelligence +2, Magic power +1, Dexterity +1", description: "Complete 11th Anniversary Quest of Julian", reward: "", category: "Normal -> Event -> Page 1" },
    { id: 98, name: "Enjoying Thanksgiving 2013", title: "2013 Thanksgiving", effect: "Health +5", description: "Deliver 50 Moon pieces to Magipie Mother for the year 2013", reward: "", category: "Normal -> Event -> Page 1" },
    { id: 99, name: "13Th Snow Knight", title: "13th Snow Knight", effect: "Health +3, Ice bonus +2, Ice resistance +2", description: "13Th Snow Knight", reward: "", category: "Normal -> Event -> Page 1" },
    { id: 100, name: "Relic Protector", title: "Relic Protector", effect: "Exp bonus +5%", description: "Relic Protector", reward: "", category: "Normal -> Event -> Page 1" },
    { id: 101, name: "Juraid Protector", title: "Juraid Protector", effect: "Defense +100", description: "Win 150 times at Juraid event", reward: "", category: "War -> Juraid -> Page 1" },
    { id: 102, name: "Knight Beginner", title: "Beginner", effect: "Defense +20, Health +3", description: "More than 1 year of Service during the Event Period", reward: "", category: "Normal -> Event -> Page 1" },
    { id: 103, name: "Knight Expert", title: "Expert", effect: "Defense +30, Health +4", description: "More than 4 years of Service during the Event Period", reward: "", category: "Normal -> Event -> Page 2" },
    { id: 104, name: "Knight Master", title: "Master", effect: "Defense +40, Health +5", description: "More than 8 years of Service during the Event Period", reward: "", category: "Normal -> Event -> Page 2" },
    { id: 105, name: "Enjoying Thanksgiving 2014", title: "2014 Thanksgiving", effect: "Defense +30", description: "Deliver 50 Moon pieces to Magipie Mother for the year 2014", reward: "", category: "Normal -> Event -> Page 2" },
    { id: 106, name: "14th Snow Knight", title: "14th Snow Knight", effect: "Defense +10, Health +4", description: "14th Snow Knight", reward: "", category: "Normal -> Event -> Page 2" },
    { id: 107, name: "Hellfire Controller", title: "Fire Dragon", effect: "Strength +5, Contribution (NP per kill) +1", description: "Accumulate 100 Feather Of Hellfire Dragon during anniversary event (every year, items to collect are different)", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 108, name: "Storm Controller", title: "Wind Dragon", effect: "Dexterity +5, Contribution (NP per kill) +1", description: "Accumulate 100 Feather Of Hellfire Dragon during anniversary event (every year, items to collect are different)", reward: "", category: "Normal -> Event -> Page 2" },
    { id: 109, name: "Terrain Controller", title: "Earth Dragon", effect: "Intelligence +5, Magic power +5, Contribution (NP per kill) +1", description: "Accumulate 100 Feather Of Hellfire Dragon during anniversary event (every year, items to collect are different)", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 110, name: "Hellfire Dragon Fighter", title: "Hellfire Dragon Fighter", effect: "Strength +3, Intelligence +3, Magic power +3, Dexterity +3", description: "Accumulate 1 Mark of Hellfire Dragon during 11th anniversary event", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 111, name: "Hellfire Dragon Slayer", title: "Hellfire Dragon Slayer", effect: "Strength +5, Intelligence +5, Magic power +5, Dexterity +5", description: "Accumulate 5 Mark of Hellfire Dragon during 11th anniversary event", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 112, name: "Hellfire Dragon Slayer Master", title: "Hellfire Dragon Slayer Master", effect: "Defense -20, Strength +10, Intelligence +10, Magic power +10, Dexterity +10", description: "Accumulate 10 Mark of Hellfire Dragon during 11th anniversary event", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 113, name: "Hellfire Dragon Slayer God", title: "Hellfire Dragon Slayer God", effect: "Defense -50, Strength +15, Intelligence +15, Magic power +15, Dexterity +15", description: "Accumulate 20 Mark of Hellfire Dragon during 11th anniversary event", reward: "", category: "Normal -> Event -> Page 3" },
    { id: 114, name: "15th Snow Knight", title: "15th SNow Knight", effect: "Defense +10, Health +4", description: "15th Snow Knight", reward: "", category: "Normal -> Event -> Page 4" },
    { id: 115, name: "Conqueror of Draki's Tower", title: "Conqueror of Draki's Tower", effect: "Attack power +20", description: "Defeat Draki El Rasaga", reward: "", category: "Adventure -> Dungeon -> Page 11" },
    { id: 116, name: "Berserker of Draki's Tower", title: "Berserker of Draki's Tower", effect: "Health +2, Exp bonus +5%", description: "Complete Draki's Tower in 20 minutes", reward: "", category: "Challenge -> Dungeon -> Page 1" },
    { id: 117, name: "Ruler of Draki's Tower", title: "Ruler of Draki's Tower", effect: "Defense +100", description: "Title Exchange Voucher will be given to 1st rank of Draki's Tower", reward: "", category: "Challenge -> Dungeon -> Page 1" },
    { id: 118, name: "Kill the enemy Vanguard!", title: "Master Bounty Hunter", effect: "Attack power +30", description: "Kill a total of 100 Vanguards", reward: "", category: "War -> Pioneer Area -> Page 4" },
    { id: 119, name: "RUN! RUN! RUN!", title: "Master Survivalist", effect: "Defense +90", description: "Survive as a Vanguard a total of 100 times", reward: "", category: "War -> Pioneer Area -> Page 4" },
    { id: 120, name: "Golden Knight of Snow", title: "Golden Knight of Snow", effect: "Defense +10, Health +4", description: "Deliver 2017 Snow Crzstals to NPC [Maggpie]", reward: "", category: "Normal -> Event -> Page 4" },
    { id: 121, name: "Lunar Warrrior", title: "Lunar Warrrior", effect: "Strength +1, Health +1, Intelligence +1, Magic power +1, Dexterity +1", description: "Deliver 1 [Grace of Moon God] to NPC [Julianne]", reward: "", category: "Normal -> Event -> Page 4" },
    { id: 122, name: "Lunar Hero", title: "Lunar Hero", effect: "Defense +10, Strength +1, Health +1, Intelligence +1, Magic power +1, Dexterity +1", description: "Deliver 5 [Grace of Moon God] to NPC [Julianne]", reward: "", category: "Normal -> Event -> Page 4" },
    { id: 123, name: "Lunar Advent", title: "Lunar Advent", effect: "Defense +10, Strength +5, Health +5", description: "Deliver 10 [Grace of Moon God] to NPC [Julianne]", reward: "", category: "Normal -> Event -> Page 4" },
    { id: 124, name: "Lunar Rebirth", title: "Lunar Rebirth", effect: "Defense +10, Health +5, Dexterity +5", description: "Deliver 10 [Grace of Moon God] to NPC [Julianne]", reward: "", category: "Normal -> Event -> Page 5" },
    { id: 125, name: "Lunar Messenger", title: "Lunar Messenger", effect: "Defense +10, Intelligence +5, Magic power +5, Ice bonus +2, Flame bonus +2, Electric bonus +2", description: "Deliver 10 [Grace of Moon God] to NPC [Julianne]", reward: "", category: "Normal -> Event -> Page 5" },
    { id: 126, name: "Knight Grand Master", title: "Grand Master", effect: "Attack power +3, Defense +90", description: "Old User Reward Title - 15 years", reward: "", category: "Normal -> Event -> Page 5" },
    { id: 127, name: "Solar Messenger", title: "Solar Messenger", effect: "Attack power +16, Defense +16", description: "Deliver 300 Soul Gems to Julia", reward: "", category: "Normal -> Event -> Page 5" },
    { id: 128, name: "I'm the King", title: "I'm the King", effect: "", description: "Become a King", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 1" },
    { id: 129, name: "Nation's Superior", title: "Nation's Superior", effect: "", description: "Achieve Contribution 5'000", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 1" },
    { id: 130, name: "Nation's Captain", title: "Nation's Captain", effect: "", description: "Achieve Contribution 500'000", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 2" },
    { id: 131, name: "Nation's Commodore", title: "Nation's Commodore", effect: "", description: "Achieve Contribution 50'000'000", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 3" },
    { id: 132, name: "Nation's Enemy", title: "Nation's Enemy", effect: "", description: "Achieve Contribution 2'000'000'000", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 4" },
    { id: 133, name: "[Level 20] Fast", title: "Level 20", effect: "", description: "Reach level 20", reward: "Monster stone", category: "Normal -> Character -> Page 4" },
    { id: 134, name: "[Level 30] To New Place", title: "Level 30", effect: "", description: "Reach level 30", reward: "Monster stone", category: "Normal -> Character -> Page 5" },
    { id: 135, name: "[Level 40] three Spirits", title: "Level 40", effect: "", description: "Reach level 40", reward: "Monster stone", category: "Normal -> Character -> Page 5" },
    { id: 136, name: "[Level 50] Enjoy the War", title: "Level 50", effect: "", description: "Reach level 50", reward: "Monster stone", category: "Normal -> Character -> Page 5" },
    { id: 137, name: "[Level 60] Exciting Place", title: "Level 60", effect: "", description: "Reach level 60", reward: "Monster stone", category: "Normal -> Character -> Page 5" },
    { id: 138, name: "[Level 70] With You and Me", title: "Level 70", effect: "", description: "Reach level 70", reward: "Monster stone", category: "Normal -> Character -> Page 5" },
    { id: 139, name: "[Level 80] To the Castle", title: "Level 80", effect: "", description: "Reach level 80", reward: "Monster stone", category: "Normal -> Character -> Page 6" },
    { id: 140, name: "[Level 83] Start, and Finish", title: "Level 83", effect: "", description: "Reach level 83", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Normal -> Character -> Page 6" },
    { id: 141, name: "Knight Sergeant", title: "Knight Sergeant", effect: "", description: "Achieve Knight Contribution Point of 500 (donated np in clan)", reward: "Monster stone", category: "Normal -> Clan -> Page 1" },
    { id: 142, name: "Knight Second Lieutenant", title: "Knight Second Lieutenant", effect: "", description: "Achieve Knight Contribution Point of 50'000 (donated np in clan)", reward: "Monster stone", category: "Normal -> Clan -> Page 2" },
    { id: 143, name: "Knight Commander", title: "Knight Commander", effect: "", description: "Achieve Knight Contribution Point of 5'000'000 (donated np in clan)", reward: "Monster stone", category: "Normal -> Clan -> Page 2" },
    { id: 144, name: "Knight Lieutenant General", title: "Knight Lieutenant General", effect: "", description: "Achieve Knight Contribution Point of 500'000'000 (donated np in clan)", reward: "Monster stone", category: "Normal -> Clan -> Page 3" },
    { id: 145, name: "Knight Enemy", title: "Knight Enemy", effect: "", description: "Achieve Knight Contribution Point of 2'000'000'000 (donated np in clan)", reward: "Monster stone", category: "Normal -> Clan -> Page 4" },
    { id: 146, name: "Merchant's Daughter", title: "Merchant's Daughter", effect: "", description: "Complete Quests for Bulk of Silk and Bandicoot Fang", reward: "Monster stone", category: "Quest -> Moradon -> Page 1" },
    { id: 147, name: "Chief Guard Patrick", title: "Chief Guard Patrick", effect: "", description: "Complete Worm Hunting, Bandicoot Hunting", reward: "Monster stone", category: "Quest -> Moradon -> Page 1" },
    { id: 148, name: "Getting Ready", title: "Getting Ready", effect: "", description: "Defeat 10 Enemy Users", reward: "Monster stone", category: "War -> Common -> Page 1" },
    { id: 149, name: "You are Done", title: "You are Done", effect: "", description: "Succeed in Revenge x10", reward: "Monster stone", category: "War -> Common -> Page 3" },
    { id: 150, name: "Everyone's Enemy!", title: "Everyone's Enemy!", effect: "", description: "Wn 10 times against another User at Moradon Duel", reward: "Monster stone", category: "War -> Moradon -> Page 1" },
    { id: 151, name: "Start of a Strategy", title: "Start of a Strategy", effect: "", description: "Win 10 times in Lunar War", reward: "Monster stone", category: "War -> Lunar -> Page 2" },
    { id: 152, name: "I've got the Know-how", title: "I've got the Know-how", effect: "", description: "Win 50 times in Lunar War", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "War -> Lunar -> Page 3" },
    { id: 153, name: "Can't stop now", title: "Can't stop now", effect: "", description: "20 or more kills in Chaos War", reward: "Monster stone", category: "War -> Chaos -> Page 2" },
    { id: 154, name: "Never Changing Castle", title: "Never Changing Castle", effect: "", description: "Cumulative Win x3 at Castle Siege", reward: "Monster stone", category: "War -> Castle Siege -> Page 1" },
    { id: 155, name: "Juraid Monster III", title: "Juraid Monster III", effect: "", description: "Complete Juraid Monster I and II in Juraid\nJuraid Monster I: Defeat 100 Lich Kings and 100 Kocatris in Juraid\nJuraid Monster II: Defeat 100 Lirimu and 100 Bone Dragons in Juraid", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 7" },
    { id: 156, name: "Oppressing the Mammoth III", title: "Oppressing the Mammoth III", effect: "", description: "Defeat 100 [Elite] Safahee Heavy Calvary in Under the Castle", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 7" },
    { id: 157, name: "Castle Soldiers I", title: "Castle Soldiers I", effect: "", description: "Defeat 100 [Elite] Kapiclue Royal Guard in Under the Castle", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 8" },
    { id: 158, name: "Castle Soldiers II", title: "Castle Soldiers II", effect: "", description: "Defeat 100 [Elite] Toorckmen in Under the Castle", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 8" },
    { id: 159, name: "Take it Easy I", title: "Take it Easy I", effect: "", description: "Defeat 100 Kapiclue Royal Guards in Under the Castle", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 8" },
    { id: 160, name: "Take it Easy II", title: "Take it Easy II", effect: "", description: "Defeat 100 Toorckmen", reward: "Monster stone", category: "Adventure -> Dungeon -> Page 8" },
    { id: 161, name: "Castle Owner", title: "Castle Owner", effect: "", description: "Complete Under the Castle I and II\nUnder the Castle I: Defeat [Machine Golem] Crashergimmic and [Abyssal Guardian] Purious\nUnder the Castle II: Defeat [Shackled Lord] Pluwitoon and [Destroyer of Flame] Pluwitoon", reward: "Battle Hero Wing Exchange Coupon (7 days)", category: "Adventure -> Dungeon -> Page 9" },
    { id: 162, name: "Chief Hunting II", title: "Chief Hunting II", effect: "", description: "Defeat [Chief] Scoride and [Chief] Byzombie", reward: "Monster stone", category: "Adventure -> Field -> Page 4" },
    { id: 163, name: "Powerless Scorpion", title: "Powerless Scorpion", effect: "", description: "Defeat Antares", reward: "Monster stone", category: "Adventure -> Field -> Page 8" },
    { id: 164, name: "David and Goliath", title: "David and Goliath", effect: "", description: "Defeat Samma in Eslant", reward: "Monster stone", category: "Adventure -> Field -> Page 27" },
    { id: 165, name: "Defeat Corrupted Prophet", title: "Defeat Corrupted Prophet", effect: "", description: "Defeat Deruvish Founder in Eslant", reward: "Monster stone", category: "Adventure -> Field -> Page 27" },
    { id: 166, name: "Day to catch Serpent", title: "Day to catch Serpent", effect: "", description: "Defeat Snake Queen in Eslant", reward: "Monster stone", category: "Adventure -> Field -> Page 27" },
    { id: 167, name: "Eslant King & Queen", title: "Eslant King & Queen", effect: "", description: "Defeat Troll King and Harpy Queen in Eslant", reward: "Monster stone", category: "Adventure -> Field -> Page 30" },
    { id: 168, name: "Rare Hunter", title: "Rare Hunter", effect: "", description: "Complete Rare Monster of the Base I and II in Ronarkland Base\nMonster of the Base I : Defeat Duke and Bach in Ronarkland Base\nMonster of the Base II: Defeat Bishop in Ronarkland Base", reward: "Monster stone", category: "Adventure -> Field -> Page 31" },
    { id: 169, name: "Ronarkland Elder I", title: "Ronarkland Elder I", effect: "", description: "Complete Chief of Dragon and Chief of Snake in Ronarkland\nChief of Dragon: Defeat 100 Enigmas in Ronarkland\nChief of Snake: Defeat 100 Cruels in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 35" },
    { id: 170, name: "Ronarkland Elder II", title: "Ronarkland Elder II", effect: "", description: "Complete Chief of Horse and Chief of Darkness in Ronarkland\nChief of Horse: Defeat 100 Havoc in Ronarkland\nChief of Darkness: Defeat 100 Hell Fire in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 36" },
    { id: 171, name: "Seal Breaker", title: "Seal Breaker", effect: "", description: "Destroy Chaos Stone in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 37" },
    { id: 172, name: "In Between the Arrow and Magic", title: "In Between the Arrow and Magic", effect: "", description: "Complete Defeat Orc Bandit I and II in Ronarkland\nOrc Bandit I: Defeat 100 Orc Bandit Archers and 100 Orc Bandit Officers (Archers)\nOrc Bandit II: Defeat 100 Ord Bandit Sorcerers and 100 Orc Bandit Officers (Sorcerers)", reward: "Monster stone", category: "Adventure -> Field -> Page 39" },
    { id: 173, name: "In Between two Swords", title: "In Between two Swords", effect: "", description: "Complete Defeat Orc Bandit III and Death of Orc Village in Ronarkland\nOrc Bandit III: Defeat 100 Orc Bandit Warriors and 100 Orc Bandit Officers (Warriors)\nDeath of Orc Village: Defeat 100 Orc Bandit Leaders in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 39" },
    { id: 174, name: "4 Sins", title: "4 Sins", effect: "", description: "Complete Shape of Sin I and II in Ronarkland\nShape of Sin I: Defeat 100 Prides and 100 Gluttons in Ronarkland\nShape of Sin II: Defeat 100 Envy and 100 Greeds in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 40" },
    { id: 175, name: "3 Sins", title: "3 Sins", effect: "", description: "Complete Shape of Sin III and IV in Ronarkland\nShape of Sin III: Defeat 100 Sloths and 100 Lusts in Ronarkland\nShape of Sin IV: Defeat 100 Wratches in Ronarkland", reward: "Monster stone", category: "Adventure -> Field -> Page 41" },
    { id: 176, name: "Defeating the Giant", title: "Defeating the Giant", effect: "", description: "Defeat Giga Hammer in Krowaz's Dominion", reward: "Monster stone", category: "Adventure -> Field -> Page 42" },
    { id: 177, name: "Treasure!", title: "Treasure!", effect: "", description: "Open Old Box in Krowaz's Dominion", reward: "Monster stone", category: "Adventure -> Field -> Page 43" }
  ];



   // Güncellenmiş filtreler
  const filters = [
    'Tümü', 'War Wing', 'Monster Stone', 'attack', 'defense', 'exp', 
    'dexterity', 'strength', 'intelligence', 'magic power'
  ];

const filteredAchievements = selectedFilter === 'Tümü' 
  ? achievementsData 
  : achievementsData.filter(achieve => {
      if (selectedFilter === 'War Wing') {
        return achieve.reward && achieve.reward.includes('Battle Hero Wing');
      } else if (selectedFilter === 'Monster Stone') {
        return achieve.reward && achieve.reward.includes('Monster stone');
      } else {
        // Effect kontrolü - effect alanında filtre kelimesi geçiyor mu?
        const effectLower = achieve.effect ? achieve.effect.toLowerCase() : '';
        
        if (selectedFilter === 'attack') {
          return effectLower.includes('attack') || effectLower.includes('attack power');
        } else if (selectedFilter === 'defense') {
          return effectLower.includes('defense') || effectLower.includes('defense');
        } else if (selectedFilter === 'exp') {
          return effectLower.includes('exp') || effectLower.includes('exp bonus');
        } else if (selectedFilter === 'dexterity') {
          return effectLower.includes('dexterity');
        } else if (selectedFilter === 'strength') {
          return effectLower.includes('strength');
        } else if (selectedFilter === 'intelligence') {
          return effectLower.includes('intelligence');
        } else if (selectedFilter === 'magic power') {
          return effectLower.includes('magic power');
        } else {
          // Diğer kategoriler için eski mantık
          return achieve.category && achieve.category.includes(selectedFilter);
        }
      }
    });

  // Kategori görünen isimleri - GÜNCELLENDİ
  const getCategoryDisplayName = (category) => {
    const names = {
      'Tümü': '📋 Tümü',
      'War Wing': '🪽 War Wing',
      'Monster Stone': '💎 Monster Stone',
      'attack': '⚔️ Attack',
      'defense': '🛡️ Defense', 
      'exp': '⭐ EXP',
      'dexterity': '🎯 Dexterity',
      'strength': '💪 Strength',
      'intelligence': '🧠 Intelligence',
      'magic power': '🔮 Magic Power'
    };
    return names[category] || category;
  };

  // Kategori renkleri - GÜNCELLENDİ
  const getCategoryColor = (category) => {
    const colors = {
      'War Wing': '#A78BFA',
      'Monster Stone': '#FF6B9D',
      'attack': '#FF6B6B',
      'defense': '#4ECDC4',
      'exp': '#FFD93D',
      'dexterity': '#6BCF7F',
      'strength': '#FF9F1C',
      'intelligence': '#A78BFA',
      'magic power': '#FF6B9D'
    };
    return colors[category] || '#FFD66B';
  };

  // Kategori badge'i için kategoriyi çıkarma fonksiyonu
  const getMainCategory = (categoryString) => {
    return 'Normal';
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.tabContent}>
        <Text style={styles.homeTitle}>🏆 Achievements</Text>
        <Text style={styles.sectionDescription}>
          Knight Online başarımları ve ödülleri
        </Text>

        {/* Filtreleme Butonları */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {getCategoryDisplayName(filter)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.eventName}>
            {getCategoryDisplayName(selectedFilter)} ({filteredAchievements.length} başarım)
          </Text>
          
          {filteredAchievements.length === 0 ? (
            <Text style={styles.muted}>
              Bu filtreye uygun başarım bulunamadı.
            </Text>
          ) : (
            filteredAchievements.map((achieve) => (
              <View key={achieve.id} style={styles.achievementItem}>
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementName}>{achieve.name}</Text>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(getMainCategory(achieve.category)) }
                  ]}>
                    <Text style={styles.categoryText}>
                      {getCategoryDisplayName(getMainCategory(achieve.category))}
                    </Text>
                  </View>
                </View>
                <Text style={styles.achievementTitle}>{achieve.title}</Text>
                {achieve.effect && (
                  <Text style={styles.achievementEffect}>🎯 {achieve.effect}</Text>
                )}
                <Text style={styles.achievementDescription}>{achieve.description}</Text>
                {achieve.reward && (
                  <Text style={styles.achievementReward}>🏆 Ödül: {achieve.reward}</Text>
                )}
                <Text style={styles.achievementCategory}>📁 {achieve.category}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
};

// Master Bileşeni
const MasterScreen = () => {
  const masterData = [
    {
      level: "70",
      requiredPowder: "5", 
      description: "70. Seviye Master Skill açma görevi",
      details: "70. seviye master skillini açmak için 5 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "70 Level Master Skill"
    },
  
    {
      level: "72",
      requiredPowder: "7",
      description: "72. Seviye Master Skill açma görevi",
      details: "72. seviye master skillini açmak için 7 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC", 
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "72 Level Master Skill"
    },
  
    {
      level: "74",
      requiredPowder: "9",
      description: "74. Seviye Master Skill açma görevi",
      details: "74. seviye master skillini açmak için 9 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "74 Level Master Skill"
    },
    {
      level: "75",
      requiredPowder: "10",
      description: "75. Seviye Master Skill açma görevi", 
      details: "75. seviye master skillini açmak için 10 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "75 Level Master Skill"
    },
    {
      level: "76",
      requiredPowder: "11",
      description: "76. Seviye Master Skill açma görevi",
      details: "76. seviye master skillini açmak için 11 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "76 Level Master Skill"
    },
   
    {
      level: "78",
      requiredPowder: "12",
      description: "78. Seviye Master Skill açma görevi", 
      details: "78. seviye master skillini açmak için 12 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "78 Level Master Skill"
    },
 
    {
      level: "80",
      requiredPowder: "15",
      description: "80. Seviye Master Skill açma görevi",
      details: "80. seviye master skillini açmak için 15 adet Spell Stone Powder gerekmektedir.",
      npc: "Moradon - [Master] NPC",
      location: "Moradon 726, 744 koordinatları arasında",
      rewards: "80 Level Master Skill"
    }
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={styles.tabContent}>
        <Text style={styles.homeTitle}>⚔️ Master 70+ Görevleri</Text>
        <Text style={styles.sectionDescription}>
          Knight Online master görevleri ve detayları
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.eventName}>Master Skill Açma Görevleri</Text>
          <Text style={styles.muted}>
            Master görevleri karakterinizin 70 seviye ve üzeri için açılan özel görevlerdir.
            Her seviye için belirli sayıda Spell Stone Powder gerekmektedir.
          </Text>
          
          {masterData.map((master, index) => (
            <TouchableOpacity
              key={index}
              style={styles.masterItem}
              onPress={() => {
                Alert.alert(
                  `Lv. ${master.level} Master Skill`,
                  `${master.details}\n\n🏆 Ödül: ${master.rewards}\n👤 NPC: ${master.npc}\n📍 ${master.location}`
                );
              }}
            >
              <View style={styles.masterHeader}>
                <View style={styles.levelBadge}>
                  <Text style={styles.masterLevel}>Lv. ${master.level}</Text>
                </View>
                <View style={styles.powderContainer}>
                  <Text style={styles.powderAmount}>{master.requiredPowder}x</Text>
                  <Text style={styles.powderText}>Spell Stone Powder</Text>
                </View>
              </View>
              <Text style={styles.masterDescription}>{master.description}</Text>
              <Text style={styles.masterReward}>🏆 {master.rewards}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// Ana Uygulama Bileşeni - GÜNCELLENMİŞ
function MainApp() {
  const { user, login, register, logout, showDisclaimer, setShowDisclaimer, acceptDisclaimer, disclaimerAccepted, isLoading } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('anasayfa');
  const [activeMerchantSubTab, setActiveMerchantSubTab] = useState('pazar');
  const [activeKarakterSubTab, setActiveKarakterSubTab] = useState('basitAtakHesaplama');
  const [activeRehberSubTab, setActiveRehberSubTab] = useState('master');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [fullWebKey, setFullWebKey] = useState(null);
  const [activeGorevSubTab, setActiveGorevSubTab] = useState('1-35');

  // Geliştirilmiş alarm sistemini kullan
  const { alarms, alarmType, setAlarmType, toggleAlarm } = useAlarmSystem();

  // Knight Online Etkinlikleri
  const etkinlikler = [
    { 
      id: 'bdw', 
      name: 'BDW - Border Defense War', 
      times: ['13:00', '19:00', '02:00'],
      description: 'Sınır Savunma Savaşı'
    },
    { 
      id: 'chaos', 
      name: 'Chaos', 
      times: ['00:00', '12:00'],
      description: 'Kaos Savaşı'
    },
    { 
      id: 'juraid', 
      name: 'Juraid Mountain (JR)', 
      times: ['07:40', '22:40'],
      description: 'Juraid Dağı Etkinliği'
    },
    { 
      id: 'bifrost', 
      name: 'Bifrost', 
      times: ['14:00', '21:00', '02:00'],
      description: 'Bifrost Savaşı'
    },
    { 
      id: 'krowaz', 
      name: 'Krowaz', 
      times: ['10:00', '21:00'],
      description: 'Krowaz Etkinliği'
    },
    { 
      id: 'lunar', 
      name: 'Lunar War', 
      times: ['14:00', '20:00'],
      description: 'Ay Savaşı (Pazartesi & Cumartesi)',
      days: ['Pazartesi', 'Cumartesi']
    },
    { 
      id: 'csw', 
      name: 'Castle Siege War (CSW)', 
      times: ['20:30'],
      description: 'Kale Kuşatma Savaşı (Pazar)',
      days: ['Pazar']
    },
    { 
      id: 'utc', 
      name: 'Under the Castle (UTC)', 
      times: ['21:00'],
      description: 'Kale Altı Savaşı (Sadece Cuma)',
      days: ['Cuma']
    },
    { 
      id: 'ultima', 
      name: 'Ultima', 
      times: ['10:00', '21:30'],
      description: 'Ultima Etkinliği'
    },
    { 
      id: 'steam_bdw', 
      name: 'SteamKO BDW', 
      times: ['01:00', '07:00', '12:00', '16:00', '20:00'],
      description: 'SteamKO Border Defense War'
    },
    { 
      id: 'steam_chaos', 
      name: 'SteamKO Chaos', 
      times: ['10:00', '14:00', '22:00'],
      description: 'SteamKO Chaos Savaşı'
    },
    { 
      id: 'steam_jr', 
      name: 'SteamKO JR', 
      times: ['02:40', '13:40'],
      description: 'SteamKO Juraid Mountain'
    },
    { 
      id: 'steam_ft', 
      name: 'SteamKO Forgotten Temple (FT)',
      times: ['08:00', '23:00'],
      description: 'SteamKO Unutulmuş Tapınak'
    },
  ];

  // ÇEKİLİŞ STATE'LERİ
  const [cekilisler, setCekilisler] = useState([
    {
      id: 1,
      baslik: "🎯 YAKINDA",
      aciklama: "YAKINDA!",
      katilimcilar: 0,
      sonTarih: "2024-12-31",
      aktif: false
    }
  ]);

  // Görev Verileri (kısaltılmış - tam versiyon için önceki kodu kullanabilirsiniz)
  // 1-35 Seviye Görevleri - DÜZENLENMİŞ
  const gorevler1_35 = [
    { seviye: "1.02", baslik: "Worm Hunt", npc: "[Guard] Patrick", aciklama: "5 Worm / Blood Worm öldürün", odul: "250 Exp, 2.000 Noah" },
    { seviye: "1.02", baslik: "Get rid of the mice", npc: "[Kurian] Potrang", aciklama: "5 Bandicoot / Scavenger Bandicoot öldürün", odul: "250 Exp, 2.000 Noah" },
    { seviye: "1.02", baslik: "Manufacture Clothing", npc: "[Kurian] Potrang", aciklama: "Potrang'a 2 Apple of Moradon teslim edin", odul: "250 Exp, 2.000 Noah" },
    { seviye: "1.02", baslik: "Obtaining food", npc: "[Kurian] Potrang", aciklama: "Potrang'a 2 Apple of Moradon teslim edin", odul: "250 Exp, 2.000 Noah" },
    { seviye: "2", baslik: "Silk Spool", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 2 Apple of Moradon teslim edin", odul: "250 Exp, 2.500 Noah" },
    { seviye: "3", baslik: "Bandicoot hunt", npc: "[Guard] Patrick", aciklama: "5 Bandicoot öldürün", odul: "375 Exp, 2.700 Noah" },
    { seviye: "4", baslik: "Kaishan's trust", npc: "Kaishan", aciklama: "Kaishan'a 20 Apple of Moradon teslim edin", odul: "15.000 Exp" },
    { seviye: "4", baslik: "Billbor's trust", npc: "Billbor", aciklama: "Billbor'a 1 Secret Account Book teslim edin (limandaki Looter'lardan düşmekte)", odul: "15.000 Exp" },
    { seviye: "4", baslik: "Gaining trust", npc: "[Kurian] Potrang", aciklama: "Token that represent Patrick's trust, Token that represent Billbor's trust, Token that represent Menissia's trust ve Token that represent Kaishan's trust eşyalarını Potrang'e teslim edin", odul: "15.000 Exp, 2.000 Noah" },
    { seviye: "4", baslik: "Bandicoot Tooth", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 2 Apple of Moradon teslim edin", odul: "850 Exp, 3.500 Noah" },
    { seviye: "5", baslik: "Monster Suppression Squad (I)", npc: "[Mercenary Captain] Cougar", aciklama: "Cougar'a, gireceğiniz zindandan 1 Proof of Orc Bandit Boss teslim edin", odul: "1,250 Exp, 2.000 Noah" },
    { seviye: "6", baslik: "Kecoon hunting", npc: "[Guard] Patrick", aciklama: "5 Kecoon öldürün", odul: "1,875 Exp, 2.000 Noah, 1 Red Pearl Ring(+5)" },
    { seviye: "7", baslik: "Making antifebriles paletts", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 2 Apple of Moradon teslim edin", odul: "3.500 Exp" },
    { seviye: "8", baslik: "Bulcan hunting", npc: "[Guard] Patrick", aciklama: "5 Bulcan öldürün", odul: "3.500 Exp" },
    { seviye: "9", baslik: "Upgrade to Strengthen weapons", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya Dagger(+2) teslim edin", odul: "1 Quest weapon" },
    { seviye: "9", baslik: "Wild Bulcan hunting", npc: "[Guard] Patrick", aciklama: "5 Wild Bulcan öldürün", odul: "4.500 Exp" },
    { seviye: "9.59", baslik: "Characteristic of weapon offering striking power", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya Poison'lı Dagger(+1) teslim edin", odul: "50.000 Noah" },
    { seviye: "10", baslik: "1st job change", npc: "Kaishan", aciklama: "Kaishan'ı ziyaret edip ona 3.000 Coin verin", odul: "1 1st job change" },
    { seviye: "10.29", baslik: "Pet", npc: "[Familliar Tamer] Kate", aciklama: "10 Worm, 10 Bandicoot, 10 Kekoon ve 10 Bulcan öldürün", odul: "" },
    { seviye: "10.59", baslik: "Kekoon Warrior hunting", npc: "[Guard] Patrick", aciklama: "5 Kekoon Warrior öldürün", odul: "6.250 Exp" },
    { seviye: "11", baslik: "Kecoon Armor", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya 2 Apple of Moradon teslim edin", odul: "6.250 Exp" },
    { seviye: "11.32", baslik: "Subdual of Gavolt", npc: "[Guard] Patrick", aciklama: "5 Gavolt öldürün", odul: "6.250 Exp" },
    { seviye: "12", baslik: "Hasten Potion", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 2 Apple of Moradon teslim edin", odul: "7.500 Exp, 1 Low level pads (+5)" },
    { seviye: "12", baslik: "Discipline", npc: "[Mercenary Captain] Cougar", aciklama: "", odul: "10.000 Exp" },
    { seviye: "13", baslik: "Kekoon Captain Hunt", npc: "[Guard] Patrick", aciklama: "5 Kekoon Captain öldürün", odul: "11,250 Exp" },
    { seviye: "14", baslik: "Subdual of Vulture", npc: "[Guard] Patrick", aciklama: "5 Bulture öldürün", odul: "13.750 Exp" },
    { seviye: "15", baslik: "Giant Bulcan Hunting", npc: "[Guard] Patrick", aciklama: "10 Giant Bulcan öldürün", odul: "15.000 Exp" },
    { seviye: "16", baslik: "Werewolf elimination", npc: "[Guard] Patrick", aciklama: "5 Werewolf öldürün", odul: "15.000 Exp" },
    { seviye: "16", baslik: "Low-Level weapon production", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya 3 Bulture Horn, 3 Iron Bar ve 1.000 teslim edin", odul: "1 Quest weapon" },
    { seviye: "17", baslik: "Subdual of Silan", npc: "[Guard] Patrick", aciklama: "5 Silan öldürün", odul: "17.500 Exp, 1 Low level helmet (+6)" },
    { seviye: "17", baslik: "Trade with Menissiah", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 5 Apple of Moradon teslim edin", odul: "3 Elemental scroll (Low class)" },
    { seviye: "17.38", baslik: "Silan's bone", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya 2 Apple of Moradon teslim edin", odul: "20.000 Exp, 100.000 Noah" },
    { seviye: "18", baslik: "Collecting Wolfman's fangs", npc: "[Blacksmith] Hepa", aciklama: "Hepa'ya 3 Apple of Moradon teslim edin", odul: "25.000 Exp" },
    { seviye: "18.45", baslik: "Fishing Float Material", npc: "[Entrepot Trader] Berret", aciklama: "Berret'e 3 Apple of Moradon teslim edin", odul: "30.000 Exp, 100.000 Noah, 1 Low level pants (+6)" },
    { seviye: "19", baslik: "Giant Gavolt hunting", npc: "[Guard] Patrick", aciklama: "10 Giant Gavolt öldürün", odul: "47.500 Exp" },
    { seviye: "20", baslik: "[Chaos] Emblem of Chaos I", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 1 Voucher of Chaos teslim edin", odul: "75.000 Exp, 100.000 Noah" },
    { seviye: "20", baslik: "Glyptodont hunt", npc: "[Guard] Patrick", aciklama: "1 Glyptodont öldürün", odul: "50.000 Exp, 30 Water of Grace, 30 Potion of Wisdom" },
    { seviye: "20.38", baslik: "Werewolf skin", npc: "[Guard] Patrick", aciklama: "Patrick'e 5 Apple of Moradon teslim edin", odul: "75.000 Exp" },
    { seviye: "21", baslik: "Gemstone of Courage", npc: "[Mercenary Captain] Cougar", aciklama: "Gireceğiniz zindandaki yaratıklardan 10x Gem of Bravery toplayın", odul: "150.000 Exp, 1 Low level pauldron (+6)" },
    { seviye: "22", baslik: "Gloomwing hunt", npc: "[Guard] Patrick", aciklama: "10 Gloomwing öldürün", odul: "125.000 Exp, 1 Red Pearl Ring(+6)" },
    { seviye: "23", baslik: "Orc Watcher hunting", npc: "[Guard] Patrick", aciklama: "10 Orc Watcher öldürün", odul: "210.000 Exp, 1 Quest item" },
    { seviye: "24", baslik: "Battle Armor 1", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Spoiler öldürün", odul: "75.000 Exp, 1 War boots" },
    { seviye: "24.32", baslik: "Folk Village Construction", npc: "[Mercenary Supply Officer] Osmond", aciklama: "Osmond'a 2 Apple of Moradon teslim edin", odul: "125.000 Exp, 50.000 Noah, 1 Red Pearl Ring(+6)" },
    { seviye: "25", baslik: "Battle Armor 2", npc: "[Mercenary Adjutant] Lazi", aciklama: "5 Scorpion öldürün", odul: "75.000 Exp, 1 War Gauntlets" },
    { seviye: "25.38", baslik: "Rest of Soul", npc: "Nameless Warrior", aciklama: "5 Rotten Eye öldürün", odul: "125.000 Exp, 50 Water of Grace, 40 Potion of Wisdom, 1 Pearl Earring(+6)" },
    { seviye: "26", baslik: "Battle Armor 3", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Lycan öldürün", odul: "112.500 Exp, 1 War Helmet" },
    { seviye: "26.37", baslik: "Unknown warrior's song", npc: "Nameless Warrior", aciklama: "Nameless Warrior'a 3 Apple of Moradon teslim edin", odul: "112.500 Exp, 150.000 Noah, 1 Pearl Earring(+6)" },
    { seviye: "27", baslik: "Battle Armor 4", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Lugaru öldürün", odul: "175.000 Exp, 1 War Pads" },
    { seviye: "28", baslik: "Osmoond's Request", npc: "[Mercenary Supply Officer] Osmond", aciklama: "Osmoond'a 1 Apple of Moradon teslim edin", odul: "3 Upgrade Scroll (middle class)" },
    { seviye: "28", baslik: "Battle Armor 5", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Dark Eye öldürün", odul: "150.000 Exp, 1 War Pauldron" },
    { seviye: "28.37", baslik: "Stop decrease in morale", npc: "[Mercenary Adjutant] Lazi", aciklama: "Lazi'ye 3 Apple of Moradon teslim edin", odul: "50.000 Exp, 1 Quest weapon" },
    { seviye: "29", baslik: "First preparation of war materials", npc: "[Mercenary Supply Officer] Osmond", aciklama: "Osmoond'a 2 Apple of Moradon teslim edin", odul: "150.000 Exp, 1 Topaz Pendant (+6)" },
    { seviye: "29.32", baslik: "Subdual of Keilan", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Keilan öldürün", odul: "150.000 Exp, 300.000 Noah" },
    { seviye: "30", baslik: "Full Plate Armor 1", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Skeleton öldürün", odul: "250.000 Exp, 1 Full Plate Boots (+5), 1 Royal Guardsman Boots" },
    { seviye: "30.27", baslik: "Second preparation of war materials", npc: "[Mercenary Supply Officer] Osmond", aciklama: "[Field Boss] Wolfraiger, [Field Boss] Omegatron, [Field Boss] Gavoltin ve [Field Boss] Scolaid'i öldürün", odul: "250.000 Exp, 200.000 Noah, 60 Water of Grace, 40 Potion of Wisdom" },
    { seviye: "30.54", baslik: "Third preparation of war materials", npc: "[Mercenary Supply Officer] Osmond", aciklama: "Osmoond'a 2 Apple of Moradon teslim edin", odul: "300.000 Exp, 1 Low fur belt (+6)" },
    { seviye: "31", baslik: "Full Plate Armor 2", npc: "[Mercenary Adjutant] Lazi", aciklama: "5 Paralyzer öldürün", odul: "375.000 Exp, 1 Full Plate Gauntlets (+5), 1 Royal Guardsman Gauntlets" },
    { seviye: "31.37", baslik: "Antidote", npc: "[Entrepot Trader] Berret", aciklama: "Berret'e 3 Apple of Moradon teslim edin", odul: "500.000 Exp" },
    { seviye: "32", baslik: "Full Plate Armor 3", npc: "[Mercenary Adjutant] Lazi", aciklama: "10 Dire Wolf öldürün", odul: "425.000 Exp, 1 Full Plate Helmet (+5), 1 Royal Guardsman Helmet" },
    { seviye: "32.3", baslik: "Wolf Products", npc: "[Entrepot Trader] Berret", aciklama: "Berret'e 4 Apple of Moradon teslim edin", odul: "550.000 Exp" },
    { seviye: "33", baslik: "Full Plate Armor 4", npc: "[Mercenary Adjutant] Lazi", aciklama: "5 Smilodon öldürün", odul: "500.000 Exp, 1 Full Plate Pads (+5), 1 Royal Guardsman Pads" },
    { seviye: "33.4", baslik: "Smirdons Meat", npc: "[Entrepot Trader] Berret", aciklama: "Berret'e 2 Apple of Moradon teslim edin", odul: "625.000 Exp" },
    { seviye: "34", baslik: "Full Plate Armor 5", npc: "[Mercenary Adjutant] Lazi", aciklama: "5 Wild Smilodon öldürün", odul: "550.000 Exp, 1 Full Plate Pauldron (+5), 1 Royal Guardsman Pauldron" },
    { seviye: "34.4", baslik: "Smirdons Hides", npc: "[Entrepot Trader] Berret", aciklama: "Berret'e 2 Apple of Moradon teslim edin", odul: "675.000 Exp" },
    { seviye: "35", baslik: "Vilbore's Gift", npc: "[Manager] Billbor", aciklama: "Oyuna başladığınızda çantanızda bir Promise of Training olacak. Bunu silmediyseniz Billbor'a teslim edin", odul: "3x Scroll of Armor 200, 3x Scroll of 1000 HP Up, 3x Speed-Up Potion, 3x Ascent Scroll" },
    { seviye: "35", baslik: "The Beginning of a New Adventure 1 (El Morad)", npc: "[Mercenary Captain] Cougar", aciklama: "Cougar'dan alacağınız El Morad Intro'yu, El Morad Castle'da bulunan [Captain] Folkwein'e teslim edin", odul: "100.000 Coin" },
    { seviye: "35", baslik: "The Beginning of a New Adventure 1 (Karus)", npc: "[Mercenary Captain] Cougar", aciklama: "Cougar'dan alacağınız Karus Intro'yu, Luferson Castle'da bulunan [Captain] Fargo'ya teslim edin", odul: "100.000 Coin" },
    { seviye: "35", baslik: "The dangerous escape", npc: "[Grand Elder] Atlas", aciklama: "30 Wolf Dog ve 30 Savage öldürün", odul: "300.000 Exp" },
    { seviye: "35", baslik: "The dangerous escape", npc: "[Grand Elder] Morbor", aciklama: "30 Wolf Dog ve 30 Savage öldürün", odul: "300.000 Exp" },
    { seviye: "35", baslik: "Food shortage 2", npc: "[Grand Elder] Atlas", aciklama: "Atlas'a 20 Shebiji Meat teslim edin", odul: "300.000 Exp" },
    { seviye: "35", baslik: "Food shortage 2", npc: "[Grand Elder] Morbor", aciklama: "Morbor'a 20 Shebiji Meat teslim edin", odul: "300.000 Exp" },
    { seviye: "35", baslik: "Shadow Seeker Hunt", npc: "[Guard] Zalk", aciklama: "15 Shadow Seeker öldürün", odul: "270.000 Exp, 1 Quest weapon" },
    { seviye: "35", baslik: "Shadow Seeker Hunt", npc: "[Guard] Malverick", aciklama: "15 Shadow Seeker öldürün", odul: "270.000 Exp, 1 Quest weapon" },
    { seviye: "35", baslik: "[Repeatable] Maria's concern", npc: "[Sorcerer] Maria", aciklama: "[Sorcerer] Maria'ya Tarantula's tooth teslim edin", odul: "10.000 Noah" },
    { seviye: "35", baslik: "[Repeatable] Room of Dark Dragon", npc: "[Sorcerer] Samathran", aciklama: "[Sorcerer] Samathran'a 5 Tarantula's teeth teslim edin", odul: "1 Castellan's key" },
    { seviye: "35", baslik: "Investigation Mission", npc: "[Priest] Sol", aciklama: "Draki's Tower'da Captured Girl ile konuşun", odul: "1.500.000 Exp, 70 Water of Grace" },
    { seviye: "35", baslik: "Investigation Mission", npc: "[Priest] Ann", aciklama: "Draki's Tower'da Captured Girl ile konuşun", odul: "1.500.000 Exp, 70 Water of Grace" },
    { seviye: "35", baslik: "Daughter's present", npc: "Sadi - El Morad", aciklama: "Sadi'ye 20 Wolf Dog Leathers teslim edin", odul: "300.000 Exp" },
    { seviye: "35", baslik: "Daughter's present", npc: "Sadi - Karus", aciklama: "Sadi'ye 20 Wolf Dog Leathers teslim edin", odul: "300.000 Exp" },
    { seviye: "35", baslik: "Rescuing Parents I", npc: "[Priest] Sol", aciklama: "Draki's Tower'da Captured Karus Warrior ile konuşun", odul: "1.000.000 Exp, 40 Potion of Wisdom" },
  ];

  // 35-59 Seviye Görevleri
  const gorevler35_59 = [
    { seviye: "35.33", baslik: "Animal Blood", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Animal Blood teslim edin", odul: "675.000 Exp" },
    { seviye: "35.33", baslik: "Animal Blood", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Animal Blood teslim edin", odul: "675.000 Exp" },
    { seviye: "36", baslik: "Defend the Gravesite", npc: "[Tomb Gatekeper] Slay", aciklama: "15 Rotten Eye öldürün", odul: "750.000 Exp, 1 Royal Knight Boots, 75 Water of Grace, 40 Potion of Wisdom" },
    { seviye: "36", baslik: "Defend the Gravesite", npc: "[Tomb Gatekeper] Bertem", aciklama: "15 Rotten Eye öldürün", odul: "750.000 Exp, 1 Royal Knight Boots, 75 Water of Grace, 40 Potion of Wisdom" },
    { seviye: "36.33", baslik: "Rotten Eye", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Rotten Eye teslim edin", odul: "750.000 Exp" },
    { seviye: "36.33", baslik: "Rotten Eye", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Rotten Eye teslim edin", odul: "750.000 Exp" },
    { seviye: "37", baslik: "Sabertooth Hunt", npc: "[Guard] Zalk", aciklama: "15 Sabertooth öldürün", odul: "825.000 Exp, 1 Royal Knight Gauntlets" },
    { seviye: "37", baslik: "Sabertooth Hunt", npc: "[Guard] Malverick", aciklama: "15 Sabertooth öldürün", odul: "825.000 Exp, 1 Royal Knight Gauntlets" },
    { seviye: "37", baslik: "Silver Hair I", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Silver Feather teslim edin", odul: "825.000 Exp" },
    { seviye: "37", baslik: "Silver Hair I", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Silver Feather teslim edin", odul: "825.000 Exp" },
    { seviye: "38", baslik: "Skeleton Warrior Hunt", npc: "[Guard] Zalk", aciklama: "15 Skeleton Warrior öldürün", odul: "925.000 Exp, 1 Royal Knight Helmet" },
    { seviye: "38", baslik: "Skeleton Warrior Hunt", npc: "[Guard] Malverick", aciklama: "15 Skeleton Warrior öldürün", odul: "925.000 Exp, 1 Royal Knight Helmet" },
    { seviye: "38.34", baslik: "Skull Collection", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Apple of Moradon teslim edin", odul: "925.000 Exp" },
    { seviye: "38.34", baslik: "Skull Collection", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Apple of Moradon teslim edin", odul: "925.000 Exp" },
    { seviye: "39", baslik: "Skeleton Knight Hunt", npc: "[Guard] Zalk", aciklama: "15 Skeleton Knight öldürün", odul: "1.000.000 Exp, 1 Royal Knight Pads" },
    { seviye: "39", baslik: "Skeleton Knight Hunt", npc: "[Guard] Malverick", aciklama: "15 Skeleton Knight öldürün", odul: "1.000.000 Exp, 1 Royal Knight Pads" },
    { seviye: "39.33", baslik: "Coarse Bone Powder", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Coarse Ground Bone teslim edin", odul: "1.000.000 Exp" },
    { seviye: "39.33", baslik: "Coarse Bone Powder", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Coarse Ground Bone teslim edin", odul: "1.000.000 Exp" },
    { seviye: "40", baslik: "Death Knight Hunt", npc: "[Guard] Zalk", aciklama: "20 Death Knight öldürün", odul: "1,875.000 Exp, 1 Royal Knight Pauldron, 85 Water of Grace, 50 Potion of Wisdom" },
    { seviye: "40", baslik: "Death Knight Hunt", npc: "[Guard] Malverick", aciklama: "20 Death Knight öldürün", odul: "1,875.000 Exp, 1 Royal Knight Pauldron, 85 Water of Grace, 50 Potion of Wisdom" },
    { seviye: "40", baslik: "[Chaos] Emblem of Chaos II", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 2 Voucher of Moradon teslim edin", odul: "2.000.000 Exp, 50 National Point" },
    { seviye: "40.31", baslik: "Offering", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 10 Apple of Moradon teslim edin", odul: "2.000.000 Exp, 100.000 Noah" },
    { seviye: "40.31", baslik: "Offering", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 10 Apple of Moradon teslim edin", odul: "2.000.000 Exp, 100.000 Noah" },
    { seviye: "41", baslik: "Eradcate Lard Orc", npc: "[Guard] Cheina", aciklama: "20 Lard Orc öldürün", odul: "850.000 Exp, 100.000 Noah, 1 Quest weapon" },
    { seviye: "41", baslik: "Eradcate Lard Orc", npc: "[Guard] Keife", aciklama: "20 Lard Orc öldürün", odul: "850.000 Exp, 100.000 Noah, 1 Quest weapon" },
    { seviye: "41.32", baslik: "Orc Talisman", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 7 Orc Talisman teslim edin", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "41.32", baslik: "Orc Talisman", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 7 Orc Talisman teslim edin", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "42", baslik: "Univited Guest at Gravesite", npc: "[Tomb Gatekeper] Slay", aciklama: "20 Battalion öldürün", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "42", baslik: "Univited Guest at Gravesite", npc: "[Tomb Gatekeper] Bertem", aciklama: "20 Battalion öldürün", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "42.32", baslik: "Covenant of Darkness", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 3 Oath of Darkness teslim edin", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "42.32", baslik: "Covenant of Darkness", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 3 Oath of Darkness teslim edin", odul: "2.250.000 Exp, 100.000 Noah" },
    { seviye: "43", baslik: "Megantelion Hunt", npc: "[Guard] Cheina", aciklama: "20 Megathereon öldürün", odul: "2,375.000 Exp, 100.000 Noah" },
    { seviye: "43", baslik: "Megantelion Hunt", npc: "[Guard] Keife", aciklama: "20 Megathereon öldürün", odul: "2,375.000 Exp, 100.000 Noah" },
    { seviye: "43.3", baslik: "Silver Hair II", npc: "[Moradon Merchant] Clark", aciklama: "Clark'a 7 Silver Feather teslim edin", odul: "2,375.000 Exp, 100.000 Noah" },
    { seviye: "43.3", baslik: "Silver Hair II", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer'a 7 Silver Feather teslim edin", odul: "2,375.000 Exp, 100.000 Noah" },
    { seviye: "44", baslik: "Ape Hunt", npc: "[Mercenary] Tales", aciklama: "20 Ape öldürün", odul: "2.500.000 Exp, 100.000 Noah" },
    { seviye: "44", baslik: "Ape Hunt", npc: "[Mercenary] Russel", aciklama: "20 Ape öldürün", odul: "2.500.000 Exp, 100.000 Noah" },
    { seviye: "44.28", baslik: "Scouting Report", npc: "[Captain] Falkwine", aciklama: "Falkwine'a 1 Reconnaissance Report ve 3 Reconnaissance Map teslim edin", odul: "2.500.000 Exp, 100.000 Noah" },
    { seviye: "44.28", baslik: "Scouting Report", npc: "[Captain] Fargo", aciklama: "Fargo'ya 1 Reconnaissance Report ve 3 Reconnaissance Map teslim edin", odul: "2.500.000 Exp, 100.000 Noah" },
    { seviye: "45", baslik: "The Beginning of a New Adventure 2 (Ardream)", npc: "[Captain] Folkwein", aciklama: "Folkwein'in vereceği Ardream Intro'yu Ardream'de bulunan [Search Captain] Laek'e teslim edin", odul: "100.000 Coin" },
    { seviye: "45", baslik: "The Beginning of a New Adventure 2 (Ardream)", npc: "[Captain] Fargo", aciklama: "Fargo'nun vereceği Ardream Intro'yu Ardream'de bulunan [Search Captain] Zamed'e teslim edin", odul: "100.000 Coin" },
    { seviye: "45", baslik: "Scuola Hunt", npc: "[Guard] Cheina", aciklama: "10 Scolar öldürün", odul: "3.750.000 Exp, 100.000 Noah" },
    { seviye: "45", baslik: "Scuola Hunt", npc: "[Guard] Keife", aciklama: "10 Scolar öldürün", odul: "3.750.000 Exp, 100.000 Noah" },
    { seviye: "45.28", baslik: "Kongaus Hunt", npc: "[Mercenary] Tales", aciklama: "20 Kongau öldürün", odul: "3.750.000 Exp, 100.000 Noah, 100 Water of Grace, 70 Potion of Wisdom" },
    { seviye: "45.28", baslik: "Kongaus Hunt", npc: "[Mercenary] Russel", aciklama: "20 Kongau öldürün", odul: "3.750.000 Exp, 100.000 Noah, 100 Water of Grace, 70 Potion of Wisdom" },
    { seviye: "46", baslik: "Burning Skeleton Hunt", npc: "[Mercenary] Tales", aciklama: "30 Burning Skeleton öldürün", odul: "2.500.000 Exp" },
    { seviye: "46", baslik: "Burning Skeleton Hunt", npc: "[Mercenary] Russel", aciklama: "20 Burning Skeleton öldürün", odul: "2.500.000 Exp, 100.000 Noah" },
    { seviye: "46.17", baslik: "Monster Suppression Squad (II)", npc: "[Captain] Falkwine", aciklama: "Falkwine'a 3 Certificate of Hunting ve 1 Grape Ripper's Certificate teslim edin", odul: "1.500.000 Exp, 100.000 Noah, 1 Quest weapon" },
    { seviye: "46.17", baslik: "Monster Suppression Squad (II)", npc: "[Captain] Fargo", aciklama: "Fargo'ya 3 Certificate of Hunting ve 1 Grape Ripper's Certificate teslim edin", odul: "1.500.000 Exp, 100.000 Noah, 1 Quest weapon" },
    { seviye: "46.43", baslik: "Barbeque Ingredient", npc: "[Imperial Palace Chef] Veros", aciklama: "Veros'a 2 Tyon Meat teslim edin", odul: "2.500.000 Exp, 100.000 Noah, 1 BBQ Dish" },
    { seviye: "46.43", baslik: "Barbeque Ingredient", npc: "[Imperial Palace Chef] Jakata", aciklama: "Jakata'ya 2 Tyon Meat teslim edin", odul: "2.500.000 Exp, 100.000 Noah, 1 BBQ Dish" },
    { seviye: "47", baslik: "Hornet Hunt", npc: "[Imperial Palace Guard] Telson", aciklama: "30 Hornet öldürün", odul: "4.000.000 Exp, 100.000 Noah" },
    { seviye: "47", baslik: "Hornet Hunt", npc: "[Imperial Palace Guard] Verca", aciklama: "30 Hornet öldürün", odul: "4.000.000 Exp, 100.000 Noah" },
    { seviye: "47.23", baslik: "Legendary Ring", npc: "[Guard] Cheina", aciklama: "40 Macairodus öldürün", odul: "1.900.000 Exp, 100.000 Noah, 1 Quest ring – grade 1" },
    { seviye: "47.23", baslik: "Legendary Ring", npc: "[Guard] Keife", aciklama: "40 Macairodus öldürün", odul: "1.900.000 Exp, 100.000 Noah, 1 Quest ring – grade 1" },
    { seviye: "48", baslik: "Ash Knight Hunt", npc: "[Mercenary] Tales", aciklama: "20 Ash Knight öldürün", odul: "4.250.000 Exp, 100.000 Noah" },
    { seviye: "48", baslik: "Ash Knight Hunt", npc: "[Mercenary] Russel", aciklama: "20 Ash Knight öldürün", odul: "4.250.000 Exp, 100.000 Noah" },
    { seviye: "49", baslik: "Haunga Hunt", npc: "[Mercenary] Tales", aciklama: "20 Haunga öldürün", odul: "4.500.000 Exp, 100.000 Noah" },
    { seviye: "49", baslik: "Haunga Hunt", npc: "[Mercenary] Russel", aciklama: "20 Haunga öldürün", odul: "4.500.000 Exp, 100.000 Noah" },
    { seviye: "50", baslik: "Lamia Hunt", npc: "[Guard] Beth", aciklama: "20 Lamia öldürün", odul: "12.500.000 Exp, 1 Troll Armor Gauntlets" },
    { seviye: "50", baslik: "Lamia Hunt", npc: "[Guard] Hashan", aciklama: "20 Lamia öldürün", odul: "12.500.000 Exp, 1 Troll Armor Gauntlets" },
    { seviye: "50.32", baslik: "Legendary Earring", npc: "[Mercenary] Tales", aciklama: "30 Sherrif öldürün", odul: "4.500.000 Exp, 1 Quest Earring – grade 1" },
    { seviye: "50.32", baslik: "Legendary Earring", npc: "[Mercenary] Russel", aciklama: "30 Sherrif öldürün", odul: "4.500.000 Exp, 1 Quest Earring – grade 1" },
    { seviye: "51", baslik: "Eradicate Uruk Hai", npc: "[Guard] Beth", aciklama: "20 Uruk Hai öldürün", odul: "13.750.000 Exp, 1 Troll Armor Boots" },
    { seviye: "51", baslik: "Eradicate Uruk Hai", npc: "[Guard] Hashan", aciklama: "20 Uruk Hai öldürün", odul: "13.750.000 Exp, 1 Troll Armor Boots" },
    { seviye: "51.32", baslik: "Legendary Belt", npc: "[Guard] Cheina", aciklama: "20 Blood Don öldürün", odul: "4.000.000 Exp, 1 Quest belt – grade 1" },
    { seviye: "51.32", baslik: "Legendary Belt", npc: "[Guard] Keife", aciklama: "20 Blood Don öldürün", odul: "4.000.000 Exp, 1 Quest belt – grade 1" },
    { seviye: "52", baslik: "Haunga Warrior Hunt", npc: "[Imperial Palace Guard] Telson", aciklama: "20 Haunga Warrior öldürün", odul: "11,250.000 Exp, 1 Troll Armor Helmet" },
    { seviye: "52", baslik: "Haunga Warrior Hunt", npc: "[Imperial Palace Guard] Verca", aciklama: "20 Haunga Warrior öldürün", odul: "11,250.000 Exp, 1 Troll Armor Helmet" },
    { seviye: "52.32", baslik: "Legendary Pendant", npc: "[Mercenary] Tales", aciklama: "30 Garuna öldürün", odul: "4.500.000 Exp, 1 Quest pendant – grade 1" },
    { seviye: "52.32", baslik: "Legendary Pendant", npc: "[Mercenary] Russel", aciklama: "30 Garuna öldürün", odul: "4.500.000 Exp, 1 Quest pendant – grade 1" },
    { seviye: "53", baslik: "Dragon Tooth Soldier Hunt", npc: "[Mercenary] Tales", aciklama: "20 Dragon Tooth Soldier öldürün", odul: "13.750.000 Exp, 1 Troll Armor Lower Garment" },
    { seviye: "53", baslik: "Dragon Tooth Soldier Hunt", npc: "[Mercenary] Russel", aciklama: "20 Dragon Tooth Soldier öldürün", odul: "13.750.000 Exp, 1 Troll Armor Lower Garment" },
    { seviye: "53.27", baslik: "Treant Hunt", npc: "[Guard] Beth", aciklama: "20 Treant öldürün", odul: "15.000.000 Exp, 5 Weapon Enchant Scroll, 5 Armor Enchant Scroll" },
    { seviye: "53.27", baslik: "Treant Hunt", npc: "[Guard] Hashan", aciklama: "20 Treant öldürün", odul: "15.000.000 Exp, 5 Weapon Enchant Scroll, 5 Armor Enchant Scroll" },
    { seviye: "54", baslik: "Ancient Hunt", npc: "[Guard] Beth", aciklama: "20 Ancient öldürün", odul: "16.250.000 Exp, 1 Troll Armor Upper Garment" },
    { seviye: "54", baslik: "Ancient Hunt", npc: "[Guard] Hashan", aciklama: "20 Ancient öldürün", odul: "16.250.000 Exp, 1 Troll Armor Upper Garment" },
    { seviye: "54.27", baslik: "Dragon Tooth Knight Hunt", npc: "[Mercenary] Tales", aciklama: "20 Dragon Tooth Skeleton öldürün", odul: "16.250.000 Exp" },
    { seviye: "54.27", baslik: "Dragon Tooth Knight Hunt", npc: "[Mercenary] Russel", aciklama: "20 Dragon Tooth Skeleton öldürün", odul: "16.250.000 Exp" },
    { seviye: "55", baslik: "Manticore Hunt", npc: "[Guard] Beth", aciklama: "20 Manticore öldürün", odul: "25.000.000 Exp" },
    { seviye: "55", baslik: "Manticore Hunt", npc: "[Guard] Hashan", aciklama: "20 Manticore öldürün", odul: "25.000.000 Exp" },
    { seviye: "56", baslik: "Uruk Blade Hunt", npc: "[Guard] Beth", aciklama: "20 Uruk Blade öldürün", odul: "25.000.000 Exp" },
    { seviye: "56", baslik: "Uruk Blade Hunt", npc: "[Guard] Hashan", aciklama: "20 Uruk Blade öldürün", odul: "25.000.000 Exp" },
    { seviye: "56.27", baslik: "Grell Hunt", npc: "[Guard] Cheina", aciklama: "20 Grell öldürün", odul: "30.000.000 Exp, 1 Green Treasure Chest" },
    { seviye: "56.27", baslik: "Grell Hunt", npc: "[Guard] Keife", aciklama: "20 Grell öldürün", odul: "30.000.000 Exp, 1 Green Treasure Chest" },
    { seviye: "57", baslik: "Phantom Hunt", npc: "[Imperial Palace Guard] Telson", aciklama: "20 Phantom öldürün", odul: "30.000.000 Exp, 5 Transformation Scroll" },
    { seviye: "57", baslik: "Phantom Hunt", npc: "[Imperial Palace Guard] Verca", aciklama: "20 Phantom öldürün", odul: "30.000.000 Exp, 5 Transformation Scroll" },
    { seviye: "57.29", baslik: "Hell Hound Hunt", npc: "[Guard] Cheina", aciklama: "20 Hellhound öldürün", odul: "30.000.000 Exp" },
    { seviye: "57.29", baslik: "Hell Hound Hunt", npc: "[Guard] Keife", aciklama: "20 Hellhound öldürün", odul: "30.000.000 Exp" },
    { seviye: "58", baslik: "Groom Hound Hunt", npc: "[Imperial Palace Guard] Telson", aciklama: "20 Groom Hound öldürün", odul: "35.000.000 Exp" },
    { seviye: "58", baslik: "Groom Hound Hunt", npc: "[Imperial Palace Guard] Verca", aciklama: "20 Groom Hound öldürün", odul: "35.000.000 Exp" },
    { seviye: "58.31", baslik: "Manticore Hunt (Dragon Tooth Commander)", npc: "[Guard] Cheina", aciklama: "20 Dragon Tooth Commander öldürün", odul: "32.500.000 Exp" },
    { seviye: "58.31", baslik: "Manticore Hunt (Dragon Tooth Commander)", npc: "[Guard] Keife", aciklama: "20 Dragon Tooth Commander öldürün", odul: "32.500.000 Exp" },
    { seviye: "59", baslik: "Preemptive Strike", npc: "[Mercenary] Tales", aciklama: "Master tüplerinizin düştüğü [Field Boss]'ların iki türünden 10'ar tane öldürün", odul: "25.000.000 Exp" },
    { seviye: "59", baslik: "Preemptive Strike", npc: "[Mercenary] Russel", aciklama: "Master tüplerinizin düştüğü [Field Boss]'ların iki türünden 10'ar tane öldürün", odul: "25.000.000 Exp" },
  ];

  // 60-70 Seviye Görevleri - YENİ EKLENDİ
  const gorevler60_70 = [
    { seviye: "60", baslik: "Guardian of 7 Keys", npc: "[Captain] Falkwine", aciklama: "Anahtar görevini tamamlayın. Detaylı rehbere buradan ulaşabilirsiniz.", odul: "38.047.370 Exp" },
    { seviye: "60", baslik: "Guardian of 7 Keys", npc: "[Captain] Fargo", aciklama: "Anahtar görevini tamamlayın. Detaylı rehbere buradan ulaşabilirsiniz.", odul: "38.047.370 Exp" },
    { seviye: "60", baslik: "Knock, and the door will open I", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 5 Ore magic power extract teslim edin", odul: "12.500.000 Exp, 100.000 Noah" },
    { seviye: "60", baslik: "Dominated warriors (I)", npc: "[Ascetic] Tabeth", aciklama: "20 Dragon Tooth Commander öldürün.", odul: "21.500.000 Exp" },
    { seviye: "60", baslik: "Dominated warriors (I)", npc: "[Ascetic] Veda", aciklama: "20 Dragon Tooth Commander öldürün.", odul: "21.500.000 Exp" },
    { seviye: "60", baslik: "Dominated warriors (II)", npc: "[Ascetic] Tabeth", aciklama: "20 Dragon Tooth Commander öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Dominated warriors (II)", npc: "[Ascetic] Veda", aciklama: "20 Dragon Tooth Commander öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Identify of the strange weeping (1)", npc: "[Ascetic] Tabeth", aciklama: "20 Harpy öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Identify of the strange weeping (1)", npc: "[Ascetic] Veda", aciklama: "20 Harpy öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Identify of the strange weeping (2)", npc: "[Ascetic] Tabeth", aciklama: "20 Harpy öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Identify of the strange weeping (2)", npc: "[Ascetic] Veda", aciklama: "20 Harpy öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Acolytes' counter attack (1)", npc: "[Ascetic] Tabeth", aciklama: "20 Apostle öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Acolytes' counter attack (1)", npc: "[Ascetic] Veda", aciklama: "20 Apostle öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Acolytes' counter attack (2)", npc: "[Ascetic] Tabeth", aciklama: "20 Apostle öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "Acolytes' counter attack (2)", npc: "[Ascetic] Veda", aciklama: "20 Apostle öldürün.", odul: "21.250.000 Exp" },
    { seviye: "60", baslik: "[Chaos] Emblem of Chaos III", npc: "[Wealthy Merchant's Daughter] Menissiah", aciklama: "Menissiah'a 10 Voucher of Chaos teslim edin.", odul: "1 Old Takı, 3,000.000 Exp, 100 National Point" },
    { seviye: "60", baslik: "Noises that don't let us sleep", npc: "[Ascetic] Tabeth", aciklama: "Tabeth'e 10 Feather of Harpie teslim edin.", odul: "22.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "Noises that don't let us sleep", npc: "[Ascetic] Veda", aciklama: "Veda'ya 10 Feather of Harpie teslim edin.", odul: "22.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "Commending the fallen warriors", npc: "[Ascetic] Tabeth", aciklama: "Tabeth'e 10 Medal for the Leader teslim edin.", odul: "22.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "Commending the fallen warriors", npc: "[Ascetic] Veda", aciklama: "Veda'ya 10 Medal for the Leader teslim edin.", odul: "22.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Two Faces of Monks I", npc: "[Eslant Sage] Agata", aciklama: "20 Brahman öldürün.", odul: "1.375.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Two Faces of Monks I", npc: "[Eslant Sage] Pablo", aciklama: "20 Brahman öldürün.", odul: "1.375.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Two Faces of Monks II", npc: "[Eslant Sage] Agata", aciklama: "20 Paramun öldürün.", odul: "1.375.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Two Faces of Monks II", npc: "[Eslant Sage] Pablo", aciklama: "20 Paramun öldürün.", odul: "1.375.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] The Ominous Force", npc: "[Eslant Sage] Agata", aciklama: "20 Troll Shaman öldürün.", odul: "2.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] The Ominous Force", npc: "[Eslant Sage] Pablo", aciklama: "20 Troll Shaman öldürün.", odul: "2.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Rage of the Piercing Cold", npc: "[Eslant Sage] Agata", aciklama: "20 Apostle of Piercing Cold öldürün.", odul: "1.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Rage of the Piercing Cold", npc: "[Eslant Sage] Pablo", aciklama: "20 Apostle of Piercing Cold öldürün.", odul: "1.500.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Madness", npc: "[Eslant Sage] Agata", aciklama: "20 Troll Warrior öldürün.", odul: "1.000.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Repeatable] Madness", npc: "[Eslant Sage] Pablo", aciklama: "20 Troll Warrior öldürün.", odul: "1.000.000 Exp (premium kullanıcıları için iki katıdır)" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Destruction)", npc: "[Reserve Knight] Lily", aciklama: "50 Dark Stone öldürün.", odul: "5.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Destruction)", npc: "[Reserve Knight] Hill", aciklama: "50 Dark Stone öldürün.", odul: "5.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Lust)", npc: "[Reserve Knight] Lily", aciklama: "50 Booro öldürün.", odul: "5.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Lust)", npc: "[Reserve Knight] Hill", aciklama: "50 Booro öldürün.", odul: "5.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Nightmare)", npc: "[Reserve Knight] Lily", aciklama: "50 Titan öldürün.", odul: "7.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Nightmare)", npc: "[Reserve Knight] Hill", aciklama: "50 Titan öldürün.", odul: "7.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Chaos)", npc: "[Reserve Knight] Lily", aciklama: "50 Balrog öldürün.", odul: "7.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Demonic Legion of Eslant (Chaos)", npc: "[Reserve Knight] Hill", aciklama: "50 Balrog öldürün.", odul: "7.000.000 Exp" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Dark Mitrhril Piece", npc: "[Reserve Knight] Lily", aciklama: "[Quest] Lard Orc, [Quest] Uruk Tron, [Quest] Stone Golem ve [Quest] Troll Berserker'ı öldürün.", odul: "10.000.000 Exp, 1 Dark Mithril Fragment" },
    { seviye: "60", baslik: "[Daily/Party/Repeatable] Dark Mitrhril Piece", npc: "[Reserve Knight] Hill", aciklama: "[Quest] Uruk Hai, [Quest] Apostle, [Quest] Stone Golem ve [Quest] Troll Berserker'ı öldürün.", odul: "10.000.000 Exp, 1 Dark Mithril Fragment" },
    { seviye: "60", baslik: "[Repeatable] Dark Mithril Piece exchange", npc: "[Reserve Knight] Lily", aciklama: "Exchange Dark Mithril Fragments", odul: "1 Quest silahı ya da 7th set armor parçası" },
    { seviye: "60", baslik: "[Repeatable] Dark Mithril Piece exchange", npc: "[Reserve Knight] Hill", aciklama: "Exchange Dark Mithril Fragments", odul: "1 Quest silahı ya da 7th set armor parçası" },
    { seviye: "60", baslik: "[Descendant of Hero] Festival Preparation", npc: "[Moradon Merchant] Clark", aciklama: "Clark ile konuşun.", odul: "Descendant of Hero – bölüm 1" },
    { seviye: "60", baslik: "[Descendant of Hero] Festival Preparation", npc: "[Moradon Merchant] Shymer", aciklama: "Shymer ile konuşun.", odul: "Descendant of Hero – bölüm 1" },
    { seviye: "60", baslik: "The 3 Demons and God Weapons", npc: "Earth", aciklama: "Talk with Earth to activate more quests", odul: "212.500 Exp, Eslant Kurian – bölüm 1" },
    { seviye: "60", baslik: "The 3 Demons and God Weapons", npc: "Mars", aciklama: "Talk with Mars to activate more quests", odul: "212.500 Exp, Eslant Kurian – bölüm 1" },
    { seviye: "60", baslik: "Subjugation Squad of the Goblin Village", npc: "[Goblin Punitive Force] Wells", aciklama: "Talk to [Goblin Punitive Force] Wells to activate quest series Goblin 1 and Goblin 2", odul: "Goblin 1 and Goblin 2 – bölüm 1" },
    { seviye: "60", baslik: "Subjugation Squad of the Goblin Village", npc: "[Goblin Punitive Force] Raul", aciklama: "Talk to [Goblin Punitive Force] Raul to activate quest series Goblin 1 and Goblin 2", odul: "Goblin 1 and Goblin 2 – bölüm 1" },
    // ... (60-70 arası diğer görevler buraya eklenecek)
    { seviye: "70", baslik: "[Lemegeton] Devil 11 Duke Gusion", npc: "[Order of the Sorcery] Bros", aciklama: "Kill Gusion", odul: "32.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos" },
  ];

  // 71-83 Seviye Görevleri - YENİ EKLENDİ
  const gorevler71_83 = [
    { seviye: "71", baslik: "[Lemegeton] Count of a Fool", npc: "[Order of the Sorcery] Sais", aciklama: "Kill 50 Bifloans and 1 Efos", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Helmet – grade 3, Lemegeton – bölüm 12" },
    { seviye: "71", baslik: "[Lemegeton] Count of a Fool", npc: "[Order of the Sorcery] Bros", aciklama: "Kill 50 Bifloans and 1 Efos", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Helmet – grade 3, Lemegeton – bölüm 12" },
    { seviye: "71", baslik: "[Lemegeton] The Third Underworld", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [22 magical spirit] Efos sealed scroll and [46 magical spirit] Orias sealed scroll to Sais", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 13" },
    { seviye: "71", baslik: "[Lemegeton] The Third Underworld", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [22 magical spirit] Efos sealed scroll and [46 magical spirit] Orias sealed scroll to Bros", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 13" },
    { seviye: "71", baslik: "[Lemegeton] Count of Storm and Thunderbolt", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [71 magical spirit] Dantalion sealed scroll, [58 magical spirit] Ami sealed scroll and [34 magical spirit] Purpur sealed scroll to Sais", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Earring – grade 2, Lemegeton – bölüm 14" },
    { seviye: "71", baslik: "[Lemegeton] Count of Storm and Thunderbolt", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [71 magical spirit] Dantalion sealed scroll, [58 magical spirit] Ami sealed scroll and [34 magical spirit] Purpur sealed scroll to Bros", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Earring – grade 2, Lemegeton – bölüm 14" },
    { seviye: "71", baslik: "[Lemegeton] Devil 10 President Buer", npc: "[Order of the Sorcery] Sais", aciklama: "Kill Buer", odul: "37.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 15" },
    { seviye: "71", baslik: "[Lemegeton] Devil 10 President Buer", npc: "[Order of the Sorcery] Bros", aciklama: "Kill Buer", odul: "37.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 15" },
    { seviye: "71", baslik: "[Lemegeton] Sovereign of 66 Legions", npc: "[Order of the Sorcery] Sais", aciklama: "Kill 50 Ose and 1 Gaap", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Pads – grade 3, Lemegeton – bölüm 16" },
    { seviye: "71", baslik: "[Lemegeton] Sovereign of 66 Legions", npc: "[Order of the Sorcery] Bros", aciklama: "Kill 50 Ose and 1 Gaap", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Pads – grade 3, Lemegeton – bölüm 16" },
    { seviye: "71", baslik: "[Lemegeton] The other door", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [33 magical spirit] Gaf sealed scroll and [57 magical spirit] Ose sealed scroll to Sais", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 17" },
    { seviye: "71", baslik: "[Lemegeton] The other door", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [33 magical spirit] Gaf sealed scroll and [57 magical spirit] Ose sealed scroll to Bros", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 17" },
    { seviye: "71", baslik: "[Lemegeton] President of the 36 Legions", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [65 magical spirit] Andrealfus sealed scroll, [45 magical spirit] Vinne sealed scroll and [21 magical spirit] Moraks sealed scroll to Sais", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Earring – grade 2, Lemegeton – bölüm 18" },
    { seviye: "71", baslik: "[Lemegeton] President of the 36 Legions", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [65 magical spirit] Andrealfus sealed scroll, [45 magical spirit] Vinne sealed scroll and [21 magical spirit] Moraks sealed scroll to Bros", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Earring – grade 2, Lemegeton – bölüm 18" },
    { seviye: "71", baslik: "[Lemegeton] Devil 9 Satan Paimo", npc: "[Order of the Sorcery] Sais", aciklama: "Kill Paimon", odul: "42.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 19" },
    { seviye: "71", baslik: "[Lemegeton] Devil 9 Satan Paimo", npc: "[Order of the Sorcery] Bros", aciklama: "Kill Paimon", odul: "42.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 19" },
    { seviye: "72", baslik: "[Lemegeton] King of the Hidden Treasures", npc: "[Order of the Sorcery] Sais", aciklama: "Kill 50 Shax and 1 Furson", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Pauldron – grade 3, Lemegeton – bölüm 20" },
    { seviye: "72", baslik: "[Lemegeton] King of the Hidden Treasures", npc: "[Order of the Sorcery] Bros", aciklama: "Kill 50 Shax and 1 Furson", odul: "7.500.000 Exp, 30.000 Noah, 1 Quest Chitin Shell Pauldron – grade 3, Lemegeton – bölüm 20" },
    { seviye: "72", baslik: "[Lemegeton] Endless Path", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [20 magical spirit] Purson sealed scroll and [44 magical spirit] Sharks sealed scroll to Sais", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 21" },
    { seviye: "72", baslik: "[Lemegeton] Endless Path", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [20 magical spirit] Purson sealed scroll and [44 magical spirit] Sharks sealed scroll to Bros", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 21" },
    { seviye: "72", baslik: "[Lemegeton] Cherubim of Sin", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [70 magical spirit] Sele sealed scroll, [56 magical spirit] Gomori sealed scroll and [32 magical spirit] Asmodeus sealed scroll to Sais", odul: "8.750.000 Exp, 30.000 Noah, 1 Quest pendant – grade 2, Lemegeton – bölüm 22" },
    { seviye: "72", baslik: "[Lemegeton] Cherubim of Sin", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [70 magical spirit] Sele sealed scroll, [56 magical spirit] Gomori sealed scroll and [32 magical spirit] Asmodeus sealed scroll to Bros", odul: "8.750.000 Exp, 30.000 Noah, 1 Quest pendant – grade 2, Lemegeton – bölüm 22" },
    { seviye: "72", baslik: "[Lemegeton] Devil 8 Count Barbatos", npc: "[Order of the Sorcery] Sais", aciklama: "Kill Barbatos", odul: "47.500.000 Exp, 100.000 Noah, 2 Certificate of Victory, Lemegeton – bölüm 23" },
    { seviye: "72", baslik: "[Lemegeton] Devil 8 Count Barbatos", npc: "[Order of the Sorcery] Bros", aciklama: "Kill Barbatos", odul: "47.500.000 Exp, 100.000 Noah, 2 Certificate of Victory, Lemegeton – bölüm 23" },
    { seviye: "72", baslik: "[Lemegeton] President of Explorer", npc: "[Order of the Sorcery] Sais", aciklama: "Kill 50 Orobas and 1 Foras", odul: "8.750.000 Exp, 30.000 Noah, 1 Quest belt – grade 2, Lemegeton – bölüm 24" },
    { seviye: "72", baslik: "[Lemegeton] President of Explorer", npc: "[Order of the Sorcery] Bros", aciklama: "Kill 50 Orobas and 1 Foras", odul: "8.750.000 Exp, 30.000 Noah, 1 Quest belt – grade 2, Lemegeton – bölüm 24" },
    { seviye: "72", baslik: "[Lemegeton] To the Bottom of the Abyss", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [31 magical spirit] Foras sealed scroll and [55 magical spirit] Orobas sealed scroll to Sais", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 25" },
    { seviye: "72", baslik: "[Lemegeton] To the Bottom of the Abyss", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [31 magical spirit] Foras sealed scroll and [55 magical spirit] Orobas sealed scroll to Bros", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 25" },
    { seviye: "72", baslik: "[Lemegeton] Duke of Silver Armor", npc: "[Order of the Sorcery] Sais", aciklama: "Deliver [64 magical spirit] Floresslah sealed scroll, [43 magical spirit] Savnark sealed scroll and [19 magical spirit] Saleos sealed scroll to Sais", odul: "8.750.000 Exp, 30.000 Noah, 50 National Point, Lemegeton – bölüm 26" },
    { seviye: "72", baslik: "[Lemegeton] Duke of Silver Armor", npc: "[Order of the Sorcery] Bros", aciklama: "Deliver [64 magical spirit] Floresslah sealed scroll, [43 magical spirit] Savnark sealed scroll and [19 magical spirit] Saleos sealed scroll to Bros", odul: "8.750.000 Exp, 30.000 Noah, 50 National Point, Lemegeton – bölüm 26" },
    { seviye: "72", baslik: "[Lemegeton] Devil 7 Marquis Amon", npc: "[Order of the Sorcery] Sais", aciklama: "Amon'u öldürün.", odul: "47.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 27" },
    { seviye: "72", baslik: "[Lemegeton] Devil 7 Marquis Amon", npc: "[Order of the Sorcery] Bros", aciklama: "Amon'u öldürün.", odul: "47.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 27" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of Hell", npc: "[Order of the Sorcery] Sais", aciklama: "50 Vepar ve 1 Bathin öldürün.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 28" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of Hell", npc: "[Order of the Sorcery] Bros", aciklama: "50 Vepar ve 1 Bathin öldürün.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 28" },
    { seviye: "73", baslik: "[Lemegeton] Entrance of Hell", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [18 magical spirit] Badin sealed scroll ve [42 magical spirit] Befal sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 29" },
    { seviye: "73", baslik: "[Lemegeton] Entrance of Hell", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [18 magical spirit] Badin sealed scroll ve [42 magical spirit] Befal sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 29" },
    { seviye: "73", baslik: "[Lemegeton] Gigantic Sea Monster Marquis", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [69 magical spirit] Dekarbia sealed scroll, [54 magical spirit] Murmur sealed scroll ve [30 magical spirit] Foluneous sealed scroll eşyalarını teslim edin.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 30" },
    { seviye: "73", baslik: "[Lemegeton] Gigantic Sea Monster Marquis", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [69 magical spirit] Dekarbia sealed scroll, [54 magical spirit] Murmur sealed scroll ve [30 magical spirit] Foluneous sealed scroll eşyalarını teslim edin.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 30" },
    { seviye: "73", baslik: "[Lemegeton] Devil 6 Count Valefor", npc: "[Order of the Sorcery] Sais", aciklama: "Valefar'ı öldürün.", odul: "52.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 31" },
    { seviye: "73", baslik: "[Lemegeton] Devil 6 Count Valefor", npc: "[Order of the Sorcery] Bros", aciklama: "Valefar'ı öldürün.", odul: "52.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 31" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of Devildom", npc: "[Order of the Sorcery] Sais", aciklama: "50 Caim ve 1 Astaroth öldürün.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 32" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of Devildom", npc: "[Order of the Sorcery] Bros", aciklama: "50 Caim ve 1 Astaroth öldürün.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 32" },
    { seviye: "73", baslik: "[Lemegeton] Gate of Devildom", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [29 magical spirit] Astarot sealed scroll ve [53 magical spirit] Kaim sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 33" },
    { seviye: "73", baslik: "[Lemegeton] Gate of Devildom", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [29 magical spirit] Astarot sealed scroll ve [53 magical spirit] Kaim sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 33" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of 26 Legions", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [63 magical spirit] Andras sealed scroll, [41 magical spirit] Fokalro sealed scroll ve [17 magical spirit] Botis sealed scroll eşyalarını teslim edin.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 34" },
    { seviye: "73", baslik: "[Lemegeton] Archduke of 26 Legions", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [63 magical spirit] Andras sealed scroll, [41 magical spirit] Fokalro sealed scroll ve [17 magical spirit] Botis sealed scroll eşyalarını teslim edin.", odul: "8.750.000 Exp, 30.000 Noah, Lemegeton – bölüm 34" },
    { seviye: "73", baslik: "[Lemegeton] Devil 5 President Marbas", npc: "[Order of the Sorcery] Sais", aciklama: "Marbas'ı öldürün.", odul: "57.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 35" },
    { seviye: "73", baslik: "[Lemegeton] Devil 5 President Marbas", npc: "[Order of the Sorcery] Bros", aciklama: "Marbas'ı öldürün.", odul: "57.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 35" },
    { seviye: "74", baslik: "Patriarch's Followers", npc: "[Outpost Captain] Della", aciklama: "60 Keramash, 60 Medichmash ve 80 Nigmash öldürün.", odul: "250.000.000 Exp" },
    { seviye: "74", baslik: "Patriarch's Followers", npc: "[Outpost Captain] Elrod", aciklama: "60 Keramash, 60 Medichmash ve 80 Nigmash öldürün.", odul: "250.000.000 Exp" },
    { seviye: "74", baslik: "[Lemegeton] Red Duke", npc: "[Order of the Sorcery] Sais", aciklama: "50 Raum ve 1 Zepar öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 36" },
    { seviye: "74", baslik: "[Lemegeton] Red Duke", npc: "[Order of the Sorcery] Bros", aciklama: "50 Raum ve 1 Zepar öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 36" },
    { seviye: "74", baslik: "[Lemegeton] At the End of Hell", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [16 magical spirit] Jepar sealed scroll and [40 magical spirit] Laum sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 37" },
    { seviye: "74", baslik: "[Lemegeton] At the End of Hell", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [16 magical spirit] Jepar sealed scroll and [40 magical spirit] Laum sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 37" },
    { seviye: "74", baslik: "[Lemegeton] King of Cruelty", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [68 magical spirit] Vallial sealed scroll, [52 magical spirit] Alroken sealed scroll and [28 magical spirit] Berrid sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 38" },
    { seviye: "74", baslik: "[Lemegeton] King of Cruelty", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [68 magical spirit] Vallial sealed scroll, [52 magical spirit] Alroken sealed scroll and [28 magical spirit] Berrid sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 38" },
    { seviye: "74", baslik: "[Lemegeton] Devil 4 Great Marquis Gamygyn", npc: "[Order of the Sorcery] Sais", aciklama: "Gamigin'i öldürün.", odul: "62.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 39" },
    { seviye: "74", baslik: "[Lemegeton] Devil 4 Great Marquis Gamygyn", npc: "[Order of the Sorcery] Bros", aciklama: "Gamigin'i öldürün.", odul: "62.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 39" },
    { seviye: "74", baslik: "[Lemegeton] Earl of Red Mist", npc: "[Order of the Sorcery] Sais", aciklama: "50 Balam ve 1 Ronove öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 40" },
    { seviye: "74", baslik: "[Lemegeton] Earl of Red Mist", npc: "[Order of the Sorcery] Bros", aciklama: "50 Balam ve 1 Ronove öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 40" },
    { seviye: "74", baslik: "[Lemegeton] Space of Depravity", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [27 magical spirit] Ronebe sealed scroll ve [51 magical spirit] Balam sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 41" },
    { seviye: "74", baslik: "[Lemegeton] Space of Depravity", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [27 magical spirit] Ronebe sealed scroll ve [51 magical spirit] Balam sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 41" },
    { seviye: "74", baslik: "[Lemegeton] Duke of True Chivalry", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [62 magical spirit] Barak sealed scroll, [39 magical spirit] Marpath sealed scroll ve [15 magical spirit] Eligolle sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 42" },
    { seviye: "74", baslik: "[Lemegeton] Duke of True Chivalry", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [62 magical spirit] Barak sealed scroll, [39 magical spirit] Marpath sealed scroll ve [15 magical spirit] Eligolle sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 42" },
    { seviye: "74", baslik: "[Lemegeton] Devil 3 Prince Vassaago", npc: "[Order of the Sorcery] Sais", aciklama: "Bithagos'u öldürün.", odul: "67.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 43" },
    { seviye: "74", baslik: "[Lemegeton] Devil 3 Prince Vassaago", npc: "[Order of the Sorcery] Bros", aciklama: "Bithagos'u öldürün.", odul: "67.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 43" },
    { seviye: "75", baslik: "Dragon hunt", npc: "[Mercenary Captain] Cougar", aciklama: "Felankor'u öldürün.", odul: "1 Exceptional silah +5" },
    { seviye: "75", baslik: "King of Kings", npc: "[Twilight Observer] Balmanfae", aciklama: "[Twilight Observer] Balmanfae'ye 1 Dented ironmass, 1 Petrified weapon shrap, 1 Iron powder of chain ve 1 Plwitoon's tear teslim edin.", odul: "25.000.000 Exp" },
    { seviye: "75", baslik: "The wings of the falling I", npc: "[Twilight Observer] Balmanfae", aciklama: "[Twilight Observer] Balmanfae'ye Padama's broken feathers teslim edin.", odul: "2.500.000 Exp, 1 Padama's feather" },
    { seviye: "75", baslik: "The wings of the falling II", npc: "[Twilight Observer] Balmanfae", aciklama: "[Twilight Observer] Balmanfae'ye 5 Evelys's ripped leathers teslim edin.", odul: "2.500.000 Exp, 1 Evelys's leather" },
    { seviye: "75", baslik: "Report", npc: "[Twilight Knight Guard] Martin", aciklama: "[Twilight Knight Guard] Martin inside Under the Castle'da [Twilight Knight Guard] Martin ile konuşun.", odul: "100 National Point, 1 Ascent Scroll (+20% exp for 1 hour)" },
    { seviye: "75", baslik: "[Twilight Knights] Fire support", npc: "[Twilight Observer] Eyre – El Morad", aciklama: "Deliver your support Application to the [Twilight Knight Guard] Martin", odul: "1 Pray for hit emblem for one week" },
    { seviye: "75", baslik: "[Twilight Knights] Fire support", npc: "[Twilight Observer] Eyre – Karus", aciklama: "Deliver your support Application to the [Twilight Knight Guard] Martin", odul: "1 Pray for hit emblem for one week" },
    { seviye: "75", baslik: "[Lemegeton] Marquis of Archer", npc: "[Order of the Sorcery] Sais", aciklama: "50 Halphas ve 1 Leraje öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 44" },
    { seviye: "75", baslik: "[Lemegeton] Marquis of Archer", npc: "[Order of the Sorcery] Bros", aciklama: "50 Halphas ve 1 Leraje öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 44" },
    { seviye: "75", baslik: "[Lemegeton] Bottom of Despair", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [14 magical spirit] Lerajie sealed scroll ve [38 magical spirit] Halpas sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 45" },
    { seviye: "75", baslik: "[Lemegeton] Bottom of Despair", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [14 magical spirit] Lerajie sealed scroll ve [38 magical spirit] Halpas sealed scroll eşyalarını teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 45" },
    { seviye: "75", baslik: "[Lemegeton] Duke of the Dead", npc: "[Order of the Sorcery] Sais", aciklama: "Sais'e [67 magical spirit] Xiahs sealed scroll, [50 magical spirit] Frukas sealed scroll ve [26 magical spirit] Bruneth sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 46" },
    { seviye: "75", baslik: "[Lemegeton] Duke of the Dead", npc: "[Order of the Sorcery] Bros", aciklama: "Bros'a [67 magical spirit] Xiahs sealed scroll, [50 magical spirit] Frukas sealed scroll ve [26 magical spirit] Bruneth sealed scroll eşyalarını teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 46" },
    { seviye: "75", baslik: "[Lemegeton] Devil 2 Archduke Agares", npc: "[Order of the Sorcery] Sais", aciklama: "Agares'i öldürün.", odul: "72.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 47" },
    { seviye: "75", baslik: "[Lemegeton] Devil 2 Archduke Agares", npc: "[Order of the Sorcery] Bros", aciklama: "Agares'i öldürün.", odul: "72.500.000 Exp, 100.000 Noah, 100 National Point, 2 Certificate of Victory, Lemegeton – bölüm 47" },
    { seviye: "75", baslik: "[Lemegeton] President of Slayer", npc: "[Order of the Sorcery] Sais", aciklama: "50 Crocell ve 1 Goloras öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 48" },
    { seviye: "75", baslik: "[Lemegeton] President of Slayer", npc: "[Order of the Sorcery] Bros", aciklama: "50 Crocell ve 1 Goloras öldürün.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 48" },
    { seviye: "75", baslik: "[Lemegeton] The Last Hell", npc: "[Order of the Sorcery] Sais", aciklama: "[25 magical spirit] Glashalabolas sealed scroll ve [49 magical spirit] Prokel sealed scroll'u Sais'e teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 49" },
    { seviye: "75", baslik: "[Lemegeton] The Last Hell", npc: "[Order of the Sorcery] Bros", aciklama: "[25 magical spirit] Glashalabolas sealed scroll ve [49 magical spirit] Prokel sealed scroll'u Bros'a teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 49" },
    { seviye: "75", baslik: "[Lemegeton] King of Madness", npc: "[Order of the Sorcery] Sais", aciklama: "[61 magical spirit] Jagan sealed scroll, [37 magical spirit] Finix sealed scroll ve [13 magical spirit] Bellred sealed scroll'u Sais'e teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 50" },
    { seviye: "75", baslik: "[Lemegeton] King of Madness", npc: "[Order of the Sorcery] Bros", aciklama: "[61 magical spirit] Jagan sealed scroll, [37 magical spirit] Finix sealed scroll ve [13 magical spirit] Bellred sealed scroll'u Bros'a teslim edin.", odul: "10.000.000 Exp, 30.000 Noah, Lemegeton – bölüm 50" },
    { seviye: "75", baslik: "[Lemegeton] Devil 1 Great Devil", npc: "[Order of the Sorcery] Sais", aciklama: "Baal'ı öldürün.", odul: "77.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 51" },
    { seviye: "75", baslik: "[Lemegeton] Devil 1 Great Devil", npc: "[Order of the Sorcery] Bros", aciklama: "Baal'ı öldürün.", odul: "77.500.000 Exp, 100.000 Noah, 50 National Point, 1 Voucher of Chaos, Lemegeton – bölüm 51" },
    { seviye: "75", baslik: "[Lemegeton] Isolation method", npc: "[Order of the Sorcery] Sais", aciklama: "Eslant'ta Pelore'la konuşun.", odul: "Lemegeton – bölüm 52" },
    { seviye: "75", baslik: "[Lemegeton] Isolation method", npc: "[Order of the Sorcery] Bros", aciklama: "Eslant'ta Malraseu'yla konuşun.", odul: "Lemegeton – bölüm 52" },
    { seviye: "75", baslik: "[Lemegeton] Scroll of Seal", npc: "[Order of the Sorcery Leader] Pelore", aciklama: "Hidden sealed scroll, Lock cannot be open ve Benshar's spell water'ı Pelore'a teslim edin.", odul: "500.000 Exp, 50.000 Noah, Lemegeton – bölüm 53" },
    { seviye: "75", baslik: "[Lemegeton] Scroll of Seal", npc: "[Order of the Sorcery Leader] Malraseu", aciklama: "Hidden sealed scroll, Lock cannot be open ve Benshar's spell water'ı Malraseu'ya teslim edin.", odul: "500.000 Exp, 50.000 Noah, Lemegeton – bölüm 53" },
    { seviye: "75", baslik: "[Lemegeton] Deprived Ring", npc: "[Order of the Sorcery Leader] Pelore", aciklama: "Completed sealed scroll'u Ronark Land'de Sais'e teslim edin.", odul: "125.000 Exp, 10.000 Noah, Lemegeton – bölüm 54" },
    { seviye: "75", baslik: "[Lemegeton] Deprived Ring", npc: "[Order of the Sorcery Leader] Malraseu", aciklama: "Completed sealed scroll'u Ronark Land'de Bros'a teslim edin.", odul: "125.000 Exp, 10.000 Noah, Lemegeton – bölüm 54" },
    { seviye: "75", baslik: "[Lemegeton] Chasing the Devil", npc: "[Order of the Sorcery] Sais", aciklama: "Sais ile konuşun.", odul: "Lemegeton – bölüm 55" },
    { seviye: "75", baslik: "[Lemegeton] Chasing the Devil", npc: "[Order of the Sorcery] Bros", aciklama: "Bros ile konuşun.", odul: "Lemegeton – bölüm 55" },
    { seviye: "75", baslik: "[Lemegeton] Demon's Leader Asmodeus", npc: "[Order of the Sorcery] Sais", aciklama: "Awaken Asmodeus'u öldürün.", odul: "82.500.000 Exp, 1.000.000 Noah, 100 National Point, 2 Voucher of Chaos, Lemegeton – bölüm 56" },
    { seviye: "75", baslik: "[Lemegeton] Demon's Leader Asmodeus", npc: "[Order of the Sorcery] Bros", aciklama: "Awaken Asmodeus'u öldürün.", odul: "82.500.000 Exp, 1.000.000 Noah, 100 National Point, 2 Voucher of Chaos, Lemegeton – bölüm 56" },
    { seviye: "75", baslik: "[Lemegeton] Lemegeton, Scroll which sealed Devil", npc: "[Order of the Sorcery] Sais", aciklama: "Sealed scroll Remegedon'u Pelore'a teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 57" },
    { seviye: "75", baslik: "[Lemegeton] Lemegeton, Scroll which sealed Devil", npc: "[Order of the Sorcery] Bros", aciklama: "Sealed scroll Remegedon'u Malraseu'ya teslim edin.", odul: "250.000 Exp, 30.000 Noah, Lemegeton – bölüm 57" },
    { seviye: "77", baslik: "Aposlte of Flames hunt (1)", npc: "[Ascetic] Tabeth", aciklama: "40 Apostle of Flame öldürün.", odul: "50.000.000 Exp" },
    { seviye: "77", baslik: "Aposlte of Flames hunt (1)", npc: "[Ascetic] Veda", aciklama: "40 Apostle of Flame öldürün.", odul: "50.000.000 Exp" },
    { seviye: "77", baslik: "Aposlte of Flames hunt (2)", npc: "[Ascetic] Tabeth", aciklama: "40 Apostle of Flame öldürün.", odul: "50.000.000 Exp" },
    { seviye: "77", baslik: "Aposlte of Flames hunt (2)", npc: "[Ascetic] Veda", aciklama: "40 Apostle of Flame öldürün.", odul: "50.000.000 Exp" },
    { seviye: "78", baslik: "Unfinished hunt II (1)", npc: "[Ascetic] Tabeth", aciklama: "40 Troll Berserker öldürün.", odul: "68.750.000 Exp" },
    { seviye: "78", baslik: "Unfinished hunt II (1)", npc: "[Ascetic] Veda", aciklama: "40 Troll Berserker öldürün.", odul: "68.750.000 Exp" },
    { seviye: "78", baslik: "Unfinished hunt II (2)", npc: "[Ascetic] Tabeth", aciklama: "40 Troll Berserker öldürün.", odul: "68.750.000 Exp" },
    { seviye: "78", baslik: "Unfinished hunt II (2)", npc: "[Ascetic] Veda", aciklama: "40 Troll Berserker öldürün.", odul: "68.750.000 Exp" },
    { seviye: "79", baslik: "Unfinished hunt III (1)", npc: "[Ascetic] Tabeth", aciklama: "40 Troll Captain öldürün.", odul: "68.750.000 Exp" },
    { seviye: "79", baslik: "Unfinished hunt III (1)", npc: "[Ascetic] Veda", aciklama: "40 Troll Captain öldürün.", odul: "68.750.000 Exp" },
    { seviye: "79", baslik: "Unfinished hunt III (2)", npc: "[Ascetic] Tabeth", aciklama: "40 Troll Captain öldürün.", odul: "68.750.000 Exp" },
    { seviye: "79", baslik: "Unfinished hunt III (2)", npc: "[Ascetic] Veda", aciklama: "40 Troll Captain öldürün.", odul: "68.750.000 Exp" },
    { seviye: "80", baslik: "Nightmare (1)", npc: "[Ascetic] Tabeth", aciklama: "80 Booro öldürün.", odul: "83.750.000 Exp" },
    { seviye: "80", baslik: "Nightmare (1)", npc: "[Ascetic] Veda", aciklama: "80 Booro öldürün.", odul: "83.750.000 Exp" },
    { seviye: "80", baslik: "Nightmare (2)", npc: "[Ascetic] Tabeth", aciklama: "80 Booro öldürün.", odul: "83.750.000 Exp" },
    { seviye: "80", baslik: "Nightmare (2)", npc: "[Ascetic] Veda", aciklama: "80 Booro öldürün.", odul: "83.750.000 Exp" },
    { seviye: "80", baslik: "Danger from Monster II", npc: "[Outpost Captain] Della", aciklama: "Enigma ve Cruel öldürün.", odul: "1 Personal item" },
    { seviye: "80", baslik: "Danger from Monster II", npc: "[Outpost Captain] Elrod", aciklama: "Havoc ve Hellfire öldürün.", odul: "1 Personal item" },
    { seviye: "81.05", baslik: "Past Mistake (1)", npc: "[Ascetic] Tabeth", aciklama: "80 Dark Stone öldürün.", odul: "83.750.000 Exp" },
    { seviye: "81.05", baslik: "Past Mistake (1)", npc: "[Ascetic] Veda", aciklama: "80 Dark Stone öldürün.", odul: "83.750.000 Exp" },
    { seviye: "81.05", baslik: "Past Mistake (2)", npc: "[Ascetic] Tabeth", aciklama: "80 Dark Stone öldürün.", odul: "83.750.000 Exp" },
    { seviye: "81.05", baslik: "Past Mistake (2)", npc: "[Ascetic] Veda", aciklama: "80 Dark Stone öldürün.", odul: "83.750.000 Exp" },
    { seviye: "82", baslik: "Fallen Spirit of Flame (1)", npc: "[Ascetic] Tabeth", aciklama: "80 Balrog öldürün.", odul: "102.500.000 Exp" },
    { seviye: "82", baslik: "Fallen Spirit of Flame (1)", npc: "[Ascetic] Veda", aciklama: "80 Balrog öldürün.", odul: "102.500.000 Exp" },
    { seviye: "82", baslik: "Fallen Spirit of Flame (2)", npc: "[Ascetic] Tabeth", aciklama: "80 Balrog öldürün.", odul: "102.500.000 Exp" },
    { seviye: "82", baslik: "Fallen Spirit of Flame (2)", npc: "[Ascetic] Veda", aciklama: "80 Balrog öldürün.", odul: "102.500.000 Exp" },
    { seviye: "83", baslik: "[Daily/Repeatable] Ones Who Failed Rebirth", npc: "[Soul Healer] Dason – El Morad", aciklama: "3 Spirit of Hero öldürün.", odul: "" },
    { seviye: "83", baslik: "[Daily/Repeatable] Ones Who Failed Rebirth", npc: "[Soul Healer] Dason – Karus", aciklama: "3 Spirit of Hero öldürün.", odul: "" },
  ];

  // Sekmeler
  const allTabs = [
    { id: 'anasayfa', icon: '🏠', label: 'Anasayfa' },
    { id: 'alarm', icon: '⏰', label: 'Alarm' },
    { id: 'merchant', icon: '💰', label: 'Merchant' },
    { id: 'karakter', icon: '👤', label: 'Karakter' },
    { id: 'rehber', icon: '📚', label: 'Rehber' },
  ];

  const openWeb = (key) => setFullWebKey(key);
  const closeWeb = () => setFullWebKey(null);

  // Alarm ekranı - GÜNCELLENMİŞ
  const AlarmScreen = () => {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.tabContent}>
          <Text style={styles.homeTitle}>⏰ Knight Online Etkinlikleri</Text>
          <Text style={styles.alarmInfo}>
            🔔 Etkinlikler başlamadan 5 dakika önce ve tam saatinde {
              alarmType === 'phone' ? 'telefon alarmı' : 'bildirim'
            } alacaksınız
          </Text>
          
          <View style={styles.card}>
            {etkinlikler.map((etkinlik) => (
              <View key={etkinlik.id} style={styles.etkinlikItem}>
                <View style={styles.etkinlikHeader}>
                  <View style={styles.etkinlikInfo}>
                    <Text style={styles.etkinlikName}>{etkinlik.name}</Text>
                    <Text style={styles.etkinlikDescription}>{etkinlik.description}</Text>
                    {etkinlik.days && (
                      <Text style={styles.etkinlikDays}>📅 {etkinlik.days.join(', ')}</Text>
                    )}
                  </View>
                  <Switch
                    value={alarms[etkinlik.id]?.active || false}
                    onValueChange={() => toggleAlarm(etkinlik.id, etkinlik)}
                    trackColor={{ false: '#475467', true: '#FFD66B' }}
                    thumbColor={alarms[etkinlik.id]?.active ? '#0B0B0B' : '#f4f3f4'}
                    disabled={user?.isGuest}
                  />
                </View>
                <Text style={styles.etkinlikTime}>🕐 Saatler: {etkinlik.times.join(' - ')}</Text>
                <Text style={[
                  styles.alarmStatus,
                  { color: alarms[etkinlik.id]?.active ? '#FFD66B' : '#8E97A8' }
                ]}>
                  {alarms[etkinlik.id]?.active ? 
                    `✅ Alarm Aktif (5 dk önce & başlangıçta ${alarmType === 'phone' ? 'telefon alarmı' : 'bildirim'})` : 
                    '❌ Alarm Kapalı'
                  }
                </Text>
                {alarms[etkinlik.id]?.active && (
                  <Text style={styles.alarmDetail}>
                    ⚙️ Son ayarlanma: {new Date(alarms[etkinlik.id]?.lastScheduled).toLocaleString('tr-TR')}
                  </Text>
                )}
                {user?.isGuest && (
                  <Text style={styles.guestWarning}>
                    ⚠️ Alarm özelliğini kullanmak için giriş yapmalısınız
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  // Ana sayfa içeriği - GÜNCELLENMİŞ
  const AnasayfaScreen = () => {
    const aktifAlarmlar = etkinlikler.filter(etkinlik => alarms[etkinlik.id]?.active);
    
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.tabContent}>
          <Text style={styles.homeTitle}>🏠 Hoş Geldiniz, {user?.username || 'Kullanıcı'}!</Text>

          {/* Alarm Tipi Bilgisi */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔔 Geçerli alarm tipi: <Text style={{fontWeight: 'bold', color: '#FFD66B'}}>
                {alarmType === 'phone' ? 'Telefon Alarmı' : 'Bildirim'}
              </Text>
            </Text>
            <Text style={[styles.infoText, {fontSize: 12, marginTop: 5}]}>
              Alarm tipini ayarlardan değiştirebilirsiniz
            </Text>
          </View>

          {/* Sadece Aktif Alarmlar Bölümü */}
          {aktifAlarmlar.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.eventName}>⏰ Aktif Alarmlarım</Text>
              {aktifAlarmlar.map((etkinlik) => (
                <View key={etkinlik.id} style={styles.etkinlikItem}>
                  <View style={styles.etkinlikHeader}>
                    <View style={styles.etkinlikInfo}>
                      <Text style={styles.etkinlikName}>{etkinlik.name}</Text>
                      <Text style={styles.etkinlikDescription}>{etkinlik.description}</Text>
                      {etkinlik.days && (
                        <Text style={styles.etkinlikDays}>📅 {etkinlik.days.join(', ')}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.etkinlikTime}>🕐 Saatler: {etkinlik.times.join(' - ')}</Text>
                  <Text style={[styles.alarmStatus, { color: '#FFD66B' }]}>
                    ✅ Alarm Aktif (5 dk önce & başlangıçta {alarmType === 'phone' ? 'telefon alarmı' : 'bildirim'})
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Çekilişler Bölümü */}
          <View style={styles.card}>
            <Text style={styles.eventName}>🎁 Çekilişler</Text>
            {cekilisler.filter(c => c.aktif).map((cekilis) => (
              <View key={cekilis.id} style={styles.cekilisItem}>
                <View style={styles.cekilisHeader}>
                  <Text style={styles.cekilisBaslik}>{cekilis.baslik}</Text>
                  <View style={[styles.durumBadge, styles.pasifBadge]}>
                    <Text style={styles.durumText}>Aktif Değil</Text>
                  </View>
                </View>
                <Text style={styles.cekilisAciklama}>{cekilis.aciklama}</Text>
                <View style={styles.cekilisBilgiler}>
                  <Text style={styles.cekilisBilgi}>👥 {cekilis.katilimcilar} katılımcı</Text>
                  <Text style={styles.cekilisBilgi}>⏰ {cekilis.sonTarih}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.katilButton, styles.pasifButton]}
                  disabled={true}
                >
                  <Text style={styles.katilButtonText}>❌ Aktif Değil</Text>
                </TouchableOpacity>
              </View>
            ))}
            {cekilisler.filter(c => c.aktif).length === 0 && (
              <Text style={styles.muted}>Şu anda aktif çekiliş bulunmuyor.</Text>
            )}
          </View>

          {/* Güncelleme Notları Bölümü */}
          <TouchableOpacity 
            style={styles.card}
            onPress={() => setActiveTab('guncelleme')}
          >
            <Text style={styles.eventName}>🔄 Güncelleme Notları</Text>
            <Text style={styles.muted}>Son güncellemeleri görüntülemek için tıklayın</Text>
          </TouchableOpacity>

          {/* KnightNostalji Bölümü */}
          <View style={styles.card}>
            <Text style={styles.eventName}>📸 KnightNostalji</Text>
            <Text style={styles.muted}>Eski Knight Online fotoğraflarını görüntülemek için tıklayın</Text>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setActiveTab('nostalji')}
            >
              <Text style={styles.moreButtonText}>Nostalji Galerisi ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (fullWebKey) {
      switch(fullWebKey) {
        case 'pazar':
          return (
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity onPress={() => setFullWebKey(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>⬅️ Uygulamaya Dön</Text>
                </TouchableOpacity>
                <Text style={styles.webViewTitle}>💰 UskoPazar - Knight Online Pazar</Text>
              </View>
              <WebView
                source={{ uri: "https://www.uskopazar.com" }}
                style={styles.webView}
              />
            </View>
          );
        case 'goldbar':
          return (
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity onPress={() => setFullWebKey(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>⬅️ Uygulamaya Dön</Text>
                </TouchableOpacity>
                <Text style={styles.webViewTitle}>💎 EnUcuzGB - Goldbar Fiyatları</Text>
              </View>
              <WebView
                source={{ uri: "https://www.enucuzgb.com" }}
                style={styles.webView}
              />
            </View>
          );
        case 'basitAtakHesaplama':
          return (
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity onPress={() => setFullWebKey(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>⬅️ Uygulamaya Dön</Text>
                </TouchableOpacity>
                <Text style={styles.webViewTitle}>⚔️ Basit Atak Hesaplama</Text>
              </View>
              <WebView
                source={{ uri: "https://www.kobugda.com/Calculator" }}
                style={styles.webView}
              />
            </View>
          );
        case 'skillHesaplama':
          return (
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity onPress={() => setFullWebKey(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>⬅️ Uygulamaya Dön</Text>
                </TouchableOpacity>
                <Text style={styles.webViewTitle}>🔮 Skill Hesaplama</Text>
              </View>
              <WebView
                source={{ uri: "https://www.kobugda.com/SkillCalculator" }}
                style={styles.webView}
              />
            </View>
          );
        case 'charDiz':
          return (
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity onPress={() => setFullWebKey(null)} style={styles.backButton}>
                  <Text style={styles.backButtonText}>⬅️ Uygulamaya Dön</Text>
                </TouchableOpacity>
                <Text style={styles.webViewTitle}>👤 Char Diz</Text>
              </View>
              <WebView
                source={{ uri: "https://www.kobugda.com/Calculator/Calculator" }}
                style={styles.webView}
              />
            </View>
          );
        default:
          return null;
      }
    }

    switch(activeTab) {
      case 'anasayfa':
        return <AnasayfaScreen />;

      case 'alarm':
        return <AlarmScreen />;

      case 'merchant':
        return (
          <View style={{ flex: 1 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.subTabMenu}
              contentContainerStyle={styles.subTabMenuContent}
            >
              <TouchableOpacity 
                style={[styles.subTabButton, activeMerchantSubTab === 'pazar' && styles.activeSubTab]}
                onPress={() => setActiveMerchantSubTab('pazar')}
              >
                <Text style={[styles.subTabIcon, activeMerchantSubTab === 'pazar' && styles.activeSubTabIcon]}>
                  💰
                </Text>
                <Text style={[styles.subTabText, activeMerchantSubTab === 'pazar' && styles.activeSubTabText]}>
                  Pazar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeMerchantSubTab === 'goldbar' && styles.activeSubTab]}
                onPress={() => setActiveMerchantSubTab('goldbar')}
              >
                <Text style={[styles.subTabIcon, activeMerchantSubTab === 'goldbar' && styles.activeSubTabIcon]}>
                  💎
                </Text>
                <Text style={[styles.subTabText, activeMerchantSubTab === 'goldbar' && styles.activeSubTabText]}>
                  Goldbar
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.rehberContent}>
              {activeMerchantSubTab === 'pazar' && (
                <View style={styles.tabContent}>
                  <Text style={styles.homeTitle}>💰 Pazar</Text>
                  <Text style={styles.sectionDescription}>
                    Knight Online pazar fiyatlarını takip edebileceğiniz sayfa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.fullScreenButton}
                    onPress={() => setFullWebKey('pazar')}
                  >
                    <Text style={styles.fullScreenButtonText}>Tam Ekran Aç</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeMerchantSubTab === 'goldbar' && (
                <View style={styles.tabContent}>
                  <Text style={styles.homeTitle}>💎 Goldbar</Text>
                  <Text style={styles.sectionDescription}>
                    Goldbar fiyatlarını takip edebileceğiniz sayfa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.fullScreenButton}
                    onPress={() => setFullWebKey('goldbar')}
                  >
                    <Text style={styles.fullScreenButtonText}>Tam Ekran Aç</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );

      case 'karakter':
        return (
          <View style={{ flex: 1 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.subTabMenu}
              contentContainerStyle={styles.subTabMenuContent}
            >
              <TouchableOpacity 
                style={[styles.subTabButton, activeKarakterSubTab === 'basitAtakHesaplama' && styles.activeSubTab]}
                onPress={() => setActiveKarakterSubTab('basitAtakHesaplama')}
              >
                <Text style={[styles.subTabIcon, activeKarakterSubTab === 'basitAtakHesaplama' && styles.activeSubTabIcon]}>
                  ⚔️
                </Text>
                <Text style={[styles.subTabText, activeKarakterSubTab === 'basitAtakHesaplama' && styles.activeSubTabText]}>
                  Basit Atak
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeKarakterSubTab === 'charDiz' && styles.activeSubTab]}
                onPress={() => setActiveKarakterSubTab('charDiz')}
              >
                <Text style={[styles.subTabIcon, activeKarakterSubTab === 'charDiz' && styles.activeSubTabIcon]}>
                  👤
                </Text>
                <Text style={[styles.subTabText, activeKarakterSubTab === 'charDiz' && styles.activeSubTabText]}>
                  Char Diz
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeKarakterSubTab === 'skillHesaplama' && styles.activeSubTab]}
                onPress={() => setActiveKarakterSubTab('skillHesaplama')}
              >
                <Text style={[styles.subTabIcon, activeKarakterSubTab === 'skillHesaplama' && styles.activeSubTabIcon]}>
                  🔮
                </Text>
                <Text style={[styles.subTabText, activeKarakterSubTab === 'skillHesaplama' && styles.activeSubTabText]}>
                  Skill Hesapla
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.rehberContent}>
              {activeKarakterSubTab === 'basitAtakHesaplama' && (
                <View style={styles.tabContent}>
                  <Text style={styles.homeTitle}>⚔️ Basit Atak Hesaplama</Text>
                  <Text style={styles.sectionDescription}>
                    Karakterinizin basit atak değerlerini hesaplayabileceğiniz sayfa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.fullScreenButton}
                    onPress={() => setFullWebKey('basitAtakHesaplama')}
                  >
                    <Text style={styles.fullScreenButtonText}>Tam Ekran Aç</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeKarakterSubTab === 'charDiz' && (
                <View style={styles.tabContent}>
                  <Text style={styles.homeTitle}>👤 Char Diz</Text>
                  <Text style={styles.sectionDescription}>
                    Karakter dizilimlerini planlayabileceğiniz sayfa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.fullScreenButton}
                    onPress={() => setFullWebKey('charDiz')}
                  >
                    <Text style={styles.fullScreenButtonText}>Tam Ekran Aç</Text>
                  </TouchableOpacity>
                </View>
              )}
              {activeKarakterSubTab === 'skillHesaplama' && (
                <View style={styles.tabContent}>
                  <Text style={styles.homeTitle}>🔮 Skill Hesaplama</Text>
                  <Text style={styles.sectionDescription}>
                    Skill değerlerinizi hesaplayabileceğiniz sayfa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.fullScreenButton}
                    onPress={() => setFullWebKey('skillHesaplama')}
                  >
                    <Text style={styles.fullScreenButtonText}>Tam Ekran Aç</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );

      case 'rehber':
        return (
          <View style={{ flex: 1 }}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.subTabMenu}
              contentContainerStyle={styles.subTabMenuContent}
            >
              <TouchableOpacity 
                style={[styles.subTabButton, activeRehberSubTab === 'master' && styles.activeSubTab]}
                onPress={() => setActiveRehberSubTab('master')}
              >
                <Text style={[styles.subTabIcon, activeRehberSubTab === 'master' && styles.activeSubTabIcon]}>
                  ⚔️
                </Text>
                <Text style={[styles.subTabText, activeRehberSubTab === 'master' && styles.activeSubTabText]}>
                  Master
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeRehberSubTab === 'statSifirlama' && styles.activeSubTab]}
                onPress={() => setActiveRehberSubTab('statSifirlama')}
              >
                <Text style={[styles.subTabIcon, activeRehberSubTab === 'statSifirlama' && styles.activeSubTabIcon]}>
                  📊
                </Text>
                <Text style={[styles.subTabText, activeRehberSubTab === 'statSifirlama' && styles.activeSubTabText]}>
                  Skill-Stat Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeRehberSubTab === 'achievements' && styles.activeSubTab]}
                onPress={() => setActiveRehberSubTab('achievements')}
              >
                <Text style={[styles.subTabIcon, activeRehberSubTab === 'achievements' && styles.activeSubTabIcon]}>
                  🏆
                </Text>
                <Text style={[styles.subTabText, activeRehberSubTab === 'achievements' && styles.activeSubTabText]}>
                  Achieve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.subTabButton, activeRehberSubTab === 'gorevler' && styles.activeSubTab]}
                onPress={() => setActiveRehberSubTab('gorevler')}
              >
                <Text style={[styles.subTabIcon, activeRehberSubTab === 'gorevler' && styles.activeSubTabIcon]}>
                  📋
                </Text>
                <Text style={[styles.subTabText, activeRehberSubTab === 'gorevler' && styles.activeSubTabText]}>
                  Görevler
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.rehberContent}>
              {activeRehberSubTab === 'master' && <MasterScreen />}
              {activeRehberSubTab === 'statSifirlama' && <SkillStatResetScreen />}
              {activeRehberSubTab === 'achievements' && <AchievementsScreen />}
              {activeRehberSubTab === 'gorevler' && (
                <View style={{ flex: 1 }}>
                  {/* GÖREVLER ALT SEKMELERİ */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.subTabMenu}
                    contentContainerStyle={styles.subTabMenuContent}
                  >
                    <TouchableOpacity 
                      style={[styles.subTabButton, activeGorevSubTab === '1-35' && styles.activeSubTab]}
                      onPress={() => setActiveGorevSubTab('1-35')}
                    >
                      <Text style={[styles.subTabIcon, activeGorevSubTab === '1-35' && styles.activeSubTabIcon]}>
                        🎯
                      </Text>
                      <Text style={[styles.subTabText, activeGorevSubTab === '1-35' && styles.activeSubTabText]}>
                        1-35
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabButton, activeGorevSubTab === '35-59' && styles.activeSubTab]}
                      onPress={() => setActiveGorevSubTab('35-59')}
                    >
                      <Text style={[styles.subTabIcon, activeGorevSubTab === '35-59' && styles.activeSubTabIcon]}>
                        ⚔️
                      </Text>
                      <Text style={[styles.subTabText, activeGorevSubTab === '35-59' && styles.activeSubTabText]}>
                        35-59
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabButton, activeGorevSubTab === '60-70' && styles.activeSubTab]}
                      onPress={() => setActiveGorevSubTab('60-70')}
                    >
                      <Text style={[styles.subTabIcon, activeGorevSubTab === '60-70' && styles.activeSubTabIcon]}>
                        🔥
                      </Text>
                      <Text style={[styles.subTabText, activeGorevSubTab === '60-70' && styles.activeSubTabText]}>
                        60-70
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.subTabButton, activeGorevSubTab === '71-83' && styles.activeSubTab]}
                      onPress={() => setActiveGorevSubTab('71-83')}
                    >
                      <Text style={[styles.subTabIcon, activeGorevSubTab === '71-83' && styles.activeSubTabIcon]}>
                        🏆
                      </Text>
                      <Text style={[styles.subTabText, activeGorevSubTab === '71-83' && styles.activeSubTabText]}>
                        71-83
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>

                  {/* GÖREV İÇERİĞİ */}
                  <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 80 }}>
                    <View style={styles.tabContent}>
                      <Text style={styles.homeTitle}>📋 {activeGorevSubTab} Seviye Görevleri</Text>
                      <Text style={styles.sectionDescription}>
                        Knight Online {activeGorevSubTab} seviye görev rehberi
                      </Text>
                      
                      {/* Seçilen seviye aralığına göre görevleri göster */}
                      {activeGorevSubTab === '1-35' && (
                        <View style={styles.card}>
                          <Text style={styles.eventName}>1-35 Seviye Görevler ({gorevler1_35.length} görev)</Text>
                          {gorevler1_35.map((gorev, index) => (
                            <View key={index} style={styles.gorevItem}>
                              <View style={styles.gorevHeader}>
                                <View style={styles.levelBadge}>
                                  <Text style={styles.gorevSeviye}>Lv. {gorev.seviye}</Text>
                                </View>
                                <Text style={styles.gorevBaslik}>{gorev.baslik}</Text>
                              </View>
                              <Text style={styles.gorevNpc}>NPC: {gorev.npc}</Text>
                              <Text style={styles.gorevAciklama}>{gorev.aciklama}</Text>
                              {gorev.odul && <Text style={styles.gorevOdul}>🎁 {gorev.odul}</Text>}
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {activeGorevSubTab === '35-59' && (
                        <View style={styles.card}>
                          <Text style={styles.eventName}>35-59 Seviye Görevler ({gorevler35_59.length} görev)</Text>
                          {gorevler35_59.map((gorev, index) => (
                            <View key={index} style={styles.gorevItem}>
                              <View style={styles.gorevHeader}>
                                <View style={styles.levelBadge}>
                                  <Text style={styles.gorevSeviye}>Lv. {gorev.seviye}</Text>
                                </View>
                                <Text style={styles.gorevBaslik}>{gorev.baslik}</Text>
                              </View>
                              <Text style={styles.gorevNpc}>NPC: {gorev.npc}</Text>
                              <Text style={styles.gorevAciklama}>{gorev.aciklama}</Text>
                              {gorev.odul && <Text style={styles.gorevOdul}>🎁 {gorev.odul}</Text>}
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {activeGorevSubTab === '60-70' && (
                        <View style={styles.card}>
                          <Text style={styles.eventName}>60-70 Seviye Görevler ({gorevler60_70.length} görev)</Text>
                          {gorevler60_70.map((gorev, index) => (
                            <View key={index} style={styles.gorevItem}>
                              <View style={styles.gorevHeader}>
                                <View style={styles.levelBadge}>
                                  <Text style={styles.gorevSeviye}>Lv. {gorev.seviye}</Text>
                                </View>
                                <Text style={styles.gorevBaslik}>{gorev.baslik}</Text>
                              </View>
                              <Text style={styles.gorevNpc}>NPC: {gorev.npc}</Text>
                              <Text style={styles.gorevAciklama}>{gorev.aciklama}</Text>
                              {gorev.odul && <Text style={styles.gorevOdul}>🎁 {gorev.odul}</Text>}
                            </View>
                          ))}
                        </View>
                      )}
                      
                      {activeGorevSubTab === '71-83' && (
                        <View style={styles.card}>
                          <Text style={styles.eventName}>71-83 Seviye Görevler ({gorevler71_83.length} görev)</Text>
                          {gorevler71_83.map((gorev, index) => (
                            <View key={index} style={styles.gorevItem}>
                              <View style={styles.gorevHeader}>
                                <View style={styles.levelBadge}>
                                  <Text style={styles.gorevSeviye}>Lv. {gorev.seviye}</Text>
                                </View>
                                <Text style={styles.gorevBaslik}>{gorev.baslik}</Text>
                              </View>
                              <Text style={styles.gorevNpc}>NPC: {gorev.npc}</Text>
                              <Text style={styles.gorevAciklama}>{gorev.aciklama}</Text>
                              {gorev.odul && <Text style={styles.gorevOdul}>🎁 {gorev.odul}</Text>}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        );

      case 'nostalji':
        return <KnightNostaljiScreen />;

      case 'guncelleme':
        return <GuncellemeNotlariScreen />;

      default:
        return <AnasayfaScreen />;
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 1000); // 1 saniye
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (user && disclaimerAccepted) {
      setShowDisclaimer(false);
    }
  }, [user, disclaimerAccepted]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (splashVisible) {
    return <SplashScreen />;
  }

 if (!user) {
  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor="#07070C" />
      <DisclaimerModal 
        visible={showDisclaimer}
        onAccept={acceptDisclaimer}
      />

      {!showDisclaimer && (
        <>
          {authMode === 'login' ? (
            <LoginScreen 
              onLogin={login} 
              onSwitchToRegister={() => setAuthMode('register')} 
            />
          ) : (
            <RegisterScreen 
              onRegister={register} 
              onSwitchToLogin={() => setAuthMode('login')} 
            />
          )}

          {/* --- BURAYA EKLEDİK: Şifremi Unuttum butonu --- */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={{ color: "#FFD66B", fontSize: 15 }}>🔑 Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>

          {/* --- ForgotPassword modal/ekranı --- */}
          {showForgotPassword && (
            <ForgotPasswordSimple onClose={() => setShowForgotPassword(false)} />
          )}
        </>
      )}
    </SafeAreaView>
  );
}


  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="light-content" backgroundColor="#07070C" />
      
      <Header onOpenSettings={() => setSettingsVisible(true)} />

      <View style={styles.body}>
        {renderContent()}
      </View>

      {/* ALT TAB BAR */}
      <View style={styles.bottom}>
        {allTabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={styles.tab} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabIcon, activeTab === tab.id && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

// STYLES - YENİ STILLER EKLENDİ
const styles = StyleSheet.create({
  /* ALARM TİPİ STİLLERİ */
  alarmTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#0E0F17',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1C1D26',
  },
  alarmTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  alarmTypeButtonActive: {
    backgroundColor: '#FFD66B',
  },
  alarmTypeText: {
    fontSize: 16,
    color: '#9AA6B6',
  },
  alarmTypeTextActive: {
    color: '#0B0B0B',
  },

  /* ALARM DETAY STİLLERİ */
  alarmDetail: {
    color: '#98A2B3',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },

  /* DİĞER STİLLER */
  app: { 
    flex: 1, 
    backgroundColor: "#07070C" 
  },
  body: { 
    flex: 1 
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  title: {
    color: "#FFD66B",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  settingsWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFD66B",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsCircle: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#0C0C12",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsEmoji: { 
    fontSize: 16 
  },

  /* MODAL (SETTINGS) */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "92%",
    backgroundColor: "#0C0D14",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1C1D26",
    position: 'relative',
    maxHeight: '90%',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 8,
    zIndex: 1,
  },
  backButtonText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "#FFD66B",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0E0F17",
  },
  avatarEmoji: {
    fontSize: 40,
  },
  profileName: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "800",
    marginTop: 8,
  },
  profileEmail: { 
    color: "#9AA6B6", 
    fontSize: 12 
  },
  premiumBadge: {
    marginTop: 8,
    backgroundColor: "#FFD66B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  premiumBadgeText: { 
    color: "#0B0B0B", 
    fontWeight: "900" 
  },
  guestBadge: {
    marginTop: 8,
    backgroundColor: "#1C1D26",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFD66B",
  },
  guestText: { 
    color: "#FFD66B", 
    fontWeight: "900", 
    fontSize: 12 
  },

  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1D26",
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  settingDescription: {
    color: "#9AA6B6",
    fontSize: 12,
    lineHeight: 16,
  },

  disclaimerSetting: {
    backgroundColor: "#0E0F17",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1C1D26",
    marginTop: 8,
  },
  disclaimerSettingText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  textArea: {
    marginTop: 8,
    minHeight: 86,
    borderRadius: 8,
    backgroundColor: "#0E0F17",
    color: "#E8F0FF",
    padding: 10,
    borderWidth: 1,
    borderColor: "#1A1B24",
  },

  quickContactButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#0E0F17",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1C1D26",
    marginHorizontal: 4,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#FFD66B",
    fontSize: 12,
    fontWeight: "600",
  },

  modalButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 12 
  },
  logoutBtn: { 
    backgroundColor: "#1C1D26", 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD66B",
  },
  logoutBtnText: { 
    color: "#FFD66B", 
    fontWeight: "700" 
  },
  sendBtn: { 
    backgroundColor: "#FFD66B", 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  sendBtnText: { 
    color: "#0B0B0B", 
    fontWeight: "900" 
  },

  /* HOME / CARDS */
  screen: { 
    flex: 1, 
    backgroundColor: "transparent" 
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  homeTitle: { 
    color: "#FFD66B", 
    fontWeight: "800", 
    fontSize: 15, 
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#0E0F16",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  eventName: { 
    color: "#FFF", 
    fontWeight: "800", 
    marginBottom: 4 
  },
  muted: { 
    color: "#9CA6B6", 
    fontSize: 13 
  },
  small: { 
    color: "#8C99A8", 
    fontSize: 12 
  },

  /* BOTTOM TAB */
  bottom: {
    height: Platform.OS === "ios" ? 84 : 68,
    backgroundColor: "#06060A",
    borderTopColor: "#11121A",
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: Platform.OS === "ios" ? 18 : 0,
  },
  tab: { 
    flex: 1, 
    alignItems: "center" 
  },
  tabIcon: { 
    fontSize: 18, 
    marginBottom: 2, 
    color: "#9FA9B9" 
  },
  tabIconActive: { 
    color: "#FFD66B" 
  },
  tabText: { 
    color: "#9FA9B9", 
    fontWeight: "800", 
    fontSize: 12 
  },
  tabTextActive: { 
    color: "#FFD66B" 
  },

  /* SUB TAB MENU */
  subTabMenu: {
    backgroundColor: "#0C0D14",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1D26",
    maxHeight: 60,
  },
  subTabMenuContent: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: "center",
  },
  subTabButton: {
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#1C1D26",
    flexDirection: "row",
    alignItems: "center",
  },
  activeSubTab: {
    backgroundColor: "#FFD66B",
    borderColor: "#FFD66B",
  },
  subTabIcon: {
    fontSize: 16,
    marginRight: 6,
    color: "#9AA6B6",
  },
  activeSubTabIcon: {
    color: "#0B0B0B",
  },
  subTabText: {
    color: "#9AA6B6",
    fontSize: 12,
    fontWeight: "600",
  },
  activeSubTabText: {
    color: "#0B0B0B",
    fontWeight: "bold",
  },

  /* REHBER CONTENT */
  rehberContent: {
    flex: 1,
  },

  /* ETKINLIK STILLERI */
  etkinlikItem: {
    backgroundColor: "#0E0F16",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  etkinlikHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  etkinlikInfo: {
    flex: 1,
    marginRight: 15,
  },
  etkinlikName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  etkinlikDescription: {
    color: "#98A2B3",
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  etkinlikDays: {
    color: "#FFD66B",
    fontSize: 13,
    fontStyle: "italic",
  },
  etkinlikTime: {
    color: "#EAECF0",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "500",
  },
  alarmStatus: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 8,
  },
  guestWarning: {
    color: "#FFD66B",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  alarmInfo: {
    color: "#FFD66B",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
    backgroundColor: "#0E0F16",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
    lineHeight: 20,
  },

  /* GOREV STILLERI */
  gorevItem: {
    backgroundColor: "#0E0F16",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  gorevHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: "#FFD66B",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gorevSeviye: {
    color: "#0B0B0B",
    fontSize: 12,
    fontWeight: "bold",
  },
  gorevBaslik: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 12,
  },
  gorevNpc: {
    color: "#FFD66B",
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },
  gorevAciklama: {
    color: "#EAECF0",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  gorevOdul: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "600",
  },

  /* CEKILIS STILLERI */
  cekilisItem: {
    backgroundColor: "#0E0F16",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  cekilisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cekilisBaslik: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 15,
  },
  durumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  aktifBadge: {
    backgroundColor: "#FFD66B",
  },
  pasifBadge: {
    backgroundColor: "#1C1D26",
  },
  durumText: {
    color: "#0B0B0B",
    fontSize: 11,
    fontWeight: "bold",
  },
  cekilisAciklama: {
    color: "#98A2B3",
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  cekilisBilgiler: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  cekilisBilgi: {
    color: "#EAECF0",
    fontSize: 13,
  },
  katilButton: {
    backgroundColor: "#FFD66B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  katildiButton: {
    backgroundColor: "#1C1D26",
  },
  pasifButton: {
    backgroundColor: "#1C1D26",
    opacity: 0.6,
  },
  katilButtonText: {
    color: "#0B0B0B",
    fontSize: 14,
    fontWeight: "bold",
  },
  katildiButtonText: {
    color: "#FFD66B",
  },

  /* NOSTALJI STILLERI */
  nostaljiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  nostaljiImageContainer: {
    width: "48%",
    marginBottom: 16,
    backgroundColor: "#0E0F16",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  nostaljiImage: {
    width: "100%",
    height: 120,
  },
  nostaljiImageInfo: {
    padding: 12,
  },
  nostaljiImageTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImageContainer: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fullScreenImageTouchable: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "80%",
  },
  navButtonLeft: {
    position: "absolute",
    left: 20,
    top: "50%",
    backgroundColor: "rgba(255, 214, 107, 0.8)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navButtonRight: {
    position: "absolute",
    right: 20,
    top: "50%",
    backgroundColor: "rgba(255, 214, 107, 0.8)",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navButtonText: {
    color: "#0B0B0B",
    fontSize: 30,
    fontWeight: "bold",
  },
  imageInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(12, 13, 20, 0.8)",
    padding: 15,
  },
  fullImageTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  imageCounter: {
    color: "#FFD66B",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  nostaljiWatermark: {
    color: "#FFD66B",
    fontSize: 14,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#FFD66B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#0B0B0B",
    fontSize: 20,
    fontWeight: "bold",
  },

  /* INFO BOX */
  infoBox: {
    backgroundColor: "#0E0F16",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD66B",
    marginBottom: 16,
  },
  infoText: {
    color: "#EAECF0",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  /* MASTER STILLERI */
  masterItem: {
    backgroundColor: "#0E0F16",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  masterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  masterLevel: {
    color: "#0B0B0B",
    fontSize: 12,
    fontWeight: "bold",
  },
  powderContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E0F17",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  powderAmount: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 6,
  },
  powderText: {
    color: "#FFD66B",
    fontSize: 12,
    fontWeight: "bold",
  },
  masterDescription: {
    color: "#EAECF0",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  masterReward: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "600",
  },

  /* SKILL-STAT RESET TABLOSU */
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1A1C24",
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: 1,
  },
  tableHeaderText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1C24",
  },
  tableRowEven: {
    backgroundColor: "#0E0F16",
  },
  tableRowOdd: {
    backgroundColor: "#0C0D14",
  },
  tableCell: {
    color: "#EAECF0",
    fontSize: 14,
    textAlign: "center",
  },
  resetInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#0E0F17",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD66B",
  },
  resetInfoTitle: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  resetInfoText: {
    color: "#EAECF0",
    fontSize: 12,
    marginBottom: 4,
  },

  /* ACHIEVEMENTS STILLERI */
  filterScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 8,
    alignItems: "center",
  },
  filterButton: {
    backgroundColor: "#0E0F17",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#1C1D26",
  },
  filterButtonActive: {
    backgroundColor: "#FFD66B",
    borderColor: "#FFD66B",
  },
  filterButtonText: {
    color: "#9AA6B6",
    fontSize: 12,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#0B0B0B",
    fontWeight: "bold",
  },
  achievementItem: {
    backgroundColor: "#0E0F16",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A1C24",
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  achievementName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: "#0B0B0B",
    fontSize: 10,
    fontWeight: "bold",
  },
  achievementTitle: {
    color: "#FFD66B",
    fontSize: 14,
    marginBottom: 6,
    fontStyle: "italic",
  },
  achievementEffect: {
    color: "#4ECDC4",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  achievementDescription: {
    color: "#EAECF0",
    fontSize: 13,
    lineHeight: 18,
  },

  /* SECTION STILLERI */
  sectionDescription: {
    color: "#98A2B3",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },

  /* FULL SCREEN BUTTON */
  fullScreenButton: {
    backgroundColor: "#FFD66B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  fullScreenButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "bold",
  },

  /* WEBVIEW STILLERI */
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "#0C0D14",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1D26",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
  },
  webViewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  webView: {
    flex: 1,
  },

  /* GUEST WARNING */
  disclaimerContainer: {
    flex: 1,
    backgroundColor: "rgba(7, 7, 12, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  disclaimerContent: {
    backgroundColor: "#0C0D14",
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD66B",
    width: "100%",
    maxHeight: "80%",
  },
  disclaimerTitle: {
    color: "#FFD66B",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  disclaimerScroll: {
    maxHeight: 400,
  },
  disclaimerText: {
    color: "#EAECF0",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "justify",
  },
  disclaimerButton: {
    backgroundColor: "#FFD66B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  disclaimerButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "bold",
  },
  guestWarningContent: {
    backgroundColor: "#0C0D14",
    padding: 30,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFD66B",
    width: "100%",
  },
  guestWarningTitle: {
    color: "#FFD66B",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  guestWarningText: {
    color: "#EAECF0",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 25,
  },
  guestWarningButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  guestWarningButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#1C1D26",
    borderWidth: 1,
    borderColor: "#FFD66B",
  },
  confirmButton: {
    backgroundColor: "#FFD66B",
  },
  cancelButtonText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: "#0B0B0B",
    fontSize: 14,
    fontWeight: "bold",
  },

  /* AUTH STILLERI */
  authContainer: {
    flex: 1,
    backgroundColor: "#07070C",
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  authHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 214, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 214, 107, 0.3)",
  },
  logo: {
    fontSize: 32,
  },
  authTitle: {
    color: "#FFD66B",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  authSubtitle: {
    color: "#9AA6B6",
    fontSize: 16,
  },
  authCard: {
    backgroundColor: "#0C0D14",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1C1D26",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#F2F4F7",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#0E0F17",
    color: "white",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1C1D26",
  },
  authButton: {
    backgroundColor: "#FFD66B",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  authButtonDisabled: {
    backgroundColor: "#475467",
    opacity: 0.7,
  },
  authButtonText: {
    color: "#0B0B0B",
    fontSize: 16,
    fontWeight: "bold",
  },
  guestButton: {
    backgroundColor: "transparent",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFD66B",
  },
  guestButtonText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
  },
  switchAuthButton: {
    alignItems: "center",
    marginTop: 20,
    padding: 10,
  },
  switchAuthText: {
    color: "#9AA6B6",
    fontSize: 14,
  },
  switchAuthHighlight: {
    color: "#FFD66B",
    fontWeight: "bold",
  },
  testAccount: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#0E0F17",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD66B",
  },
  testAccountTitle: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  testAccountText: {
    color: "#EAECF0",
    fontSize: 12,
    marginBottom: 2,
  },

  /* MORE BUTTON */
  moreButton: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD66B",
    marginTop: 10,
  },
  moreButtonText: {
    color: "#FFD66B",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: '#0a0000ff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec0606ff',
    marginBottom: 10,
  },
  linkContainer: {
    backgroundColor: '#000000ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#97ad18ff',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  subHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginTop: 8,
    marginBottom: 4,
  },
  muted: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 5,
    marginBottom: 2,
  },
  // Styles'a ekle
achievementReward: {
  color: '#FFD66B',
  fontSize: 12,
  fontWeight: '600',
  marginTop: 6,
},
achievementCategory: {
  color: '#98A2B3',
  fontSize: 11,
  marginTop: 4,
  fontStyle: 'italic',
},
});