// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { MiningRegistry } from "../contracts/MiningRegistry.sol";

/**
 * @notice Deploy script for MiningRegistry contract
 * @dev Uses the ScaffoldETH deployer runner and whitelists the deployer as a demo QP.
 */
contract DeployMiningRegistry is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        MiningRegistry miningRegistry = new MiningRegistry(deployer);
        miningRegistry.whitelistQP(deployer);
    }
}
