'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { X } from 'lucide-react';
import { theme } from '@/styles/theme';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${theme.zIndex.modal};
  background: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.15s ease;
`;

const ContentBox = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: ${theme.zIndex.modal + 1};
  width: calc(100% - 2rem);
  max-width: 512px;
  /* 모바일 키보드 올라왔을 때 버튼이 잘리지 않도록 스크롤 처리 */
  max-height: 90vh;
  overflow-y: auto;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.bgCard};
  padding: 24px;
  box-shadow: ${theme.shadows.lg};
  animation: ${slideIn} 0.15s ease;
  /* iOS momentum scroll */
  -webkit-overflow-scrolling: touch;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: ${theme.colors.textMuted};
  display: flex;
  align-items: center;
  border-radius: ${theme.borderRadius.sm};
  transition: all 0.15s ease;

  &:hover {
    color: ${theme.colors.text};
    background: ${theme.colors.bgMuted};
  }
`;

const HeaderBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const TitleText = styled.h2`
  margin: 0;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.text};
`;

const DescText = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

const FooterBox = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

// ─── Context ─────────────────────────────────────────────

interface DialogCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogCtx>({ open: false, setOpen: () => {} });

// ─── Components ──────────────────────────────────────────

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open: externalOpen, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = useState(false);
  const controlled = externalOpen !== undefined;
  const open = controlled ? externalOpen : internal;

  function setOpen(v: boolean) {
    if (!controlled) setInternal(v);
    onOpenChange?.(v);
  }

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: () => setOpen(true),
    });
  }
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

export function DialogContent({
  children,
  showCloseButton = true,
}: {
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  const { open, setOpen } = useContext(DialogContext);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <Overlay onClick={() => setOpen(false)} />
      <ContentBox>
        {showCloseButton && (
          <CloseBtn onClick={() => setOpen(false)} aria-label="닫기">
            <X size={16} />
          </CloseBtn>
        )}
        {children}
      </ContentBox>
    </>,
    document.body
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <HeaderBox>{children}</HeaderBox>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <TitleText>{children}</TitleText>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <DescText>{children}</DescText>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <FooterBox>{children}</FooterBox>;
}

export function DialogClose({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onClick: () => setOpen(false),
    });
  }
  return <span onClick={() => setOpen(false)}>{children}</span>;
}

export { DialogContext };
