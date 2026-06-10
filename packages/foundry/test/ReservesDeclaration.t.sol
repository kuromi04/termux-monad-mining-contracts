// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MiningRegistry } from "../contracts/MiningRegistry.sol";

contract ReservesDeclarationTest is Test {
    MiningRegistry public miningRegistry;

    address private owner = address(0xA11CE);
    address private qp = address(0xB0B);
    address private receiver = address(0xDEED);

    function setUp() public {
        miningRegistry = new MiningRegistry(owner);
        vm.prank(owner);
        miningRegistry.whitelistQP(qp);
    }

    function test_DeclareProbableFromIndicated_Works() public {
        uint256 tokenId = _registerCertificate("RES-001", MiningRegistry.ResourceCategory.INDICATED);
        
        vm.prank(qp);
        miningRegistry.declareReserves(tokenId, MiningRegistry.ReserveCategory.PROBABLE);
        
        MiningRegistry.MiningAssetCertificate memory cert = miningRegistry.getCertificate(tokenId);
        assertEq(uint256(cert.reserveCategory), uint256(MiningRegistry.ReserveCategory.PROBABLE));
    }

    function test_DeclareProvedFromMeasured_Works() public {
        uint256 tokenId = _registerCertificate("RES-002", MiningRegistry.ResourceCategory.MEASURED);
        
        vm.prank(qp);
        miningRegistry.declareReserves(tokenId, MiningRegistry.ReserveCategory.PROVED);
        
        MiningRegistry.MiningAssetCertificate memory cert = miningRegistry.getCertificate(tokenId);
        assertEq(uint256(cert.reserveCategory), uint256(MiningRegistry.ReserveCategory.PROVED));
    }

    function test_DeclareProbableFromInferred_Reverts() public {
        uint256 tokenId = _registerCertificate("RES-003", MiningRegistry.ResourceCategory.INFERRED);
        
        vm.expectRevert(MiningRegistry.InvalidCategoryTransition.selector);
        vm.prank(qp);
        miningRegistry.declareReserves(tokenId, MiningRegistry.ReserveCategory.PROBABLE);
    }

    function test_DeclareProvedFromIndicated_Reverts() public {
        uint256 tokenId = _registerCertificate("RES-004", MiningRegistry.ResourceCategory.INDICATED);
        
        vm.expectRevert(MiningRegistry.InvalidCategoryTransition.selector);
        vm.prank(qp);
        miningRegistry.declareReserves(tokenId, MiningRegistry.ReserveCategory.PROVED);
    }

    function test_Soulbound_TransferReverts() public {
        uint256 tokenId = _registerCertificate("RES-005", MiningRegistry.ResourceCategory.INFERRED);
        
        vm.prank(qp);
        vm.expectRevert("Soulbound: Transfer not allowed");
        miningRegistry.transferFrom(qp, receiver, tokenId);
    }

    function _registerCertificate(string memory titleId, MiningRegistry.ResourceCategory category)
        private
        returns (uint256 tokenId)
    {
        vm.prank(qp);
        tokenId = miningRegistry.registerCertificate(
            titleId, MiningRegistry.Standard.NI_43_101, category, 100, 1_000_000, "dr5ru6j2"
        );
    }
}
