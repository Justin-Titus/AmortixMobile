import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Menu, Bell, ArrowLeft } from 'lucide-react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Typography from '@/components/ui/Typography';
import { getNotifications } from '@/services/notifications';

type DashboardHeaderProps = {
  title: string;
  context?: string;
  showBack?: boolean;
  backHref?: string;
};

export default function DashboardHeader({ title, context = 'Workspace', showBack = false, backHref }: DashboardHeaderProps) {
  const { user } = useAuth();
  const firstLetter = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchCount = async () => {
        try {
          const data = await getNotifications();
          if (isActive) {
            setUnreadCount(data.filter((n) => !n.isRead).length);
          }
        } catch (error) {
          console.error("Failed to fetch notifications count:", error);
        }
      };
      if (user) fetchCount();
      return () => { isActive = false; };
    }, [user])
  );

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleProfile = () => {
    router.push('/(drawer)/(tabs)/profile');
  };

  const handleNotifications = () => {
    router.push('/notifications');
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.headerInner}>
        {/* Left: Menu & Title */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            onPress={showBack 
              ? () => (backHref ? router.push(backHref as any) : router.back()) 
              : openDrawer} 
            style={styles.menuButton} 
            activeOpacity={0.7}
          >
            {showBack ? (
              <ArrowLeft size={20} color={Colors.navy} />
            ) : (
              <Menu size={20} color={Colors.navy} />
            )}
          </TouchableOpacity>
          <View style={styles.titleBox}>
            <View style={styles.breadcrumbRow}>
              <Typography variant="base" weight="medium" color="navy" numberOfLines={1} fontFamily="heading">
                {title}
              </Typography>
            </View>
            <Typography variant="xs" color="slateLight" numberOfLines={1}>
              {context}
            </Typography>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleNotifications}>
            <Bell size={20} color={Colors.slate} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Typography 
                  variant="caption" 
                  color="white" 
                  style={{ 
                    fontSize: 9, 
                    fontWeight: 'bold', 
                    lineHeight: 9,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    includeFontPadding: false
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Typography>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8} onPress={handleProfile}>
            <Typography variant="caption" weight="medium" color="white" align="center">
              {firstLetter}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    height: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  titleBox: {
    flex: 1,
    justifyContent: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
