import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Linking, StyleSheet, StatusBar,
} from 'react-native';
import { supabase } from '../config/supabase';
import { colors } from '../constants/theme';
import { BARBERS } from '../constants/data';
import BarberCard from '../components/BarberCard';
import BookingModal from '../components/BookingModal';

export default function HomeScreen({ user, onLogout }) {
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

  const handleCloseBooking = () => {
    setBookingVisible(false);
    loadBookings();
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
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Cabelo & Barba na régua?</Text>
        <Text style={styles.bannerSubtitle}>Reserve seu horário hoje mesmo.</Text>
      </View>

      {/* BARBEIROS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nossos Barbeiros</Text>
        {BARBERS.map(barber => (
          <BarberCard
            key={barber.id}
            barber={barber}
            onBook={openBooking}
            onWhatsApp={openWhatsApp}
          />
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
              <Text style={styles.bookingPrice}>{b.price}</Text>
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
          onClose={handleCloseBooking}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  welcomeText: { color: colors.textMuted, fontSize: 13, letterSpacing: 1 },
  brandText: { color: colors.primary, fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  subBrandText: { color: colors.text, fontSize: 10, letterSpacing: 3, marginTop: -3 },
  logoutBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: colors.textMuted, fontSize: 13 },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 30,
  },
  bannerTitle: { color: colors.text, fontSize: 17, fontWeight: 'bold' },
  bannerSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  section: { marginBottom: 30 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15, letterSpacing: 0.5 },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingBarber: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  bookingService: { color: colors.text, fontSize: 14, marginTop: 2 },
  bookingDate: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  bookingPrice: { color: colors.primary, fontSize: 14, fontWeight: 'bold', marginTop: 4 },
});