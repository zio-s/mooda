import styled from 'styled-components';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.sticky};
  width: 100%;
  border-bottom: 1px solid ${theme.colors.border};
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
`;

export const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  height: 56px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
`;

export const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.primaryText};
  text-decoration: none;
  letter-spacing: -0.02em;

  svg { color: ${theme.colors.primary}; }

  &:hover { opacity: 0.85; }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  margin-left: 24px;
  gap: 4px;
`;

export const NavLink = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: ${theme.fontSize.sm};
  font-weight: ${({ $active }) => ($active ? theme.fontWeight.semibold : theme.fontWeight.medium)};
  color: ${({ $active }) => ($active ? theme.colors.primaryText : theme.colors.text)};
  border-radius: ${theme.borderRadius.md};
  text-decoration: none;
  transition: all 0.15s ease;
  background: ${({ $active }) => ($active ? theme.colors.primaryLight : 'transparent')};

  svg {
    color: ${({ $active }) => ($active ? theme.colors.primary : 'currentColor')};
  }

  /* 모바일: 아이콘만 표시 */
  span {
    display: none;
    @media (min-width: ${theme.breakpoints.sm}) {
      display: inline;
    }
  }

  &:hover {
    background: ${({ $active }) => ($active ? theme.colors.primaryMid : theme.colors.bgMuted)};
  }
`;

/* 모바일에서 회원가입 버튼 숨김 — 로그인 페이지에서 접근 가능 */
export const SignupWrapper = styled.div`
  display: none;
  @media (min-width: ${theme.breakpoints.sm}) {
    display: block;
  }
`;

export const HeaderRight = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AvatarButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  padding: 0;
  cursor: pointer;
  background: none;
`;

export const MenuLink = styled(Link)`
  display: block;
  padding: 7px 10px;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.text};
  border-radius: 6px;
  text-decoration: none;
  width: 100%;

  &:hover { background: ${theme.colors.bgMuted}; }
`;

export const AuthLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;
