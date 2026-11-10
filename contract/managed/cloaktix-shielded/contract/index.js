import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_3 = __compactRuntime.CompactTypeBoolean;

class _QualifiedShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment())));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_1.fromValue(value_0),
      color: _descriptor_1.fromValue(value_0),
      value: _descriptor_0.fromValue(value_0),
      mt_index: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.nonce).concat(_descriptor_1.toValue(value_0.color).concat(_descriptor_0.toValue(value_0.value).concat(_descriptor_2.toValue(value_0.mt_index))));
  }
}

const _descriptor_4 = new _QualifiedShieldedCoinInfo_0();

class _Listing_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment())));
  }
  fromValue(value_0) {
    return {
      seller: _descriptor_1.fromValue(value_0),
      typeId: _descriptor_0.fromValue(value_0),
      price: _descriptor_2.fromValue(value_0),
      fee: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.seller).concat(_descriptor_0.toValue(value_0.typeId).concat(_descriptor_2.toValue(value_0.price).concat(_descriptor_2.toValue(value_0.fee))));
  }
}

const _descriptor_5 = new _Listing_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_6 = new _ContractAddress_0();

class _TicketType_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment())))));
  }
  fromValue(value_0) {
    return {
      eventId: _descriptor_2.fromValue(value_0),
      price: _descriptor_2.fromValue(value_0),
      fee: _descriptor_2.fromValue(value_0),
      supply: _descriptor_2.fromValue(value_0),
      sold: _descriptor_2.fromValue(value_0),
      maxResale: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.eventId).concat(_descriptor_2.toValue(value_0.price).concat(_descriptor_2.toValue(value_0.fee).concat(_descriptor_2.toValue(value_0.supply).concat(_descriptor_2.toValue(value_0.sold).concat(_descriptor_2.toValue(value_0.maxResale))))));
  }
}

const _descriptor_7 = new _TicketType_0();

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

class _ShieldedCoinInfo_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return {
      nonce: _descriptor_1.fromValue(value_0),
      color: _descriptor_1.fromValue(value_0),
      value: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.nonce).concat(_descriptor_1.toValue(value_0.color).concat(_descriptor_0.toValue(value_0.value)));
  }
}

const _descriptor_9 = new _ShieldedCoinInfo_0();

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_10 = new _ZswapCoinPublicKey_0();

class _Either_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_10.alignment().concat(_descriptor_6.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_10.fromValue(value_0),
      right: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_10.toValue(value_0.left).concat(_descriptor_6.toValue(value_0.right)));
  }
}

const _descriptor_11 = new _Either_0();

class _EventInfo_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_10.alignment().concat(_descriptor_3.alignment()));
  }
  fromValue(value_0) {
    return {
      organizer: _descriptor_1.fromValue(value_0),
      payout: _descriptor_10.fromValue(value_0),
      open: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.organizer).concat(_descriptor_10.toValue(value_0.payout).concat(_descriptor_3.toValue(value_0.open)));
  }
}

const _descriptor_12 = new _EventInfo_0();

class _UserAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_13 = new _UserAddress_0();

class _Either_1 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_6.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_6.toValue(value_0.right)));
  }
}

const _descriptor_14 = new _Either_1();

const _descriptor_15 = __compactRuntime.CompactTypeOpaqueString;

const _descriptor_16 = __compactRuntime.CompactTypeField;

const _descriptor_17 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

const _descriptor_18 = new __compactRuntime.CompactTypeBytes(21);

class _CoinPreimage_0 {
  alignment() {
    return _descriptor_18.alignment().concat(_descriptor_9.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment())));
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_18.fromValue(value_0),
      info: _descriptor_9.fromValue(value_0),
      dataType: _descriptor_3.fromValue(value_0),
      data: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_18.toValue(value_0.domain_sep).concat(_descriptor_9.toValue(value_0.info).concat(_descriptor_3.toValue(value_0.dataType).concat(_descriptor_1.toValue(value_0.data))));
  }
}

const _descriptor_19 = new _CoinPreimage_0();

const _descriptor_20 = new __compactRuntime.CompactTypeVector(1, _descriptor_1);

class _Either_2 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_21 = new _Either_2();

const _descriptor_22 = new __compactRuntime.CompactTypeVector(2, _descriptor_16);

class _Either_3 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_6.alignment().concat(_descriptor_13.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_3.fromValue(value_0),
      left: _descriptor_6.fromValue(value_0),
      right: _descriptor_13.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_left).concat(_descriptor_6.toValue(value_0.left).concat(_descriptor_13.toValue(value_0.right)));
  }
}

const _descriptor_23 = new _Either_3();

class _Maybe_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_9.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_3.fromValue(value_0),
      value: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.is_some).concat(_descriptor_9.toValue(value_0.value));
  }
}

const _descriptor_24 = new _Maybe_0();

class _ShieldedSendResult_0 {
  alignment() {
    return _descriptor_24.alignment().concat(_descriptor_9.alignment());
  }
  fromValue(value_0) {
    return {
      change: _descriptor_24.fromValue(value_0),
      sent: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_24.toValue(value_0.change).concat(_descriptor_9.toValue(value_0.sent));
  }
}

const _descriptor_25 = new _ShieldedSendResult_0();

const _descriptor_26 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.wit_CloakSK) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_CloakSK');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      wrap: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`wrap: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const amount_0 = args_1[1];
        const nonce_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('wrap',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 67 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('wrap',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 67 char 1',
                                     'Uint<0..18446744073709551616>',
                                     amount_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('wrap',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 67 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(amount_0).concat(_descriptor_1.toValue(nonce_0)),
            alignment: _descriptor_2.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._wrap_0(context,
                                      partialProofData,
                                      amount_0,
                                      nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      unwrap: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`unwrap: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const coin_0 = args_1[1];
        const to_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('unwrap',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 76 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(coin_0) === 'object' && coin_0.nonce.buffer instanceof ArrayBuffer && coin_0.nonce.BYTES_PER_ELEMENT === 1 && coin_0.nonce.length === 32 && coin_0.color.buffer instanceof ArrayBuffer && coin_0.color.BYTES_PER_ELEMENT === 1 && coin_0.color.length === 32 && typeof(coin_0.value) === 'bigint' && coin_0.value >= 0n && coin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('unwrap',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 76 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     coin_0)
        }
        if (!(typeof(to_0) === 'object' && to_0.bytes.buffer instanceof ArrayBuffer && to_0.bytes.BYTES_PER_ELEMENT === 1 && to_0.bytes.length === 32)) {
          __compactRuntime.typeError('unwrap',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 76 char 1',
                                     'struct UserAddress<bytes: Bytes<32>>',
                                     to_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_9.toValue(coin_0).concat(_descriptor_13.toValue(to_0)),
            alignment: _descriptor_9.alignment().concat(_descriptor_13.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._unwrap_0(context, partialProofData, coin_0, to_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      createEvent: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`createEvent: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const payout_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createEvent',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 85 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(payout_0) === 'object' && payout_0.bytes.buffer instanceof ArrayBuffer && payout_0.bytes.BYTES_PER_ELEMENT === 1 && payout_0.bytes.length === 32)) {
          __compactRuntime.typeError('createEvent',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 85 char 1',
                                     'struct ZswapCoinPublicKey<bytes: Bytes<32>>',
                                     payout_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_10.toValue(payout_0),
            alignment: _descriptor_10.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._createEvent_0(context, partialProofData, payout_0);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      addTicketType: (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`addTicketType: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const eventId_0 = args_1[1];
        const price_0 = args_1[2];
        const fee_0 = args_1[3];
        const supply_0 = args_1[4];
        const maxResale_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(supply_0) === 'bigint' && supply_0 >= 0n && supply_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'Uint<0..18446744073709551616>',
                                     supply_0)
        }
        if (!(typeof(maxResale_0) === 'bigint' && maxResale_0 >= 0n && maxResale_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 92 char 1',
                                     'Uint<0..18446744073709551616>',
                                     maxResale_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(eventId_0).concat(_descriptor_2.toValue(price_0).concat(_descriptor_2.toValue(fee_0).concat(_descriptor_2.toValue(supply_0).concat(_descriptor_2.toValue(maxResale_0))))),
            alignment: _descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._addTicketType_0(context,
                                               partialProofData,
                                               eventId_0,
                                               price_0,
                                               fee_0,
                                               supply_0,
                                               maxResale_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      buyTicket: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`buyTicket: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const feeCoin_0 = args_1[2];
        const restCoin_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 108 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 108 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(typeof(feeCoin_0) === 'object' && feeCoin_0.nonce.buffer instanceof ArrayBuffer && feeCoin_0.nonce.BYTES_PER_ELEMENT === 1 && feeCoin_0.nonce.length === 32 && feeCoin_0.color.buffer instanceof ArrayBuffer && feeCoin_0.color.BYTES_PER_ELEMENT === 1 && feeCoin_0.color.length === 32 && typeof(feeCoin_0.value) === 'bigint' && feeCoin_0.value >= 0n && feeCoin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 108 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     feeCoin_0)
        }
        if (!(typeof(restCoin_0) === 'object' && restCoin_0.nonce.buffer instanceof ArrayBuffer && restCoin_0.nonce.BYTES_PER_ELEMENT === 1 && restCoin_0.nonce.length === 32 && restCoin_0.color.buffer instanceof ArrayBuffer && restCoin_0.color.BYTES_PER_ELEMENT === 1 && restCoin_0.color.length === 32 && typeof(restCoin_0.value) === 'bigint' && restCoin_0.value >= 0n && restCoin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 108 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     restCoin_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_9.toValue(feeCoin_0).concat(_descriptor_9.toValue(restCoin_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_9.alignment().concat(_descriptor_9.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._buyTicket_0(context,
                                           partialProofData,
                                           typeId_0,
                                           feeCoin_0,
                                           restCoin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      listForResale: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`listForResale: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const price_0 = args_1[2];
        const fee_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 124 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 124 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 124 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 124 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_2.toValue(price_0).concat(_descriptor_2.toValue(fee_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._listForResale_0(context,
                                               partialProofData,
                                               typeId_0,
                                               price_0,
                                               fee_0);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      buyResale: (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`buyResale: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        const feeCoin_0 = args_1[2];
        const restCoin_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 139 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 139 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        if (!(typeof(feeCoin_0) === 'object' && feeCoin_0.nonce.buffer instanceof ArrayBuffer && feeCoin_0.nonce.BYTES_PER_ELEMENT === 1 && feeCoin_0.nonce.length === 32 && feeCoin_0.color.buffer instanceof ArrayBuffer && feeCoin_0.color.BYTES_PER_ELEMENT === 1 && feeCoin_0.color.length === 32 && typeof(feeCoin_0.value) === 'bigint' && feeCoin_0.value >= 0n && feeCoin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 139 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     feeCoin_0)
        }
        if (!(typeof(restCoin_0) === 'object' && restCoin_0.nonce.buffer instanceof ArrayBuffer && restCoin_0.nonce.BYTES_PER_ELEMENT === 1 && restCoin_0.nonce.length === 32 && restCoin_0.color.buffer instanceof ArrayBuffer && restCoin_0.color.BYTES_PER_ELEMENT === 1 && restCoin_0.color.length === 32 && typeof(restCoin_0.value) === 'bigint' && restCoin_0.value >= 0n && restCoin_0.value <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 139 char 1',
                                     'struct ShieldedCoinInfo<nonce: Bytes<32>, color: Bytes<32>, value: Uint<0..340282366920938463463374607431768211456>>',
                                     restCoin_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(listingId_0).concat(_descriptor_9.toValue(feeCoin_0).concat(_descriptor_9.toValue(restCoin_0))),
            alignment: _descriptor_2.alignment().concat(_descriptor_9.alignment().concat(_descriptor_9.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._buyResale_0(context,
                                           partialProofData,
                                           listingId_0,
                                           feeCoin_0,
                                           restCoin_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      claimProceeds: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`claimProceeds: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('claimProceeds',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 153 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('claimProceeds',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 153 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(listingId_0),
            alignment: _descriptor_2.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._claimProceeds_0(context,
                                               partialProofData,
                                               listingId_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      cancelListing: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`cancelListing: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('cancelListing',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 163 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('cancelListing',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 163 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_2.toValue(listingId_0),
            alignment: _descriptor_2.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._cancelListing_0(context,
                                               partialProofData,
                                               listingId_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      proveHolder: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`proveHolder: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('proveHolder',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 173 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('proveHolder',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-shielded.compact line 173 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._proveHolder_0(context, partialProofData, typeId_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      accountId(context, ...args_1) {
        return { result: pureCircuits.accountId(...args_1), context };
      }
    };
    this.impureCircuits = {
      wrap: this.circuits.wrap,
      unwrap: this.circuits.unwrap,
      createEvent: this.circuits.createEvent,
      addTicketType: this.circuits.addTicketType,
      buyTicket: this.circuits.buyTicket,
      listForResale: this.circuits.listForResale,
      buyResale: this.circuits.buyResale,
      claimProceeds: this.circuits.claimProceeds,
      cancelListing: this.circuits.cancelListing,
      proveHolder: this.circuits.proveHolder
    };
    this.provableCircuits = {
      wrap: this.circuits.wrap,
      unwrap: this.circuits.unwrap,
      createEvent: this.circuits.createEvent,
      addTicketType: this.circuits.addTicketType,
      buyTicket: this.circuits.buyTicket,
      listForResale: this.circuits.listForResale,
      buyResale: this.circuits.buyResale,
      claimProceeds: this.circuits.claimProceeds,
      cancelListing: this.circuits.cancelListing,
      proveHolder: this.circuits.proveHolder
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 4) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 4 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const uri__0 = args_0[1];
    const feeBps__0 = args_0[2];
    const feeKey__0 = args_0[3];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(feeBps__0) === 'bigint' && feeBps__0 >= 0n && feeBps__0 <= 65535n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'cloaktix-shielded.compact line 36 char 1',
                                 'Uint<0..65536>',
                                 feeBps__0)
    }
    if (!(typeof(feeKey__0) === 'object' && feeKey__0.bytes.buffer instanceof ArrayBuffer && feeKey__0.bytes.BYTES_PER_ELEMENT === 1 && feeKey__0.bytes.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'cloaktix-shielded.compact line 36 char 1',
                                 'struct ZswapCoinPublicKey<bytes: Bytes<32>>',
                                 feeKey__0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('wrap', new __compactRuntime.ContractOperation());
    state_0.setOperation('unwrap', new __compactRuntime.ContractOperation());
    state_0.setOperation('createEvent', new __compactRuntime.ContractOperation());
    state_0.setOperation('addTicketType', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyTicket', new __compactRuntime.ContractOperation());
    state_0.setOperation('listForResale', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyResale', new __compactRuntime.ContractOperation());
    state_0.setOperation('claimProceeds', new __compactRuntime.ContractOperation());
    state_0.setOperation('cancelListing', new __compactRuntime.ContractOperation());
    state_0.setOperation('proveHolder', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(0n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(1n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(2n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(''),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(3n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(false),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(4n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(0n),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(5n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue({ bytes: new Uint8Array(32) }),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(6n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(7n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(8n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(9n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(10n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(11n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(12n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(13n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(14n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    this._initialize_0(context, partialProofData, uri__0);
    let t_0;
    __compactRuntime.assert((t_0 = feeBps__0, t_0 <= 10000n), 'feeBps > 100%');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(4n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(feeBps__0),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(5n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(feeKey__0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _some_0(value_0) { return { is_some: true, value: value_0 }; }
  _none_0() {
    return { is_some: false,
             value:
               { nonce: new Uint8Array(32), color: new Uint8Array(32), value: 0n } };
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: new Uint8Array(32) };
  }
  _left_1(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _left_2(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _right_1(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _right_2(value_0) {
    return { is_left: false, left: new Uint8Array(32), right: value_0 };
  }
  _nativeToken_0() {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  _tokenType_0(domain_sep_0, contractAddress_0) {
    return this._persistentCommit_0([domain_sep_0, contractAddress_0.bytes],
                                    new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 100, 101, 114, 105, 118, 101, 95, 116, 111, 107, 101, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  }
  _mintShieldedToken_0(context,
                       partialProofData,
                       domain_sep_0,
                       value_0,
                       nonce_0,
                       recipient_0)
  {
    const coin_0 = { nonce: nonce_0,
                     color:
                       this._tokenType_0(domain_sep_0,
                                         _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                   partialProofData,
                                                                                                   [
                                                                                                    { dup: { n: 2 } },
                                                                                                    { idx: { cached: true,
                                                                                                             pushPath: false,
                                                                                                             path: [
                                                                                                                    { tag: 'value',
                                                                                                                      value: { value: _descriptor_26.toValue(0n),
                                                                                                                               alignment: _descriptor_26.alignment() } }] } },
                                                                                                    { popeq: { cached: true,
                                                                                                               result: undefined } }]).value)),
                     value: value_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(4n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(domain_sep_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(value_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const cm_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(2n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_0(recipient_0.right.bytes,
                      _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 2 } },
                                                                                 { idx: { cached: true,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_26.toValue(0n),
                                                                                                            alignment: _descriptor_26.alignment() } }] } },
                                                                                 { popeq: { cached: true,
                                                                                            result: undefined } }]).value).bytes))
    {
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(1n),
                                                                    alignment: _descriptor_26.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    return coin_0;
  }
  _shieldedBurnAddress_0() {
    return this._left_1({ bytes: new Uint8Array(32) });
  }
  _receiveShielded_0(context, partialProofData, coin_0) {
    const recipient_0 = this._right_1(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 2 } },
                                                                                                 { idx: { cached: true,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_26.toValue(0n),
                                                                                                                            alignment: _descriptor_26.alignment() } }] } },
                                                                                                 { popeq: { cached: true,
                                                                                                            result: undefined } }]).value));
    this._createZswapOutput_0(context, partialProofData, coin_0, recipient_0);
    const tmp_0 = this._coinCommitment_0(coin_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(1n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _sendShielded_0(context, partialProofData, input_0, recipient_0, value_0) {
    const selfAddr_0 = _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_26.toValue(0n),
                                                                                                             alignment: _descriptor_26.alignment() } }] } },
                                                                                  { popeq: { cached: true,
                                                                                             result: undefined } }]).value);
    this._createZswapInput_0(context, partialProofData, input_0);
    const tmp_0 = this._coinNullifier_0(this._downcastQualifiedCoin_0(input_0),
                                        selfAddr_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(0n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    let t_0;
    const change_0 = (t_0 = input_0.value,
                      (__compactRuntime.assert(t_0 >= value_0,
                                               'result of subtraction would be negative'),
                       t_0 - value_0));
    const output_0 = { nonce:
                         this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToField(28,
                                                                                                                  new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101]),
                                                                                                                  '<standard library>'),
                                                                             this._degradeToTransient_0(input_0.nonce)])),
                       color: input_0.color,
                       value: value_0 };
    this._createZswapOutput_0(context, partialProofData, output_0, recipient_0);
    const tmp_1 = this._coinCommitment_0(output_0, recipient_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(2n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (!recipient_0.is_left
        &&
        this._equal_1(recipient_0.right.bytes, selfAddr_0.bytes))
    {
      const tmp_2 = this._coinCommitment_0(output_0, recipient_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(1n),
                                                                    alignment: _descriptor_26.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_2),
                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    if (this._equal_2(change_0, 0n)) {
      return { change: this._none_0(), sent: output_0 };
    } else {
      const changeCoin_0 = { nonce:
                               this._upgradeFromTransient_0(this._transientHash_0([__compactRuntime.convertBytesToField(30,
                                                                                                                        new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 107, 101, 114, 110, 101, 108, 58, 110, 111, 110, 99, 101, 95, 101, 118, 111, 108, 118, 101, 47, 50]),
                                                                                                                        '<standard library>'),
                                                                                   this._degradeToTransient_0(input_0.nonce)])),
                             color: input_0.color,
                             value: change_0 };
      this._createZswapOutput_0(context,
                                partialProofData,
                                changeCoin_0,
                                this._right_1(selfAddr_0));
      const cm_0 = this._coinCommitment_0(changeCoin_0,
                                          this._right_1(selfAddr_0));
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(2n),
                                                                    alignment: _descriptor_26.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(1n),
                                                                    alignment: _descriptor_26.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                                alignment: _descriptor_1.alignment() }).encode() } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newNull().encode() } },
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
      return { change: this._some_0(changeCoin_0), sent: output_0 };
    }
  }
  _sendImmediateShielded_0(context, partialProofData, input_0, target_0, value_0)
  {
    return this._sendShielded_0(context,
                                partialProofData,
                                this._upcastQualifiedCoin_0(input_0),
                                target_0,
                                value_0);
  }
  _downcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce, color: coin_0.color, value: coin_0.value };
  }
  _upcastQualifiedCoin_0(coin_0) {
    return { nonce: coin_0.nonce,
             color: coin_0.color,
             value: coin_0.value,
             mt_index: 0n };
  }
  _coinCommitment_0(coin_0, recipient_0) {
    return this._persistentHash_0({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 99, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: recipient_0.is_left,
                                    data:
                                      recipient_0.is_left ?
                                      recipient_0.left.bytes :
                                      recipient_0.right.bytes });
  }
  _coinNullifier_0(coin_0, addr_0) {
    return this._persistentHash_0({ domain_sep:
                                      new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 122, 115, 119, 97, 112, 45, 99, 110, 91, 118, 49, 93]),
                                    info: coin_0,
                                    dataType: false,
                                    data: addr_0.bytes });
  }
  _sendUnshielded_0(context, partialProofData, color_0, amount_0, recipient_0) {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(7n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(tmp_0),
                                                                                              alignment: _descriptor_21.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(amount_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    const tmp_1 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(8n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                              { value: _descriptor_21.toValue(tmp_1),
                                                                                                alignment: _descriptor_21.alignment() },
                                                                                              { value: _descriptor_23.toValue(recipient_0),
                                                                                                alignment: _descriptor_23.alignment() }
                                                                                            )).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(amount_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    if (recipient_0.is_left
        &&
        this._equal_3(recipient_0.left.bytes,
                      _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                partialProofData,
                                                                                [
                                                                                 { dup: { n: 2 } },
                                                                                 { idx: { cached: true,
                                                                                          pushPath: false,
                                                                                          path: [
                                                                                                 { tag: 'value',
                                                                                                   value: { value: _descriptor_26.toValue(0n),
                                                                                                            alignment: _descriptor_26.alignment() } }] } },
                                                                                 { popeq: { cached: true,
                                                                                            result: undefined } }]).value).bytes))
    {
      const tmp_2 = this._left_0(color_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { swap: { n: 0 } },
                                         { idx: { cached: true,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(6n),
                                                                    alignment: _descriptor_26.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(tmp_2),
                                                                                                alignment: _descriptor_21.alignment() }).encode() } },
                                         { dup: { n: 1 } },
                                         { dup: { n: 1 } },
                                         'member',
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(amount_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { swap: { n: 0 } },
                                         'neg',
                                         { branch: { skip: 4 } },
                                         { dup: { n: 2 } },
                                         { dup: { n: 2 } },
                                         { idx: { cached: true,
                                                  pushPath: false,
                                                  path: [ { tag: 'stack' }] } },
                                         'add',
                                         { ins: { cached: true, n: 2 } },
                                         { swap: { n: 0 } }]);
    }
    return [];
  }
  _receiveUnshielded_0(context, partialProofData, color_0, amount_0) {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(6n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_21.toValue(tmp_0),
                                                                                              alignment: _descriptor_21.alignment() }).encode() } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'member',
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(amount_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { swap: { n: 0 } },
                                       'neg',
                                       { branch: { skip: 4 } },
                                       { dup: { n: 2 } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: true,
                                                pushPath: false,
                                                path: [ { tag: 'stack' }] } },
                                       'add',
                                       { ins: { cached: true, n: 2 } },
                                       { swap: { n: 0 } }]);
    return [];
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_22, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_19, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_20, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_17,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _upgradeFromTransient_0(x_0) {
    const result_0 = __compactRuntime.upgradeFromTransient(x_0);
    return result_0;
  }
  _ownPublicKey_0(context, partialProofData) {
    const result_0 = __compactRuntime.ownPublicKey(context);
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _createZswapInput_0(context, partialProofData, coin_0) {
    const result_0 = __compactRuntime.createZswapInput(context, coin_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _createZswapOutput_0(context, partialProofData, coin_0, recipient_0) {
    const result_0 = __compactRuntime.createZswapOutput(context,
                                                        coin_0,
                                                        recipient_0);
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  _ZERO_0() {
    return { is_left: true,
             left: new Uint8Array(32),
             right: { bytes: new Uint8Array(32) } };
  }
  _initialize_0(context, partialProofData, uri__0) {
    this._initialize_1(context, partialProofData);
    this.__setURI_0(context, partialProofData, uri__0);
    return [];
  }
  _balanceOf_0(context, partialProofData, account_0, id_0) {
    this._assertInitialized_0(context, partialProofData);
    const canonAcct_0 = this._canonicalize_0(account_0);
    if (!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_26.toValue(0n),
                                                                                               alignment: _descriptor_26.alignment() } }] } },
                                                                    { push: { storage: false,
                                                                              value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                                                           alignment: _descriptor_0.alignment() }).encode() } },
                                                                    'member',
                                                                    { popeq: { cached: true,
                                                                               result: undefined } }]).value)
        ||
        !_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_26.toValue(0n),
                                                                                               alignment: _descriptor_26.alignment() } },
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_0.toValue(id_0),
                                                                                               alignment: _descriptor_0.alignment() } }] } },
                                                                    { push: { storage: false,
                                                                              value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(canonAcct_0),
                                                                                                                           alignment: _descriptor_14.alignment() }).encode() } },
                                                                    'member',
                                                                    { popeq: { cached: true,
                                                                               result: undefined } }]).value))
    {
      return 0n;
    } else {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(0n),
                                                                                                   alignment: _descriptor_26.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_0.toValue(id_0),
                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_14.toValue(canonAcct_0),
                                                                                                   alignment: _descriptor_14.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  }
  __update_0(context, partialProofData, fromAddress_0, to_0, id_0, value_0) {
    this._assertInitialized_0(context, partialProofData);
    const canonFrom_0 = this._canonicalize_0(fromAddress_0);
    const canonTo_0 = this._canonicalize_0(to_0);
    if (!this.__isTargetZero_0(canonFrom_0)) {
      const fromBalance_0 = this._balanceOf_0(context,
                                              partialProofData,
                                              canonFrom_0,
                                              id_0);
      __compactRuntime.assert(fromBalance_0 >= value_0,
                              'MultiToken: insufficient balance');
      const newBalance_0 = (__compactRuntime.assert(fromBalance_0 >= value_0,
                                                    'result of subtraction would be negative'),
                            fromBalance_0 - value_0);
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_26.toValue(0n),
                                                                    alignment: _descriptor_26.alignment() } },
                                                         { tag: 'value',
                                                           value: { value: _descriptor_0.toValue(id_0),
                                                                    alignment: _descriptor_0.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(canonFrom_0),
                                                                                                alignment: _descriptor_14.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(newBalance_0),
                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 2 } }]);
    }
    if (!this.__isTargetZero_0(canonTo_0)) {
      if (!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_26.toValue(0n),
                                                                                                 alignment: _descriptor_26.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                                                             alignment: _descriptor_0.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value))
      {
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_26.toValue(0n),
                                                                      alignment: _descriptor_26.alignment() } }] } },
                                           { push: { storage: false,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                           { push: { storage: true,
                                                     value: __compactRuntime.StateValue.newMap(
                                                              new __compactRuntime.StateMap()
                                                            ).encode() } },
                                           { ins: { cached: false, n: 1 } },
                                           { ins: { cached: true, n: 1 } }]);
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_26.toValue(0n),
                                                                      alignment: _descriptor_26.alignment() } },
                                                           { tag: 'value',
                                                             value: { value: _descriptor_0.toValue(id_0),
                                                                      alignment: _descriptor_0.alignment() } }] } },
                                           { push: { storage: false,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(canonTo_0),
                                                                                                  alignment: _descriptor_14.alignment() }).encode() } },
                                           { push: { storage: true,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(value_0),
                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                           { ins: { cached: false, n: 1 } },
                                           { ins: { cached: true, n: 2 } }]);
      } else {
        const toBalance_0 = this._balanceOf_0(context,
                                              partialProofData,
                                              canonTo_0,
                                              id_0);
        const MAX_UINT128_0 = 340282366920938463463374607431768211455n;
        let t_0;
        __compactRuntime.assert((t_0 = (__compactRuntime.assert(MAX_UINT128_0
                                                                >=
                                                                toBalance_0,
                                                                'result of subtraction would be negative'),
                                        MAX_UINT128_0 - toBalance_0),
                                 t_0 >= value_0),
                                'MultiToken: arithmetic overflow');
        const tmp_0 = ((t1) => {
                        if (t1 > 340282366920938463463374607431768211455n) {
                          throw new __compactRuntime.CompactError('MultiToken.compact line 400 char 65: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                        }
                        return t1;
                      })(toBalance_0 + value_0);
        __compactRuntime.queryLedgerState(context,
                                          partialProofData,
                                          [
                                           { idx: { cached: false,
                                                    pushPath: true,
                                                    path: [
                                                           { tag: 'value',
                                                             value: { value: _descriptor_26.toValue(0n),
                                                                      alignment: _descriptor_26.alignment() } },
                                                           { tag: 'value',
                                                             value: { value: _descriptor_0.toValue(id_0),
                                                                      alignment: _descriptor_0.alignment() } }] } },
                                           { push: { storage: false,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(canonTo_0),
                                                                                                  alignment: _descriptor_14.alignment() }).encode() } },
                                           { push: { storage: true,
                                                     value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                                  alignment: _descriptor_0.alignment() }).encode() } },
                                           { ins: { cached: false, n: 1 } },
                                           { ins: { cached: true, n: 2 } }]);
      }
    }
    return [];
  }
  __unsafeTransfer_0(context,
                     partialProofData,
                     fromAddress_0,
                     to_0,
                     id_0,
                     value_0)
  {
    this._assertInitialized_0(context, partialProofData);
    __compactRuntime.assert(!this.__isTargetZero_0(fromAddress_0),
                            'MultiToken: invalid sender');
    __compactRuntime.assert(!this.__isTargetZero_0(to_0),
                            'MultiToken: invalid receiver');
    this.__update_0(context,
                    partialProofData,
                    fromAddress_0,
                    to_0,
                    id_0,
                    value_0);
    return [];
  }
  __setURI_0(context, partialProofData, newURI_0) {
    this._assertInitialized_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(2n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_15.toValue(newURI_0),
                                                                                              alignment: _descriptor_15.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  __mint_0(context, partialProofData, to_0, id_0, value_0) {
    const isContractAddr_0 = !to_0.is_left;
    __compactRuntime.assert(!isContractAddr_0, 'MultiToken: unsafe transfer');
    this.__unsafeMint_0(context, partialProofData, to_0, id_0, value_0);
    return [];
  }
  __unsafeMint_0(context, partialProofData, to_0, id_0, value_0) {
    this._assertInitialized_0(context, partialProofData);
    __compactRuntime.assert(!this.__isTargetZero_0(to_0),
                            'MultiToken: invalid receiver');
    this.__update_0(context,
                    partialProofData,
                    this._ZERO_0(),
                    to_0,
                    id_0,
                    value_0);
    return [];
  }
  _computeAccountId_0(secretKey_0) {
    return this._persistentHash_1([secretKey_0]);
  }
  __isTargetZero_0(target_0) {
    if (target_0.is_left) {
      return this._equal_4(target_0.left, new Uint8Array(32));
    } else {
      return this._equal_5(target_0.right, { bytes: new Uint8Array(32) });
    }
  }
  _initialize_1(context, partialProofData) {
    this._assertNotInitialized_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_26.toValue(3n),
                                                                                              alignment: _descriptor_26.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(true),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _assertInitialized_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(3n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'Initializable: contract not initialized');
    return [];
  }
  _assertNotInitialized_0(context, partialProofData) {
    __compactRuntime.assert(!_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_26.toValue(3n),
                                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'Initializable: contract already initialized');
    return [];
  }
  _canonicalize_0(value_0) {
    if (value_0.is_left) {
      return { is_left: true,
               left: value_0.left,
               right: { bytes: new Uint8Array(32) } };
    } else {
      return { is_left: false, left: new Uint8Array(32), right: value_0.right };
    }
  }
  _wit_CloakSK_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_CloakSK(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_CloakSK',
                                 'return value',
                                 'cloaktix-shielded.compact line 15 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _me_0(context, partialProofData) {
    return this._computeAccountId_0(this._wit_CloakSK_0(context,
                                                        partialProofData));
  }
  _payColor_0(context, partialProofData) {
    return this._tokenType_0(new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 119, 110, 105, 103, 104, 116, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                             _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 2 } },
                                                                                        { idx: { cached: true,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_26.toValue(0n),
                                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value));
  }
  _checkFee_0(context, partialProofData, p_0, f_0) {
    const pb_0 = p_0
                 *
                 _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_26.toValue(4n),
                                                                                                       alignment: _descriptor_26.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = f_0 * 10000n, t_0 <= pb_0), 'fee too high');
    __compactRuntime.assert(pb_0 < (f_0 + 1n) * 10000n, 'fee too low');
    __compactRuntime.assert(f_0 > 0n, 'Price too low');
    return [];
  }
  _takePayment_0(context, partialProofData, feeCoin_0, restCoin_0, fee_0, rest_0)
  {
    const c_0 = this._payColor_0(context, partialProofData);
    __compactRuntime.assert(this._equal_6(feeCoin_0.color, c_0)
                            &&
                            this._equal_7(restCoin_0.color, c_0),
                            'Pay in wNIGHT');
    __compactRuntime.assert(this._equal_8(feeCoin_0.value, fee_0),
                            'Wrong fee coin');
    __compactRuntime.assert(this._equal_9(restCoin_0.value, rest_0),
                            'Wrong payment coin');
    this._receiveShielded_0(context, partialProofData, feeCoin_0);
    this._receiveShielded_0(context, partialProofData, restCoin_0);
    this._sendImmediateShielded_0(context,
                                  partialProofData,
                                  feeCoin_0,
                                  this._left_1(_descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                          partialProofData,
                                                                                                          [
                                                                                                           { dup: { n: 0 } },
                                                                                                           { idx: { cached: false,
                                                                                                                    pushPath: false,
                                                                                                                    path: [
                                                                                                                           { tag: 'value',
                                                                                                                             value: { value: _descriptor_26.toValue(5n),
                                                                                                                                      alignment: _descriptor_26.alignment() } }] } },
                                                                                                           { popeq: { cached: false,
                                                                                                                      result: undefined } }]).value)),
                                  fee_0);
    return [];
  }
  _wrap_0(context, partialProofData, amount_0, nonce_0) {
    const a_0 = amount_0;
    __compactRuntime.assert(a_0 > 0n, 'Zero');
    this._receiveUnshielded_0(context,
                              partialProofData,
                              this._nativeToken_0(),
                              a_0);
    this._mintShieldedToken_0(context,
                              partialProofData,
                              new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 119, 110, 105, 103, 104, 116, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                              a_0,
                              nonce_0,
                              this._left_1(this._ownPublicKey_0(context,
                                                                partialProofData)));
    const tmp_0 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(14n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_0),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _unwrap_0(context, partialProofData, coin_0, to_0) {
    const c_0 = coin_0;
    __compactRuntime.assert(this._equal_10(c_0.color,
                                           this._payColor_0(context,
                                                            partialProofData)),
                            'Not wNIGHT');
    this._receiveShielded_0(context, partialProofData, c_0);
    this._sendImmediateShielded_0(context,
                                  partialProofData,
                                  c_0,
                                  this._shieldedBurnAddress_0(),
                                  c_0.value);
    this._sendUnshielded_0(context,
                           partialProofData,
                           this._nativeToken_0(),
                           c_0.value,
                           this._right_0(to_0));
    return [];
  }
  _createEvent_0(context, partialProofData, payout_0) {
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-shielded.compact line 86 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_26.toValue(11n),
                                                                                                          alignment: _descriptor_26.alignment() } }] } },
                                                                               { popeq: { cached: true,
                                                                                          result: undefined } }]).value)
                    +
                    1n);
    const tmp_0 = { organizer: this._me_0(context, partialProofData),
                    payout: payout_0,
                    open: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(6n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(id_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(tmp_0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(11n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_1),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  _addTicketType_0(context,
                   partialProofData,
                   eventId_0,
                   price_0,
                   fee_0,
                   supply_0,
                   maxResale_0)
  {
    const e_0 = eventId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(6n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(e_0),
                                                                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    __compactRuntime.assert(this._equal_11(_descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                      partialProofData,
                                                                                                      [
                                                                                                       { dup: { n: 0 } },
                                                                                                       { idx: { cached: false,
                                                                                                                pushPath: false,
                                                                                                                path: [
                                                                                                                       { tag: 'value',
                                                                                                                         value: { value: _descriptor_26.toValue(6n),
                                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                                       { idx: { cached: false,
                                                                                                                pushPath: false,
                                                                                                                path: [
                                                                                                                       { tag: 'value',
                                                                                                                         value: { value: _descriptor_2.toValue(e_0),
                                                                                                                                  alignment: _descriptor_2.alignment() } }] } },
                                                                                                       { popeq: { cached: false,
                                                                                                                  result: undefined } }]).value).organizer,
                                           this._me_0(context, partialProofData)),
                            'Not organizer');
    const p_0 = price_0;
    const f_0 = fee_0;
    this._checkFee_0(context, partialProofData, p_0, f_0);
    const id_0 = _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_26.toValue(12n),
                                                                                                       alignment: _descriptor_26.alignment() } }] } },
                                                                            { popeq: { cached: true,
                                                                                       result: undefined } }]).value)
                 +
                 1n;
    const tmp_0 = { eventId: e_0,
                    price: p_0,
                    fee: f_0,
                    supply: supply_0,
                    sold: 0n,
                    maxResale: maxResale_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(7n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(12n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_1),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  _buyTicket_0(context, partialProofData, typeId_0, feeCoin_0, restCoin_0) {
    const t_0 = typeId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(7n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket type');
    const tt_0 = _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_26.toValue(7n),
                                                                                                       alignment: _descriptor_26.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(t_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    let tmp_0;
    const ev_0 = (tmp_0 = tt_0.eventId,
                  _descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_26.toValue(6n),
                                                                                                         alignment: _descriptor_26.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(tmp_0),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value));
    __compactRuntime.assert(ev_0.open, 'Sales closed');
    let t_1;
    __compactRuntime.assert((t_1 = tt_0.sold, t_1 < tt_0.supply), 'Sold out');
    let t_2, t_3;
    const rest_0 = (t_2 = tt_0.price,
                    (t_3 = tt_0.fee,
                     (__compactRuntime.assert(t_2 >= t_3,
                                              'result of subtraction would be negative'),
                      t_2 - t_3)));
    this._takePayment_0(context,
                        partialProofData,
                        feeCoin_0,
                        restCoin_0,
                        tt_0.fee,
                        rest_0);
    this._sendImmediateShielded_0(context,
                                  partialProofData,
                                  restCoin_0,
                                  this._left_1(ev_0.payout),
                                  rest_0);
    this.__mint_0(context,
                  partialProofData,
                  this._left_2(this._me_0(context, partialProofData)),
                  t_0,
                  1n);
    const tmp_1 = { eventId: tt_0.eventId,
                    price: tt_0.price,
                    fee: tt_0.fee,
                    supply: tt_0.supply,
                    sold:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('cloaktix-shielded.compact line 120 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(tt_0.sold + 1n),
                    maxResale: tt_0.maxResale };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(7n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_1),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _listForResale_0(context, partialProofData, typeId_0, price_0, fee_0) {
    const t_0 = typeId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(7n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket type');
    const p_0 = price_0;
    const f_0 = fee_0;
    __compactRuntime.assert(p_0
                            <=
                            _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(7n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_0.toValue(t_0),
                                                                                                                  alignment: _descriptor_0.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value).maxResale,
                            'Above max resale price');
    this._checkFee_0(context, partialProofData, p_0, f_0);
    this.__unsafeTransfer_0(context,
                            partialProofData,
                            this._left_2(this._me_0(context, partialProofData)),
                            this._right_2(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 2 } },
                                                                                                     { idx: { cached: true,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_26.toValue(0n),
                                                                                                                                alignment: _descriptor_26.alignment() } }] } },
                                                                                                     { popeq: { cached: true,
                                                                                                                result: undefined } }]).value)),
                            t_0,
                            1n);
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-shielded.compact line 133 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_26.toValue(13n),
                                                                                                          alignment: _descriptor_26.alignment() } }] } },
                                                                               { popeq: { cached: true,
                                                                                          result: undefined } }]).value)
                    +
                    1n);
    const tmp_0 = { seller: this._me_0(context, partialProofData),
                    typeId: t_0,
                    price: p_0,
                    fee: f_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(8n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(id_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(13n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_8.toValue(tmp_1),
                                                                alignment: _descriptor_8.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  _buyResale_0(context, partialProofData, listingId_0, feeCoin_0, restCoin_0) {
    const l_0 = listingId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(8n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No listing');
    const li_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_26.toValue(8n),
                                                                                                       alignment: _descriptor_26.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_2.toValue(l_0),
                                                                                                       alignment: _descriptor_2.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    let t_0, t_1;
    const rest_0 = (t_0 = li_0.price,
                    (t_1 = li_0.fee,
                     (__compactRuntime.assert(t_0 >= t_1,
                                              'result of subtraction would be negative'),
                      t_0 - t_1)));
    this._takePayment_0(context,
                        partialProofData,
                        feeCoin_0,
                        restCoin_0,
                        li_0.fee,
                        rest_0);
    const tmp_0 = this._right_1(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                          partialProofData,
                                                                                          [
                                                                                           { dup: { n: 2 } },
                                                                                           { idx: { cached: true,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_26.toValue(0n),
                                                                                                                      alignment: _descriptor_26.alignment() } }] } },
                                                                                           { popeq: { cached: true,
                                                                                                      result: undefined } }]).value));
    __compactRuntime.hasCoinCommitment(context, restCoin_0, tmp_0) ? __compactRuntime.queryLedgerState(context,
                                                                                                       partialProofData,
                                                                                                       [
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: true,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_26.toValue(9n),
                                                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                                                        { push: { storage: false,
                                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                                                                                               alignment: _descriptor_2.alignment() }).encode() } },
                                                                                                        { dup: { n: 5 } },
                                                                                                        { push: { storage: false,
                                                                                                                  value: __compactRuntime.StateValue.newCell(__compactRuntime.runtimeCoinCommitment(
                                                                                                                                                               { value: _descriptor_9.toValue(restCoin_0),
                                                                                                                                                                 alignment: _descriptor_9.alignment() },
                                                                                                                                                               { value: _descriptor_11.toValue(tmp_0),
                                                                                                                                                                 alignment: _descriptor_11.alignment() }
                                                                                                                                                             )).encode() } },
                                                                                                        { idx: { cached: true,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_26.toValue(1n),
                                                                                                                                   alignment: _descriptor_26.alignment() } },
                                                                                                                        { tag: 'stack' }] } },
                                                                                                        { push: { storage: false,
                                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(restCoin_0),
                                                                                                                                                               alignment: _descriptor_9.alignment() }).encode() } },
                                                                                                        { swap: { n: 0 } },
                                                                                                        { concat: { cached: true,
                                                                                                                    n: 91 } },
                                                                                                        { ins: { cached: false,
                                                                                                                 n: 1 } },
                                                                                                        { ins: { cached: true,
                                                                                                                 n: 1 } }]) : (() => { throw new __compactRuntime.CompactError(`cloaktix-shielded.compact line 145 char 3: Coin commitment not found. Check the coin has been received (or call 'createZswapOutput')`); })();
    const tmp_1 = li_0.seller;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(10n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_1),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    this.__unsafeTransfer_0(context,
                            partialProofData,
                            this._right_2(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 2 } },
                                                                                                     { idx: { cached: true,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_26.toValue(0n),
                                                                                                                                alignment: _descriptor_26.alignment() } }] } },
                                                                                                     { popeq: { cached: true,
                                                                                                                result: undefined } }]).value)),
                            this._left_2(this._me_0(context, partialProofData)),
                            li_0.typeId,
                            1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(8n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _claimProceeds_0(context, partialProofData, listingId_0) {
    const l_0 = listingId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(10n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Nothing to claim');
    __compactRuntime.assert(this._equal_12(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_26.toValue(10n),
                                                                                                                                 alignment: _descriptor_26.alignment() } }] } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_2.toValue(l_0),
                                                                                                                                 alignment: _descriptor_2.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value),
                                           this._me_0(context, partialProofData)),
                            'Not seller');
    const coin_0 = _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_26.toValue(9n),
                                                                                                         alignment: _descriptor_26.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_2.toValue(l_0),
                                                                                                         alignment: _descriptor_2.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value);
    this._sendShielded_0(context,
                         partialProofData,
                         coin_0,
                         this._left_1(this._ownPublicKey_0(context,
                                                           partialProofData)),
                         coin_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(9n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(10n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _cancelListing_0(context, partialProofData, listingId_0) {
    const l_0 = listingId_0;
    __compactRuntime.assert(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_26.toValue(8n),
                                                                                                                  alignment: _descriptor_26.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No listing');
    const li_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_26.toValue(8n),
                                                                                                       alignment: _descriptor_26.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_2.toValue(l_0),
                                                                                                       alignment: _descriptor_2.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(this._equal_13(li_0.seller,
                                           this._me_0(context, partialProofData)),
                            'Not seller');
    this.__unsafeTransfer_0(context,
                            partialProofData,
                            this._right_2(_descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 2 } },
                                                                                                     { idx: { cached: true,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_26.toValue(0n),
                                                                                                                                alignment: _descriptor_26.alignment() } }] } },
                                                                                                     { popeq: { cached: true,
                                                                                                                result: undefined } }]).value)),
                            this._left_2(li_0.seller),
                            li_0.typeId,
                            1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_26.toValue(8n),
                                                                  alignment: _descriptor_26.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(l_0),
                                                                                              alignment: _descriptor_2.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  _proveHolder_0(context, partialProofData, typeId_0) {
    let t_0;
    __compactRuntime.assert((t_0 = this._balanceOf_0(context,
                                                     partialProofData,
                                                     this._left_2(this._me_0(context,
                                                                             partialProofData)),
                                                     typeId_0),
                             t_0 >= 1n),
                            'Not holder');
    return [];
  }
  _accountId_0(sk_0) { return this._computeAccountId_0(sk_0); }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (x0 !== y0) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_12(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_13(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get feeBps() {
      return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(4n),
                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get feeKey() {
      return _descriptor_10.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_26.toValue(5n),
                                                                                                    alignment: _descriptor_26.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    events: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(6n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(6n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 26 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(6n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 26 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_26.toValue(6n),
                                                                                                      alignment: _descriptor_26.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_2.toValue(key_0),
                                                                                                      alignment: _descriptor_2.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_2.fromValue(key.value),      _descriptor_12.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    ticketTypes: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(7n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(7n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 27 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(7n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 27 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     key_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(7n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[7];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_7.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    listings: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(8n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(8n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 28 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(8n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 28 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(8n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(key_0),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_2.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    proceeds: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(9n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(9n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 29 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(9n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 29 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(9n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(key_0),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_2.fromValue(key.value),      _descriptor_4.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    soldListings: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(10n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(0n),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(10n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 30 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(10n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_2.toValue(key_0),
                                                                                                                                 alignment: _descriptor_2.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-shielded.compact line 30 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_26.toValue(10n),
                                                                                                     alignment: _descriptor_26.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_2.toValue(key_0),
                                                                                                     alignment: _descriptor_2.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[10];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_2.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get eventCount() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(11n),
                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get typeCount() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(12n),
                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get listingCount() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(13n),
                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get wrapped() {
      return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_26.toValue(14n),
                                                                                                   alignment: _descriptor_26.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({ wit_CloakSK: (...args) => undefined });
export const pureCircuits = {
  accountId: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`accountId: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('accountId',
                                 'argument 1',
                                 'cloaktix-shielded.compact line 178 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._accountId_0(sk_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
