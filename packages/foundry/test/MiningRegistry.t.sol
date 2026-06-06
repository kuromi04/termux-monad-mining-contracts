// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MiningRegistry } from "../contracts/MiningRegistry.sol";

contract MiningRegistryTest is Test {
    MiningRegistry public miningRegistry;

    address private owner = address(0xA11CE);
    address private qp = address(0xB0B);
    address private nonQP = address(0xE0E);

    function setUp() public {
        miningRegistry = new MiningRegistry(owner);
    }

    function test_RegisterByWhitelistedQP_Works() public {
        vm.prank(owner);
        miningRegistry.whitelistQP(qp);

        vm.warp(1_717_171_717);
        vm.prank(qp);
        uint256 tokenId = miningRegistry.registerCertificate(
            "COL-123",
            MiningRegistry.Standard.ECRR_2018,
            MiningRegistry.ResourceCategory.INDICATED,
            50,
            1_250_000,
            "dr5ru6j2"
        );

        MiningRegistry.MiningAssetCertificate memory certificate = miningRegistry.getCertificate(tokenId);

        assertEq(tokenId, 1);
        assertEq(miningRegistry.ownerOf(tokenId), qp);
        assertEq(certificate.titleId, "COL-123");
        assertEq(uint256(certificate.standard), uint256(MiningRegistry.Standard.ECRR_2018));
        assertEq(uint256(certificate.category), uint256(MiningRegistry.ResourceCategory.INDICATED));
        assertEq(certificate.cutOffGradeBps, 50);
        assertEq(certificate.tonnage, 1_250_000);
        assertEq(certificate.polygonGeoHash, "dr5ru6j2");
        assertEq(certificate.qp, qp);
        assertEq(certificate.updatedAt, block.timestamp);
    }

    function test_RegisterByNonQP_Reverts() public {
        vm.expectRevert(MiningRegistry.NotQualifiedPerson.selector);
        vm.prank(nonQP);
        miningRegistry.registerCertificate(
            "CAN-999",
            MiningRegistry.Standard.NI_43_101,
            MiningRegistry.ResourceCategory.INFERRED,
            35,
            500_000,
            "f23nq8p0"
        );
    }

    function test_AdvanceCategory_ForwardOnly() public {
        vm.prank(owner);
        miningRegistry.whitelistQP(qp);

        uint256 tokenId = _registerCertificate("COL-001", MiningRegistry.ResourceCategory.INFERRED);

        vm.prank(qp);
        miningRegistry.advanceCategory(tokenId, MiningRegistry.ResourceCategory.INDICATED);

        MiningRegistry.MiningAssetCertificate memory advancedCertificate = miningRegistry.getCertificate(tokenId);
        assertEq(uint256(advancedCertificate.category), uint256(MiningRegistry.ResourceCategory.INDICATED));

        uint256 jumpTokenId = _registerCertificate("COL-002", MiningRegistry.ResourceCategory.INFERRED);

        vm.expectRevert(MiningRegistry.InvalidCategoryTransition.selector);
        vm.prank(qp);
        miningRegistry.advanceCategory(jumpTokenId, MiningRegistry.ResourceCategory.MEASURED);

        vm.expectRevert(MiningRegistry.InvalidCategoryTransition.selector);
        vm.prank(qp);
        miningRegistry.advanceCategory(tokenId, MiningRegistry.ResourceCategory.INFERRED);
    }

    function _registerCertificate(
        string memory titleId,
        MiningRegistry.ResourceCategory category
    ) private returns (uint256 tokenId) {
        vm.prank(qp);
        tokenId = miningRegistry.registerCertificate(
            titleId,
            MiningRegistry.Standard.ECRR_2018,
            category,
            50,
            1_000_000,
            "dr5ru6j2"
        );
    }
}
