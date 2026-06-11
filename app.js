import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Image, TouchableOpacity,
  StatusBar, TextInput, Alert, ActivityIndicator, Linking, Modal, Platform
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CONFIG ───────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://xlnohsebcwikbugnxybc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RUK1Yo5Y4vq2ldI6aSieyg_6b1l7GDC';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── TEMA ──────────────────────────────────────────────────────────────────────
const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  border: '#2C2C2C',
  error: '#FF4444',
  success: '#46b846',
};

// ─── BARBEIROS ─────────────────────────────────────────────────────────────────
const BARBERS = [
  {
    id: 1,
    name: 'Otávio',
    role: 'Mestre Barbeiro',
    whatsapp: '5546988029445',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
    status: 'Disponível',
  },
  {
    id: 2,
    name: 'Eduardo',
    role: 'Barbeiro Senior',
    whatsapp: '5546988198076',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'Disponível',
  },
];

const SERVICES = [
  { id: 1, name: 'Corte Colella Signature', duration: '30 min', price: 'R$ 60' },
  { id: 2, name: 'Barba com Toalha Quente', duration: '40 min', price: 'R$ 50' },
  { id: 3, name: 'Corte + Barba Completo', duration: '60 min', price: 'R$ 100' },
];

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// ─── TELA DE LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setVerificationSent(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user.email_confirmed_at) {
          Alert.alert('E-mail não verificado', 'Verifique seu e-mail antes de entrar.');
          return;
        }
        onLogin(data.user);
      }
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <View style={styles.authContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.brandBig}>COLELLA</Text>
        <Text style={styles.subBrand}>BARBERSHOP & CO.</Text>
        <View style={styles.verifyBox}>
          <Text style={styles.verifyIcon}>✉️</Text>
          <Text style={styles.verifyTitle}>Verifique seu e-mail</Text>
          <Text style={styles.verifyText}>
            Enviamos um link de confirmação para{'\n'}
            <Text style={{ color: colors.primary }}>{email}</Text>
          </Text>
          <Text style={styles.verifyText}>
            Após confirmar, volte aqui e faça login normalmente.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => { setVerificationSent(false); setIsRegister(false); }}>
            <Text style={styles.btnPrimaryText}>Ir para Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.authContainer}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.brandBig}>COLELLA</Text>
      <Text style={styles.subBrand}>BARBERSHOP & CO.</Text>
      <View style={styles.authCard}>
        <Text style={styles.authTitle}>{isRegister ? 'Criar Conta' : 'Entrar'}</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.background} /> : (
            <Text style={styles.btnPrimaryText}>{isRegister ? 'Cadastrar' : 'Entrar'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={{ marginTop: 16 }}>
          <Text style={styles.toggleText}>
            {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── MODAL DE AGENDAMENTO ──────────────────────────────────────────────────────
function BookingModal({ visible, barber, user, onClose }) {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      Alert.alert('Atenção', 'Selecione serviço, data e horário.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('agendamentos').insert({
        user_id: user.id,
        user_email: user.email,
        barber_id: barber.id,
        barber_name: barber.name,
        service: selectedService.name,
        price: selectedService.price,
        date: selectedDate,
        time: selectedTime,
        status: 'pendente',
      });
      if (error) throw error;
      Alert.alert('✅ Agendado!', `Seu horário com ${barber.name} foi marcado para ${selectedDate} às ${selectedTime}.`);
      onClose();
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agendar com {barber?.name}</Text>

          <Text style={styles.modalLabel}>Serviço</Text>
          {SERVICES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.optionBtn, selectedService?.id === s.id && styles.optionBtnSelected]}
              onPress={() => setSelectedService(s)}
            >
              <Text style={[styles.optionText, selectedService?.id === s.id && styles.optionTextSelected]}>
                {s.name} — {s.price}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.modalLabel}>Data</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD (ex: 2025-12-20)"
            placeholderTextColor={colors.textMuted}
            value={selectedDate}
            onChangeText={setSelectedDate}
          />

          <Text style={styles.modalLabel}>Horário</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeBtn, selectedTime === t && styles.timeBtnSelected]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeBtnText, selectedTime === t && styles.timeBtnTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleBook} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.background} /> : (
              <Text style={styles.btnPrimaryText}>Confirmar Agendamento</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── TELA PRINCIPAL ────────────────────────────────────────────────────────────
function HomeScreen({ user, onLogout }) {
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    if (data) setMyBookings(data);
  };

  const openWhatsApp = (barber) => {
    const msg = `Olá ${barber.name}! Vi seu perfil na Barbearia Colella e gostaria de mais informações.`;
    const url = `https://wa.me/${barber.whatsapp}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.'));
  };

  const openBooking = (barber) => {
    setSelectedBarber(barber);
    setBookingVisible(true);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bem-vindo,</Text>
          <Text style={styles.brandText}>COLELLA</Text>
          <Text style={styles.subBrandText}>BARBERSHOP & CO.</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* BANNER */}
      <View style={styles.bannerContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Cabelo & Barba na régua?</Text>
          <Text style={styles.bannerSubtitle}>Reserve seu horário hoje mesmo.</Text>
        </View>
      </View>

      {/* BARBEIROS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nossos Barbeiros</Text>
        {BARBERS.map(barber => (
          <View key={barber.id} style={styles.barberFullCard}>
            <TouchableOpacity onPress={() => openWhatsApp(barber)}>
              <Image source={{ uri: barber.photo }} style={styles.barberFullPhoto} />
              <View style={styles.waBadge}>
                <Text style={styles.waBadgeText}>WhatsApp</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.barberFullInfo}>
              <Text style={styles.barberFullName}>{barber.name}</Text>
              <Text style={styles.barberFullRole}>{barber.role}</Text>
              <Text style={[styles.barberFullStatus, { color: barber.status === 'Disponível' ? colors.success : colors.error }]}>
                ● {barber.status}
              </Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => openBooking(barber)}>
                <Text style={styles.btnPrimaryText}>Agendar Horário</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnWhatsapp} onPress={() => openWhatsApp(barber)}>
                <Text style={styles.btnWhatsappText}>📱 Chamar no WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* MEUS AGENDAMENTOS */}
      {myBookings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meus Agendamentos</Text>
          {myBookings.map((b, i) => (
            <View key={i} style={styles.bookingCard}>
              <Text style={styles.bookingBarber}>{b.barber_name}</Text>
              <Text style={styles.bookingService}>{b.service}</Text>
              <Text style={styles.bookingDate}>{b.date} às {b.time}</Text>
              <Text style={[styles.bookingStatus, { color: colors.primary }]}>{b.price}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      {selectedBarber && (
        <BookingModal
          visible={bookingVisible}
          barber={selectedBarber}
          user={user}
          onClose={() => { setBookingVisible(false); loadBookings(); }}
        />
      )}
    </ScrollView>
  );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return user
    ? <HomeScreen user={user} onLogout={handleLogout} />
    : <LoginScreen onLogin={setUser} />;
}

// ─── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },

  // AUTH
  authContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  brandBig: { color: colors.primary, fontSize: 48, fontWeight: '900', letterSpacing: 6 },
  subBrand: { color: colors.text, fontSize: 12, letterSpacing: 5, marginBottom: 40 },
  authCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border },
  authTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: colors.background, color: colors.text, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 14, fontSize: 15 },
  toggleText: { color: colors.primary, textAlign: 'center', fontSize: 14 },

  // VERIFY
  verifyBox: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  verifyIcon: { fontSize: 48, marginBottom: 12 },
  verifyTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  verifyText: { color: colors.textMuted, textAlign: 'center', marginBottom: 8, fontSize: 14, lineHeight: 22 },

  // BUTTONS
  btnPrimary: { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPrimaryText: { color: colors.background, fontWeight: 'bold', fontSize: 15 },
  btnSecondary: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnSecondaryText: { color: colors.textMuted, fontSize: 15 },
  btnWhatsapp: { backgroundColor: '#25D366', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  btnWhatsappText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  logoutBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: colors.textMuted, fontSize: 13 },

  // HOME
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: colors.textMuted, fontSize: 13, letterSpacing: 1 },
  brandText: { color: colors.primary, fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  subBrandText: { color: colors.text, fontSize: 10, letterSpacing: 3, marginTop: -3 },
  bannerContainer: { backgroundColor: colors.surface, borderRadius: 12, padding: 20, borderLeftWidth: 4, borderLeftColor: colors.primary, marginBottom: 30 },
  bannerTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  bannerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  section: { marginBottom: 30 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },

  // BARBER CARD
  barberFullCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 16 },
  barberFullPhoto: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primary },
  waBadge: { backgroundColor: '#25D366', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginTop: 6, alignItems: 'center' },
  waBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  barberFullInfo: { flex: 1 },
  barberFullName: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  barberFullRole: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  barberFullStatus: { fontSize: 12, marginTop: 4, marginBottom: 8, fontWeight: 'bold' },

  // BOOKING CARD
  bookingCard: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  bookingBarber: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  bookingService: { color: colors.text, fontSize: 14, marginTop: 2 },
  bookingDate: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  bookingStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { color: colors.primary, fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  optionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 8 },
  optionBtnSelected: { borderColor: colors.primary, backgroundColor: 'rgba(212,175,55,0.15)' },
  optionText: { color: colors.textMuted, fontSize: 14 },
  optionTextSelected: { color: colors.primary, fontWeight: 'bold' },
  timeBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  timeBtnSelected: { borderColor: colors.primary, backgroundColor: 'rgba(212,175,55,0.15)' },
  timeBtnText: { color: colors.textMuted, fontSize: 14 },
  timeBtnTextSelected: { color: colors.primary, fontWeight: 'bold' },
});