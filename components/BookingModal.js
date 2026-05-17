import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { supabase } from '../config/supabase';
import { colors } from '../constants/theme';
import { SERVICES, TIME_SLOTS } from '../constants/data';

export default function BookingModal({ visible, barber, user, onClose }) {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

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
      Alert.alert(
        '✅ Agendado!',
        `Seu horário com ${barber.name} foi marcado para ${selectedDate} às ${selectedTime}.`
      );
      setSelectedService(null);
      setSelectedDate('');
      setSelectedTime(null);
      onClose();
    } catch (err) {
      Alert.alert('Erro', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Agendar com {barber?.name}</Text>

          <Text style={styles.label}>Serviço</Text>
          {SERVICES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.optionBtn, selectedService?.id === s.id && styles.optionBtnSelected]}
              onPress={() => setSelectedService(s)}
            >
              <Text style={[styles.optionText, selectedService?.id === s.id && styles.optionTextSelected]}>
                {s.name} — {s.price} ({s.duration})
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD (ex: 2026-06-20)"
            placeholderTextColor={colors.textMuted}
            value={selectedDate}
            onChangeText={setSelectedDate}
          />

          <Text style={styles.label}>Horário</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeBtn, selectedTime === t && styles.timeBtnSelected]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeBtnText, selectedTime === t && styles.timeBtnTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleBook} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.btnPrimaryText}>Confirmar Agendamento</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
            <Text style={styles.btnSecondaryText}>Cancelar</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  title: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    fontSize: 15,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  optionText: { color: colors.textMuted, fontSize: 14 },
  optionTextSelected: { color: colors.primary, fontWeight: 'bold' },
  timeBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  timeBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  timeBtnText: { color: colors.textMuted, fontSize: 14 },
  timeBtnTextSelected: { color: colors.primary, fontWeight: 'bold' },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colors.background, fontWeight: 'bold', fontSize: 15 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnSecondaryText: { color: colors.textMuted, fontSize: 15 },
});