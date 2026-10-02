import express from 'express';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { Address, beginCell, toNano } from '@ton/core';

const app = express();
app.use(express.json());

const OPERATOR_MNEMONIC = process.env.OPERATOR_MNEMONIC!.split(' ');
const OPERATOR_CONTRACT = Address.parse(process.env.OPERATOR_CONTRACT!);
const DESTINATION = Address.parse(process.env.DESTINATION!);

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TONCENTER_KEY,
});

async function getOperatorWallet() {
  const key = await mnemonicToPrivateKey(OPERATOR_MNEMONIC);
  const wallet = WalletContractV4.create({
    publicKey: key.publicKey,
    workchain: 0,
  });
  return { wallet, contract: client.open(wallet), key };
}

// op: Collect(nft, to, responseTo) — сгенерирован Tact'ом
// Проверь build/Operator/Operator_Operator.ts для реального op-кода
function buildCollectBody(nft: Address, to: Address, responseTo: Address) {
  return beginCell()
    .storeUint(0x12345678, 32)
    .storeAddress(nft)
    .storeAddress(to)
    .storeAddress(responseTo)
    .endCell();
}

app.post('/withdraw', async (req, res) => {
  const { nfts } = req.body as { nfts: string[] };

  const { contract, key } = await getOperatorWallet();
  const seqno = await contract.getSeqno();

  await contract.sendTransfer({
    secretKey: key.secretKey,
    seqno,
    messages: nfts.map((nft) =>
      internal({
        to: OPERATOR_CONTRACT,
        value: toNano('0.06'),
        body: buildCollectBody(
          Address.parse(nft),
          DESTINATION,
          contract.address
        ),
      })
    ),
  });

  res.json({ ok: true, count: nfts.length });
});

app.listen(3000, () => console.log('collector on :3000'));
