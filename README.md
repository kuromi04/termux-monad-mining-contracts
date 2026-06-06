# Monad Mining Registry

> Expediente digital **inmutable** de títulos mineros bajo las normas internacionales **NI 43-101** (Canadá) y **ECRR 2018** (Colombia).
>
> Convertimos meses de *due diligence* minero en segundos de verificación: la certificación técnica de un yacimiento deja de ser un PDF falsificable y pasa a ser una **firma criptográfica inmutable** de un geólogo certificado, validada bajo norma.

---

## 🛑 El problema

La inversión en minería a gran y mediana escala (clave para la transición energética — cobre, litio) se frena por la **opacidad**:

- Verificar si un título minero es legítimo y si los datos de perforación son reales toma **3–6 meses** de auditoría legal y geológica (ej. fondos en la bolsa de Toronto, TSX).
- Las bases de datos estatales están desactualizadas.
- Los reportes técnicos viven en **PDFs fácilmente falsificables**.
- Riesgo de linderos superpuestos con reservas ambientales o títulos preexistentes.

## ✅ La solución

Un registro on-chain donde la **cadena de custodia de la verdad técnica** es verificable por cualquiera, al instante:

1. **Solo una Persona Calificada (QP) certificada** —en lista blanca— puede firmar, con su billetera → **responsabilidad legal inmutable on-chain**.
2. Cada título es un **NFT dinámico** cuya clasificación de recurso (Inferido → Indicado → Medido) **solo puede avanzar si la norma lo permite** (regla codificada en el contrato).
3. El inversor **verifica en segundos**, sin intermediarios.

## 📜 El contrato: `MiningRegistry`

ERC-721 construido sobre OpenZeppelin. Las normas codificadas como reglas on-chain:

| Elemento | Rol |
|---|---|
| `enum Standard { NI_43_101, ECRR_2018 }` | Norma aplicada (Canadá / Colombia) |
| `enum ResourceCategory { INFERRED, INDICATED, MEASURED }` | Escalera de clasificación CRIRSCO (Recurso Inferido/Indicado/Medido) |
| `whitelistedQP` | Solo Personas Calificadas certificadas pueden firmar |

**Funciones:**
- `whitelistQP(address)` — *(owner)* autoriza a una Persona Calificada.
- `registerCertificate(...)` — *(QP)* registra un título y lo mintea como NFT, fijando al firmante (`qp`) como responsable legal.
- `advanceCategory(tokenId, newCategory)` — *(QP)* avanza la clasificación **solo un nivel hacia adelante** (la norma como regla: prohíbe saltar o retroceder).
- `getCertificate(tokenId)` — lectura pública para auditoría.

## 🔗 Desplegado y verificado en Monad Testnet

| | |
|---|---|
| **Contrato** | `0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d` |
| **Red** | Monad Testnet (chainId `10143`) |
| **MonadVision** | https://testnet.monadvision.com/address/0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d |
| **MonadScan** | https://testnet.monadscan.com/address/0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d |
| **Tx de demo (certificado #1)** | `0x5c36987fc7d60c58c1c7e68eebad284f5cb7684212231f9e3b7b8bee4f7ecc0a` |

Código fuente **verificado** en ambos exploradores ✅

## 🧱 Stack

- **Blockchain:** Monad (L1 EVM-compatible, 10k TPS, finalidad ~800ms, gas ~$0.00004/tx)
- **Contratos:** Solidity `^0.8.28` + Foundry + OpenZeppelin
- **Scaffold:** scaffold-eth-2 (Foundry) — página *Debug Contracts* como UI de demo

## 🚀 Cómo correr

```bash
# Contratos (dentro de packages/foundry)
forge build
forge test

# Deploy a Monad testnet
yarn deploy --network monad_testnet --keystore <tu-keystore>

# UI de demo (Debug Contracts)
yarn start   # -> http://localhost:3000
```

## 🗺️ Roadmap

- **Capa de IA (off-chain):** auditor geoespacial (SIG) que cruza shapefiles/GeoJSON contra reservas ambientales; auditor matemático de ensayes que valida estadísticamente la clasificación NI 43-101.
- **Declaración de Reservas** (Probable/Probada) y NFT soulbound.
- **Frontend** dedicado (dashboard QP + herramienta de auditoría para inversores).
- **Indexer** (Envio HyperIndex) para feed histórico de certificaciones.

---

*MVP construido para hackathon. Las normas NI 43-101 (Canadá) y ECRR 2018 (Colombia) son el núcleo: el contrato las hace cumplir automáticamente.*
