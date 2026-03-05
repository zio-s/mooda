'use client';

import React, { createContext, useContext, useState } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

interface TabsContextType {
  active: string;
  setActive: (v: string) => void;
}

const TabsContext = createContext<TabsContextType>({ active: '', setActive: () => {} });

// Tabs root
export function Tabs({
  defaultValue,
  children,
}: {
  defaultValue?: string;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState(defaultValue ?? '');
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList
const TabsListWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: ${theme.borderRadius.lg};
  padding: 3px;
  gap: 2px;
  width: 100%;
`;

export function TabsList({ children }: { children: React.ReactNode }) {
  return <TabsListWrapper>{children}</TabsListWrapper>;
}

// TabsTrigger
const TabsTriggerButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
  padding: 6px 2px;
  font-size: 12px;
  font-weight: ${theme.fontWeight.medium};
  border-radius: 7px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  background: ${({ $active }) => ($active ? theme.colors.white : 'transparent')};
  color: ${({ $active }) => ($active ? theme.colors.text : theme.colors.textMuted)};
  box-shadow: ${({ $active }) => ($active ? theme.shadows.sm : 'none')};

  &:hover {
    color: ${theme.colors.text};
  }
`;

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <TabsTriggerButton $active={active === value} onClick={() => setActive(value)}>
      {children}
    </TabsTriggerButton>
  );
}

// TabsContent
export function TabsContent({
  value,
  children,
  style,
}: {
  value: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { active } = useContext(TabsContext);
  if (active !== value) return null;
  return <div style={style}>{children}</div>;
}
