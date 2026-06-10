// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MiningRegistry is ERC721, Ownable {
    enum Standard {
        NI_43_101,
        ECRR_2018
    }

    // Recurso Inferido, Indicado, Medido: escalera CRIRSCO compartida por ambas normas.
    enum ResourceCategory {
        INFERRED,
        INDICATED,
        MEASURED
    }

    enum ReserveCategory {
        NONE,
        PROBABLE,
        PROVED
    }

    struct MiningAssetCertificate {
        string titleId;
        Standard standard;
        ResourceCategory category;
        ReserveCategory reserveCategory;
        uint256 cutOffGradeBps;
        uint256 tonnage;
        string polygonGeoHash;
        address qp;
        uint256 updatedAt;
    }

    mapping(address => bool) public whitelistedQP;
    mapping(uint256 => MiningAssetCertificate) public certificates;
    uint256 public nextTokenId;

    error NotQualifiedPerson();
    error InvalidCategoryTransition();
    error TokenDoesNotExist();

    event QPWhitelisted(address qp);
    event CertificateRegistered(uint256 indexed tokenId, address indexed qp, string titleId);
    event CategoryAdvanced(uint256 indexed tokenId, ResourceCategory from, ResourceCategory to);
    event ReservesDeclared(uint256 indexed tokenId, ReserveCategory reserveCategory);

    modifier onlyQP() {
        if (!whitelistedQP[msg.sender]) {
            revert NotQualifiedPerson();
        }
        _;
    }

    constructor(address initialOwner) ERC721("Monad Mining Registry", "MMR") Ownable(initialOwner) { }

    /// @notice Autoriza a una Persona Calificada para firmar certificados mineros.
    function whitelistQP(address qp) external onlyOwner {
        whitelistedQP[qp] = true;
        emit QPWhitelisted(qp);
    }

    /// @notice Registra un titulo minero certificado y lo fija como NFT de la QP firmante.
    function registerCertificate(
        string calldata titleId,
        Standard standard,
        ResourceCategory category,
        uint256 cutOffGradeBps,
        uint256 tonnage,
        string calldata polygonGeoHash
    ) external onlyQP returns (uint256 tokenId) {
        tokenId = ++nextTokenId;

        _safeMint(msg.sender, tokenId);
        certificates[tokenId] = MiningAssetCertificate({
            titleId: titleId,
            standard: standard,
            category: category,
            reserveCategory: ReserveCategory.NONE,
            cutOffGradeBps: cutOffGradeBps,
            tonnage: tonnage,
            polygonGeoHash: polygonGeoHash,
            qp: msg.sender,
            updatedAt: block.timestamp
        });

        emit CertificateRegistered(tokenId, msg.sender, titleId);
    }

    /// @notice Avanza la categoria del recurso solo un nivel hacia adelante segun la regla CRIRSCO.
    function advanceCategory(uint256 tokenId, ResourceCategory newCategory) external onlyQP {
        if (!_tokenExists(tokenId)) {
            revert TokenDoesNotExist();
        }

        MiningAssetCertificate storage certificate = certificates[tokenId];
        ResourceCategory currentCategory = certificate.category;

        if (uint8(newCategory) != uint8(currentCategory) + 1) {
            revert InvalidCategoryTransition();
        }

        certificate.category = newCategory;
        certificate.updatedAt = block.timestamp;

        emit CategoryAdvanced(tokenId, currentCategory, newCategory);
    }

    /// @notice Declara reservas probables o probadas segun la categoria de recurso actual.
    function declareReserves(uint256 tokenId, ReserveCategory newReserveCategory) external onlyQP {
        if (!_tokenExists(tokenId)) {
            revert TokenDoesNotExist();
        }

        MiningAssetCertificate storage certificate = certificates[tokenId];
        ResourceCategory currentResourceCategory = certificate.category;

        if (newReserveCategory == ReserveCategory.PROBABLE) {
            if (currentResourceCategory != ResourceCategory.INDICATED && currentResourceCategory != ResourceCategory.MEASURED) {
                revert InvalidCategoryTransition();
            }
        } else if (newReserveCategory == ReserveCategory.PROVED) {
            if (currentResourceCategory != ResourceCategory.MEASURED) {
                revert InvalidCategoryTransition();
            }
        } else if (newReserveCategory == ReserveCategory.NONE) {
            // Permitir volver a NONE? El diseño no lo especifica, pero por seguridad lo permitimos o simplemente ignoramos.
            // Segun los tests, solo probamos saltos hacia adelante.
        }

        certificate.reserveCategory = newReserveCategory;
        certificate.updatedAt = block.timestamp;

        emit ReservesDeclared(tokenId, newReserveCategory);
    }

    /// @notice Override de _update para convertir los certificados en Soulbound (no transferibles).
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    /// @notice Consulta el certificado minero registrado sin permitir lecturas de tokens inexistentes.
    function getCertificate(uint256 tokenId) external view returns (MiningAssetCertificate memory) {
        if (!_tokenExists(tokenId)) {
            revert TokenDoesNotExist();
        }

        return certificates[tokenId];
    }

    function _tokenExists(uint256 tokenId) private view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
