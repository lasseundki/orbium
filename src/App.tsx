import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import Auth from './screens/Auth';
import Dashboard from './screens/Dashboard';
import Contacts from './screens/Contacts';
import ContactDetail from './screens/ContactDetail';
import Pipeline from './screens/Pipeline';
import Reminders from './screens/Reminders';
import Settings from './screens/Settings';
import Network from './screens/Network';
import { useReminders } from './hooks/useReminders';
import { todayStart } from './lib/utils';

function Shell() {
  const { user } = useAuth();
  const { reminders } = useReminders(user?.uid ?? null);
  const overdue = reminders.filter(r => r.status === 'offen' && r.dueDate < todayStart()).length;

  if (!user) return <Auth />;

  return (
    <div className="app">
      <Sidebar overdueBadge={overdue} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/network" element={<Network />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <BottomNav overdueBadge={overdue} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={null}>
          <Shell />
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}
