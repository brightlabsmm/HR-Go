import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { CORRECTION_REQUESTS } from '../constants/mockData';
import { Badge, StatusType } from '../components/Badge';

type TabType = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function MyRequestsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('All');

  const filteredRequests = CORRECTION_REQUESTS.filter((r) => {
    if (tab === 'All') return true;
    return r.status.toLowerCase() === tab.toLowerCase();
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My correction requests</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => router.push('/correction-request')}
        >
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Filter Tabs */}
        <View style={styles.tabsContainer}>
          {(['All', 'Pending', 'Approved', 'Rejected'] as TabType[]).map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Requests List */}
        <View style={styles.list}>
          {filteredRequests.map((req) => {
            const isRejected = req.status === 'REJECTED';
            return (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.cardDate}>{req.date}</Text>
                    <Text style={styles.cardMeta}>
                      {req.type} · sent {req.sent}
                    </Text>
                  </View>
                  <Badge status={req.status as StatusType} />
                </View>

                {/* Was vs Requested */}
                <View style={styles.compareGrid}>
                  <View style={styles.compareBox}>
                    <Text style={styles.compareLabel}>Recorded</Text>
                    <Text style={styles.compareValue}>{req.was}</Text>
                  </View>
                  <View style={styles.compareBox}>
                    <Text style={styles.compareLabel}>Requested</Text>
                    <Text style={styles.compareValue}>{req.req}</Text>
                  </View>
                </View>

                {/* Note */}
                <Text
                  style={[
                    styles.noteText,
                    isRejected ? { color: colors.status.absentText } : { color: colors.textSecondary },
                  ]}
                >
                  {req.note}
                </Text>

                {/* Rejected Action */}
                {isRejected && (
                  <TouchableOpacity
                    style={styles.resubmitButton}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                      pathname: '/correction-request',
                      params: { type: 'corr', date: req.date },
                    })}
                  >
                    <Text style={styles.resubmitButtonText}>Edit and resubmit</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4E9F3',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compareGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  compareBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.bg,
    gap: 2,
  },
  compareLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  compareValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
  },
  resubmitButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
});
