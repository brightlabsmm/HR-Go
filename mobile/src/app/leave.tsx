import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { Badge, StatusType } from '../components/Badge';
import {
  leaveApi,
  MobileLeaveBalance,
  MobileLeaveRequest,
} from '../services/api/leaveApi';

const PALETTE = ['#1787f5', '#12805C', '#D97706', '#7C3AED'];

export default function LeaveScreen() {
  const router = useRouter();
  const [balances, setBalances] = useState<MobileLeaveBalance[]>([]);
  const [requests, setRequests] = useState<MobileLeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadLeaveData = useCallback(async () => {
    try {
      const [balList, reqPage] = await Promise.all([
        leaveApi.listBalances(),
        leaveApi.listRequests({ pageSize: 50 }),
      ]);
      setBalances(balList);
      setRequests(reqPage?.items ?? []);
    } catch (err: any) {
      Alert.alert('Load Failed', err?.message || 'Unable to load leave data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLeaveData();
  }, [loadLeaveData]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadLeaveData();
  };

  const toggleOpen = (id: string) => {
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
          <Text style={styles.headerTitle}>Leave</Text>
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          activeOpacity={0.8}
          onPress={() => router.push('/new-leave')}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.applyButtonText}>Apply leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : (
          <>
            {/* Balances 2x2 Grid */}
            <View style={styles.balanceGrid}>
              {balances.map((b, i) => {
                const accent = PALETTE[i % PALETTE.length];
                const pct =
                  b.requiresBalance && b.allocatedDays > 0
                    ? Math.max(0, Math.min(100, Math.round((b.remainingDays / b.allocatedDays) * 100)))
                    : 0;
                return (
                  <View key={b.id || b.leaveTypeId} style={styles.balanceTile}>
                    <Text style={styles.balanceName}>{b.leaveTypeName}</Text>
                    <View style={styles.balanceCountRow}>
                      <Text style={[styles.balanceLeft, { color: accent }]}>
                        {b.requiresBalance ? b.remainingDays : '—'}
                      </Text>
                      <Text style={styles.balanceOf}>
                        {b.requiresBalance ? `of ${b.allocatedDays} left` : 'no limit'}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${pct}%`, backgroundColor: accent },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Leave Requests Heading */}
            <Text style={styles.sectionHeading}>Leave requests</Text>

            {/* Requests List */}
            {requests.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardType}>No leave requests yet</Text>
                <Text style={styles.detailValue}>Tap &ldquo;Apply leave&rdquo; to submit a request.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {requests.map((item) => {
                  const isOpen = openId === item.id;
                  const isRejected = item.requestStatus === 'REJECTED';
                  const daysLabel = `${item.requestedDays} ${item.requestedDays === 1 ? 'day' : 'days'}`;
                  const rangeLabel =
                    item.startDate === item.endDate
                      ? item.startDate
                      : `${item.startDate} – ${item.endDate}`;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      activeOpacity={0.9}
                      onPress={() => toggleOpen(item.id)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardMain}>
                          <Text style={styles.cardType}>{item.leaveTypeName}</Text>
                          <Text style={styles.cardRange}>
                            {daysLabel} · {rangeLabel}
                          </Text>
                        </View>
                        <View style={styles.cardRight}>
                          <Badge status={item.requestStatus as StatusType} />
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
                              {item.decisionNotes ||
                                (item.requestStatus === 'PENDING'
                                  ? 'Waiting for approval'
                                  : item.requestStatus)}
                            </Text>
                          </View>

                          {isRejected && (
                            <TouchableOpacity
                              style={styles.resubmitButton}
                              activeOpacity={0.8}
                              onPress={() => router.push('/new-leave')}
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
            )}
          </>
        )}
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
  applyButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  balanceTile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  balanceName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  balanceCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceLeft: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceOf: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 4,
    backgroundColor: '#E4E9F3',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
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
  cardMain: {
    flex: 1,
    gap: 2,
  },
  cardType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardRange: {
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
