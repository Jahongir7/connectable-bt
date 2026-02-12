import { useState, useEffect } from 'react';
import { useLocation, useParams, Navigate } from 'react-router-dom';
import { LoginScreen } from '@/components/LoginScreen';
import { RoleSelection } from '@/components/RoleSelection';
import { Dashboard } from '@/components/Dashboard';
import { LovyChat } from '@/components/LovyChat';
import { useBankStore } from '@/store/bankStore';
import { UserRole } from '@/types/bank';

const Index = () => {
  const { pathname } = useLocation();
  const { role } = useParams<{ role: UserRole }>();
  const { currentUser } = useBankStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if store is hydrated
    const checkHydration = () => {
      const hasHydrated = useBankStore.persist.hasHydrated();
      if (hasHydrated) {
        setIsHydrated(true);
      } else {
        // If not hydrated yet, wait a bit or use the onRehydrate callback
        const unsub = useBankStore.persist.onFinishHydration(() => {
          setIsHydrated(true);
          unsub();
        });
      }
    };
    checkHydration();
  }, []);

  // Don't render anything or show a loader until the store is hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  // Auth check: if not logged in and not on login page, redirect to login
  if (!currentUser && pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in and on login page, redirect to role selection
  if (currentUser && (pathname === '/login' || pathname === '/')) {
    return <Navigate to="/role-select" replace />;
  }
  
  return (
    <>
      {pathname === '/login' && <LoginScreen />}
      {pathname === '/role-select' && <RoleSelection />}
      {pathname.startsWith('/dashboard/') && role && <Dashboard />}
      <LovyChat />
    </>
  );
};

export default Index;
