'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { StyledComponentsRegistry } from '@/styles/StyledComponentsRegistry';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <StyledComponentsRegistry>
          <ThemeProvider theme={theme}>
            {children}
            <Toaster />
          </ThemeProvider>
        </StyledComponentsRegistry>
      </Provider>
    </SessionProvider>
  );
}
