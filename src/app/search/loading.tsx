'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';
import { Skeleton } from '@/components/ui/skeleton';

const Wrapper = styled.div`
  min-height: 100dvh;
  background: ${theme.colors.white};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;
  border-bottom: 1px solid ${theme.colors.ink100};
`;

const Back = styled(Skeleton)`
  width: 40px;
  height: 40px;
  border-radius: 12px;
`;

const Field = styled(Skeleton)`
  flex: 1;
  height: 40px;
  border-radius: 20px;
`;

const Section = styled.div`
  padding: 16px 20px 8px;
`;

const SectionTitle = styled(Skeleton)`
  width: 32%;
  height: 12px;
  border-radius: 6px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
`;

const Icon = styled(Skeleton)`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
`;

const RowBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RowTitle = styled(Skeleton)`
  width: 55%;
  height: 14px;
  border-radius: 6px;
`;

const RowMeta = styled(Skeleton)`
  width: 70%;
  height: 12px;
  border-radius: 6px;
`;

export default function SearchLoading() {
  return (
    <Wrapper aria-busy>
      <Header>
        <Back />
        <Field />
      </Header>
      <Section>
        <SectionTitle />
      </Section>
      {Array.from({ length: 6 }).map((_, i) => (
        <Row key={i}>
          <Icon />
          <RowBody>
            <RowTitle style={{ width: `${50 + ((i * 7) % 30)}%` }} />
            <RowMeta style={{ width: `${60 + ((i * 5) % 25)}%` }} />
          </RowBody>
        </Row>
      ))}
    </Wrapper>
  );
}
