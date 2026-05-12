import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '@/components/layout/CustomDrawerContent';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import DashboardHeader from '@/components/layout/DashboardHeader';

const renderProfileHeader = () => <DashboardHeader title="Profile" context="Profile controls" />;
const renderAnalysisHeader = () => <DashboardHeader title="Analysis" context="Scenario sandbox" />;

export default function DrawerLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.emerald} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Drawer
      drawerContent={CustomDrawerContent}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280,
        },
        swipeEdgeWidth: 100,
      }}
    >
      <Drawer.Screen 
        name="(tabs)" 
        options={{ 
          title: 'Main',
        }} 
      />
    </Drawer>
  );
}
