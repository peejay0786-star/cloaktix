// Generates (once) the Preprod dev wallet seed into .secrets/ (chmod 600) and prints ONLY the public address.
import fs from 'node:fs';
import { HDWallet, Roles, createKeystore, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk';
const f = new URL('../.secrets/preprod-wallet.env', import.meta.url).pathname;
if (!fs.existsSync(f)) {
  const seed = Buffer.from(generateRandomSeed()).toString('hex');
  fs.writeFileSync(f, `# CloakTix Preprod dev wallet (tNIGHT only). Never copy it elsewhere.\nMIDNIGHT_PREPROD_ALICE_SEED=${seed}\n`, { mode: 0o600 });
}
const seed = fs.readFileSync(f, 'utf8').match(/SEED=([0-9a-f]+)/)![1];
const hd: any = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
const key = hd.hdWallet.selectAccount(0).selectRole(Roles.NightExternal).deriveKeyAt(0).key;
const ks: any = createKeystore(key, 'preprod' as any);
console.log('adresse publique preprod:', ks.getBech32Address().asString?.() ?? String(ks.getBech32Address()));
