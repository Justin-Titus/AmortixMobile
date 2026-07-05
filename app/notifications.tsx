import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '@/components/ui/Typography';
import { getNotifications, markAsRead, markAllAsRead, type NotificationRecord } from '@/services/notifications';
import { Bell, CheckCheck, ArrowLeft, ExternalLink } from 'lucide-react-native';

function formatNotificationDate(dateStr: string): string {
  const date = new Date(dateStr);
  
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: tz || undefined
    });
  } catch (e) {
    // Fallback to manual local formatting if Intl fails
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
  }
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationPress = async (notification: NotificationRecord) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }

    if (notification.link) {
      // Navigate to the linked screen
      // If it starts with /loans/, push it directly
      router.push(notification.link as any);
    }
  };

  const renderItem = ({ item }: { item: NotificationRecord }) => {
    const isUnread = !item.isRead;
    const date = formatNotificationDate(item.createdAt);

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <Typography variant="body" weight="semiBold" color={isUnread ? 'navy' : 'slate'} style={styles.titleText}>
              {item.title}
            </Typography>
          </View>
          <Typography variant="caption" color="slateLight">
            {date}
          </Typography>
        </View>
        <Typography variant="sm" color={isUnread ? 'slate' : 'slateLight'} style={styles.bodyText}>
          {item.body}
        </Typography>
        {item.link && (
          <View style={styles.linkRow}>
            <ExternalLink size={14} color={Colors.emerald} />
            <Typography variant="caption" color="emerald" weight="medium" style={{ marginLeft: 4 }}>
              View Details
            </Typography>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: "Notifications",
          headerShown: true,
          headerStyle: { backgroundColor: Colors.white },
          headerTintColor: Colors.navy,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ArrowLeft size={24} color={Colors.navy} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            notifications.some(n => !n.isRead) ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markReadBtn}>
                <CheckCheck size={16} color={Colors.emerald} />
                <Typography variant="caption" color="emerald" weight="medium" style={{ marginLeft: 4 }}>
                  Mark all read
                </Typography>
              </TouchableOpacity>
            ) : null
          )
        }} 
      />

      {loading ? (
        <View style={styles.center}>
          <Typography color="slate">Loading notifications...</Typography>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Bell size={32} color={Colors.slateLight} />
          </View>
          <Typography variant="lg" weight="bold" color="navy" style={{ marginTop: 16 }}>
            All caught up!
          </Typography>
          <Typography variant="body" color="slate" style={{ textAlign: 'center', marginTop: 8 }}>
            You don't have any notifications right now.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', // Emerald 50
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  unreadCard: {
    backgroundColor: '#F0FDF4', // Emerald 50 very light
    borderColor: '#D1FAE5', // Emerald 100
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
    marginRight: 8,
  },
  titleText: {
    flex: 1,
  },
  bodyText: {
    lineHeight: 20,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  }
});
