"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NavItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  roles?: ('student' | 'organization' | 'admin')[];
}

interface SidebarNavProps {
  items: NavItem[];
  onItemClick?: () => void;
}

export function SidebarNav({ items, onItemClick }: SidebarNavProps) {
  const path = usePathname();
  const { t } = useLanguage();
  
  if (!items?.length) {
    return null;
  }
  
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = path === item.href;
        const title = t(item.titleKey);

        const linkContent = (
          <>
            <Icon className="h-5 w-5" />
            {title}
            {item.label && (
              <span className="ml-auto text-xs text-muted-foreground">
                {item.label}
              </span>
            )}
          </>
        );

        if (item.external) {
          return (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary"
              )}
            >
              {linkContent}
            </a>
          );
        }

        return (
          <Link
            key={index}
            href={item.disabled ? "#" : item.href}
            onClick={() => {
              if (!item.disabled && item.href !== path) {
                onItemClick?.();
              }
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-card-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary",
              item.disabled && "cursor-not-allowed opacity-80"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {linkContent}
          </Link>
        );
      })}
    </nav>
  );
}
