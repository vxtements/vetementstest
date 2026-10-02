import { toNano, Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { Operator } from '../build/Operator/Operator_Operator';

export async function run(provider: NetworkProvider) {
  const owner = provider.sender().address!;
  const operator = Address.parse(process.env.OPERATOR_WALLET!);

  const contract = provider.open(await Operator.fromInit(owner, operator));

  await contract.send(
    provider.sender(),
    { value: toNano('0.1') },
    { $$type: 'Deploy', queryId: 0n }
  );

  await provider.waitForDeploy(contract.address);
  console.log('Operator deployed at:', contract.address.toString());
}
