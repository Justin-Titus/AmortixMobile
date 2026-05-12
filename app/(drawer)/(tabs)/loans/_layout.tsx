import { Stack } from 'expo-router';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function LoansLayout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen
        name="index"
        options={{
          header: () => <DashboardHeader title="My Loans" context="Loan inventory" />,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          header: () => <DashboardHeader title="Manage Loan" context="Add or edit loan details" showBack={true} />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          header: () => <DashboardHeader title="Loan Details" context="Payoff progress" showBack={true} />,
        }}
      />
    </Stack>
  );
}
