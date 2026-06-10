import { useQuery } from "urql";
import { gql } from "graphql-tag";

const CertificateHistoryQuery = gql`
  query GetCertificateHistory($tokenId: BigInt!) {
    Certificate_by_pk(id: $tokenId) {
      id
      titleId
      qp
      currentCategory
      reserveCategory
      updatedAt
    }
    CategoryChange(where: { tokenId: { _eq: $tokenId } }, order_by: { timestamp: desc }) {
      id
      from
      to
      timestamp
    }
    ReserveDeclaration(where: { tokenId: { _eq: $tokenId } }, order_by: { timestamp: desc }) {
      id
      reserveCategory
      timestamp
    }
  }
`;

export const useCertificateHistory = (tokenId: string | undefined) => {
  const [result] = useQuery({
    query: CertificateHistoryQuery,
    variables: { tokenId: tokenId || "" },
    pause: !tokenId,
  });

  return result;
};
