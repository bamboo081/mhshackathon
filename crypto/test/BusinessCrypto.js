const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployFixture() {
  const [owner, addr1, addr2] = await ethers.getSigners();
  const initialSupply = ethers.parseUnits("10000", 18);
  const BusinessCrypto = await ethers.getContractFactory("BusinessCrypto");
  const token = await BusinessCrypto.deploy(initialSupply);
  return { token, owner, addr1, addr2, initialSupply };
}

describe("BusinessCrypto", function () {
  describe("Minting", function () {
    it("owner can mint tokens", async function () {
      const { token, addr1 } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("100", 18);
      await expect(token.mint(addr1.address, amount))
        .to.emit(token, "TokensMinted")
        .withArgs(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("non-owner cannot mint", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits("50", 18);
      await expect(
        token.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Updating rates", function () {
    it("owner can update burn and creator rates", async function () {
      const { token } = await loadFixture(deployFixture);
      await expect(token.setBurnRate(500))
        .to.emit(token, "BurnRateUpdated")
        .withArgs(1, 500);
      await expect(token.setCreatorRate(1000))
        .to.emit(token, "CreatorRateUpdated")
        .withArgs(1, 1000);
    });

    it("cannot exceed max total rate", async function () {
      const { token } = await loadFixture(deployFixture);
      await token.setBurnRate(1000);
      await expect(token.setCreatorRate(1500)).to.be.revertedWith(
        "Combined fees too high"
      );
    });
  });

  describe("Transfers with fees", function () {
    it("applies burn and creator fees", async function () {
      const { token, owner, addr1, initialSupply } = await loadFixture(deployFixture);
      await token.setBurnRate(1000); // 1%
      await token.setCreatorRate(1000); // 1%
      const amount = ethers.parseUnits("1000", 18);
      const burnAmt = (amount * 1000n) / 100000n;
      const creatorAmt = burnAmt;
      const sendAmt = amount - burnAmt - creatorAmt;

      await expect(token.transfer(addr1.address, amount))
        .to.emit(token, "TokensBurned")
        .withArgs(owner.address, burnAmt);

      expect(await token.balanceOf(addr1.address)).to.equal(sendAmt);
      const expectedOwnerBal = initialSupply - amount + creatorAmt;
      expect(await token.balanceOf(owner.address)).to.equal(expectedOwnerBal);
    });
  });
});
