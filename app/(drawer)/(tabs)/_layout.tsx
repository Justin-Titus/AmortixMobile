import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Colors, Shadows } from '@/constants/theme';
import {
  LayoutDashboard, BarChart3, Target, TrendingUp, MessageSquare,
} from 'lucide-react-native';
import DashboardHeader from '@/components/layout/DashboardHeader';


import CustomBottomTabBar from '@/components/layout/CustomBottomTabBar';

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.emerald} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: true, // Enable custom headers
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          header: () => <DashboardHeader title="Dashboard" context="Portfolio overview" />,
          tabBarIcon: ({ color }) => <LayoutDashboard size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          headerShown: false,
          tabBarIcon: ({ color }) => <BarChart3 size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="strategy"
        options={{
          title: 'Strategy',
          header: () => <DashboardHeader title="Repayment Strategy" context="Repayment planning" />,
          tabBarIcon: ({ color }) => <Target size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          header: () => <DashboardHeader title="Analysis" context="Risk & leaks" />,
          tabBarIcon: ({ color }) => <TrendingUp size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Advisor',
          header: () => <DashboardHeader title="AI Advisor" context="Advisor workspace" />,
          tabBarIcon: ({ color }) => <MessageSquare size={18} color={color} />,
        }}
      />

      {/* Hidden tabs that still show the bottom navbar */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          header: () => <DashboardHeader title="Deep Insights" context="Risk & leaks" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          header: () => <DashboardHeader title="Profile" context="Profile controls" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'EMI Calendar',
          header: () => <DashboardHeader title="EMI Calendar" context="Payment schedule" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="glossary"
        options={{
          title: 'Glossary',
          header: () => <DashboardHeader title="Glossary" context="Financial terms" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          header: () => <DashboardHeader title="Edit Profile" context="Update financial data" showBack={true} backHref="/profile" />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: 'Help Center',
          header: () => <DashboardHeader title="Help Center" context="Support & Guides" showBack={true} backHref="/profile" />,
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
