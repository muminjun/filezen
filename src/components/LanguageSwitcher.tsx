'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string | null) => {
    if (!newLocale) return;
    
    // Get segments and remove empty ones
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if the first segment is a locale
    const currentLocaleInPath = segments[0] === 'en' || segments[0] === 'ko' ? segments[0] : null;
    
    if (currentLocaleInPath) {
      // Replace existing locale in path
      segments[0] = newLocale;
    } else {
      // No locale in path (default was used and hidden)
      // Prepend the new locale if it's not the default
      // Note: next-intl with localePrefix: 'as-needed' handles this, 
      // but let's be explicit or let the middleware handle it.
      segments.unshift(newLocale);
    }

    const newPath = `/${segments.join('/')}`;
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[120px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue>{locale === 'ko' ? '한국어' : 'English'}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="ko">한국어</SelectItem>
      </SelectContent>
    </Select>
  );
}
