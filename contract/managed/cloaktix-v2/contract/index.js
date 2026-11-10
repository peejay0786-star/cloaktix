import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.21.0');

export var ResaleMode;
(function (ResaleMode) {
  ResaleMode[ResaleMode['capped'] = 0] = 'capped';
  ResaleMode[ResaleMode['unlimited'] = 1] = 'unlimited';
  ResaleMode[ResaleMode['none'] = 2] = 'none';
})(ResaleMode || (ResaleMode = {}));

export var TicketStatus;
(function (TicketStatus) {
  TicketStatus[TicketStatus['owned'] = 0] = 'owned';
  TicketStatus[TicketStatus['listed'] = 1] = 'listed';
  TicketStatus[TicketStatus['consumed'] = 2] = 'consumed';
})(TicketStatus || (TicketStatus = {}));

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = new __compactRuntime.CompactTypeEnum(2, 1);

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_4 = __compactRuntime.CompactTypeBoolean;

class _Ticket_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment()))))));
  }
  fromValue(value_0) {
    return {
      typeId: _descriptor_0.fromValue(value_0),
      owner: _descriptor_1.fromValue(value_0),
      status: _descriptor_2.fromValue(value_0),
      epoch: _descriptor_3.fromValue(value_0),
      hasAdmit: _descriptor_4.fromValue(value_0),
      admitCommit: _descriptor_1.fromValue(value_0),
      listingId: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.typeId).concat(_descriptor_1.toValue(value_0.owner).concat(_descriptor_2.toValue(value_0.status).concat(_descriptor_3.toValue(value_0.epoch).concat(_descriptor_4.toValue(value_0.hasAdmit).concat(_descriptor_1.toValue(value_0.admitCommit).concat(_descriptor_3.toValue(value_0.listingId)))))));
  }
}

const _descriptor_5 = new _Ticket_0();

const _descriptor_6 = __compactRuntime.CompactTypeJubjubPoint;

class _Maybe_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_6.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_6.toValue(value_0.value));
  }
}

const _descriptor_7 = new _Maybe_0();

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

const _descriptor_8 = new _UserAddress_0();

class _EventInfo_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_8.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      organizer: _descriptor_1.fromValue(value_0),
      payout: _descriptor_8.fromValue(value_0),
      open: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.organizer).concat(_descriptor_8.toValue(value_0.payout).concat(_descriptor_4.toValue(value_0.open)));
  }
}

const _descriptor_9 = new _EventInfo_0();

const _descriptor_10 = new __compactRuntime.CompactTypeEnum(2, 1);

class _TicketType_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_10.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment())))))));
  }
  fromValue(value_0) {
    return {
      eventId: _descriptor_3.fromValue(value_0),
      price: _descriptor_3.fromValue(value_0),
      fee: _descriptor_3.fromValue(value_0),
      supply: _descriptor_3.fromValue(value_0),
      sold: _descriptor_3.fromValue(value_0),
      resale: _descriptor_10.fromValue(value_0),
      maxResale: _descriptor_3.fromValue(value_0),
      adultOnly: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.eventId).concat(_descriptor_3.toValue(value_0.price).concat(_descriptor_3.toValue(value_0.fee).concat(_descriptor_3.toValue(value_0.supply).concat(_descriptor_3.toValue(value_0.sold).concat(_descriptor_10.toValue(value_0.resale).concat(_descriptor_3.toValue(value_0.maxResale).concat(_descriptor_4.toValue(value_0.adultOnly))))))));
  }
}

const _descriptor_11 = new _TicketType_0();

class _Listing_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_8.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment())))));
  }
  fromValue(value_0) {
    return {
      seller: _descriptor_1.fromValue(value_0),
      payout: _descriptor_8.fromValue(value_0),
      serial: _descriptor_0.fromValue(value_0),
      typeId: _descriptor_0.fromValue(value_0),
      price: _descriptor_3.fromValue(value_0),
      fee: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.seller).concat(_descriptor_8.toValue(value_0.payout).concat(_descriptor_0.toValue(value_0.serial).concat(_descriptor_0.toValue(value_0.typeId).concat(_descriptor_3.toValue(value_0.price).concat(_descriptor_3.toValue(value_0.fee))))));
  }
}

const _descriptor_12 = new _Listing_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

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

const _descriptor_14 = new _ContractAddress_0();

class _AgeClaim_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_3.alignment());
  }
  fromValue(value_0) {
    return {
      holder: _descriptor_1.fromValue(value_0),
      adultFrom: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.holder).concat(_descriptor_3.toValue(value_0.adultFrom));
  }
}

const _descriptor_15 = new _AgeClaim_0();

const _descriptor_16 = __compactRuntime.CompactTypeField;

class _AgeSignature_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_16.alignment());
  }
  fromValue(value_0) {
    return {
      r: _descriptor_6.fromValue(value_0),
      s: _descriptor_16.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.r).concat(_descriptor_16.toValue(value_0.s));
  }
}

const _descriptor_17 = new _AgeSignature_0();

class _AgeProof_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_6.alignment().concat(_descriptor_17.alignment()))));
  }
  fromValue(value_0) {
    return {
      issuerMethod: _descriptor_1.fromValue(value_0),
      createdAt: _descriptor_3.fromValue(value_0),
      challengeHash: _descriptor_1.fromValue(value_0),
      publicKey: _descriptor_6.fromValue(value_0),
      signature: _descriptor_17.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.issuerMethod).concat(_descriptor_3.toValue(value_0.createdAt).concat(_descriptor_1.toValue(value_0.challengeHash).concat(_descriptor_6.toValue(value_0.publicKey).concat(_descriptor_17.toValue(value_0.signature)))));
  }
}

const _descriptor_18 = new _AgeProof_0();

class _AgeCredential_0 {
  alignment() {
    return _descriptor_15.alignment().concat(_descriptor_18.alignment());
  }
  fromValue(value_0) {
    return {
      claim: _descriptor_15.fromValue(value_0),
      proof: _descriptor_18.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_15.toValue(value_0.claim).concat(_descriptor_18.toValue(value_0.proof));
  }
}

const _descriptor_19 = new _AgeCredential_0();

class _Maybe_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_19.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_19.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_19.toValue(value_0.value));
  }
}

const _descriptor_20 = new _Maybe_1();

const _descriptor_21 = __compactRuntime.CompactTypeJubjubScalar;

const _descriptor_22 = new __compactRuntime.CompactTypeVector(3, _descriptor_1);

class _AdmitMaterial_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment())))));
  }
  fromValue(value_0) {
    return {
      tag: _descriptor_1.fromValue(value_0),
      networkTag: _descriptor_1.fromValue(value_0),
      contractKey: _descriptor_1.fromValue(value_0),
      serial: _descriptor_0.fromValue(value_0),
      epoch: _descriptor_3.fromValue(value_0),
      nonce: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.tag).concat(_descriptor_1.toValue(value_0.networkTag).concat(_descriptor_1.toValue(value_0.contractKey).concat(_descriptor_0.toValue(value_0.serial).concat(_descriptor_3.toValue(value_0.epoch).concat(_descriptor_1.toValue(value_0.nonce))))));
  }
}

const _descriptor_23 = new _AdmitMaterial_0();

const _descriptor_24 = new __compactRuntime.CompactTypeVector(5, _descriptor_1);

const _descriptor_25 = new __compactRuntime.CompactTypeVector(1, _descriptor_1);

const _descriptor_26 = new __compactRuntime.CompactTypeVector(2, _descriptor_16);

class _Either_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_27 = new _Either_0();

class _Either_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_14.alignment().concat(_descriptor_8.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_14.fromValue(value_0),
      right: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_14.toValue(value_0.left).concat(_descriptor_8.toValue(value_0.right)));
  }
}

const _descriptor_28 = new _Either_1();

class _Maybe_2 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_28.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_28.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_28.toValue(value_0.value));
  }
}

const _descriptor_29 = new _Maybe_2();

const _descriptor_30 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_31 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

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
    if (typeof(witnesses_0.wit_AgeCredential) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_AgeCredential');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      async accountId(context, ...args_1) {
        return { result: pureCircuits.accountId(...args_1), context };
      },
      async ageChallenge(context, ...args_1) {
        return { result: pureCircuits.ageChallenge(...args_1), context };
      },
      async contractKeyOf(context, ...args_1) {
        return { result: pureCircuits.contractKeyOf(...args_1), context };
      },
      async admitCommitOf(context, ...args_1) {
        return { result: pureCircuits.admitCommitOf(...args_1), context };
      },
      createEvent: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`createEvent: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const payout_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('createEvent',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 172 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(payout_0) === 'object' && payout_0.bytes.buffer instanceof ArrayBuffer && payout_0.bytes.BYTES_PER_ELEMENT === 1 && payout_0.bytes.length === 32)) {
          __compactRuntime.typeError('createEvent',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 172 char 1',
                                     'struct UserAddress<bytes: Bytes<32>>',
                                     payout_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_8.toValue(payout_0),
            alignment: _descriptor_8.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._createEvent_0(context,
                                                   partialProofData,
                                                   payout_0);
        partialProofData.output = { value: _descriptor_3.toValue(result_0), alignment: _descriptor_3.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      addTicketType: async (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`addTicketType: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const eventId_0 = args_1[1];
        const price_0 = args_1[2];
        const fee_0 = args_1[3];
        const supply_0 = args_1[4];
        const resale_0 = args_1[5];
        const maxResale_0 = args_1[6];
        const adultOnly_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(supply_0) === 'bigint' && supply_0 >= 0n && supply_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Uint<0..18446744073709551616>',
                                     supply_0)
        }
        if (!(typeof(resale_0) === 'number' && resale_0 >= 0 && resale_0 <= 2)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Enum<ResaleMode, capped, unlimited, none>',
                                     resale_0)
        }
        if (!(typeof(maxResale_0) === 'bigint' && maxResale_0 >= 0n && maxResale_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Uint<0..18446744073709551616>',
                                     maxResale_0)
        }
        if (!(typeof(adultOnly_0) === 'boolean')) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 180 char 1',
                                     'Boolean',
                                     adultOnly_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(eventId_0).concat(_descriptor_3.toValue(price_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_3.toValue(supply_0).concat(_descriptor_10.toValue(resale_0).concat(_descriptor_3.toValue(maxResale_0).concat(_descriptor_4.toValue(adultOnly_0))))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_10.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._addTicketType_0(context,
                                                     partialProofData,
                                                     eventId_0,
                                                     price_0,
                                                     fee_0,
                                                     supply_0,
                                                     resale_0,
                                                     maxResale_0,
                                                     adultOnly_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      setSalesOpen: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`setSalesOpen: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const eventId_0 = args_1[1];
        const open_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('setSalesOpen',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 197 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('setSalesOpen',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 197 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(open_0) === 'boolean')) {
          __compactRuntime.typeError('setSalesOpen',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 197 char 1',
                                     'Boolean',
                                     open_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(eventId_0).concat(_descriptor_4.toValue(open_0)),
            alignment: _descriptor_3.alignment().concat(_descriptor_4.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._setSalesOpen_0(context,
                                                    partialProofData,
                                                    eventId_0,
                                                    open_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyTicket: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`buyTicket: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const admitCommit_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 233 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 233 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(admitCommit_0.buffer instanceof ArrayBuffer && admitCommit_0.BYTES_PER_ELEMENT === 1 && admitCommit_0.length === 32)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 233 char 1',
                                     'Bytes<32>',
                                     admitCommit_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_1.toValue(admitCommit_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyTicket_0(context,
                                                 partialProofData,
                                                 typeId_0,
                                                 admitCommit_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyTicketAdult: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`buyTicketAdult: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const admitCommit_0 = args_1[2];
        const asOf_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 236 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 236 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(admitCommit_0.buffer instanceof ArrayBuffer && admitCommit_0.BYTES_PER_ELEMENT === 1 && admitCommit_0.length === 32)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 236 char 1',
                                     'Bytes<32>',
                                     admitCommit_0)
        }
        if (!(typeof(asOf_0) === 'bigint' && asOf_0 >= 0n && asOf_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 236 char 1',
                                     'Uint<0..18446744073709551616>',
                                     asOf_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_1.toValue(admitCommit_0).concat(_descriptor_3.toValue(asOf_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyTicketAdult_0(context,
                                                      partialProofData,
                                                      typeId_0,
                                                      admitCommit_0,
                                                      asOf_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      registerAdmit: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`registerAdmit: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        const commit_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('registerAdmit',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 244 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('registerAdmit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 244 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(commit_0.buffer instanceof ArrayBuffer && commit_0.BYTES_PER_ELEMENT === 1 && commit_0.length === 32)) {
          __compactRuntime.typeError('registerAdmit',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 244 char 1',
                                     'Bytes<32>',
                                     commit_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0).concat(_descriptor_1.toValue(commit_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._registerAdmit_0(context,
                                                     partialProofData,
                                                     serial_0,
                                                     commit_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      listForResale: async (...args_1) => {
        if (args_1.length !== 5) {
          throw new __compactRuntime.CompactError(`listForResale: expected 5 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        const price_0 = args_1[2];
        const fee_0 = args_1[3];
        const payout_0 = args_1[4];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 258 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 258 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(typeof(price_0) === 'bigint' && price_0 >= 0n && price_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 258 char 1',
                                     'Uint<0..18446744073709551616>',
                                     price_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 258 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(payout_0) === 'object' && payout_0.bytes.buffer instanceof ArrayBuffer && payout_0.bytes.BYTES_PER_ELEMENT === 1 && payout_0.bytes.length === 32)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 258 char 1',
                                     'struct UserAddress<bytes: Bytes<32>>',
                                     payout_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0).concat(_descriptor_3.toValue(price_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_8.toValue(payout_0)))),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_8.alignment())))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._listForResale_0(context,
                                                     partialProofData,
                                                     serial_0,
                                                     price_0,
                                                     fee_0,
                                                     payout_0);
        partialProofData.output = { value: _descriptor_3.toValue(result_0), alignment: _descriptor_3.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyResale: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`buyResale: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 306 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 306 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(listingId_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyResale_0(context,
                                                 partialProofData,
                                                 listingId_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyResaleAdult: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`buyResaleAdult: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        const asOf_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 307 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 307 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        if (!(typeof(asOf_0) === 'bigint' && asOf_0 >= 0n && asOf_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 307 char 1',
                                     'Uint<0..18446744073709551616>',
                                     asOf_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(listingId_0).concat(_descriptor_3.toValue(asOf_0)),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyResaleAdult_0(context,
                                                      partialProofData,
                                                      listingId_0,
                                                      asOf_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      admit: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`admit: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        const nonce_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('admit',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 313 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('admit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 313 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('admit',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 313 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0).concat(_descriptor_1.toValue(nonce_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._admit_0(context,
                                             partialProofData,
                                             serial_0,
                                             nonce_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      proveHolder: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`proveHolder: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('proveHolder',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 330 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('proveHolder',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 330 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._proveHolder_0(context,
                                                   partialProofData,
                                                   serial_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      adminSet: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`adminSet: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const paused__0 = args_1[1];
        const newIssuer_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('adminSet',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-v2.compact line 338 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(paused__0) === 'boolean')) {
          __compactRuntime.typeError('adminSet',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 338 char 1',
                                     'Boolean',
                                     paused__0)
        }
        if (!(typeof(newIssuer_0) === 'object' && typeof(newIssuer_0.is_some) === 'boolean' && typeof(newIssuer_0.value.x) === 'bigint' && newIssuer_0.value.x >= 0n && newIssuer_0.value.x <= __compactRuntime.MAX_FIELD && typeof(newIssuer_0.value.y) === 'bigint' && newIssuer_0.value.y >= 0n && newIssuer_0.value.y <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('adminSet',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-v2.compact line 338 char 1',
                                     'struct Maybe<is_some: Boolean, value: JubjubPoint>',
                                     newIssuer_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(paused__0).concat(_descriptor_7.toValue(newIssuer_0)),
            alignment: _descriptor_4.alignment().concat(_descriptor_7.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._adminSet_0(context,
                                                partialProofData,
                                                paused__0,
                                                newIssuer_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      }
    };
    this.impureCircuits = {
      createEvent: this.circuits.createEvent,
      addTicketType: this.circuits.addTicketType,
      setSalesOpen: this.circuits.setSalesOpen,
      buyTicket: this.circuits.buyTicket,
      buyTicketAdult: this.circuits.buyTicketAdult,
      registerAdmit: this.circuits.registerAdmit,
      listForResale: this.circuits.listForResale,
      buyResale: this.circuits.buyResale,
      buyResaleAdult: this.circuits.buyResaleAdult,
      admit: this.circuits.admit,
      proveHolder: this.circuits.proveHolder,
      adminSet: this.circuits.adminSet
    };
    this.provableCircuits = {
      createEvent: this.circuits.createEvent,
      addTicketType: this.circuits.addTicketType,
      setSalesOpen: this.circuits.setSalesOpen,
      buyTicket: this.circuits.buyTicket,
      buyTicketAdult: this.circuits.buyTicketAdult,
      registerAdmit: this.circuits.registerAdmit,
      listForResale: this.circuits.listForResale,
      buyResale: this.circuits.buyResale,
      buyResaleAdult: this.circuits.buyResaleAdult,
      admit: this.circuits.admit,
      proveHolder: this.circuits.proveHolder,
      adminSet: this.circuits.adminSet
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 6) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 6 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const feeBps__0 = args_0[1];
    const feeAddress__0 = args_0[2];
    const admin__0 = args_0[3];
    const ageIssuer__0 = args_0[4];
    const networkTag__0 = args_0[5];
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
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'cloaktix-v2.compact line 84 char 1',
                                 'Uint<0..65536>',
                                 feeBps__0)
    }
    if (!(typeof(feeAddress__0) === 'object' && feeAddress__0.bytes.buffer instanceof ArrayBuffer && feeAddress__0.bytes.BYTES_PER_ELEMENT === 1 && feeAddress__0.bytes.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'cloaktix-v2.compact line 84 char 1',
                                 'struct UserAddress<bytes: Bytes<32>>',
                                 feeAddress__0)
    }
    if (!(admin__0.buffer instanceof ArrayBuffer && admin__0.BYTES_PER_ELEMENT === 1 && admin__0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'cloaktix-v2.compact line 84 char 1',
                                 'Bytes<32>',
                                 admin__0)
    }
    if (!(typeof(ageIssuer__0.x) === 'bigint' && ageIssuer__0.x >= 0n && ageIssuer__0.x <= __compactRuntime.MAX_FIELD && typeof(ageIssuer__0.y) === 'bigint' && ageIssuer__0.y >= 0n && ageIssuer__0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 4 (argument 5 as invoked from Typescript)',
                                 'cloaktix-v2.compact line 84 char 1',
                                 'JubjubPoint',
                                 ageIssuer__0)
    }
    if (!(networkTag__0.buffer instanceof ArrayBuffer && networkTag__0.BYTES_PER_ELEMENT === 1 && networkTag__0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 5 (argument 6 as invoked from Typescript)',
                                 'cloaktix-v2.compact line 84 char 1',
                                 'Bytes<32>',
                                 networkTag__0)
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
    state_0.setOperation('createEvent', new __compactRuntime.ContractOperation());
    state_0.setOperation('addTicketType', new __compactRuntime.ContractOperation());
    state_0.setOperation('setSalesOpen', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyTicket', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyTicketAdult', new __compactRuntime.ContractOperation());
    state_0.setOperation('registerAdmit', new __compactRuntime.ContractOperation());
    state_0.setOperation('listForResale', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyResale', new __compactRuntime.ContractOperation());
    state_0.setOperation('buyResaleAdult', new __compactRuntime.ContractOperation());
    state_0.setOperation('admit', new __compactRuntime.ContractOperation());
    state_0.setOperation('proveHolder', new __compactRuntime.ContractOperation());
    state_0.setOperation('adminSet', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext({circuitId: 'constructor', contractAddress: __compactRuntime.dummyContractAddress(), coinPublicKeyOrZswapState: constructorContext_0.initialZswapLocalState.coinPublicKey, contractState: state_0.data, privateState: constructorContext_0.initialPrivateState});
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
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(0n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(0n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(1n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(2n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(3n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue({ bytes: new Uint8Array(32) }),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(4n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(5n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(false),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(6n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(7n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(8n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(9n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(10n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(11n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(12n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(13n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(14n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    let t_0;
    __compactRuntime.assert((t_0 = feeBps__0, t_0 <= 10000n), 'feeBps > 100%');
    const tmp_0 = 2n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(0n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(tmp_0),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(2n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(feeBps__0),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(3n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_8.toValue(feeAddress__0),
                                                                                              alignment: _descriptor_8.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(4n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(admin__0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(14n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(ageIssuer__0),
                                                                                              alignment: _descriptor_6.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(1n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(networkTag__0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(5n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(false),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.callContext.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.callContext.currentPrivateState,
      currentZswapLocalState: context.callContext.currentZswapLocalState
    }
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: new Uint8Array(32) };
  }
  _right_0(value_0) {
    return { is_left: false, left: { bytes: new Uint8Array(32) }, right: value_0 };
  }
  _nativeToken_0() {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  async _blockTimeLt_0(context, partialProofData, time_0) {
    return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 2 } },
                                                                      { idx: { cached: true,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_30.toValue(2n),
                                                                                                 alignment: _descriptor_30.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(time_0),
                                                                                                                             alignment: _descriptor_3.alignment() }).encode() } },
                                                                      'lt',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value);
  }
  async _blockTimeGte_0(context, partialProofData, time_0) {
    return !await this._blockTimeLt_0(context, partialProofData, time_0);
  }
  async _sendUnshielded_0(context,
                          partialProofData,
                          color_0,
                          amount_0,
                          recipient_0)
  {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(7n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_0),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                              { value: _descriptor_27.toValue(tmp_1),
                                                                                                alignment: _descriptor_27.alignment() },
                                                                                              { value: _descriptor_28.toValue(recipient_0),
                                                                                                alignment: _descriptor_28.alignment() }
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
        this._equal_0(recipient_0.left.bytes,
                      _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_30.toValue(0n),
                                                                                                             alignment: _descriptor_30.alignment() } }] } },
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
                                                           value: { value: _descriptor_30.toValue(6n),
                                                                    alignment: _descriptor_30.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_2),
                                                                                                alignment: _descriptor_27.alignment() }).encode() } },
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
  async _receiveUnshielded_0(context, partialProofData, color_0, amount_0) {
    const tmp_0 = this._left_0(color_0);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { swap: { n: 0 } },
                                       { idx: { cached: true,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(6n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(tmp_0),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
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
    const result_0 = __compactRuntime.transientHash(_descriptor_3, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_26, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_14, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_25, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_15, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_24, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_22, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_23, value_0);
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
  _jubjubPointX_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointX(pt_0);
    return result_0;
  }
  _jubjubPointY_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointY(pt_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _wit_CloakSK_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_CloakSK(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_CloakSK',
                                 'return value',
                                 'cloaktix-v2.compact line 16 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _wit_AgeCredential_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_AgeCredential(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && typeof(result_0.is_some) === 'boolean' && typeof(result_0.value) === 'object' && typeof(result_0.value.claim) === 'object' && result_0.value.claim.holder.buffer instanceof ArrayBuffer && result_0.value.claim.holder.BYTES_PER_ELEMENT === 1 && result_0.value.claim.holder.length === 32 && typeof(result_0.value.claim.adultFrom) === 'bigint' && result_0.value.claim.adultFrom >= 0n && result_0.value.claim.adultFrom <= 18446744073709551615n && typeof(result_0.value.proof) === 'object' && result_0.value.proof.issuerMethod.buffer instanceof ArrayBuffer && result_0.value.proof.issuerMethod.BYTES_PER_ELEMENT === 1 && result_0.value.proof.issuerMethod.length === 32 && typeof(result_0.value.proof.createdAt) === 'bigint' && result_0.value.proof.createdAt >= 0n && result_0.value.proof.createdAt <= 18446744073709551615n && result_0.value.proof.challengeHash.buffer instanceof ArrayBuffer && result_0.value.proof.challengeHash.BYTES_PER_ELEMENT === 1 && result_0.value.proof.challengeHash.length === 32 && typeof(result_0.value.proof.publicKey.x) === 'bigint' && result_0.value.proof.publicKey.x >= 0n && result_0.value.proof.publicKey.x <= __compactRuntime.MAX_FIELD && typeof(result_0.value.proof.publicKey.y) === 'bigint' && result_0.value.proof.publicKey.y >= 0n && result_0.value.proof.publicKey.y <= __compactRuntime.MAX_FIELD && typeof(result_0.value.proof.signature) === 'object' && typeof(result_0.value.proof.signature.r.x) === 'bigint' && result_0.value.proof.signature.r.x >= 0n && result_0.value.proof.signature.r.x <= __compactRuntime.MAX_FIELD && typeof(result_0.value.proof.signature.r.y) === 'bigint' && result_0.value.proof.signature.r.y >= 0n && result_0.value.proof.signature.r.y <= __compactRuntime.MAX_FIELD && typeof(result_0.value.proof.signature.s) === 'bigint' && result_0.value.proof.signature.s >= 0 && result_0.value.proof.signature.s <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('wit_AgeCredential',
                                 'return value',
                                 'cloaktix-v2.compact line 17 char 1',
                                 'struct Maybe<is_some: Boolean, value: struct AgeCredential<claim: struct AgeClaim<holder: Bytes<32>, adultFrom: Uint<0..18446744073709551616>>, proof: struct AgeProof<issuerMethod: Bytes<32>, createdAt: Uint<0..18446744073709551616>, challengeHash: Bytes<32>, publicKey: JubjubPoint, signature: struct AgeSignature<r: JubjubPoint, s: Field>>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_20.toValue(result_0),
      alignment: _descriptor_20.alignment()
    });
    return result_0;
  }
  _accountId_0(sk_0) { return this._persistentHash_0([sk_0]); }
  async _me_0(context, partialProofData) {
    return this._accountId_0(this._wit_CloakSK_0(context, partialProofData));
  }
  async _assertNotPaused_0(context, partialProofData) {
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_30.toValue(5n),
                                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'Paused');
    return [];
  }
  async _checkFee_0(context, partialProofData, p_0, f_0) {
    const pb_0 = p_0
                 *
                 _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_30.toValue(2n),
                                                                                                        alignment: _descriptor_30.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = f_0 * 10000n, t_0 <= pb_0), 'fee too high');
    __compactRuntime.assert(pb_0 < (f_0 + 1n) * 10000n, 'fee too low');
    return [];
  }
  async _pay_0(context, partialProofData, amount_0, fee_0, to_0) {
    await this._receiveUnshielded_0(context,
                                    partialProofData,
                                    this._nativeToken_0(),
                                    amount_0);
    if (fee_0 > 0n) {
      await this._sendUnshielded_0(context,
                                   partialProofData,
                                   this._nativeToken_0(),
                                   fee_0,
                                   this._right_0(_descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                           partialProofData,
                                                                                                           [
                                                                                                            { dup: { n: 0 } },
                                                                                                            { idx: { cached: false,
                                                                                                                     pushPath: false,
                                                                                                                     path: [
                                                                                                                            { tag: 'value',
                                                                                                                              value: { value: _descriptor_30.toValue(3n),
                                                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                                                            { popeq: { cached: false,
                                                                                                                       result: undefined } }]).value)));
    }
    if (amount_0 > fee_0) {
      await this._sendUnshielded_0(context,
                                   partialProofData,
                                   this._nativeToken_0(),
                                   (__compactRuntime.assert(amount_0 >= fee_0,
                                                            'result of subtraction would be negative'),
                                    amount_0 - fee_0),
                                   this._right_0(to_0));
    }
    return [];
  }
  _ageChallenge_0(claim_0,
                  issuerMethod_0,
                  createdAt_0,
                  challengeHash_0,
                  publicKey_0,
                  r_0)
  {
    const body_0 = this._persistentHash_1(claim_0);
    const payload_0 = this._persistentHash_2([body_0,
                                              new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 118, 99, 58, 105, 115, 115, 117, 97, 110, 99, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                              issuerMethod_0,
                                              this._upgradeFromTransient_0(this._transientHash_0(createdAt_0)),
                                              challengeHash_0]);
    return this._degradeToTransient_0(this._persistentHash_3([payload_0,
                                                              this._upgradeFromTransient_0(this._transientHash_1([this._jubjubPointX_0(publicKey_0),
                                                                                                                  this._jubjubPointY_0(publicKey_0)])),
                                                              this._upgradeFromTransient_0(this._transientHash_1([this._jubjubPointX_0(r_0),
                                                                                                                  this._jubjubPointY_0(r_0)]))]));
  }
  async _assertAdult_0(context, partialProofData, asOf_0) {
    const m_0 = this._wit_AgeCredential_0(context, partialProofData);
    const c_0 = m_0.value;
    __compactRuntime.assert(m_0.is_some, 'Age credential required (18+)');
    __compactRuntime.assert(this._equal_1(c_0.proof.publicKey,
                                          _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_30.toValue(14n),
                                                                                                                                alignment: _descriptor_30.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            'Age credential from an untrusted issuer');
    __compactRuntime.assert(this._equal_2(c_0.claim.holder,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Age credential issued to another account');
    const ch_0 = this._ageChallenge_0(c_0.claim,
                                      c_0.proof.issuerMethod,
                                      c_0.proof.createdAt,
                                      c_0.proof.challengeHash,
                                      c_0.proof.publicKey,
                                      c_0.proof.signature.r);
    __compactRuntime.assert(this._equal_3(this._ecMulGenerator_0(__compactRuntime.convertNumericToJubjubScalar(c_0.proof.signature.s)),
                                          this._ecAdd_0(c_0.proof.signature.r,
                                                        this._ecMul_0(c_0.proof.publicKey,
                                                                      __compactRuntime.convertNumericToJubjubScalar(ch_0)))),
                            'Invalid age credential signature');
    const t_0 = asOf_0;
    __compactRuntime.assert(await this._blockTimeGte_0(context,
                                                       partialProofData,
                                                       t_0),
                            'asOf is in the future');
    let t_1;
    __compactRuntime.assert((t_1 = c_0.claim.adultFrom, t_1 <= t_0), 'Under 18');
    return [];
  }
  _contractKeyOf_0(addr_0) {
    return this._upgradeFromTransient_0(this._transientHash_2(addr_0));
  }
  _admitCommitOf_0(networkTag__0, contractKey_0, serial_0, epoch_0, nonce_0) {
    return this._persistentHash_4({ tag:
                                      new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 97, 100, 109, 105, 116, 58, 118, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    networkTag: networkTag__0,
                                    contractKey: contractKey_0,
                                    serial: serial_0,
                                    epoch: epoch_0,
                                    nonce: nonce_0 });
  }
  async _thisContractKey_0(context, partialProofData) {
    return this._contractKeyOf_0(_descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                            partialProofData,
                                                                                            [
                                                                                             { dup: { n: 2 } },
                                                                                             { idx: { cached: true,
                                                                                                      pushPath: false,
                                                                                                      path: [
                                                                                                             { tag: 'value',
                                                                                                               value: { value: _descriptor_30.toValue(0n),
                                                                                                                        alignment: _descriptor_30.alignment() } }] } },
                                                                                             { popeq: { cached: true,
                                                                                                        result: undefined } }]).value));
  }
  async _admitCommitFor_0(context, partialProofData, serial_0, epoch_0, nonce_0)
  {
    return this._admitCommitOf_0(_descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                           partialProofData,
                                                                                           [
                                                                                            { dup: { n: 0 } },
                                                                                            { idx: { cached: false,
                                                                                                     pushPath: false,
                                                                                                     path: [
                                                                                                            { tag: 'value',
                                                                                                              value: { value: _descriptor_30.toValue(1n),
                                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                                            { popeq: { cached: false,
                                                                                                       result: undefined } }]).value),
                                 await this._thisContractKey_0(context,
                                                               partialProofData),
                                 serial_0,
                                 epoch_0,
                                 nonce_0);
  }
  _emptyCommit_0() {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  async _createEvent_0(context, partialProofData, payout_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-v2.compact line 174 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_30.toValue(10n),
                                                                                                          alignment: _descriptor_30.alignment() } }] } },
                                                                               { popeq: { cached: true,
                                                                                          result: undefined } }]).value)
                    +
                    1n);
    const tmp_0 = { organizer: await this._me_0(context, partialProofData),
                    payout: payout_0,
                    open: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(6n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(id_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(tmp_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_30.toValue(10n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_13.toValue(tmp_1),
                                                                alignment: _descriptor_13.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  async _addTicketType_0(context,
                         partialProofData,
                         eventId_0,
                         price_0,
                         fee_0,
                         supply_0,
                         resale_0,
                         maxResale_0,
                         adultOnly_0)
  {
    await this._assertNotPaused_0(context, partialProofData);
    const e_0 = eventId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(6n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    __compactRuntime.assert(this._equal_4(_descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_30.toValue(6n),
                                                                                                                                alignment: _descriptor_30.alignment() } }] } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_3.toValue(e_0),
                                                                                                                                alignment: _descriptor_3.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value).organizer,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Not organizer');
    const p_0 = price_0;
    const f_0 = fee_0;
    await this._checkFee_0(context, partialProofData, p_0, f_0);
    const id_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(11n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { popeq: { cached: true,
                                                                                       result: undefined } }]).value)
                 +
                 1n;
    const tmp_0 = { eventId: e_0,
                    price: p_0,
                    fee: f_0,
                    supply: supply_0,
                    sold: 0n,
                    resale: resale_0,
                    maxResale: resale_0 === 0 ? maxResale_0 : 0n,
                    adultOnly: adultOnly_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(7n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(tmp_0),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_30.toValue(11n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_13.toValue(tmp_1),
                                                                alignment: _descriptor_13.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  async _setSalesOpen_0(context, partialProofData, eventId_0, open_0) {
    const e_0 = eventId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(6n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    const ev_0 = _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(6n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_3.toValue(e_0),
                                                                                                       alignment: _descriptor_3.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(this._equal_5(ev_0.organizer,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Not organizer');
    const tmp_0 = { organizer: ev_0.organizer, payout: ev_0.payout, open: open_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(6n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(tmp_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _mintOwned_0(context, partialProofData, typeId_0, admitCommit_0) {
    const t_0 = typeId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(7n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket type');
    const tt_0 = _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_30.toValue(7n),
                                                                                                        alignment: _descriptor_30.alignment() } }] } },
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
                  _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_30.toValue(6n),
                                                                                                        alignment: _descriptor_30.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_3.toValue(tmp_0),
                                                                                                        alignment: _descriptor_3.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value));
    __compactRuntime.assert(ev_0.open, 'Sales closed');
    let t_1;
    __compactRuntime.assert((t_1 = tt_0.sold, t_1 < tt_0.supply), 'Sold out');
    await this._pay_0(context,
                      partialProofData,
                      tt_0.price,
                      tt_0.fee,
                      ev_0.payout);
    const serial_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_30.toValue(12n),
                                                                                                           alignment: _descriptor_30.alignment() } }] } },
                                                                                { popeq: { cached: true,
                                                                                           result: undefined } }]).value)
                     +
                     1n;
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(12n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_13.toValue(tmp_1),
                                                                alignment: _descriptor_13.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    const commit_0 = admitCommit_0;
    const has_0 = !this._equal_6(commit_0, this._emptyCommit_0());
    const tmp_2 = { typeId: t_0,
                    owner: await this._me_0(context, partialProofData),
                    status: 0,
                    epoch: 1n,
                    hasAdmit: has_0,
                    admitCommit: commit_0,
                    listingId: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(serial_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_3 = { eventId: tt_0.eventId,
                    price: tt_0.price,
                    fee: tt_0.fee,
                    supply: tt_0.supply,
                    sold:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('cloaktix-v2.compact line 221 char 30: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(tt_0.sold + 1n),
                    resale: tt_0.resale,
                    maxResale: tt_0.maxResale,
                    adultOnly: tt_0.adultOnly };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(7n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(tmp_3),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return serial_0;
  }
  async _sellPrimary_0(context,
                       partialProofData,
                       typeId_0,
                       admitCommit_0,
                       adultProven_0)
  {
    await this._assertNotPaused_0(context, partialProofData);
    const t_0 = typeId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(7n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket type');
    __compactRuntime.assert(adultProven_0
                            ||
                            !_descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                        partialProofData,
                                                                                        [
                                                                                         { dup: { n: 0 } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_30.toValue(7n),
                                                                                                                    alignment: _descriptor_30.alignment() } }] } },
                                                                                         { idx: { cached: false,
                                                                                                  pushPath: false,
                                                                                                  path: [
                                                                                                         { tag: 'value',
                                                                                                           value: { value: _descriptor_0.toValue(t_0),
                                                                                                                    alignment: _descriptor_0.alignment() } }] } },
                                                                                         { popeq: { cached: false,
                                                                                                    result: undefined } }]).value).adultOnly,
                            '18+ ticket type: age proof required (buyTicketAdult)');
    return await this._mintOwned_0(context, partialProofData, t_0, admitCommit_0);
  }
  async _buyTicket_0(context, partialProofData, typeId_0, admitCommit_0) {
    return await this._sellPrimary_0(context,
                                     partialProofData,
                                     typeId_0,
                                     admitCommit_0,
                                     false);
  }
  async _buyTicketAdult_0(context,
                          partialProofData,
                          typeId_0,
                          admitCommit_0,
                          asOf_0)
  {
    await this._assertAdult_0(context, partialProofData, asOf_0);
    return await this._sellPrimary_0(context,
                                     partialProofData,
                                     typeId_0,
                                     admitCommit_0,
                                     true);
  }
  async _registerAdmit_0(context, partialProofData, serial_0, commit_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(8n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket');
    const tk_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(8n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(this._equal_7(tk_0.owner,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Not ticket owner');
    const c_0 = commit_0;
    const clearing_0 = this._equal_8(c_0, this._emptyCommit_0());
    const tmp_0 = { typeId: tk_0.typeId,
                    owner: tk_0.owner,
                    status: tk_0.status,
                    epoch: tk_0.epoch,
                    hasAdmit: !clearing_0,
                    admitCommit: clearing_0 ? this._emptyCommit_0() : c_0,
                    listingId: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _listForResale_0(context,
                         partialProofData,
                         serial_0,
                         price_0,
                         fee_0,
                         payout_0)
  {
    await this._assertNotPaused_0(context, partialProofData);
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(8n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket');
    const tk_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(8n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(this._equal_9(tk_0.owner,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Not ticket owner');
    let tmp_0;
    const tt_0 = (tmp_0 = tk_0.typeId,
                  _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_30.toValue(7n),
                                                                                                         alignment: _descriptor_30.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value));
    __compactRuntime.assert(tt_0.resale !== 2, 'Resale not allowed');
    const p_0 = price_0;
    const f_0 = fee_0;
    __compactRuntime.assert(tt_0.resale === 1 || p_0 <= tt_0.maxResale,
                            'Above max resale price');
    await this._checkFee_0(context, partialProofData, p_0, f_0);
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-v2.compact line 271 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                   }
                   return t1;
                 })(_descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                              partialProofData,
                                                                              [
                                                                               { dup: { n: 0 } },
                                                                               { idx: { cached: false,
                                                                                        pushPath: false,
                                                                                        path: [
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_30.toValue(13n),
                                                                                                          alignment: _descriptor_30.alignment() } }] } },
                                                                               { popeq: { cached: true,
                                                                                          result: undefined } }]).value)
                    +
                    1n);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(13n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_13.toValue(tmp_1),
                                                                alignment: _descriptor_13.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 1 } }]);
    const newEpoch_0 = ((t1) => {
                         if (t1 > 18446744073709551615n) {
                           throw new __compactRuntime.CompactError('cloaktix-v2.compact line 274 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                         }
                         return t1;
                       })(tk_0.epoch + 1n);
    const tmp_2 = { typeId: tk_0.typeId,
                    owner: tk_0.owner,
                    status: 1,
                    epoch: newEpoch_0,
                    hasAdmit: false,
                    admitCommit: this._emptyCommit_0(),
                    listingId: id_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_3 = { seller: await this._me_0(context, partialProofData),
                    payout: payout_0,
                    serial: s_0,
                    typeId: tk_0.typeId,
                    price: p_0,
                    fee: f_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(9n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(id_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(tmp_3),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return id_0;
  }
  async _sellResale_0(context, partialProofData, listingId_0, adultProven_0) {
    const l_0 = listingId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(9n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(l_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No listing');
    const li_0 = _descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_30.toValue(9n),
                                                                                                        alignment: _descriptor_30.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_3.toValue(l_0),
                                                                                                        alignment: _descriptor_3.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    const s_0 = li_0.serial;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(8n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket');
    const tk_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(8n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 1, 'Not listed');
    __compactRuntime.assert(tk_0.listingId === l_0, 'Listing mismatch');
    const withdraw_0 = !adultProven_0
                       &&
                       this._equal_10(li_0.seller,
                                      await this._me_0(context, partialProofData));
    if (!withdraw_0) {
      await this._assertNotPaused_0(context, partialProofData);
      let tmp_0;
      __compactRuntime.assert(adultProven_0
                              ||
                              !(tmp_0 = li_0.typeId,
                                _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                           partialProofData,
                                                                                           [
                                                                                            { dup: { n: 0 } },
                                                                                            { idx: { cached: false,
                                                                                                     pushPath: false,
                                                                                                     path: [
                                                                                                            { tag: 'value',
                                                                                                              value: { value: _descriptor_30.toValue(7n),
                                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                                            { idx: { cached: false,
                                                                                                     pushPath: false,
                                                                                                     path: [
                                                                                                            { tag: 'value',
                                                                                                              value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                                            { popeq: { cached: false,
                                                                                                       result: undefined } }]).value)).adultOnly,
                              '18+ ticket type: age proof required (buyResaleAdult)');
      await this._pay_0(context,
                        partialProofData,
                        li_0.price,
                        li_0.fee,
                        li_0.payout);
    }
    const newOwner_0 = await this._me_0(context, partialProofData);
    const newEpoch_0 = ((t1) => {
                         if (t1 > 18446744073709551615n) {
                           throw new __compactRuntime.CompactError('cloaktix-v2.compact line 299 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                         }
                         return t1;
                       })(tk_0.epoch + 1n);
    const tmp_1 = { typeId: tk_0.typeId,
                    owner: newOwner_0,
                    status: 0,
                    epoch: newEpoch_0,
                    hasAdmit: false,
                    admitCommit: this._emptyCommit_0(),
                    listingId: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(9n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(l_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _buyResale_0(context, partialProofData, listingId_0) {
    await this._sellResale_0(context, partialProofData, listingId_0, false);
    return [];
  }
  async _buyResaleAdult_0(context, partialProofData, listingId_0, asOf_0) {
    await this._assertAdult_0(context, partialProofData, asOf_0);
    await this._sellResale_0(context, partialProofData, listingId_0, true);
    return [];
  }
  async _admit_0(context, partialProofData, serial_0, nonce_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(8n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket');
    const tk_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(8n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(tk_0.hasAdmit, 'No admit registered');
    let tmp_0;
    const tt_0 = (tmp_0 = tk_0.typeId,
                  _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_30.toValue(7n),
                                                                                                         alignment: _descriptor_30.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                         alignment: _descriptor_0.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value));
    let tmp_1;
    const ev_0 = (tmp_1 = tt_0.eventId,
                  _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_30.toValue(6n),
                                                                                                        alignment: _descriptor_30.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_3.toValue(tmp_1),
                                                                                                        alignment: _descriptor_3.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value));
    __compactRuntime.assert(this._equal_11(ev_0.organizer,
                                           await this._me_0(context,
                                                            partialProofData)),
                            'Not gate/organizer');
    const n_0 = nonce_0;
    __compactRuntime.assert(this._equal_12(tk_0.admitCommit,
                                           await this._admitCommitFor_0(context,
                                                                        partialProofData,
                                                                        s_0,
                                                                        tk_0.epoch,
                                                                        n_0)),
                            'Bad admit');
    const tmp_2 = { typeId: tk_0.typeId,
                    owner: tk_0.owner,
                    status: 2,
                    epoch: tk_0.epoch,
                    hasAdmit: false,
                    admitCommit: this._emptyCommit_0(),
                    listingId: 0n };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_30.toValue(8n),
                                                                  alignment: _descriptor_30.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _proveHolder_0(context, partialProofData, serial_0) {
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_30.toValue(8n),
                                                                                                                  alignment: _descriptor_30.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket');
    const tk_0 = _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_30.toValue(8n),
                                                                                                       alignment: _descriptor_30.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(this._equal_13(tk_0.owner,
                                           await this._me_0(context,
                                                            partialProofData)),
                            'Not ticket owner');
    return [];
  }
  async _adminSet_0(context, partialProofData, paused__0, newIssuer_0) {
    __compactRuntime.assert(this._equal_14(await this._me_0(context,
                                                            partialProofData),
                                           _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_30.toValue(4n),
                                                                                                                                 alignment: _descriptor_30.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Not admin');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(5n),
                                                                                              alignment: _descriptor_30.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(paused__0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    if (newIssuer_0.is_some) {
      const tmp_0 = newIssuer_0.value;
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_30.toValue(14n),
                                                                                                alignment: _descriptor_30.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                                alignment: _descriptor_6.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } }]);
    }
    return [];
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
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
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
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
  _equal_14(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    callContext: { currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() },
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get schemaVersion() {
      return _descriptor_30.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_30.toValue(0n),
                                                                                                    alignment: _descriptor_30.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get networkTag() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(1n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get feeBps() {
      return _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_30.toValue(2n),
                                                                                                    alignment: _descriptor_30.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get feeAddress() {
      return _descriptor_8.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(3n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get admin() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(4n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get paused() {
      return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(5n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    events: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(6n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(6n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 74 char 1',
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
                                                                                            value: { value: _descriptor_30.toValue(6n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(key_0),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
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
                                     'cloaktix-v2.compact line 74 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(6n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(key_0),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_3.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    ticketTypes: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(7n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(7n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 75 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
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
                                                                                            value: { value: _descriptor_30.toValue(7n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 75 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     key_0)
        }
        return _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_30.toValue(7n),
                                                                                                      alignment: _descriptor_30.alignment() } }] } },
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
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_11.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    tickets: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(8n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(8n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 76 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
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
                                                                                            value: { value: _descriptor_30.toValue(8n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 76 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
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
                                                                                            value: { value: _descriptor_30.toValue(8n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
        const self_0 = state.asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_5.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    listings: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(9n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_30.toValue(9n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
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
                                     'cloaktix-v2.compact line 77 char 1',
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
                                                                                            value: { value: _descriptor_30.toValue(9n),
                                                                                                     alignment: _descriptor_30.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(key_0),
                                                                                                                                 alignment: _descriptor_3.alignment() }).encode() } },
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
                                     'cloaktix-v2.compact line 77 char 1',
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
                                                                                             value: { value: _descriptor_30.toValue(9n),
                                                                                                      alignment: _descriptor_30.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_3.toValue(key_0),
                                                                                                      alignment: _descriptor_3.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[9];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_3.fromValue(key.value),      _descriptor_12.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get eventCount() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(10n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get typeCount() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(11n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get serialCount() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(12n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get listingCount() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(13n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get ageIssuer() {
      return _descriptor_6.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_30.toValue(14n),
                                                                                                   alignment: _descriptor_30.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({
  wit_CloakSK: (...args) => undefined, wit_AgeCredential: (...args) => undefined
});
export const pureCircuits = {
  accountId: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`accountId: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('accountId',
                                 'argument 1',
                                 'cloaktix-v2.compact line 95 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._accountId_0(sk_0);
  },
  ageChallenge: (...args_0) => {
    if (args_0.length !== 6) {
      throw new __compactRuntime.CompactError(`ageChallenge: expected 6 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const claim_0 = args_0[0];
    const issuerMethod_0 = args_0[1];
    const createdAt_0 = args_0[2];
    const challengeHash_0 = args_0[3];
    const publicKey_0 = args_0[4];
    const r_0 = args_0[5];
    if (!(typeof(claim_0) === 'object' && claim_0.holder.buffer instanceof ArrayBuffer && claim_0.holder.BYTES_PER_ELEMENT === 1 && claim_0.holder.length === 32 && typeof(claim_0.adultFrom) === 'bigint' && claim_0.adultFrom >= 0n && claim_0.adultFrom <= 18446744073709551615n)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 1',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'struct AgeClaim<holder: Bytes<32>, adultFrom: Uint<0..18446744073709551616>>',
                                 claim_0)
    }
    if (!(issuerMethod_0.buffer instanceof ArrayBuffer && issuerMethod_0.BYTES_PER_ELEMENT === 1 && issuerMethod_0.length === 32)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 2',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'Bytes<32>',
                                 issuerMethod_0)
    }
    if (!(typeof(createdAt_0) === 'bigint' && createdAt_0 >= 0n && createdAt_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 3',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'Uint<0..18446744073709551616>',
                                 createdAt_0)
    }
    if (!(challengeHash_0.buffer instanceof ArrayBuffer && challengeHash_0.BYTES_PER_ELEMENT === 1 && challengeHash_0.length === 32)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 4',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'Bytes<32>',
                                 challengeHash_0)
    }
    if (!(typeof(publicKey_0.x) === 'bigint' && publicKey_0.x >= 0n && publicKey_0.x <= __compactRuntime.MAX_FIELD && typeof(publicKey_0.y) === 'bigint' && publicKey_0.y >= 0n && publicKey_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 5',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'JubjubPoint',
                                 publicKey_0)
    }
    if (!(typeof(r_0.x) === 'bigint' && r_0.x >= 0n && r_0.x <= __compactRuntime.MAX_FIELD && typeof(r_0.y) === 'bigint' && r_0.y >= 0n && r_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 6',
                                 'cloaktix-v2.compact line 123 char 1',
                                 'JubjubPoint',
                                 r_0)
    }
    return _dummyContract._ageChallenge_0(claim_0,
                                          issuerMethod_0,
                                          createdAt_0,
                                          challengeHash_0,
                                          publicKey_0,
                                          r_0);
  },
  contractKeyOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`contractKeyOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const addr_0 = args_0[0];
    if (!(typeof(addr_0) === 'object' && addr_0.bytes.buffer instanceof ArrayBuffer && addr_0.bytes.BYTES_PER_ELEMENT === 1 && addr_0.bytes.length === 32)) {
      __compactRuntime.typeError('contractKeyOf',
                                 'argument 1',
                                 'cloaktix-v2.compact line 146 char 1',
                                 'struct ContractAddress<bytes: Bytes<32>>',
                                 addr_0)
    }
    return _dummyContract._contractKeyOf_0(addr_0);
  },
  admitCommitOf: (...args_0) => {
    if (args_0.length !== 5) {
      throw new __compactRuntime.CompactError(`admitCommitOf: expected 5 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const networkTag__0 = args_0[0];
    const contractKey_0 = args_0[1];
    const serial_0 = args_0[2];
    const epoch_0 = args_0[3];
    const nonce_0 = args_0[4];
    if (!(networkTag__0.buffer instanceof ArrayBuffer && networkTag__0.BYTES_PER_ELEMENT === 1 && networkTag__0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 1',
                                 'cloaktix-v2.compact line 150 char 1',
                                 'Bytes<32>',
                                 networkTag__0)
    }
    if (!(contractKey_0.buffer instanceof ArrayBuffer && contractKey_0.BYTES_PER_ELEMENT === 1 && contractKey_0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 2',
                                 'cloaktix-v2.compact line 150 char 1',
                                 'Bytes<32>',
                                 contractKey_0)
    }
    if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 3',
                                 'cloaktix-v2.compact line 150 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 serial_0)
    }
    if (!(typeof(epoch_0) === 'bigint' && epoch_0 >= 0n && epoch_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 4',
                                 'cloaktix-v2.compact line 150 char 1',
                                 'Uint<0..18446744073709551616>',
                                 epoch_0)
    }
    if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 5',
                                 'cloaktix-v2.compact line 150 char 1',
                                 'Bytes<32>',
                                 nonce_0)
    }
    return _dummyContract._admitCommitOf_0(networkTag__0,
                                           contractKey_0,
                                           serial_0,
                                           epoch_0,
                                           nonce_0);
  }
};
export const expectedVk = {};

export const circuitSignatures = {
  'accountId': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Bytes', length: 32}},
  'ageChallenge': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'AgeClaim', elements: [{name: 'holder', type: {tag: 'Bytes', length: 32}}, {name: 'adultFrom', type: {tag: 'Uint', maxval: '18446744073709551615'}}]}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Bytes', length: 32}, {tag: 'JubjubPoint'}, {tag: 'JubjubPoint'}], resultType: {tag: 'Field'}},
  'contractKeyOf': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'ContractAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Bytes', length: 32}},
  'admitCommitOf': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Bytes', length: 32}},
  'createEvent': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'UserAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Uint', maxval: '18446744073709551615'}},
  'addTicketType': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Enum', name: 'ResaleMode', elements: ['capped', 'unlimited', 'none']}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Boolean'}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'setSalesOpen': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Boolean'}], resultType: {tag: 'Tuple', types: []}},
  'buyTicket': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'buyTicketAdult': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'registerAdmit': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'listForResale': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'UserAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Uint', maxval: '18446744073709551615'}},
  'buyResale': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'buyResaleAdult': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'admit': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'proveHolder': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}], resultType: {tag: 'Tuple', types: []}},
  'adminSet': {pure: false, provable: true, argumentTypes: [{tag: 'Boolean'}, {tag: 'Struct', name: 'Maybe', elements: [{name: 'is_some', type: {tag: 'Boolean'}}, {name: 'value', type: {tag: 'JubjubPoint'}}]}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {};

//# sourceMappingURL=index.js.map
