'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/theme';

interface DropdownContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { open, setOpen } = useContext(DropdownContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
      },
    });
  }
  return <button onClick={() => setOpen(!open)}>{children}</button>;
}

const DropdownPanel = styled.div<{ $open: boolean; $align: 'start' | 'end' }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};
  position: absolute;
  top: calc(100% + 4px);
  ${({ $align }) => ($align === 'end' ? 'right: 0;' : 'left: 0;')}
  min-width: 160px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.lg};
  z-index: ${theme.zIndex.dropdown};
  padding: 4px;
`;

export function DropdownMenuContent({
  children,
  align = 'start',
}: {
  children: React.ReactNode;
  align?: 'start' | 'end';
}) {
  const { open } = useContext(DropdownContext);
  return (
    <DropdownPanel $open={open} $align={align}>
      {children}
    </DropdownPanel>
  );
}

const DropdownItemButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 7px 10px;
  font-size: ${theme.fontSize.sm};
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${({ $danger }) => ($danger ? theme.colors.error : theme.colors.text)};
  cursor: pointer;
  text-align: left;
  transition: background 0.1s ease;

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  danger?: boolean;
}

export function DropdownMenuItem({ children, asChild, danger, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useContext(DropdownContext);

  if (asChild && React.isValidElement(children)) {
    return (
      <div onClick={() => setOpen(false)} style={{ borderRadius: 6, overflow: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <DropdownItemButton
      $danger={danger}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </DropdownItemButton>
  );
}

export const DropdownMenuSeparator = styled.div`
  height: 1px;
  background: ${theme.colors.border};
  margin: 4px 0;
`;
