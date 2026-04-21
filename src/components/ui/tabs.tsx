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

// TabsList — 탭 개수가 많거나 한글 레이블이 길면 좁은 뷰포트(≤375)에서 라벨이
// 잘리던 문제. flex:1 강제 분배 대신 필요 시 가로 스크롤 허용 + scrollbar 숨김.
const TabsListWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: ${theme.borderRadius.lg};
  padding: 3px;
  gap: 2px;
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export function TabsList({ children }: { children: React.ReactNode }) {
  return <TabsListWrapper>{children}</TabsListWrapper>;
}

// TabsTrigger
const TabsTriggerButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* flex: 1 1 0 + min-width으로 공간 부족 시 마지막 수단으로만 shrink.
     대부분은 본래 크기 유지하고 overflow-x scroll이 커버. */
  flex: 1 1 auto;
  min-width: max-content;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: ${theme.fontWeight.medium};
  border-radius: 7px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
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
