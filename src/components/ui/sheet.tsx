'use client';

import React, { createContext, useContext, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { X } from 'lucide-react';
import { theme } from '@/styles/theme';

interface SheetContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SheetContext = createContext<SheetContextType>({ open: false, setOpen: () => {} });

// Sheet root - managed externally or internally
export function Sheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }
  return <button onClick={() => setOpen(true)}>{children}</button>;
}

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: ${theme.zIndex.modal};
  display: ${({ $open }) => ($open ? 'block' : 'none')};
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
`;

const SheetPanel = styled.div<{ $open: boolean; $side: 'left' | 'right' }>`
  position: fixed;
  top: 0;
  bottom: 0;
  ${({ $side }) => ($side === 'left' ? 'left: 0;' : 'right: 0;')}
  width: 320px;
  max-width: 90vw;
  background: ${theme.colors.white};
  z-index: ${theme.zIndex.modal + 1};
  box-shadow: ${theme.shadows.lg};
  display: flex;
  flex-direction: column;
  padding: 0 20px 24px;
  animation: ${({ $open }) => ($open ? css`${slideIn} 0.25s ease` : 'none')};
  transform: ${({ $open }) => ($open ? 'translateX(0)' : 'translateX(-100%)')};
  transition: transform 0.25s ease;
  overflow-y: auto;
`;

const SheetCloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 20px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${theme.colors.textMuted};
  &:hover { background: ${theme.colors.bgMuted}; }
`;

interface SheetContentProps {
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export function SheetContent({ children, side = 'left' }: SheetContentProps) {
  const { open, setOpen } = useContext(SheetContext);
  return (
    <>
      <Overlay $open={open} onClick={() => setOpen(false)} />
      <SheetPanel $open={open} $side={side}>
        <SheetCloseBtn onClick={() => setOpen(false)}>
          <X size={16} />
        </SheetCloseBtn>
        {children}
      </SheetPanel>
    </>
  );
}

export const SheetHeader = styled.div`
  padding: 20px 0 16px;
`;

export const SheetTitle = styled.h2`
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.text};
`;
