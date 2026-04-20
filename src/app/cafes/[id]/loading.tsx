'use client';

import styled from 'styled-components';
import { theme } from '@/styles/theme';
import { Skeleton } from '@/components/ui/skeleton';

const Wrapper = styled.div`
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
  background: ${theme.colors.bg};
  min-height: 100dvh;
`;

const Hero = styled(Skeleton)`
  width: 100%;
  height: 320px;
  border-radius: 0;
`;

const Meta = styled.div`
  padding: 20px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Badges = styled.div`
  display: flex;
  gap: 8px;
`;

const BadgePill = styled(Skeleton)`
  width: 72px;
  height: 22px;
  border-radius: 6px;
`;

const Title = styled(Skeleton)`
  width: 60%;
  height: 28px;
  border-radius: 8px;
`;

const Sub = styled(Skeleton)`
  width: 40%;
  height: 14px;
  border-radius: 6px;
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 20px;
`;

const ActionCell = styled(Skeleton)`
  height: 64px;
  border-radius: 12px;
`;

const VoteCard = styled.div`
  margin: 0 20px;
  padding: 20px;
  border: 1px solid ${theme.colors.ink200};
  border-radius: 16px;
  background: ${theme.colors.ink50};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VoteTitle = styled(Skeleton)`
  width: 45%;
  height: 18px;
`;

const VotePills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const VotePill = styled(Skeleton)`
  height: 26px;
  border-radius: 999px;
`;

export default function CafeDetailLoading() {
  const pillWidths = [78, 96, 72, 112, 68];
  return (
    <Wrapper aria-busy>
      <Hero />
      <Meta>
        <Badges>
          <BadgePill />
          <BadgePill style={{ width: 96 }} />
        </Badges>
        <Title />
        <Sub />
      </Meta>
      <Actions>
        {Array.from({ length: 4 }).map((_, i) => (
          <ActionCell key={i} />
        ))}
      </Actions>
      <VoteCard>
        <VoteTitle />
        <VotePills>
          {pillWidths.map((w, i) => (
            <VotePill key={i} style={{ width: w }} />
          ))}
        </VotePills>
      </VoteCard>
    </Wrapper>
  );
}
