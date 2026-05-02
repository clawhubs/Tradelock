const arbiscanBaseUrl = "https://sepolia.arbiscan.io";
const ipfsGatewayBaseUrl = "https://gateway.pinata.cloud/ipfs";

export function isTransactionHash(value?: string | null) {
  return Boolean(value && /^0x([A-Fa-f0-9]{64})$/.test(value));
}

export function isAddressLike(value?: string | null) {
  return Boolean(value && /^0x([A-Fa-f0-9]{40})$/.test(value));
}

export function getTxExplorerUrl(txHash?: string | null) {
  return isTransactionHash(txHash) ? `${arbiscanBaseUrl}/tx/${txHash}` : undefined;
}

export function getAddressExplorerUrl(address?: string | null) {
  return isAddressLike(address) ? `${arbiscanBaseUrl}/address/${address}` : undefined;
}

export function getIpfsGatewayUrl(hash?: string | null) {
  if (!hash) {
    return undefined;
  }

  if (hash.startsWith("Qm")) {
    return `${ipfsGatewayBaseUrl}/${hash}`;
  }

  return undefined;
}

export function shortenHash(value?: string | null) {
  if (!value || value.length < 12) {
    return value ?? "N/A";
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}
