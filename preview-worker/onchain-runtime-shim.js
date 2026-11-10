// Workers build of @midnightntwrk/onchain-runtime-v4 (ledger 9; compact-runtime 0.21.0 imports this scope):
// same wasm-bindgen glue, but the .wasm is imported as a precompiled WebAssembly.Module
// (Workers cannot readFileSync or fetch-instantiate at import).
import wasmModule from './node_modules/@midnightntwrk/onchain-runtime-v4/midnight_onchain_runtime_wasm_bg.wasm';
import * as bg from './node_modules/@midnightntwrk/onchain-runtime-v4/midnight_onchain_runtime_wasm_bg.js';
const instance = new WebAssembly.Instance(wasmModule, { './midnight_onchain_runtime_wasm_bg.js': bg });
bg.__wbg_set_wasm(instance.exports);
instance.exports.__wbindgen_start?.();
export * from './node_modules/@midnightntwrk/onchain-runtime-v4/midnight_onchain_runtime_wasm_bg.js';
