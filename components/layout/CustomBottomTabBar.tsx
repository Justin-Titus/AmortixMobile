import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Colors, Shadows, Radius } from '@/constants/theme';
import Typography from '@/components/ui/Typography';
import {
  LayoutDashboard, BarChart3, Target, TrendingUp, MessageSquare
} from 'lucide-react-native';

const TabIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  loans: BarChart3,
  strategy: Target,
  analysis: TrendingUp,
  chat: MessageSquare,
};

// Only these routes will be displayed in the tab bar
const VISIBLE_TABS = ['dashboard', 'loans', 'strategy', 'analysis', 'chat'];

export default function CustomBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  // Pages where we want to hide the bottom navbar
  const hiddenOn = ['/edit-profile', '/loans/add', '/loans/'];
  const isHidden = hiddenOn.some(path => pathname.includes(path)) && !pathname.endsWith('/loans');

  if (isHidden || keyboardVisible) return null;

  // Base padding plus safe area, matching web: pb-[max(8px,env(safe-area-inset-bottom))]
  const paddingBottom = Math.max(8, insets.bottom);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.dock}>
        {state.routes.filter(route => VISIBLE_TABS.includes(route.name)).map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // If navigating to loans, ensure we go to the index screen
              if (route.name === 'loans') {
                navigation.navigate('loans', { screen: 'index' });
              } else {
                navigation.navigate(route.name);
              }
            } else if (isFocused && route.name === 'loans') {
              // If already on loans but deep in a stack (like add loan), 
              // clicking the tab again should reset to the list
              navigation.navigate('loans', { screen: 'index' });
            }
          };

          const IconComponent = TabIcons[route.name] || LayoutDashboard;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={[
                styles.tabItem,
                isFocused && styles.tabItemActive
              ]}
              activeOpacity={0.8}
            >
              <IconComponent 
                size={16} 
                color={isFocused ? Colors.white : Colors.slate} 
                strokeWidth={isFocused ? 2.5 : 2}
              />
              <Typography 
                variant="xs"
                weight={isFocused ? 'bold' : 'medium'}
                color={isFocused ? 'white' : 'slate'}
                style={styles.tabLabel}
                numberOfLines={1}
              >
                {label as string}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    zIndex: 40,
    elevation: 40,
  },
  dock: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: 6,
    ...Shadows.bottomNav,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 4,
    minHeight: 56,
  },
  tabItemActive: {
    backgroundColor: Colors.navy,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  tabLabel: {
    lineHeight: 10,
    fontSize: 10,
  },
});
