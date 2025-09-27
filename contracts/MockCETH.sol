// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockCETH is ERC20, Ownable {
    constructor() ERC20("Collateral ETH", "cETH") {
        address deployer = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        _mint(deployer, 10000000 * 10**18); // Mint 10M cETH for testing
        _transferOwnership(deployer);
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 18; // Standard ETH decimals
    }
    
    // ============= FAUCET FOR TESTERS ONLY =============
    // Public faucet for getting collateral cETH for testing borrowing
    // NOTE: This is only for testing purposes on testnet
    mapping(address => uint256) public lastFaucetTime;
    
    function faucet() external {
        require(block.timestamp >= lastFaucetTime[msg.sender] + 1 days, "Faucet: wait 24 hours between claims");
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, 1000 * 10**18); // Mint 1000 cETH for collateral testing
    }
    
    // Owner can mint any amount for advanced testing
    function faucetAmount(address to, uint256 amount) external onlyOwner {
        require(amount <= 10000 * 10**18, "Cannot mint more than 10,000 cETH at once");
        _mint(to, amount);
    }
}