// Client-side crypto address format validation.
// This checks that a destination address is well-formed for the selected network
// (correct prefix, length, and character set). It catches typos and wrong-network
// pastes — the most common cause of lost funds. It is NOT full checksum/ownership
// verification (that needs a chain node or an analytics API).

// Map a currency's xml code / symbol to a network family.
// Returns null for fiat / bank payouts (no crypto validation applies).
export function networkOf(xml = '', symbol = '') {
  const x = String(xml).toUpperCase();
  const s = String(symbol).toUpperCase();

  if (x.includes('TRC20') || x === 'TRX' || s === 'TRX') return 'tron';
  if (x.includes('ERC20') || x.includes('BEP') || x === 'ETH' || x === 'BNB' || s === 'ETH' || s === 'BNB') return 'evm';
  if (x === 'BTC' || s === 'BTC') return 'btc';
  if (x === 'SOL' || s === 'SOL') return 'sol';
  if (x === 'XRP' || s === 'XRP') return 'xrp';
  if (x === 'LTC' || s === 'LTC') return 'ltc';
  if (x === 'DOGE' || s === 'DOGE') return 'doge';

  // Anything else (UAH, USD, CARDUAH, WISEUSD, bank/card names, etc.) is fiat.
  return null;
}

const PATTERNS = {
  // Tron: base58, starts with T, 34 chars total
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  // EVM (ETH / ERC20 / BSC / BEP20 / BNB): 0x + 40 hex
  evm: /^0x[a-fA-F0-9]{40}$/,
  // Bitcoin: legacy (1/3...) or bech32 (bc1...)
  btc: /^(bc1[ac-hj-np-z02-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  // Solana: base58, 32-44 chars
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  // XRP: starts with r, base58, 25-35 chars
  xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/,
  // Litecoin: L/M/3 legacy or ltc1 bech32
  ltc: /^(ltc1[ac-hj-np-z02-9]{11,87}|[LM3][a-km-zA-HJ-NP-Z1-9]{26,33})$/,
  // Dogecoin: starts with D
  doge: /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/,
};

const LABELS = {
  tron: 'a TRON (TRC-20) address — it should start with "T"',
  evm: 'an Ethereum/BSC address — it should start with "0x" and be 42 characters',
  btc: 'a Bitcoin address — starting with "1", "3", or "bc1"',
  sol: 'a Solana address',
  xrp: 'an XRP address — starting with "r"',
  ltc: 'a Litecoin address',
  doge: 'a Dogecoin address — starting with "D"',
};

// Returns { ok: true } | { ok: false, message } | { ok: true, skipped: true } for fiat.
export function validateAddress(address, xml, symbol) {
  const net = networkOf(xml, symbol);
  if (!net) return { ok: true, skipped: true };           // fiat / bank — not our job here
  const addr = String(address || '').trim();
  if (!addr) return { ok: false, message: 'Please enter your receiving wallet address' };
  const re = PATTERNS[net];
  if (re && re.test(addr)) return { ok: true };
  return { ok: false, message: `That doesn't look like ${LABELS[net] || 'a valid address'}. Please double-check it.` };
}