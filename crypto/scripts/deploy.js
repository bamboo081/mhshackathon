// File: crypto/scripts/deploy.js

const { ethers } = require("hardhat");

async function main() {
  // In ethers v6, parseUnits is a top‐level export
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens (18 decimals)

  // Get the contract factory and deploy
  const BusinessCrypto = await ethers.getContractFactory("BusinessCrypto");
  const bc = await BusinessCrypto.deploy(initialSupply);

  // Wait for the deployment to be mined (ethers v6)
  await bc.waitForDeployment();

  console.log("✅ BusinessCrypto deployed to:", bc.target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
