import { MiningRegistry } from "generated";

MiningRegistry.QPWhitelisted.handler(async ({ event, context }) => {
  context.QualifiedPerson.set({
    id: event.params.qp,
    address: event.params.qp,
    isWhitelisted: true,
  });
});

MiningRegistry.CertificateRegistered.handler(async ({ event, context }) => {
  // Use Envio's internal contract call to fetch full certificate data
  // Note: getCertificate returns MiningAssetCertificate struct
  const cert = await MiningRegistry.getCertificate(event.params.tokenId);

  context.Certificate.set({
    id: event.params.tokenId.toString(),
    tokenId: event.params.tokenId,
    titleId: event.params.titleId,
    qp: event.params.qp,
    currentCategory: Number(cert.category),
    reserveCategory: Number(cert.reserveCategory),
    updatedAt: BigInt(event.block.timestamp),
  });
});

MiningRegistry.CategoryAdvanced.handler(async ({ event, context }) => {
  const certificateId = event.params.tokenId.toString();
  const certificate = await context.Certificate.get(certificateId);

  if (certificate) {
    context.Certificate.set({
      ...certificate,
      currentCategory: Number(event.params.to),
      updatedAt: BigInt(event.block.timestamp),
    });
  }

  context.CategoryChange.set({
    id: `${event.transaction.hash}-${event.logIndex}`,
    tokenId: event.params.tokenId,
    from: Number(event.params.from),
    to: Number(event.params.to),
    timestamp: BigInt(event.block.timestamp),
  });
});

MiningRegistry.ReservesDeclared.handler(async ({ event, context }) => {
  const certificateId = event.params.tokenId.toString();
  const certificate = await context.Certificate.get(certificateId);

  if (certificate) {
    context.Certificate.set({
      ...certificate,
      reserveCategory: Number(event.params.reserveCategory),
      updatedAt: BigInt(event.block.timestamp),
    });
  }

  context.ReserveDeclaration.set({
    id: `${event.transaction.hash}-${event.logIndex}`,
    tokenId: event.params.tokenId,
    reserveCategory: Number(event.params.reserveCategory),
    timestamp: BigInt(event.block.timestamp),
  });
});
