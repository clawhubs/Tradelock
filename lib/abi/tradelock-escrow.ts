import { parseAbi } from "viem";

export const tradeLockEscrowAbi = parseAbi([
  "event DealCreated(string indexed dealId, address indexed buyer, address indexed seller, address settlementToken, uint256 amount, string metadataURI)",
  "event EscrowFunded(string indexed dealId, address indexed buyer, uint256 amount)",
  "event ProofSubmitted(string indexed dealId, address indexed actor, string proofHash)",
  "event FundsReleased(string indexed dealId, address indexed seller, uint256 amount)",
  "event DisputeOpened(string indexed dealId, address indexed actor, string reason)",
  "event DealFrozen(string indexed dealId)",
  "event DealCancelled(string indexed dealId)",
  "function createDeal(string dealId, address seller, address settlementToken, uint256 amount, string metadataURI)",
  "function fundDeal(string dealId)",
  "function submitProofHash(string dealId, string proofHash)",
  "function releaseFunds(string dealId)",
  "function openDispute(string dealId, string reason)",
  "function freezeDeal(string dealId)",
  "function cancelDeal(string dealId)",
  "function getDeal(string dealId) view returns (string, address, address, address, uint256, string, string, uint8)",
]);
