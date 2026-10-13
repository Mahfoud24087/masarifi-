import React from 'react';
import { MasarifiProvider, useMasarifi } from './context/MasarifiContext';
import LandingScreen from './screens/LandingScreen';
import AuthScreen from './screens/AuthScreen';
import AppShell from './screens/AppShell';

function MasarifiRouter() {
  const { screen } = useMasarifi();

  if (screen === 'app')                            return <AppShell />;
  if (screen === 'auth-signup' || screen === 'auth-signin') return <AuthScreen />;
  return <LandingScreen />;
}

export default function App() {
  return (
    <MasarifiProvider>
      <MasarifiRouter />
    </MasarifiProvider>
  );
}
