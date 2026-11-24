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
import { OVERTIME_REQUESTS } from '../constants/mockData';
import { Badge, StatusType } from '../components/Badge';

type TabType = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function OvertimeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('All');
  const [openId, setOpenId] = useState<number | null>(1);

  const filteredRequests = OVERTIME_REQUESTS.filter((r) => {
    if (tab === 'All') return true;
    return r.status.toLowerCase() === tab.toLowerCase();
  });

  const toggleOpen = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

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
          <Text style={styles.headerTitle}>Overtime</Text>
        </View>

        <TouchableOpacity
          style={styles.requestButton}
          activeOpacity={0.8}
          onPress={() => router.push('/new-overtime')}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.requestButtonText}>Request</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Approved · Nov</Text>
            <Text style={styles.summaryValue}>5.5h</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>2h</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Requests</Text>
            <Text style={styles.summaryValue}>4</Text>
          </View>
        </View>

        {/* Status Tabs */}
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

        {/* Requests Accordion List */}
        <View style={styles.list}>
          {filteredRequests.map((item) => {
            const isOpen = openId === item.id;
            const isRejected = item.status === 'REJECTED';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => toggleOpen(item.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardMainInfo}>
                    <Text style={styles.cardDate}>{item.date}</Text>
                    <Text style={styles.cardMeta}>
                      {item.hours} · {item.cat} · {item.time}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Badge status={item.status as StatusType} />
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#8A94AD"
                    />
                  </View>
                </View>

                {/* Expanded Details */}
                {isOpen && (
                  <View style={styles.expandedContent}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reason</Text>
                      <Text style={styles.detailValue}>{item.reason}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Decision</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          isRejected ? { color: colors.status.absentText } : { color: colors.textSecondary },
                        ]}
                      >
                        {item.decision}
                      </Text>
                    </View>

                    {isRejected && (
                      <TouchableOpacity
                        style={styles.resubmitButton}
                        activeOpacity={0.8}
                        onPress={() => router.push('/new-overtime')}
                      >
                        <Text style={styles.resubmitButtonText}>Edit and resubmit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
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
  requestButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
  },
  summaryCol: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#BFD3F5',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
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
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMainInfo: {
    flex: 1,
    gap: 2,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1F7',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    color: colors.textPrimary,
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
