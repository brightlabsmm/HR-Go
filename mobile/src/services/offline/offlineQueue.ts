import AsyncStorage from '@react-native-async-storage/async-storage';
import { attendanceApi } from '../api/attendanceApi';
import { OfflineEventRequest, SyncResultItem } from '../api/types';

const OFFLINE_QUEUE_KEY = '@hrgo_offline_events_queue';

export interface StoredOfflineEvent {
  localEventId: string;
  eventType: 'CHECK_IN' | 'CHECK_OUT';
  localEventTime: string;
  short: 'IN' | 'OUT';
  title: string;
  timeFormatted: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFLICT';
  note: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  notes?: string;
}

const DEFAULT_MOCK_EVENTS: StoredOfflineEvent[] = [
  {
    localEventId: 'mock-1',
    eventType: 'CHECK_IN',
    localEventTime: new Date(Date.now() - 3600000).toISOString(),
    short: 'IN',
    title: 'Check in',
    timeFormatted: 'Tue 24 Nov · 08:52',
    status: 'PENDING',
    note: 'Waiting for connection',
  },
  {
    localEventId: 'mock-2',
    eventType: 'CHECK_OUT',
    localEventTime: new Date(Date.now() - 86400000).toISOString(),
    short: 'OUT',
    title: 'Check out',
    timeFormatted: 'Mon 22 Nov · 17:10',
    status: 'CONFLICT',
    note: 'A check-out already exists for this day',
  },
  {
    localEventId: 'mock-3',
    eventType: 'CHECK_IN',
    localEventTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    short: 'IN',
    title: 'Check in',
    timeFormatted: 'Mon 22 Nov · 08:58',
    status: 'ACCEPTED',
    note: 'Synced 22 Nov, 12:04',
  },
  {
    localEventId: 'mock-4',
    eventType: 'CHECK_OUT',
    localEventTime: new Date(Date.now() - 86400000 * 3).toISOString(),
    short: 'OUT',
    title: 'Check out',
    timeFormatted: 'Sun 21 Nov · 16:40',
    status: 'REJECTED',
    note: 'Not a working day for your shift',
  },
];

export const offlineQueue = {
  getEvents: async (): Promise<StoredOfflineEvent[]> => {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!data) {
        // Initialize with default events matching prototype
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(DEFAULT_MOCK_EVENTS));
        return DEFAULT_MOCK_EVENTS;
      }
      return JSON.parse(data) as StoredOfflineEvent[];
    } catch {
      return DEFAULT_MOCK_EVENTS;
    }
  },

  addPunch: async (
    type: 'CHECK_IN' | 'CHECK_OUT',
    options: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      address?: string;
      notes?: string;
    } = {}
  ): Promise<StoredOfflineEvent> => {
    const current = await offlineQueue.getEvents();
    const now = new Date();
    const localEventId = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const newEvent: StoredOfflineEvent = {
      localEventId,
      eventType: type,
      localEventTime: now.toISOString(),
      short: type === 'CHECK_IN' ? 'IN' : 'OUT',
      title: type === 'CHECK_IN' ? 'Check in' : 'Check out',
      timeFormatted: `${dateStr} · ${timeStr}`,
      status: 'PENDING',
      note: 'Waiting for connection',
      latitude: options.latitude,
      longitude: options.longitude,
      accuracy: options.accuracy,
      address: options.address,
      notes: options.notes,
    };

    const updated = [newEvent, ...current];
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    return newEvent;
  },

  sync: async (): Promise<{
    processed: number;
    success: number;
    failed: number;
    results: SyncResultItem[];
  }> => {
    const current = await offlineQueue.getEvents();
    const pendingEvents = current.filter((e) => e.status === 'PENDING');

    if (pendingEvents.length === 0) {
      return { processed: 0, success: 0, failed: 0, results: [] };
    }

    const payload: OfflineEventRequest[] = pendingEvents.map((e) => ({
      localEventId: e.localEventId,
      eventType: e.eventType,
      localEventTime: e.localEventTime,
      latitude: e.latitude,
      longitude: e.longitude,
      accuracy: e.accuracy,
      address: e.address,
      notes: e.notes,
    }));

    try {
      const response = await attendanceApi.syncOffline({ events: payload });
      const resultMap = new Map<string, SyncResultItem>();
      response.results.forEach((r) => resultMap.set(r.localEventId, r));

      const updated = current.map((item) => {
        const res = resultMap.get(item.localEventId);
        if (res) {
          return {
            ...item,
            status: res.resultStatus as 'ACCEPTED' | 'CONFLICT' | 'REJECTED',
            note:
              res.resultStatus === 'ACCEPTED'
                ? `Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : res.errorMessage || `Sync status: ${res.resultStatus}`,
          };
        }
        return item;
      });

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));

      return {
        processed: response.processedCount,
        success: response.successCount,
        failed: response.failedCount,
        results: response.results,
      };
    } catch (err: any) {
      throw err;
    }
  },

  clear: async () => {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};
