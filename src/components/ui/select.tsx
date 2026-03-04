'use client';

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import styled from 'styled-components';
import { Check, ChevronDown } from 'lucide-react';
import { theme } from '@/styles/theme';

// ─── Styled ──────────────────────────────────────────────

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Trigger = styled.button<{ $size?: 'sm' | 'default' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: ${theme.borderRadius.md};
  border: 1.5px solid ${theme.colors.border};
  background: transparent;
  font-size: ${theme.fontSize.sm};
  font-family: inherit;
  color: ${theme.colors.text};
  cursor: pointer;
  outline: none;
  white-space: nowrap;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  height: ${({ $size }) => ($size === 'sm' ? '32px' : '36px')};
  padding: 0 12px;

  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ContentBox = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  z-index: ${theme.zIndex.dropdown};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  box-shadow: ${theme.shadows.md};
  padding: 4px;
  max-height: 300px;
  overflow-y: auto;
`;

const Item = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? theme.colors.bgMuted : 'transparent')};

  &:hover {
    background: ${theme.colors.bgMuted};
  }
`;

const LabelBox = styled.div`
  padding: 4px 8px;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textMuted};
`;

const SepLine = styled.hr`
  margin: 4px -4px;
  border: none;
  border-top: 1px solid ${theme.colors.border};
`;

const Placeholder = styled.span`
  color: ${theme.colors.textLight};
`;

// ─── Context ─────────────────────────────────────────────

interface SelectCtx {
  value?: string;
  onValueChange?: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SelectContext = createContext<SelectCtx>({ open: false, setOpen: () => {} });

// ─── Components ──────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value: externalValue, defaultValue, onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const [open, setOpen] = useState(false);
  const controlled = externalValue !== undefined;
  const value = controlled ? externalValue : internalValue;

  function handleValueChange(v: string) {
    if (!controlled) setInternalValue(v);
    onValueChange?.(v);
    setOpen(false);
  }

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectContext);
  if (!value) return <Placeholder>{placeholder ?? '선택'}</Placeholder>;
  return <span>{value}</span>;
}

export function SelectTrigger({
  children,
  size = 'default',
  disabled,
}: {
  children: React.ReactNode;
  size?: 'sm' | 'default';
  disabled?: boolean;
}) {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <Wrapper>
      <Trigger
        ref={ref}
        $size={size}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {children}
        <ChevronDown size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
      </Trigger>
      {open && <SelectContentInner />}
    </Wrapper>
  );
}

function SelectContentInner() {
  const { setOpen } = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setOpen]);

  return <ContentBox ref={ref} />;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) {
  const { value: selected, onValueChange } = useContext(SelectContext);
  return (
    <Item $selected={selected === value} onClick={() => onValueChange?.(value)}>
      {children}
      {selected === value && <Check size={14} />}
    </Item>
  );
}

export function SelectLabel({ children }: { children: React.ReactNode }) {
  return <LabelBox>{children}</LabelBox>;
}

export function SelectSeparator() {
  return <SepLine />;
}

export function SelectScrollUpButton() {
  return null;
}

export function SelectScrollDownButton() {
  return null;
}
