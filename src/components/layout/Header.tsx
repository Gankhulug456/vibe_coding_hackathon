
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, LogOut, Bell, Sun, Moon, LanguagesIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useNotification } from '@/contexts/NotificationContext';
import type { UserRole } from '@/types';

export function Header() {
  const { user, logoutUser, role } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { notifications, clearNotifications, unreadCount } = useNotification();
  
  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  let settingsPath = '/';
  let userDisplayName = user?.name || '';

  if (user) {
    switch (role) {
      case 'student':
        settingsPath = '/student/settings';
        break;
      case 'organization':
        settingsPath = '/organization/settings';
        userDisplayName = user.organizationName || user.name;
        break;
      case 'admin':
        settingsPath = '/admin/settings';
        break;
      default:
        settingsPath = '/';
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
        aria-label={t('general.toggleTheme')} 
        className="rounded-full"
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label={t('general.changeLanguage')} 
            className="rounded-full"
          >
            <LanguagesIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLanguage('en')} disabled={language === 'en'}>
            {t('general.english')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setLanguage('mn')} disabled={language === 'mn'}>
            {t('general.mongolian')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                aria-label={t('general.notifications')} 
                className="relative rounded-full"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{unreadCount}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96 max-h-[calc(100vh-100px)] overflow-y-auto">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>{t('notifications.title')}</span>
              {notifications.length > 0 && (
                 <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs text-primary hover:text-primary/80 h-auto p-1">
                    <Trash2 className="mr-1 h-3 w-3" />{t('notifications.clearAll')}
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-2.5 hover:bg-accent focus:bg-accent !text-popover-foreground" asChild={!!notification.link}>
                  {notification.link ? (
                    <Link href={notification.link} className="w-full no-underline">
                      <div className="font-medium text-sm">{t(notification.titleKey, notification.descriptionArgs as Record<string, string>)}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words whitespace-normal">{t(notification.descriptionKey, notification.descriptionArgs as Record<string, string>)}</p>
                      <div className="text-xs text-muted-foreground/70 mt-1.5">
                        {new Date(notification.timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })} - {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </Link>
                  ) : (
                    <div className="w-full cursor-default">
                        <div className="font-medium text-sm">{t(notification.titleKey, notification.descriptionArgs as Record<string, string>)}</div>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words whitespace-normal">{t(notification.descriptionKey, notification.descriptionArgs as Record<string, string>)}</p>
                        <div className="text-xs text-muted-foreground/70 mt-1.5">
                            {new Date(notification.timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })} - {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="text-center text-muted-foreground p-4">
                {t('notifications.noNewNotifications')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {user ? (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    className="relative h-9 w-9 rounded-full"
                >
                <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(userDisplayName)}</AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                    </p>
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href={settingsPath}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('navigation.settings')}</span>
                </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logoutUser}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('buttons.logout')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      ) : (
         pathname !== '/login' && pathname !== '/register' && (
          <Button asChild variant="default" size="sm">
            <Link href="/login">{t('buttons.login')}</Link>
          </Button>
         )
      )}
    </div>
  );
}
