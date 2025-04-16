'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  BookOpen,
  FileQuestion,
  LogOut,
  Info,
  Menu,
  LogIn,
  GraduationCap,
  Shield,
  X,
} from 'lucide-react';
import { signOutAction } from '@/app/actions';
import { useAuth } from '@/context/auth-context';

interface LeftSidebarProps {
  className?: string;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  action?: () => Promise<void>;
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, refreshAuth } = useAuth();

  // Abmelden-Funktion
  const handleSignOut = async () => {
    try {
      const result = await signOutAction();
      if (result.success) {
        // Session im Client aktualisieren
        await refreshAuth();
        // Nach Anmeldung weiterleiten
        router.push(result.redirectTo || '/sign-in');
      } else {
        console.error('Fehler beim Abmelden:', result.error);
        // Trotz Fehler zum Login weiterleiten
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Abmelden:', error);
      router.push('/sign-in');
    }
  };

  // Menüpunkte definieren
  const publicMenuItems: MenuItem[] = [
    { href: '/', label: 'Startseite', icon: <Home className='h-5 w-5' /> },
    { href: '/about', label: 'Über uns', icon: <Info className='h-5 w-5' /> },
  ];

  // Zusätzliche Menüpunkte für angemeldete Benutzer
  const authenticatedMenuItems: MenuItem[] = [
    ...publicMenuItems,
    {
      href: '/lessons',
      label: 'Deine Kurse',
      icon: <BookOpen className='h-5 w-5' />,
    },
    {
      href: '/courses',
      label: 'Kurse',
      icon: <GraduationCap className='h-5 w-5' />,
    },
    {
      href: '/exercises',
      label: 'Übungen',
      icon: <FileQuestion className='h-5 w-5' />,
    },
    {
      href: '#',
      label: 'Abmelden',
      icon: <LogOut className='h-5 w-5' />,
      action: handleSignOut,
    },
  ];

  // Anmelde-Menüpunkt für nicht authentifizierte Benutzer
  const loginMenuItem: MenuItem = {
    href: '/sign-in',
    label: 'Anmelden',
    icon: <LogIn className='h-5 w-5' />,
  };

  // Wähle die richtigen Menüpunkte basierend auf dem Authentifizierungsstatus
  const menuItems = isAuthenticated
    ? authenticatedMenuItems
    : [...publicMenuItems, loginMenuItem];

  const handleNavigation = (href: string, action?: () => Promise<void>) => {
    setIsMenuOpen(false);

    if (action) {
      action();
    } else {
      router.push(href);
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle - rechts oben */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className='fixed top-4 right-4 z-50 p-2 rounded-md bg-[#4AA4DE] text-white md:hidden'
        aria-label='Menü öffnen'
      >
        <Menu className='h-5 w-5' />
      </button>

      {/* Navigationsleiste - mobile: als Overlay, desktop: als feste Seitenleiste */}
      <nav
        className={`md:h-screen md:w-64 bg-[#4AA4DE] text-white shadow-lg 
          md:sticky md:top-0 md:left-0 md:flex md:flex-col 
          fixed top-0 left-0 bottom-0 w-64 z-40
          transform transition-transform duration-300 ease-in-out 
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          ${className}`}
      >
        {/* Mobile Close Button - innerhalb der Seitenleiste */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className='absolute top-4 right-4 text-white md:hidden'
          aria-label='Menü schließen'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Deen Akademie Logo */}
        <div className='p-4 flex items-center justify-start mb-6 pt-4'>
          <div className='rounded-full p-2 flex items-center justify-center'>
            <Image
              src='/deen-logo.png'
              alt='Deen Akademie Logo'
              width={60}
              height={60}
              priority
            />
          </div>
          <div className='ml-2'>
            <div className='text-white text-xl font-bold'>Deen</div>
            <div className='text-white text-xl'>Akademie</div>
          </div>
        </div>

        <ul className='space-y-1 px-2'>
          {menuItems.map((item) => (
            <li key={item.href}>
              <button
                onClick={() => handleNavigation(item.href, item.action)}
                className='flex items-center gap-3 px-4 py-3 rounded-md hover:bg-white/10 transition-colors text-white w-full text-left cursor-pointer'
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}

          {/* DEBUG Bereich nur im Entwicklungsmodus */}
          {process.env.NODE_ENV === 'development' && (
            <li className='mt-8 bg-white/5 rounded-md p-2 text-xs'>
              <div className='flex items-center gap-2 mb-1 text-white/80'>
                <Shield className='h-3.5 w-3.5' />
                <span>Auth-Debug</span>
              </div>
              <div className='flex flex-col gap-1 text-white/70'>
                <span>
                  Status:{' '}
                  {isAuthenticated ? '✅ Angemeldet' : '❌ Nicht angemeldet'}
                </span>
                <span>Lädt: {isLoading ? 'Ja' : 'Nein'}</span>
                {user && <span>User: {user.email}</span>}
              </div>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}
