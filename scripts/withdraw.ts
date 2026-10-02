import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { Operator } from '../build/Operator/Operator_Operator';

export async function run(provider: NetworkProvider) {
  const contractAddress = Address.parse(process.env.OPERATOR_CONTRACT!);
  const destination = Address.parse(process.env.DESTINATION!);

  const nfts = (process.env.NFTS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Address.parse);

  if (nfts.length === 0) {
    console.log('No NFT addresses provided in NFTS env');
    return;
  }

  const contract = provider.open(Operator.fromAddress(contractAddress));

  for (const nft of nfts) {
    await contract.send(
      provider.sender(),
      { value: toNano('0.1') },
      {
        $$type: 'Collect',
        nft,
        to: destination,
        responseTo: provider.sender().address!,
      }
    );
    console.log('Collect sent for', nft.toString());
  }
}
