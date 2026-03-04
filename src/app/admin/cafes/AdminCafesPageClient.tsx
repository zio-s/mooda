'use client';

import {
  PageContainer,
  PageTitle,
  TableWrapper,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  VerifiedBadge,
} from './page.styles';

interface CafeRow {
  id: string;
  name: string;
  neighborhood: string | null;
  district: string | null;
  avgRating: number;
  isVerified: boolean;
  _count: { reviews: number };
}

interface Props {
  cafes: CafeRow[];
}

export function AdminCafesPageClient({ cafes }: Props) {
  return (
    <PageContainer>
      <PageTitle>카페 관리</PageTitle>

      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              <Th>카페명</Th>
              <Th>주소</Th>
              <Th $align="center">평점</Th>
              <Th $align="center">리뷰</Th>
              <Th $align="center">상태</Th>
            </tr>
          </Thead>
          <Tbody>
            {cafes.map((cafe) => (
              <Tr key={cafe.id}>
                <Td $bold>{cafe.name}</Td>
                <Td $muted>{cafe.neighborhood ?? cafe.district ?? '-'}</Td>
                <Td $align="center">{cafe.avgRating.toFixed(1)}</Td>
                <Td $align="center">{cafe._count.reviews}</Td>
                <Td $align="center">
                  <VerifiedBadge $verified={cafe.isVerified}>
                    {cafe.isVerified ? '검증됨' : '대기'}
                  </VerifiedBadge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableWrapper>
    </PageContainer>
  );
}
