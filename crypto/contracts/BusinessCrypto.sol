// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract BusinessCrypto is ERC20, Ownable, Pausable {
    uint256 public burnRate;
    uint256 public creatorRate;
    uint256 public constant FEE_DENOMINATOR = 100_000;
    uint256 public constant MAX_RATE = 1_000;         // 1% per category
    uint256 public constant MAX_TOTAL_RATE = 2_000;   // Combined ≤ 2%

    event BurnRateUpdated(uint256 oldRate, uint256 newRate);
    event CreatorRateUpdated(uint256 oldRate, uint256 newRate);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(uint256 initialSupply)
        ERC20("BusinessCrypto Token", "BCT")
    {
        burnRate    = 1;
        creatorRate = 1;
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply);
    }

    function setBurnRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_RATE, "Burn rate too high");
        require(newRate + creatorRate <= MAX_TOTAL_RATE, "Combined fees too high");
        emit BurnRateUpdated(burnRate, newRate);
        burnRate = newRate;
    }

    function setCreatorRate(uint256 newRate) external onlyOwner {
        require(newRate <= MAX_RATE, "Creator rate too high");
        require(burnRate + newRate <= MAX_TOTAL_RATE, "Combined fees too high");
        emit CreatorRateUpdated(creatorRate, newRate);
        creatorRate = newRate;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        _transferWithFees(_msgSender(), to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override whenNotPaused returns (bool) {
        _spendAllowance(from, _msgSender(), amount);
        _transferWithFees(from, to, amount);
        return true;
    }

    function _transferWithFees(
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        // Calculate fees
        uint256 burnAmt    = (amount * burnRate)    / FEE_DENOMINATOR;
        uint256 creatorAmt = (amount * creatorRate) / FEE_DENOMINATOR;
        uint256 sendAmt    = amount - burnAmt - creatorAmt;

        if (burnAmt > 0) {
            _transfer(sender, address(0), burnAmt);
            emit TokensBurned(sender, burnAmt);
        }
        if (creatorAmt > 0) {
            _transfer(sender, owner(), creatorAmt);
        }
        _transfer(sender, recipient, sendAmt);
    }
}
