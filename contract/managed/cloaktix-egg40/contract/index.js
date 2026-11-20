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

const _descriptor_6 = new __compactRuntime.CompactTypeEnum(2, 1);

class _TicketType_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_6.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()))))));
  }
  fromValue(value_0) {
    return {
      eventId: _descriptor_3.fromValue(value_0),
      priceUsdCents: _descriptor_3.fromValue(value_0),
      supply: _descriptor_3.fromValue(value_0),
      sold: _descriptor_3.fromValue(value_0),
      resale: _descriptor_6.fromValue(value_0),
      maxResaleUsdCents: _descriptor_3.fromValue(value_0),
      adultOnly: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.eventId).concat(_descriptor_3.toValue(value_0.priceUsdCents).concat(_descriptor_3.toValue(value_0.supply).concat(_descriptor_3.toValue(value_0.sold).concat(_descriptor_6.toValue(value_0.resale).concat(_descriptor_3.toValue(value_0.maxResaleUsdCents).concat(_descriptor_4.toValue(value_0.adultOnly)))))));
  }
}

const _descriptor_7 = new _TicketType_0();

const _descriptor_8 = new __compactRuntime.CompactTypeVector(4, _descriptor_0);

const _descriptor_9 = new __compactRuntime.CompactTypeVector(4, _descriptor_1);

const _descriptor_10 = __compactRuntime.CompactTypeField;

class _DoorKey_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment())))));
  }
  fromValue(value_0) {
    return {
      eventId: _descriptor_3.fromValue(value_0),
      gateId: _descriptor_3.fromValue(value_0),
      deviceTag: _descriptor_1.fromValue(value_0),
      validFrom: _descriptor_3.fromValue(value_0),
      validUntil: _descriptor_3.fromValue(value_0),
      active: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.eventId).concat(_descriptor_3.toValue(value_0.gateId).concat(_descriptor_1.toValue(value_0.deviceTag).concat(_descriptor_3.toValue(value_0.validFrom).concat(_descriptor_3.toValue(value_0.validUntil).concat(_descriptor_4.toValue(value_0.active))))));
  }
}

const _descriptor_11 = new _DoorKey_0();

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

const _descriptor_12 = new _UserAddress_0();

class _EventInfo_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_12.alignment().concat(_descriptor_4.alignment()));
  }
  fromValue(value_0) {
    return {
      organizer: _descriptor_1.fromValue(value_0),
      payout: _descriptor_12.fromValue(value_0),
      open: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.organizer).concat(_descriptor_12.toValue(value_0.payout).concat(_descriptor_4.toValue(value_0.open)));
  }
}

const _descriptor_13 = new _EventInfo_0();

const _descriptor_14 = __compactRuntime.CompactTypeJubjubPoint;

class _Maybe_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_14.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_14.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_14.toValue(value_0.value));
  }
}

const _descriptor_15 = new _Maybe_0();

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

const _descriptor_16 = new _ContractAddress_0();

class _AgeSignature_0 {
  alignment() {
    return _descriptor_14.alignment().concat(_descriptor_10.alignment());
  }
  fromValue(value_0) {
    return {
      r: _descriptor_14.fromValue(value_0),
      s: _descriptor_10.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_14.toValue(value_0.r).concat(_descriptor_10.toValue(value_0.s));
  }
}

const _descriptor_17 = new _AgeSignature_0();

class _RateQuote_0 {
  alignment() {
    return _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_17.alignment())));
  }
  fromValue(value_0) {
    return {
      atomsPerUsdCent: _descriptor_3.fromValue(value_0),
      issuedAt: _descriptor_3.fromValue(value_0),
      expiresAt: _descriptor_3.fromValue(value_0),
      signature: _descriptor_17.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_3.toValue(value_0.atomsPerUsdCent).concat(_descriptor_3.toValue(value_0.issuedAt).concat(_descriptor_3.toValue(value_0.expiresAt).concat(_descriptor_17.toValue(value_0.signature))));
  }
}

const _descriptor_18 = new _RateQuote_0();

class _Listing_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_12.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment()))));
  }
  fromValue(value_0) {
    return {
      seller: _descriptor_1.fromValue(value_0),
      payout: _descriptor_12.fromValue(value_0),
      serial: _descriptor_0.fromValue(value_0),
      typeId: _descriptor_0.fromValue(value_0),
      priceUsdCents: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.seller).concat(_descriptor_12.toValue(value_0.payout).concat(_descriptor_0.toValue(value_0.serial).concat(_descriptor_0.toValue(value_0.typeId).concat(_descriptor_3.toValue(value_0.priceUsdCents)))));
  }
}

const _descriptor_19 = new _Listing_0();

const _descriptor_20 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

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

const _descriptor_21 = new _AgeClaim_0();

class _AgeProof_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_14.alignment().concat(_descriptor_17.alignment()))));
  }
  fromValue(value_0) {
    return {
      issuerMethod: _descriptor_1.fromValue(value_0),
      createdAt: _descriptor_3.fromValue(value_0),
      challengeHash: _descriptor_1.fromValue(value_0),
      publicKey: _descriptor_14.fromValue(value_0),
      signature: _descriptor_17.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.issuerMethod).concat(_descriptor_3.toValue(value_0.createdAt).concat(_descriptor_1.toValue(value_0.challengeHash).concat(_descriptor_14.toValue(value_0.publicKey).concat(_descriptor_17.toValue(value_0.signature)))));
  }
}

const _descriptor_22 = new _AgeProof_0();

class _AgeCredential_0 {
  alignment() {
    return _descriptor_21.alignment().concat(_descriptor_22.alignment());
  }
  fromValue(value_0) {
    return {
      claim: _descriptor_21.fromValue(value_0),
      proof: _descriptor_22.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_21.toValue(value_0.claim).concat(_descriptor_22.toValue(value_0.proof));
  }
}

const _descriptor_23 = new _AgeCredential_0();

class _Maybe_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_23.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_23.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_23.toValue(value_0.value));
  }
}

const _descriptor_24 = new _Maybe_1();

const _descriptor_25 = __compactRuntime.CompactTypeJubjubScalar;

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

const _descriptor_26 = new _AdmitMaterial_0();

const _descriptor_27 = new __compactRuntime.CompactTypeVector(5, _descriptor_1);

const _descriptor_28 = new __compactRuntime.CompactTypeVector(3, _descriptor_1);

const _descriptor_29 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

const _descriptor_30 = new __compactRuntime.CompactTypeVector(2, _descriptor_10);

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

const _descriptor_31 = new _Either_0();

class _Either_1 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_16.alignment().concat(_descriptor_12.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_4.fromValue(value_0),
      left: _descriptor_16.fromValue(value_0),
      right: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_left).concat(_descriptor_16.toValue(value_0.left).concat(_descriptor_12.toValue(value_0.right)));
  }
}

const _descriptor_32 = new _Either_1();

class _Maybe_2 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_32.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_4.fromValue(value_0),
      value: _descriptor_32.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.is_some).concat(_descriptor_32.toValue(value_0.value));
  }
}

const _descriptor_33 = new _Maybe_2();

const _descriptor_34 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_35 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

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
    if (typeof(witnesses_0.wit_DoorSK) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named wit_DoorSK');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      async maxDoorKeySeconds(context, ...args_1) {
        return { result: pureCircuits.maxDoorKeySeconds(...args_1), context };
      },
      async rateChallenge(context, ...args_1) {
        return { result: pureCircuits.rateChallenge(...args_1), context };
      },
      async ageChallenge(context, ...args_1) {
        return { result: pureCircuits.ageChallenge(...args_1), context };
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
                                     'cloaktix-egg40.compact line 197 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(payout_0) === 'object' && payout_0.bytes.buffer instanceof ArrayBuffer && payout_0.bytes.BYTES_PER_ELEMENT === 1 && payout_0.bytes.length === 32)) {
          __compactRuntime.typeError('createEvent',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 197 char 1',
                                     'struct UserAddress<bytes: Bytes<32>>',
                                     payout_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_12.toValue(payout_0),
            alignment: _descriptor_12.alignment()
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
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`addTicketType: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const eventId_0 = args_1[1];
        const priceUsdCents_0 = args_1[2];
        const supply_0 = args_1[3];
        const resale_0 = args_1[4];
        const maxResaleUsdCents_0 = args_1[5];
        const adultOnly_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(priceUsdCents_0) === 'bigint' && priceUsdCents_0 >= 0n && priceUsdCents_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Uint<0..18446744073709551616>',
                                     priceUsdCents_0)
        }
        if (!(typeof(supply_0) === 'bigint' && supply_0 >= 0n && supply_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Uint<0..18446744073709551616>',
                                     supply_0)
        }
        if (!(typeof(resale_0) === 'number' && resale_0 >= 0 && resale_0 <= 2)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Enum<ResaleMode, capped, unlimited, none>',
                                     resale_0)
        }
        if (!(typeof(maxResaleUsdCents_0) === 'bigint' && maxResaleUsdCents_0 >= 0n && maxResaleUsdCents_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Uint<0..18446744073709551616>',
                                     maxResaleUsdCents_0)
        }
        if (!(typeof(adultOnly_0) === 'boolean')) {
          __compactRuntime.typeError('addTicketType',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 205 char 1',
                                     'Boolean',
                                     adultOnly_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(eventId_0).concat(_descriptor_3.toValue(priceUsdCents_0).concat(_descriptor_3.toValue(supply_0).concat(_descriptor_6.toValue(resale_0).concat(_descriptor_3.toValue(maxResaleUsdCents_0).concat(_descriptor_4.toValue(adultOnly_0)))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_6.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._addTicketType_0(context,
                                                     partialProofData,
                                                     eventId_0,
                                                     priceUsdCents_0,
                                                     supply_0,
                                                     resale_0,
                                                     maxResaleUsdCents_0,
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
                                     'cloaktix-egg40.compact line 222 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('setSalesOpen',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 222 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(open_0) === 'boolean')) {
          __compactRuntime.typeError('setSalesOpen',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 222 char 1',
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
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`buyTicket: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const admitCommit_0 = args_1[2];
        const nightPaid_0 = args_1[3];
        const fee_0 = args_1[4];
        const q_0 = args_1[5];
        const now_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(admitCommit_0.buffer instanceof ArrayBuffer && admitCommit_0.BYTES_PER_ELEMENT === 1 && admitCommit_0.length === 32)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'Bytes<32>',
                                     admitCommit_0)
        }
        if (!(typeof(nightPaid_0) === 'bigint' && nightPaid_0 >= 0n && nightPaid_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'Uint<0..18446744073709551616>',
                                     nightPaid_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(q_0) === 'object' && typeof(q_0.atomsPerUsdCent) === 'bigint' && q_0.atomsPerUsdCent >= 0n && q_0.atomsPerUsdCent <= 18446744073709551615n && typeof(q_0.issuedAt) === 'bigint' && q_0.issuedAt >= 0n && q_0.issuedAt <= 18446744073709551615n && typeof(q_0.expiresAt) === 'bigint' && q_0.expiresAt >= 0n && q_0.expiresAt <= 18446744073709551615n && typeof(q_0.signature) === 'object' && typeof(q_0.signature.r.x) === 'bigint' && q_0.signature.r.x >= 0n && q_0.signature.r.x <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.r.y) === 'bigint' && q_0.signature.r.y >= 0n && q_0.signature.r.y <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.s) === 'bigint' && q_0.signature.s >= 0 && q_0.signature.s <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'struct RateQuote<atomsPerUsdCent: Uint<0..18446744073709551616>, issuedAt: Uint<0..18446744073709551616>, expiresAt: Uint<0..18446744073709551616>, signature: struct AgeSignature<r: JubjubPoint, s: Field>>',
                                     q_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicket',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 260 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_1.toValue(admitCommit_0).concat(_descriptor_3.toValue(nightPaid_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_18.toValue(q_0).concat(_descriptor_3.toValue(now_0)))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_18.alignment().concat(_descriptor_3.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyTicket_0(context,
                                                 partialProofData,
                                                 typeId_0,
                                                 admitCommit_0,
                                                 nightPaid_0,
                                                 fee_0,
                                                 q_0,
                                                 now_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyTicketAdult: async (...args_1) => {
        if (args_1.length !== 8) {
          throw new __compactRuntime.CompactError(`buyTicketAdult: expected 8 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const typeId_0 = args_1[1];
        const admitCommit_0 = args_1[2];
        const nightPaid_0 = args_1[3];
        const fee_0 = args_1[4];
        const q_0 = args_1[5];
        const now_0 = args_1[6];
        const asOf_0 = args_1[7];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(typeId_0) === 'bigint' && typeId_0 >= 0n && typeId_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     typeId_0)
        }
        if (!(admitCommit_0.buffer instanceof ArrayBuffer && admitCommit_0.BYTES_PER_ELEMENT === 1 && admitCommit_0.length === 32)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Bytes<32>',
                                     admitCommit_0)
        }
        if (!(typeof(nightPaid_0) === 'bigint' && nightPaid_0 >= 0n && nightPaid_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Uint<0..18446744073709551616>',
                                     nightPaid_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(q_0) === 'object' && typeof(q_0.atomsPerUsdCent) === 'bigint' && q_0.atomsPerUsdCent >= 0n && q_0.atomsPerUsdCent <= 18446744073709551615n && typeof(q_0.issuedAt) === 'bigint' && q_0.issuedAt >= 0n && q_0.issuedAt <= 18446744073709551615n && typeof(q_0.expiresAt) === 'bigint' && q_0.expiresAt >= 0n && q_0.expiresAt <= 18446744073709551615n && typeof(q_0.signature) === 'object' && typeof(q_0.signature.r.x) === 'bigint' && q_0.signature.r.x >= 0n && q_0.signature.r.x <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.r.y) === 'bigint' && q_0.signature.r.y >= 0n && q_0.signature.r.y <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.s) === 'bigint' && q_0.signature.s >= 0 && q_0.signature.s <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'struct RateQuote<atomsPerUsdCent: Uint<0..18446744073709551616>, issuedAt: Uint<0..18446744073709551616>, expiresAt: Uint<0..18446744073709551616>, signature: struct AgeSignature<r: JubjubPoint, s: Field>>',
                                     q_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        if (!(typeof(asOf_0) === 'bigint' && asOf_0 >= 0n && asOf_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyTicketAdult',
                                     'argument 7 (argument 8 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 264 char 1',
                                     'Uint<0..18446744073709551616>',
                                     asOf_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(typeId_0).concat(_descriptor_1.toValue(admitCommit_0).concat(_descriptor_3.toValue(nightPaid_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_18.toValue(q_0).concat(_descriptor_3.toValue(now_0).concat(_descriptor_3.toValue(asOf_0))))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_18.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment()))))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyTicketAdult_0(context,
                                                      partialProofData,
                                                      typeId_0,
                                                      admitCommit_0,
                                                      nightPaid_0,
                                                      fee_0,
                                                      q_0,
                                                      now_0,
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
                                     'cloaktix-egg40.compact line 270 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('registerAdmit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 270 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(commit_0.buffer instanceof ArrayBuffer && commit_0.BYTES_PER_ELEMENT === 1 && commit_0.length === 32)) {
          __compactRuntime.typeError('registerAdmit',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 270 char 1',
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
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`listForResale: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        const priceUsdCents_0 = args_1[2];
        const payout_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 284 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 284 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(typeof(priceUsdCents_0) === 'bigint' && priceUsdCents_0 >= 0n && priceUsdCents_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 284 char 1',
                                     'Uint<0..18446744073709551616>',
                                     priceUsdCents_0)
        }
        if (!(typeof(payout_0) === 'object' && payout_0.bytes.buffer instanceof ArrayBuffer && payout_0.bytes.BYTES_PER_ELEMENT === 1 && payout_0.bytes.length === 32)) {
          __compactRuntime.typeError('listForResale',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 284 char 1',
                                     'struct UserAddress<bytes: Bytes<32>>',
                                     payout_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0).concat(_descriptor_3.toValue(priceUsdCents_0).concat(_descriptor_12.toValue(payout_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_12.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._listForResale_0(context,
                                                     partialProofData,
                                                     serial_0,
                                                     priceUsdCents_0,
                                                     payout_0);
        partialProofData.output = { value: _descriptor_3.toValue(result_0), alignment: _descriptor_3.alignment() };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyResale: async (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`buyResale: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        const nightPaid_0 = args_1[2];
        const fee_0 = args_1[3];
        const q_0 = args_1[4];
        const now_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        if (!(typeof(nightPaid_0) === 'bigint' && nightPaid_0 >= 0n && nightPaid_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'Uint<0..18446744073709551616>',
                                     nightPaid_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(q_0) === 'object' && typeof(q_0.atomsPerUsdCent) === 'bigint' && q_0.atomsPerUsdCent >= 0n && q_0.atomsPerUsdCent <= 18446744073709551615n && typeof(q_0.issuedAt) === 'bigint' && q_0.issuedAt >= 0n && q_0.issuedAt <= 18446744073709551615n && typeof(q_0.expiresAt) === 'bigint' && q_0.expiresAt >= 0n && q_0.expiresAt <= 18446744073709551615n && typeof(q_0.signature) === 'object' && typeof(q_0.signature.r.x) === 'bigint' && q_0.signature.r.x >= 0n && q_0.signature.r.x <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.r.y) === 'bigint' && q_0.signature.r.y >= 0n && q_0.signature.r.y <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.s) === 'bigint' && q_0.signature.s >= 0 && q_0.signature.s <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'struct RateQuote<atomsPerUsdCent: Uint<0..18446744073709551616>, issuedAt: Uint<0..18446744073709551616>, expiresAt: Uint<0..18446744073709551616>, signature: struct AgeSignature<r: JubjubPoint, s: Field>>',
                                     q_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResale',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 330 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(listingId_0).concat(_descriptor_3.toValue(nightPaid_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_18.toValue(q_0).concat(_descriptor_3.toValue(now_0))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_18.alignment().concat(_descriptor_3.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyResale_0(context,
                                                 partialProofData,
                                                 listingId_0,
                                                 nightPaid_0,
                                                 fee_0,
                                                 q_0,
                                                 now_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      buyResaleAdult: async (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`buyResaleAdult: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const listingId_0 = args_1[1];
        const nightPaid_0 = args_1[2];
        const fee_0 = args_1[3];
        const q_0 = args_1[4];
        const now_0 = args_1[5];
        const asOf_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(listingId_0) === 'bigint' && listingId_0 >= 0n && listingId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'Uint<0..18446744073709551616>',
                                     listingId_0)
        }
        if (!(typeof(nightPaid_0) === 'bigint' && nightPaid_0 >= 0n && nightPaid_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'Uint<0..18446744073709551616>',
                                     nightPaid_0)
        }
        if (!(typeof(fee_0) === 'bigint' && fee_0 >= 0n && fee_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'Uint<0..18446744073709551616>',
                                     fee_0)
        }
        if (!(typeof(q_0) === 'object' && typeof(q_0.atomsPerUsdCent) === 'bigint' && q_0.atomsPerUsdCent >= 0n && q_0.atomsPerUsdCent <= 18446744073709551615n && typeof(q_0.issuedAt) === 'bigint' && q_0.issuedAt >= 0n && q_0.issuedAt <= 18446744073709551615n && typeof(q_0.expiresAt) === 'bigint' && q_0.expiresAt >= 0n && q_0.expiresAt <= 18446744073709551615n && typeof(q_0.signature) === 'object' && typeof(q_0.signature.r.x) === 'bigint' && q_0.signature.r.x >= 0n && q_0.signature.r.x <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.r.y) === 'bigint' && q_0.signature.r.y >= 0n && q_0.signature.r.y <= __compactRuntime.MAX_FIELD && typeof(q_0.signature.s) === 'bigint' && q_0.signature.s >= 0 && q_0.signature.s <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'struct RateQuote<atomsPerUsdCent: Uint<0..18446744073709551616>, issuedAt: Uint<0..18446744073709551616>, expiresAt: Uint<0..18446744073709551616>, signature: struct AgeSignature<r: JubjubPoint, s: Field>>',
                                     q_0)
        }
        if (!(typeof(now_0) === 'bigint' && now_0 >= 0n && now_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'Uint<0..18446744073709551616>',
                                     now_0)
        }
        if (!(typeof(asOf_0) === 'bigint' && asOf_0 >= 0n && asOf_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('buyResaleAdult',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 333 char 1',
                                     'Uint<0..18446744073709551616>',
                                     asOf_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(listingId_0).concat(_descriptor_3.toValue(nightPaid_0).concat(_descriptor_3.toValue(fee_0).concat(_descriptor_18.toValue(q_0).concat(_descriptor_3.toValue(now_0).concat(_descriptor_3.toValue(asOf_0)))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_18.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._buyResaleAdult_0(context,
                                                      partialProofData,
                                                      listingId_0,
                                                      nightPaid_0,
                                                      fee_0,
                                                      q_0,
                                                      now_0,
                                                      asOf_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      async contractKeyOf(context, ...args_1) {
        return { result: pureCircuits.contractKeyOf(...args_1), context };
      },
      async admitCommitOf(context, ...args_1) {
        return { result: pureCircuits.admitCommitOf(...args_1), context };
      },
      async accountId(context, ...args_1) {
        return { result: pureCircuits.accountId(...args_1), context };
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
                                     'cloaktix-egg40.compact line 362 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('admit',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 362 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('admit',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 362 char 1',
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
      adminSet: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`adminSet: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const paused__0 = args_1[1];
        const newIssuer_0 = args_1[2];
        const newRateSigner_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('adminSet',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 380 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(paused__0) === 'boolean')) {
          __compactRuntime.typeError('adminSet',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 380 char 1',
                                     'Boolean',
                                     paused__0)
        }
        if (!(typeof(newIssuer_0) === 'object' && typeof(newIssuer_0.is_some) === 'boolean' && typeof(newIssuer_0.value.x) === 'bigint' && newIssuer_0.value.x >= 0n && newIssuer_0.value.x <= __compactRuntime.MAX_FIELD && typeof(newIssuer_0.value.y) === 'bigint' && newIssuer_0.value.y >= 0n && newIssuer_0.value.y <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('adminSet',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 380 char 1',
                                     'struct Maybe<is_some: Boolean, value: JubjubPoint>',
                                     newIssuer_0)
        }
        if (!(typeof(newRateSigner_0) === 'object' && typeof(newRateSigner_0.is_some) === 'boolean' && typeof(newRateSigner_0.value.x) === 'bigint' && newRateSigner_0.value.x >= 0n && newRateSigner_0.value.x <= __compactRuntime.MAX_FIELD && typeof(newRateSigner_0.value.y) === 'bigint' && newRateSigner_0.value.y >= 0n && newRateSigner_0.value.y <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('adminSet',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 380 char 1',
                                     'struct Maybe<is_some: Boolean, value: JubjubPoint>',
                                     newRateSigner_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(paused__0).concat(_descriptor_15.toValue(newIssuer_0).concat(_descriptor_15.toValue(newRateSigner_0))),
            alignment: _descriptor_4.alignment().concat(_descriptor_15.alignment().concat(_descriptor_15.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._adminSet_0(context,
                                                partialProofData,
                                                paused__0,
                                                newIssuer_0,
                                                newRateSigner_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      async doorKeyIdOf(context, ...args_1) {
        return { result: pureCircuits.doorKeyIdOf(...args_1), context };
      },
      authorizeDoorKey: async (...args_1) => {
        if (args_1.length !== 7) {
          throw new __compactRuntime.CompactError(`authorizeDoorKey: expected 7 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const eventId_0 = args_1[1];
        const gateId_0 = args_1[2];
        const keyId_0 = args_1[3];
        const deviceTag_0 = args_1[4];
        const validFrom_0 = args_1[5];
        const validUntil_0 = args_1[6];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(eventId_0) === 'bigint' && eventId_0 >= 0n && eventId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Uint<0..18446744073709551616>',
                                     eventId_0)
        }
        if (!(typeof(gateId_0) === 'bigint' && gateId_0 >= 0n && gateId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Uint<0..18446744073709551616>',
                                     gateId_0)
        }
        if (!(typeof(keyId_0) === 'bigint' && keyId_0 >= 0 && keyId_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Field',
                                     keyId_0)
        }
        if (!(deviceTag_0.buffer instanceof ArrayBuffer && deviceTag_0.BYTES_PER_ELEMENT === 1 && deviceTag_0.length === 32)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Bytes<32>',
                                     deviceTag_0)
        }
        if (!(typeof(validFrom_0) === 'bigint' && validFrom_0 >= 0n && validFrom_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Uint<0..18446744073709551616>',
                                     validFrom_0)
        }
        if (!(typeof(validUntil_0) === 'bigint' && validUntil_0 >= 0n && validUntil_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('authorizeDoorKey',
                                     'argument 6 (argument 7 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 392 char 1',
                                     'Uint<0..18446744073709551616>',
                                     validUntil_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(eventId_0).concat(_descriptor_3.toValue(gateId_0).concat(_descriptor_10.toValue(keyId_0).concat(_descriptor_1.toValue(deviceTag_0).concat(_descriptor_3.toValue(validFrom_0).concat(_descriptor_3.toValue(validUntil_0)))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_10.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment())))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._authorizeDoorKey_0(context,
                                                        partialProofData,
                                                        eventId_0,
                                                        gateId_0,
                                                        keyId_0,
                                                        deviceTag_0,
                                                        validFrom_0,
                                                        validUntil_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      revokeDoorKey: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`revokeDoorKey: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const keyId_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('revokeDoorKey',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 412 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(keyId_0) === 'bigint' && keyId_0 >= 0 && keyId_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('revokeDoorKey',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 412 char 1',
                                     'Field',
                                     keyId_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_10.toValue(keyId_0),
            alignment: _descriptor_10.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._revokeDoorKey_0(context,
                                                     partialProofData,
                                                     keyId_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      admitByDoor: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`admitByDoor: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serial_0 = args_1[1];
        const nonce_0 = args_1[2];
        const gateId_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('admitByDoor',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 421 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.typeError('admitByDoor',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 421 char 1',
                                     'Uint<0..340282366920938463463374607431768211456>',
                                     serial_0)
        }
        if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
          __compactRuntime.typeError('admitByDoor',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 421 char 1',
                                     'Bytes<32>',
                                     nonce_0)
        }
        if (!(typeof(gateId_0) === 'bigint' && gateId_0 >= 0n && gateId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('admitByDoor',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 421 char 1',
                                     'Uint<0..18446744073709551616>',
                                     gateId_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(serial_0).concat(_descriptor_1.toValue(nonce_0).concat(_descriptor_3.toValue(gateId_0))),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._admitByDoor_0(context,
                                                   partialProofData,
                                                   serial_0,
                                                   nonce_0,
                                                   gateId_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      admitByDoor4: async (...args_1) => {
        if (args_1.length !== 4) {
          throw new __compactRuntime.CompactError(`admitByDoor4: expected 4 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const serials_0 = args_1[1];
        const nonces_0 = args_1[2];
        const gateId_0 = args_1[3];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('admitByDoor4',
                                     'argument 1 (as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 471 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(Array.isArray(serials_0) && serials_0.length === 4 && serials_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 340282366920938463463374607431768211455n))) {
          __compactRuntime.typeError('admitByDoor4',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 471 char 1',
                                     'Vector<4, Uint<0..340282366920938463463374607431768211456>>',
                                     serials_0)
        }
        if (!(Array.isArray(nonces_0) && nonces_0.length === 4 && nonces_0.every((t) => t.buffer instanceof ArrayBuffer && t.BYTES_PER_ELEMENT === 1 && t.length === 32))) {
          __compactRuntime.typeError('admitByDoor4',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 471 char 1',
                                     'Vector<4, Bytes<32>>',
                                     nonces_0)
        }
        if (!(typeof(gateId_0) === 'bigint' && gateId_0 >= 0n && gateId_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('admitByDoor4',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'cloaktix-egg40.compact line 471 char 1',
                                     'Uint<0..18446744073709551616>',
                                     gateId_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_8.toValue(serials_0).concat(_descriptor_9.toValue(nonces_0).concat(_descriptor_3.toValue(gateId_0))),
            alignment: _descriptor_8.alignment().concat(_descriptor_9.alignment().concat(_descriptor_3.alignment()))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._admitByDoor4_0(context,
                                                    partialProofData,
                                                    serials_0,
                                                    nonces_0,
                                                    gateId_0);
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
      adminSet: this.circuits.adminSet,
      authorizeDoorKey: this.circuits.authorizeDoorKey,
      revokeDoorKey: this.circuits.revokeDoorKey,
      admitByDoor: this.circuits.admitByDoor,
      admitByDoor4: this.circuits.admitByDoor4
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
      adminSet: this.circuits.adminSet,
      authorizeDoorKey: this.circuits.authorizeDoorKey,
      revokeDoorKey: this.circuits.revokeDoorKey,
      admitByDoor: this.circuits.admitByDoor,
      admitByDoor4: this.circuits.admitByDoor4
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 9) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 9 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const feeBps__0 = args_0[1];
    const feeAddress__0 = args_0[2];
    const admin__0 = args_0[3];
    const ageIssuer__0 = args_0[4];
    const rateSigner__0 = args_0[5];
    const networkTag__0 = args_0[6];
    const maxQuoteAge__0 = args_0[7];
    const slippageBps__0 = args_0[8];
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
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'Uint<0..65536>',
                                 feeBps__0)
    }
    if (!(typeof(feeAddress__0) === 'object' && feeAddress__0.bytes.buffer instanceof ArrayBuffer && feeAddress__0.bytes.BYTES_PER_ELEMENT === 1 && feeAddress__0.bytes.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'struct UserAddress<bytes: Bytes<32>>',
                                 feeAddress__0)
    }
    if (!(admin__0.buffer instanceof ArrayBuffer && admin__0.BYTES_PER_ELEMENT === 1 && admin__0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'Bytes<32>',
                                 admin__0)
    }
    if (!(typeof(ageIssuer__0.x) === 'bigint' && ageIssuer__0.x >= 0n && ageIssuer__0.x <= __compactRuntime.MAX_FIELD && typeof(ageIssuer__0.y) === 'bigint' && ageIssuer__0.y >= 0n && ageIssuer__0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 4 (argument 5 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'JubjubPoint',
                                 ageIssuer__0)
    }
    if (!(typeof(rateSigner__0.x) === 'bigint' && rateSigner__0.x >= 0n && rateSigner__0.x <= __compactRuntime.MAX_FIELD && typeof(rateSigner__0.y) === 'bigint' && rateSigner__0.y >= 0n && rateSigner__0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 5 (argument 6 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'JubjubPoint',
                                 rateSigner__0)
    }
    if (!(networkTag__0.buffer instanceof ArrayBuffer && networkTag__0.BYTES_PER_ELEMENT === 1 && networkTag__0.length === 32)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 6 (argument 7 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'Bytes<32>',
                                 networkTag__0)
    }
    if (!(typeof(maxQuoteAge__0) === 'bigint' && maxQuoteAge__0 >= 0n && maxQuoteAge__0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 7 (argument 8 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'Uint<0..18446744073709551616>',
                                 maxQuoteAge__0)
    }
    if (!(typeof(slippageBps__0) === 'bigint' && slippageBps__0 >= 0n && slippageBps__0 <= 65535n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 8 (argument 9 as invoked from Typescript)',
                                 'cloaktix-egg40.compact line 82 char 1',
                                 'Uint<0..65536>',
                                 slippageBps__0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    let stateValue_2 = __compactRuntime.StateValue.newArray();
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_2 = stateValue_2.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_2);
    let stateValue_1 = __compactRuntime.StateValue.newArray();
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_1 = stateValue_1.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(stateValue_1);
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
    state_0.setOperation('adminSet', new __compactRuntime.ContractOperation());
    state_0.setOperation('authorizeDoorKey', new __compactRuntime.ContractOperation());
    state_0.setOperation('revokeDoorKey', new __compactRuntime.ContractOperation());
    state_0.setOperation('admitByDoor', new __compactRuntime.ContractOperation());
    state_0.setOperation('admitByDoor4', new __compactRuntime.ContractOperation());
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
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(0n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(0n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(1n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(2n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(0n),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(3n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue({ bytes: new Uint8Array(32) }),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(0n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(1n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(2n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(3n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(0n),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(4n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(false),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(5n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(6n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(7n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(8n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(9n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(10n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(11n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(12n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(13n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(14n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    let t_0;
    __compactRuntime.assert((t_0 = feeBps__0, t_0 <= 10000n), 'feeBps > 100%');
    let t_1;
    __compactRuntime.assert((t_1 = slippageBps__0, t_1 <= 2000n),
                            'slippage too high');
    let t_2, t_3;
    __compactRuntime.assert((t_3 = maxQuoteAge__0, t_3 >= 60n)
                            &&
                            (t_2 = maxQuoteAge__0, t_2 <= 600n),
                            'quote window out of range');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(2n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(feeBps__0),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(3n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_12.toValue(feeAddress__0),
                                                                                              alignment: _descriptor_12.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(0n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(admin__0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(13n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(ageIssuer__0),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(1n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(rateSigner__0),
                                                                                              alignment: _descriptor_14.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(1n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(networkTag__0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(2n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(maxQuoteAge__0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(3n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_20.toValue(slippageBps__0),
                                                                                              alignment: _descriptor_20.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 3n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(0n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(0n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(tmp_0),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(4n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(false),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
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
                                                                                        value: { value: _descriptor_34.toValue(2n),
                                                                                                 alignment: _descriptor_34.alignment() } }] } },
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
  async _blockTimeGt_0(context, partialProofData, time_0) {
    return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                     partialProofData,
                                                                     [
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(time_0),
                                                                                                                             alignment: _descriptor_3.alignment() }).encode() } },
                                                                      { dup: { n: 3 } },
                                                                      { idx: { cached: true,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_34.toValue(2n),
                                                                                                 alignment: _descriptor_34.alignment() } }] } },
                                                                      'lt',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value);
  }
  async _blockTimeLte_0(context, partialProofData, time_0) {
    return !await this._blockTimeGt_0(context, partialProofData, time_0);
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
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_31.toValue(tmp_0),
                                                                                              alignment: _descriptor_31.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(8n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.alignedConcat(
                                                                                              { value: _descriptor_31.toValue(tmp_1),
                                                                                                alignment: _descriptor_31.alignment() },
                                                                                              { value: _descriptor_32.toValue(recipient_0),
                                                                                                alignment: _descriptor_32.alignment() }
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
                      _descriptor_16.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                 partialProofData,
                                                                                 [
                                                                                  { dup: { n: 2 } },
                                                                                  { idx: { cached: true,
                                                                                           pushPath: false,
                                                                                           path: [
                                                                                                  { tag: 'value',
                                                                                                    value: { value: _descriptor_34.toValue(0n),
                                                                                                             alignment: _descriptor_34.alignment() } }] } },
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
                                                           value: { value: _descriptor_34.toValue(6n),
                                                                    alignment: _descriptor_34.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_31.toValue(tmp_2),
                                                                                                alignment: _descriptor_31.alignment() }).encode() } },
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
                                                         value: { value: _descriptor_34.toValue(6n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_31.toValue(tmp_0),
                                                                                              alignment: _descriptor_31.alignment() }).encode() } },
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
    const result_0 = __compactRuntime.transientHash(_descriptor_30, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_29, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_21, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_27, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_28, value_0);
    return result_0;
  }
  _persistentHash_3(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_1, value_0);
    return result_0;
  }
  _persistentHash_4(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_26, value_0);
    return result_0;
  }
  _persistentHash_5(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_16, value_0);
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
                                 'cloaktix-egg40.compact line 16 char 1',
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
                                 'cloaktix-egg40.compact line 17 char 1',
                                 'struct Maybe<is_some: Boolean, value: struct AgeCredential<claim: struct AgeClaim<holder: Bytes<32>, adultFrom: Uint<0..18446744073709551616>>, proof: struct AgeProof<issuerMethod: Bytes<32>, createdAt: Uint<0..18446744073709551616>, challengeHash: Bytes<32>, publicKey: JubjubPoint, signature: struct AgeSignature<r: JubjubPoint, s: Field>>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_24.toValue(result_0),
      alignment: _descriptor_24.alignment()
    });
    return result_0;
  }
  _wit_DoorSK_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.wit_DoorSK(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('wit_DoorSK',
                                 'return value',
                                 'cloaktix-egg40.compact line 18 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _maxDoorKeySeconds_0() { return 172800n; }
  async _me_0(context, partialProofData) {
    return this._persistentHash_3(this._wit_CloakSK_0(context, partialProofData));
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
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(4n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value),
                            'Paused');
    return [];
  }
  _emptyCommit_0() {
    return new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  async _checkFee_0(context, partialProofData, p_0, f_0) {
    const pb_0 = p_0
                 *
                 _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(0n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(2n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    let t_0;
    __compactRuntime.assert((t_0 = f_0 * 10000n, t_0 <= pb_0), 'fee too high');
    __compactRuntime.assert(pb_0 < (f_0 + 1n) * 10000n, 'fee too low');
    return [];
  }
  async _pay_0(context, partialProofData, amount_0, fee_0, to_0) {
    __compactRuntime.assert(amount_0 >= fee_0, 'fee > amount');
    await this._receiveUnshielded_0(context,
                                    partialProofData,
                                    this._nativeToken_0(),
                                    amount_0);
    if (fee_0 > 0n) {
      await this._sendUnshielded_0(context,
                                   partialProofData,
                                   this._nativeToken_0(),
                                   fee_0,
                                   this._right_0(_descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                            partialProofData,
                                                                                                            [
                                                                                                             { dup: { n: 0 } },
                                                                                                             { idx: { cached: false,
                                                                                                                      pushPath: false,
                                                                                                                      path: [
                                                                                                                             { tag: 'value',
                                                                                                                               value: { value: _descriptor_34.toValue(0n),
                                                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                                                             { tag: 'value',
                                                                                                                               value: { value: _descriptor_34.toValue(3n),
                                                                                                                                        alignment: _descriptor_34.alignment() } }] } },
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
  _rateChallenge_0(atomsPerUsdCent_0,
                   issuedAt_0,
                   expiresAt_0,
                   networkTag__0,
                   contractKey_0,
                   r_0)
  {
    const body_0 = this._persistentHash_1([new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 114, 97, 116, 101, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                           this._upgradeFromTransient_0(this._transientHash_0(atomsPerUsdCent_0)),
                                           this._upgradeFromTransient_0(this._transientHash_0(issuedAt_0)),
                                           this._upgradeFromTransient_0(this._transientHash_0(expiresAt_0)),
                                           networkTag__0]);
    return this._degradeToTransient_0(this._persistentHash_2([body_0,
                                                              contractKey_0,
                                                              this._upgradeFromTransient_0(this._transientHash_1([this._jubjubPointX_0(r_0),
                                                                                                                  this._jubjubPointY_0(r_0)]))]));
  }
  async _contractKey_0(context, partialProofData) {
    return this._persistentHash_5(_descriptor_16.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                             partialProofData,
                                                                                             [
                                                                                              { dup: { n: 2 } },
                                                                                              { idx: { cached: true,
                                                                                                       pushPath: false,
                                                                                                       path: [
                                                                                                              { tag: 'value',
                                                                                                                value: { value: _descriptor_34.toValue(0n),
                                                                                                                         alignment: _descriptor_34.alignment() } }] } },
                                                                                              { popeq: { cached: true,
                                                                                                         result: undefined } }]).value));
  }
  async _assertCoversUsd_0(context,
                           partialProofData,
                           usdCents_0,
                           atomsPerUsdCent_0,
                           paid_0)
  {
    const required_0 = usdCents_0 * atomsPerUsdCent_0;
    let t_0, t_1;
    const keep_0 = (t_0 = 10000n,
                    (t_1 = _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(3n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                     (__compactRuntime.assert(t_0 >= t_1,
                                              'result of subtraction would be negative'),
                      t_0 - t_1)));
    let t_2;
    __compactRuntime.assert((t_2 = paid_0 * 10000n, t_2 >= required_0 * keep_0),
                            'NIGHT payment below USD quote');
    return [];
  }
  async _assertFreshQuote_0(context, partialProofData, q_0, now_0) {
    const issued_0 = q_0.issuedAt;
    const exp_0 = q_0.expiresAt;
    const t_0 = now_0;
    __compactRuntime.assert(exp_0 > issued_0, 'quote window inverted');
    let t_1;
    __compactRuntime.assert((t_1 = (__compactRuntime.assert(exp_0 >= issued_0,
                                                            'result of subtraction would be negative'),
                                    exp_0 - issued_0),
                             t_1
                             <=
                             _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(2n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'quote window too long');
    __compactRuntime.assert(t_0 >= issued_0, 'quote from the future');
    __compactRuntime.assert(t_0 <= exp_0, 'quote expired');
    __compactRuntime.assert(await this._blockTimeGte_0(context,
                                                       partialProofData,
                                                       issued_0),
                            'quote from the future (block time)');
    __compactRuntime.assert(await this._blockTimeLte_0(context,
                                                       partialProofData,
                                                       exp_0),
                            'quote expired (block time)');
    return [];
  }
  async _assertValidRateQuote_0(context, partialProofData, q_0, now_0) {
    await this._assertFreshQuote_0(context, partialProofData, q_0, now_0);
    const atoms_0 = q_0.atomsPerUsdCent;
    __compactRuntime.assert(atoms_0 > 0n, 'zero rate');
    const r_0 = q_0.signature.r;
    const s_0 = q_0.signature.s;
    const ch_0 = this._rateChallenge_0(atoms_0,
                                       q_0.issuedAt,
                                       q_0.expiresAt,
                                       _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                 partialProofData,
                                                                                                 [
                                                                                                  { dup: { n: 0 } },
                                                                                                  { idx: { cached: false,
                                                                                                           pushPath: false,
                                                                                                           path: [
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_34.toValue(0n),
                                                                                                                             alignment: _descriptor_34.alignment() } },
                                                                                                                  { tag: 'value',
                                                                                                                    value: { value: _descriptor_34.toValue(1n),
                                                                                                                             alignment: _descriptor_34.alignment() } }] } },
                                                                                                  { popeq: { cached: false,
                                                                                                             result: undefined } }]).value),
                                       await this._contractKey_0(context,
                                                                 partialProofData),
                                       r_0);
    __compactRuntime.assert(this._equal_1(this._ecMulGenerator_0(__compactRuntime.convertNumericToJubjubScalar(s_0)),
                                          this._ecAdd_0(r_0,
                                                        this._ecMul_0(_descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                                                 partialProofData,
                                                                                                                                 [
                                                                                                                                  { dup: { n: 0 } },
                                                                                                                                  { idx: { cached: false,
                                                                                                                                           pushPath: false,
                                                                                                                                           path: [
                                                                                                                                                  { tag: 'value',
                                                                                                                                                    value: { value: _descriptor_34.toValue(1n),
                                                                                                                                                             alignment: _descriptor_34.alignment() } },
                                                                                                                                                  { tag: 'value',
                                                                                                                                                    value: { value: _descriptor_34.toValue(1n),
                                                                                                                                                             alignment: _descriptor_34.alignment() } }] } },
                                                                                                                                  { popeq: { cached: false,
                                                                                                                                             result: undefined } }]).value),
                                                                      __compactRuntime.convertNumericToJubjubScalar(ch_0)))),
                            'Invalid rate quote signature');
    return [];
  }
  async _settleUsd_0(context,
                     partialProofData,
                     usdCents_0,
                     nightPaid_0,
                     fee_0,
                     to_0,
                     q_0,
                     now_0)
  {
    await this._assertValidRateQuote_0(context, partialProofData, q_0, now_0);
    const paid_0 = nightPaid_0;
    const f_0 = fee_0;
    await this._checkFee_0(context, partialProofData, paid_0, f_0);
    await this._assertCoversUsd_0(context,
                                  partialProofData,
                                  usdCents_0,
                                  q_0.atomsPerUsdCent,
                                  paid_0);
    await this._pay_0(context, partialProofData, paid_0, f_0, to_0);
    return [];
  }
  _ageChallenge_0(claim_0,
                  issuerMethod_0,
                  createdAt_0,
                  challengeHash_0,
                  publicKey_0,
                  r_0)
  {
    const body_0 = this._persistentHash_0(claim_0);
    const payload_0 = this._persistentHash_1([body_0,
                                              new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 118, 99, 58, 105, 115, 115, 117, 97, 110, 99, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                              issuerMethod_0,
                                              this._upgradeFromTransient_0(this._transientHash_0(createdAt_0)),
                                              challengeHash_0]);
    return this._degradeToTransient_0(this._persistentHash_2([payload_0,
                                                              this._upgradeFromTransient_0(this._transientHash_1([this._jubjubPointX_0(publicKey_0),
                                                                                                                  this._jubjubPointY_0(publicKey_0)])),
                                                              this._upgradeFromTransient_0(this._transientHash_1([this._jubjubPointX_0(r_0),
                                                                                                                  this._jubjubPointY_0(r_0)]))]));
  }
  async _assertAdult_0(context, partialProofData, asOf_0) {
    const m_0 = this._wit_AgeCredential_0(context, partialProofData);
    __compactRuntime.assert(m_0.is_some, 'No age credential');
    const c_0 = m_0.value;
    __compactRuntime.assert(this._equal_2(c_0.claim.holder,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Age credential not for this identity');
    let t_0;
    __compactRuntime.assert((t_0 = c_0.claim.adultFrom, t_0 <= asOf_0),
                            'Under 18');
    __compactRuntime.assert(await this._blockTimeGte_0(context,
                                                       partialProofData,
                                                       asOf_0),
                            'asOf in the future');
    __compactRuntime.assert(this._equal_3(c_0.proof.publicKey,
                                          _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_34.toValue(1n),
                                                                                                                                 alignment: _descriptor_34.alignment() } },
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_34.toValue(13n),
                                                                                                                                 alignment: _descriptor_34.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Untrusted age issuer');
    const ch_0 = this._ageChallenge_0(c_0.claim,
                                      c_0.proof.issuerMethod,
                                      c_0.proof.createdAt,
                                      c_0.proof.challengeHash,
                                      c_0.proof.publicKey,
                                      c_0.proof.signature.r);
    __compactRuntime.assert(this._equal_4(this._ecMulGenerator_0(__compactRuntime.convertNumericToJubjubScalar(c_0.proof.signature.s)),
                                          this._ecAdd_0(c_0.proof.signature.r,
                                                        this._ecMul_0(c_0.proof.publicKey,
                                                                      __compactRuntime.convertNumericToJubjubScalar(ch_0)))),
                            'Invalid age credential signature');
    return [];
  }
  async _createEvent_0(context, partialProofData, payout_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-egg40.compact line 199 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
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
                                                                                                 value: { value: _descriptor_34.toValue(1n),
                                                                                                          alignment: _descriptor_34.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_34.toValue(9n),
                                                                                                          alignment: _descriptor_34.alignment() } }] } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(5n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(id_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(tmp_0),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(9n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_20.toValue(tmp_1),
                                                                alignment: _descriptor_20.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    return id_0;
  }
  async _addTicketType_0(context,
                         partialProofData,
                         eventId_0,
                         priceUsdCents_0,
                         supply_0,
                         resale_0,
                         maxResaleUsdCents_0,
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(5n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    __compactRuntime.assert(this._equal_5(_descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                     partialProofData,
                                                                                                     [
                                                                                                      { dup: { n: 0 } },
                                                                                                      { idx: { cached: false,
                                                                                                               pushPath: false,
                                                                                                               path: [
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_34.toValue(1n),
                                                                                                                                 alignment: _descriptor_34.alignment() } },
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_34.toValue(5n),
                                                                                                                                 alignment: _descriptor_34.alignment() } }] } },
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
    const cents_0 = priceUsdCents_0;
    __compactRuntime.assert(cents_0 > 0n, 'zero USD price');
    const id_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                           partialProofData,
                                                                           [
                                                                            { dup: { n: 0 } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(10n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
                                                                            { popeq: { cached: true,
                                                                                       result: undefined } }]).value)
                 +
                 1n;
    const tmp_0 = { eventId: e_0,
                    priceUsdCents: cents_0,
                    supply: supply_0,
                    sold: 0n,
                    resale: resale_0,
                    maxResaleUsdCents: resale_0 === 0 ? maxResaleUsdCents_0 : 0n,
                    adultOnly: adultOnly_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(6n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(id_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_0),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_1 = 1n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(10n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_20.toValue(tmp_1),
                                                                alignment: _descriptor_20.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(5n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    const ev_0 = _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(5n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_3.toValue(e_0),
                                                                                                        alignment: _descriptor_3.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(this._equal_6(ev_0.organizer,
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(5n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(tmp_0),
                                                                                              alignment: _descriptor_13.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _mintOwned_0(context,
                     partialProofData,
                     typeId_0,
                     admitCommit_0,
                     nightPaid_0,
                     fee_0,
                     q_0,
                     now_0)
  {
    const t_0 = typeId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(6n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(6n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
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
                  _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_34.toValue(1n),
                                                                                                         alignment: _descriptor_34.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_34.toValue(5n),
                                                                                                         alignment: _descriptor_34.alignment() } }] } },
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
    await this._settleUsd_0(context,
                            partialProofData,
                            tt_0.priceUsdCents,
                            nightPaid_0,
                            fee_0,
                            ev_0.payout,
                            q_0,
                            now_0);
    const serial_0 = _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_34.toValue(1n),
                                                                                                           alignment: _descriptor_34.alignment() } },
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_34.toValue(11n),
                                                                                                           alignment: _descriptor_34.alignment() } }] } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(11n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_20.toValue(tmp_1),
                                                                alignment: _descriptor_20.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    const commit_0 = admitCommit_0;
    const has_0 = !this._equal_7(commit_0, this._emptyCommit_0());
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(serial_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_3 = { eventId: tt_0.eventId,
                    priceUsdCents: tt_0.priceUsdCents,
                    supply: tt_0.supply,
                    sold:
                      ((t1) => {
                        if (t1 > 18446744073709551615n) {
                          throw new __compactRuntime.CompactError('cloaktix-egg40.compact line 247 char 11: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                        }
                        return t1;
                      })(tt_0.sold + 1n),
                    resale: tt_0.resale,
                    maxResaleUsdCents: tt_0.maxResaleUsdCents,
                    adultOnly: tt_0.adultOnly };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(6n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(tmp_3),
                                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return serial_0;
  }
  async _sellPrimary_0(context,
                       partialProofData,
                       typeId_0,
                       admitCommit_0,
                       nightPaid_0,
                       fee_0,
                       q_0,
                       now_0,
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(6n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(t_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No ticket type');
    __compactRuntime.assert(adultProven_0
                            ||
                            !_descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(6n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(t_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value).adultOnly,
                            '18+ ticket type: age proof required');
    return await this._mintOwned_0(context,
                                   partialProofData,
                                   t_0,
                                   admitCommit_0,
                                   nightPaid_0,
                                   fee_0,
                                   q_0,
                                   now_0);
  }
  async _buyTicket_0(context,
                     partialProofData,
                     typeId_0,
                     admitCommit_0,
                     nightPaid_0,
                     fee_0,
                     q_0,
                     now_0)
  {
    return await this._sellPrimary_0(context,
                                     partialProofData,
                                     typeId_0,
                                     admitCommit_0,
                                     nightPaid_0,
                                     fee_0,
                                     q_0,
                                     now_0,
                                     false);
  }
  async _buyTicketAdult_0(context,
                          partialProofData,
                          typeId_0,
                          admitCommit_0,
                          nightPaid_0,
                          fee_0,
                          q_0,
                          now_0,
                          asOf_0)
  {
    await this._assertAdult_0(context, partialProofData, asOf_0);
    return await this._sellPrimary_0(context,
                                     partialProofData,
                                     typeId_0,
                                     admitCommit_0,
                                     nightPaid_0,
                                     fee_0,
                                     q_0,
                                     now_0,
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(this._equal_8(tk_0.owner,
                                          await this._me_0(context,
                                                           partialProofData)),
                            'Not ticket owner');
    const c_0 = commit_0;
    const clearing_0 = this._equal_9(c_0, this._emptyCommit_0());
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _listForResale_0(context,
                         partialProofData,
                         serial_0,
                         priceUsdCents_0,
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
                                                                            { idx: { cached: false,
                                                                                     pushPath: false,
                                                                                     path: [
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_0.toValue(s_0),
                                                                                                       alignment: _descriptor_0.alignment() } }] } },
                                                                            { popeq: { cached: false,
                                                                                       result: undefined } }]).value);
    __compactRuntime.assert(tk_0.status === 0, 'Not owned');
    __compactRuntime.assert(this._equal_10(tk_0.owner,
                                           await this._me_0(context,
                                                            partialProofData)),
                            'Not ticket owner');
    let tmp_0;
    const tt_0 = (tmp_0 = tk_0.typeId,
                  _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(6n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                        alignment: _descriptor_0.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value));
    __compactRuntime.assert(tt_0.resale !== 2, 'Resale not allowed');
    const cents_0 = priceUsdCents_0;
    __compactRuntime.assert(cents_0 > 0n, 'zero USD resale');
    __compactRuntime.assert(tt_0.resale === 1
                            ||
                            cents_0 <= tt_0.maxResaleUsdCents,
                            'Above max resale USD');
    const id_0 = ((t1) => {
                   if (t1 > 18446744073709551615n) {
                     throw new __compactRuntime.CompactError('cloaktix-egg40.compact line 296 char 14: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
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
                                                                                                 value: { value: _descriptor_34.toValue(1n),
                                                                                                          alignment: _descriptor_34.alignment() } },
                                                                                               { tag: 'value',
                                                                                                 value: { value: _descriptor_34.toValue(12n),
                                                                                                          alignment: _descriptor_34.alignment() } }] } },
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(12n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                                              { value: _descriptor_20.toValue(tmp_1),
                                                                alignment: _descriptor_20.alignment() }
                                                                .value
                                                            )) } },
                                       { ins: { cached: true, n: 2 } }]);
    const newEpoch_0 = ((t1) => {
                         if (t1 > 18446744073709551615n) {
                           throw new __compactRuntime.CompactError('cloaktix-egg40.compact line 298 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    const tmp_3 = { seller: await this._me_0(context, partialProofData),
                    payout: payout_0,
                    serial: s_0,
                    typeId: tk_0.typeId,
                    priceUsdCents: cents_0 };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(8n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(id_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_19.toValue(tmp_3),
                                                                                              alignment: _descriptor_19.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return id_0;
  }
  async _sellResale_0(context,
                      partialProofData,
                      listingId_0,
                      nightPaid_0,
                      fee_0,
                      q_0,
                      now_0,
                      adultProven_0)
  {
    const l_0 = listingId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(8n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(l_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No listing');
    const li_0 = _descriptor_19.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(8n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
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
                       this._equal_11(li_0.seller,
                                      await this._me_0(context, partialProofData));
    if (!withdraw_0) {
      await this._assertNotPaused_0(context, partialProofData);
      let tmp_0;
      __compactRuntime.assert(adultProven_0
                              ||
                              !(tmp_0 = li_0.typeId,
                                _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                          partialProofData,
                                                                                          [
                                                                                           { dup: { n: 0 } },
                                                                                           { idx: { cached: false,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_34.toValue(1n),
                                                                                                                      alignment: _descriptor_34.alignment() } },
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_34.toValue(6n),
                                                                                                                      alignment: _descriptor_34.alignment() } }] } },
                                                                                           { idx: { cached: false,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                                      alignment: _descriptor_0.alignment() } }] } },
                                                                                           { popeq: { cached: false,
                                                                                                      result: undefined } }]).value)).adultOnly,
                              '18+ ticket type: age proof required');
      await this._settleUsd_0(context,
                              partialProofData,
                              li_0.priceUsdCents,
                              nightPaid_0,
                              fee_0,
                              li_0.payout,
                              q_0,
                              now_0);
    }
    const newOwner_0 = await this._me_0(context, partialProofData);
    const newEpoch_0 = ((t1) => {
                         if (t1 > 18446744073709551615n) {
                           throw new __compactRuntime.CompactError('cloaktix-egg40.compact line 323 char 20: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(8n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(l_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { rem: { cached: false } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _buyResale_0(context,
                     partialProofData,
                     listingId_0,
                     nightPaid_0,
                     fee_0,
                     q_0,
                     now_0)
  {
    await this._sellResale_0(context,
                             partialProofData,
                             listingId_0,
                             nightPaid_0,
                             fee_0,
                             q_0,
                             now_0,
                             false);
    return [];
  }
  async _buyResaleAdult_0(context,
                          partialProofData,
                          listingId_0,
                          nightPaid_0,
                          fee_0,
                          q_0,
                          now_0,
                          asOf_0)
  {
    await this._assertAdult_0(context, partialProofData, asOf_0);
    await this._sellResale_0(context,
                             partialProofData,
                             listingId_0,
                             nightPaid_0,
                             fee_0,
                             q_0,
                             now_0,
                             true);
    return [];
  }
  async _admitCommitFor_0(context, partialProofData, serial_0, epoch_0, nonce_0)
  {
    return this._persistentHash_4({ tag:
                                      new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 97, 100, 109, 105, 116, 58, 118, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    networkTag:
                                      _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 0 } },
                                                                                                 { idx: { cached: false,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_34.toValue(0n),
                                                                                                                            alignment: _descriptor_34.alignment() } },
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_34.toValue(1n),
                                                                                                                            alignment: _descriptor_34.alignment() } }] } },
                                                                                                 { popeq: { cached: false,
                                                                                                            result: undefined } }]).value),
                                    contractKey:
                                      await this._contractKey_0(context,
                                                                partialProofData),
                                    serial: serial_0,
                                    epoch: epoch_0,
                                    nonce: nonce_0 });
  }
  _contractKeyOf_0(addr_0) { return this._persistentHash_5(addr_0); }
  _admitCommitOf_0(networkTag__0, contractKey__0, serial_0, epoch_0, nonce_0) {
    return this._persistentHash_4({ tag:
                                      new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 97, 100, 109, 105, 116, 58, 118, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    networkTag: networkTag__0,
                                    contractKey: contractKey__0,
                                    serial: serial_0,
                                    epoch: epoch_0,
                                    nonce: nonce_0 });
  }
  _accountId_0(sk_0) { return this._persistentHash_3(sk_0); }
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
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
                  _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(6n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
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
                  _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_34.toValue(1n),
                                                                                                         alignment: _descriptor_34.alignment() } },
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_34.toValue(5n),
                                                                                                         alignment: _descriptor_34.alignment() } }] } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_3.toValue(tmp_1),
                                                                                                         alignment: _descriptor_3.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value));
    __compactRuntime.assert(this._equal_12(ev_0.organizer,
                                           await this._me_0(context,
                                                            partialProofData)),
                            'Not gate/organizer');
    const n_0 = nonce_0;
    __compactRuntime.assert(this._equal_13(tk_0.admitCommit,
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _adminSet_0(context,
                    partialProofData,
                    paused__0,
                    newIssuer_0,
                    newRateSigner_0)
  {
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
                                                                                                                        value: { value: _descriptor_34.toValue(1n),
                                                                                                                                 alignment: _descriptor_34.alignment() } },
                                                                                                                      { tag: 'value',
                                                                                                                        value: { value: _descriptor_34.toValue(0n),
                                                                                                                                 alignment: _descriptor_34.alignment() } }] } },
                                                                                                      { popeq: { cached: false,
                                                                                                                 result: undefined } }]).value)),
                            'Not admin');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(4n),
                                                                                              alignment: _descriptor_34.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(paused__0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    if (newIssuer_0.is_some) {
      const tmp_0 = newIssuer_0.value;
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_34.toValue(1n),
                                                                    alignment: _descriptor_34.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(13n),
                                                                                                alignment: _descriptor_34.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(tmp_0),
                                                                                                alignment: _descriptor_14.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    if (newRateSigner_0.is_some) {
      const tmp_1 = newRateSigner_0.value;
      __compactRuntime.queryLedgerState(context,
                                        partialProofData,
                                        [
                                         { idx: { cached: false,
                                                  pushPath: true,
                                                  path: [
                                                         { tag: 'value',
                                                           value: { value: _descriptor_34.toValue(1n),
                                                                    alignment: _descriptor_34.alignment() } }] } },
                                         { push: { storage: false,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_34.toValue(1n),
                                                                                                alignment: _descriptor_34.alignment() }).encode() } },
                                         { push: { storage: true,
                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_14.toValue(tmp_1),
                                                                                                alignment: _descriptor_14.alignment() }).encode() } },
                                         { ins: { cached: false, n: 1 } },
                                         { ins: { cached: true, n: 1 } }]);
    }
    return [];
  }
  _doorKeyIdOf_0(sk_0) {
    return this._transientHash_2([new Uint8Array([99, 108, 111, 97, 107, 116, 105, 120, 58, 100, 111, 111, 114, 45, 107, 101, 121, 58, 118, 49, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                  sk_0]);
  }
  async _authorizeDoorKey_0(context,
                            partialProofData,
                            eventId_0,
                            gateId_0,
                            keyId_0,
                            deviceTag_0,
                            validFrom_0,
                            validUntil_0)
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
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(5n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(e_0),
                                                                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No event');
    __compactRuntime.assert(this._equal_15(_descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                      partialProofData,
                                                                                                      [
                                                                                                       { dup: { n: 0 } },
                                                                                                       { idx: { cached: false,
                                                                                                                pushPath: false,
                                                                                                                path: [
                                                                                                                       { tag: 'value',
                                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                                       { tag: 'value',
                                                                                                                         value: { value: _descriptor_34.toValue(5n),
                                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
    const g_0 = gateId_0;
    __compactRuntime.assert(g_0 !== 0n, 'No door');
    const k_0 = keyId_0;
    __compactRuntime.assert(k_0 !== 0n, 'Empty door key');
    __compactRuntime.assert(!_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(14n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                                                                               alignment: _descriptor_10.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Door key already used');
    const vf_0 = validFrom_0;
    const vu_0 = validUntil_0;
    __compactRuntime.assert(vu_0 > vf_0, 'Door key window inverted');
    let t_0;
    __compactRuntime.assert((t_0 = (__compactRuntime.assert(vu_0 >= vf_0,
                                                            'result of subtraction would be negative'),
                                    vu_0 - vf_0),
                             t_0 <= this._maxDoorKeySeconds_0()),
                            'Door key window over 48 h');
    __compactRuntime.assert(await this._blockTimeLt_0(context,
                                                      partialProofData,
                                                      vu_0),
                            'Door key already expired');
    const tmp_0 = { eventId: e_0,
                    gateId: g_0,
                    deviceTag: deviceTag_0,
                    validFrom: vf_0,
                    validUntil: vu_0,
                    active: true };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(14n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(tmp_0),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _revokeDoorKey_0(context, partialProofData, keyId_0) {
    const k_0 = keyId_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(14n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'No door key');
    const dk_0 = _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(14n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_10.toValue(k_0),
                                                                                                        alignment: _descriptor_10.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    let tmp_0;
    __compactRuntime.assert(this._equal_16((tmp_0 = dk_0.eventId,
                                            _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                       partialProofData,
                                                                                                       [
                                                                                                        { dup: { n: 0 } },
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_34.toValue(5n),
                                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                                        { idx: { cached: false,
                                                                                                                 pushPath: false,
                                                                                                                 path: [
                                                                                                                        { tag: 'value',
                                                                                                                          value: { value: _descriptor_3.toValue(tmp_0),
                                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                                        { popeq: { cached: false,
                                                                                                                   result: undefined } }]).value)).organizer,
                                           await this._me_0(context,
                                                            partialProofData)),
                            'Not organizer');
    const tmp_1 = { eventId: dk_0.eventId,
                    gateId: dk_0.gateId,
                    deviceTag: dk_0.deviceTag,
                    validFrom: dk_0.validFrom,
                    validUntil: dk_0.validUntil,
                    active: false };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(14n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_11.toValue(tmp_1),
                                                                                              alignment: _descriptor_11.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _admitByDoor_0(context, partialProofData, serial_0, nonce_0, gateId_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const k_0 = this._doorKeyIdOf_0(this._wit_DoorSK_0(context, partialProofData));
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(14n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Unknown door key');
    const dk_0 = _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(14n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_10.toValue(k_0),
                                                                                                        alignment: _descriptor_10.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(dk_0.active, 'Door key revoked');
    __compactRuntime.assert(dk_0.gateId === gateId_0,
                            'Door key not for this door');
    __compactRuntime.assert(await this._blockTimeGte_0(context,
                                                       partialProofData,
                                                       dk_0.validFrom),
                            'Door key not yet valid');
    __compactRuntime.assert(await this._blockTimeLt_0(context,
                                                      partialProofData,
                                                      dk_0.validUntil),
                            'Door key expired');
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
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
    __compactRuntime.assert((tmp_0 = tk_0.typeId,
                             _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(6n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)).eventId
                            ===
                            dk_0.eventId,
                            'Door key not for this event');
    const n_0 = nonce_0;
    __compactRuntime.assert(this._equal_17(tk_0.admitCommit,
                                           await this._admitCommitFor_0(context,
                                                                        partialProofData,
                                                                        s_0,
                                                                        tk_0.epoch,
                                                                        n_0)),
                            'Bad admit');
    const tmp_1 = { typeId: tk_0.typeId,
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _doorKeyEventFor_0(context, partialProofData, gateId_0) {
    await this._assertNotPaused_0(context, partialProofData);
    const k_0 = this._doorKeyIdOf_0(this._wit_DoorSK_0(context, partialProofData));
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(14n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(k_0),
                                                                                                                                              alignment: _descriptor_10.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Unknown door key');
    const dk_0 = _descriptor_11.fromValue(__compactRuntime.queryLedgerState(context,
                                                                            partialProofData,
                                                                            [
                                                                             { dup: { n: 0 } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(1n),
                                                                                                        alignment: _descriptor_34.alignment() } },
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_34.toValue(14n),
                                                                                                        alignment: _descriptor_34.alignment() } }] } },
                                                                             { idx: { cached: false,
                                                                                      pushPath: false,
                                                                                      path: [
                                                                                             { tag: 'value',
                                                                                               value: { value: _descriptor_10.toValue(k_0),
                                                                                                        alignment: _descriptor_10.alignment() } }] } },
                                                                             { popeq: { cached: false,
                                                                                        result: undefined } }]).value);
    __compactRuntime.assert(dk_0.active, 'Door key revoked');
    __compactRuntime.assert(dk_0.gateId === gateId_0,
                            'Door key not for this door');
    __compactRuntime.assert(await this._blockTimeGte_0(context,
                                                       partialProofData,
                                                       dk_0.validFrom),
                            'Door key not yet valid');
    __compactRuntime.assert(await this._blockTimeLt_0(context,
                                                      partialProofData,
                                                      dk_0.validUntil),
                            'Door key expired');
    return dk_0.eventId;
  }
  async _consumeAtDoor_0(context, partialProofData, serial_0, nonce_0, eventId_0)
  {
    const s_0 = serial_0;
    __compactRuntime.assert(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(1n),
                                                                                                                  alignment: _descriptor_34.alignment() } },
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_34.toValue(7n),
                                                                                                                  alignment: _descriptor_34.alignment() } }] } },
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
                                                                                              value: { value: _descriptor_34.toValue(1n),
                                                                                                       alignment: _descriptor_34.alignment() } },
                                                                                            { tag: 'value',
                                                                                              value: { value: _descriptor_34.toValue(7n),
                                                                                                       alignment: _descriptor_34.alignment() } }] } },
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
    __compactRuntime.assert((tmp_0 = tk_0.typeId,
                             _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_34.toValue(6n),
                                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_0.toValue(tmp_0),
                                                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)).eventId
                            ===
                            eventId_0,
                            'Door key not for this event');
    const n_0 = nonce_0;
    __compactRuntime.assert(this._equal_18(tk_0.admitCommit,
                                           await this._admitCommitFor_0(context,
                                                                        partialProofData,
                                                                        s_0,
                                                                        tk_0.epoch,
                                                                        n_0)),
                            'Bad admit');
    const tmp_1 = { typeId: tk_0.typeId,
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
                                                         value: { value: _descriptor_34.toValue(1n),
                                                                  alignment: _descriptor_34.alignment() } },
                                                       { tag: 'value',
                                                         value: { value: _descriptor_34.toValue(7n),
                                                                  alignment: _descriptor_34.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(s_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _admitByDoor4_0(context, partialProofData, serials_0, nonces_0, gateId_0)
  {
    const e_0 = await this._doorKeyEventFor_0(context,
                                              partialProofData,
                                              gateId_0);
    await this._folder_0(context,
                         partialProofData,
                         (async (context, partialProofData, t_0, i_0) =>
                          {
                            await this._consumeAtDoor_0(context,
                                                        partialProofData,
                                                        serials_0[i_0],
                                                        nonces_0[i_0],
                                                        e_0);
                            return t_0;
                          }),
                         [],
                         [0n, 1n, 2n, 3n]);
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
    if (x0.x != y0.x || x0.y != y0.y) {
      return false;
    }
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
  _equal_15(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_16(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_17(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_18(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  async _folder_0(context, partialProofData, f, x, a0) {
    for (let i = 0; i < 4; i++) { x = await f(context, partialProofData, x, a0[i]); }
    return x;
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
      return _descriptor_34.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(0n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(0n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(0n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get feeBps() {
      return _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(0n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(2n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get feeAddress() {
      return _descriptor_12.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(0n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(3n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(0n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get rateSigner() {
      return _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(1n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(1n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    get maxQuoteAge() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(2n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get slippageBps() {
      return _descriptor_20.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(1n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(3n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(4n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(5n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(5n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 65 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(5n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 65 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_13.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_34.toValue(1n),
                                                                                                      alignment: _descriptor_34.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_34.toValue(5n),
                                                                                                      alignment: _descriptor_34.alignment() } }] } },
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
        const self_0 = state.asArray()[1].asArray()[5];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_3.fromValue(key.value),      _descriptor_13.fromValue(value.value)    ];  })[Symbol.iterator]();
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(6n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(6n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 66 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(6n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 66 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(6n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
        const self_0 = state.asArray()[1].asArray()[6];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_7.fromValue(value.value)    ];  })[Symbol.iterator]();
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(7n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(7n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 67 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(7n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 67 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(7n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
        const self_0 = state.asArray()[1].asArray()[7];
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(8n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(8n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 68 char 1',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(8n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                     'cloaktix-egg40.compact line 68 char 1',
                                     'Uint<0..18446744073709551616>',
                                     key_0)
        }
        return _descriptor_19.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_34.toValue(1n),
                                                                                                      alignment: _descriptor_34.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_34.toValue(8n),
                                                                                                      alignment: _descriptor_34.alignment() } }] } },
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
        const self_0 = state.asArray()[1].asArray()[8];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_3.fromValue(key.value),      _descriptor_19.fromValue(value.value)    ];  })[Symbol.iterator]();
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(9n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(10n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(11n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
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
                                                                                          value: { value: _descriptor_34.toValue(1n),
                                                                                                   alignment: _descriptor_34.alignment() } },
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_34.toValue(12n),
                                                                                                   alignment: _descriptor_34.alignment() } }] } },
                                                                        { popeq: { cached: true,
                                                                                   result: undefined } }]).value);
    },
    get ageIssuer() {
      return _descriptor_14.fromValue(__compactRuntime.queryLedgerState(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(1n),
                                                                                                    alignment: _descriptor_34.alignment() } },
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_34.toValue(13n),
                                                                                                    alignment: _descriptor_34.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value);
    },
    doorKeys: {
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(14n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(14n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'cloaktix-egg40.compact line 80 char 1',
                                     'Field',
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
                                                                                            value: { value: _descriptor_34.toValue(1n),
                                                                                                     alignment: _descriptor_34.alignment() } },
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_34.toValue(14n),
                                                                                                     alignment: _descriptor_34.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_10.toValue(key_0),
                                                                                                                                 alignment: _descriptor_10.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0 && key_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'cloaktix-egg40.compact line 80 char 1',
                                     'Field',
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
                                                                                             value: { value: _descriptor_34.toValue(1n),
                                                                                                      alignment: _descriptor_34.alignment() } },
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_34.toValue(14n),
                                                                                                      alignment: _descriptor_34.alignment() } }] } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_10.toValue(key_0),
                                                                                                      alignment: _descriptor_10.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[1].asArray()[14];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_10.fromValue(key.value),      _descriptor_11.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({
  wit_CloakSK: (...args) => undefined,
  wit_AgeCredential: (...args) => undefined,
  wit_DoorSK: (...args) => undefined
});
export const pureCircuits = {
  maxDoorKeySeconds: (...args_0) => {
    if (args_0.length !== 0) {
      throw new __compactRuntime.CompactError(`maxDoorKeySeconds: expected 0 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    return _dummyContract._maxDoorKeySeconds_0();
  },
  rateChallenge: (...args_0) => {
    if (args_0.length !== 6) {
      throw new __compactRuntime.CompactError(`rateChallenge: expected 6 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const atomsPerUsdCent_0 = args_0[0];
    const issuedAt_0 = args_0[1];
    const expiresAt_0 = args_0[2];
    const networkTag__0 = args_0[3];
    const contractKey_0 = args_0[4];
    const r_0 = args_0[5];
    if (!(typeof(atomsPerUsdCent_0) === 'bigint' && atomsPerUsdCent_0 >= 0n && atomsPerUsdCent_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 1',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'Uint<0..18446744073709551616>',
                                 atomsPerUsdCent_0)
    }
    if (!(typeof(issuedAt_0) === 'bigint' && issuedAt_0 >= 0n && issuedAt_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 2',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'Uint<0..18446744073709551616>',
                                 issuedAt_0)
    }
    if (!(typeof(expiresAt_0) === 'bigint' && expiresAt_0 >= 0n && expiresAt_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 3',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'Uint<0..18446744073709551616>',
                                 expiresAt_0)
    }
    if (!(networkTag__0.buffer instanceof ArrayBuffer && networkTag__0.BYTES_PER_ELEMENT === 1 && networkTag__0.length === 32)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 4',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'Bytes<32>',
                                 networkTag__0)
    }
    if (!(contractKey_0.buffer instanceof ArrayBuffer && contractKey_0.BYTES_PER_ELEMENT === 1 && contractKey_0.length === 32)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 5',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'Bytes<32>',
                                 contractKey_0)
    }
    if (!(typeof(r_0.x) === 'bigint' && r_0.x >= 0n && r_0.x <= __compactRuntime.MAX_FIELD && typeof(r_0.y) === 'bigint' && r_0.y >= 0n && r_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('rateChallenge',
                                 'argument 6',
                                 'cloaktix-egg40.compact line 121 char 1',
                                 'JubjubPoint',
                                 r_0)
    }
    return _dummyContract._rateChallenge_0(atomsPerUsdCent_0,
                                           issuedAt_0,
                                           expiresAt_0,
                                           networkTag__0,
                                           contractKey_0,
                                           r_0);
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
                                 'cloaktix-egg40.compact line 175 char 1',
                                 'struct AgeClaim<holder: Bytes<32>, adultFrom: Uint<0..18446744073709551616>>',
                                 claim_0)
    }
    if (!(issuerMethod_0.buffer instanceof ArrayBuffer && issuerMethod_0.BYTES_PER_ELEMENT === 1 && issuerMethod_0.length === 32)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 2',
                                 'cloaktix-egg40.compact line 175 char 1',
                                 'Bytes<32>',
                                 issuerMethod_0)
    }
    if (!(typeof(createdAt_0) === 'bigint' && createdAt_0 >= 0n && createdAt_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 3',
                                 'cloaktix-egg40.compact line 175 char 1',
                                 'Uint<0..18446744073709551616>',
                                 createdAt_0)
    }
    if (!(challengeHash_0.buffer instanceof ArrayBuffer && challengeHash_0.BYTES_PER_ELEMENT === 1 && challengeHash_0.length === 32)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 4',
                                 'cloaktix-egg40.compact line 175 char 1',
                                 'Bytes<32>',
                                 challengeHash_0)
    }
    if (!(typeof(publicKey_0.x) === 'bigint' && publicKey_0.x >= 0n && publicKey_0.x <= __compactRuntime.MAX_FIELD && typeof(publicKey_0.y) === 'bigint' && publicKey_0.y >= 0n && publicKey_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 5',
                                 'cloaktix-egg40.compact line 175 char 1',
                                 'JubjubPoint',
                                 publicKey_0)
    }
    if (!(typeof(r_0.x) === 'bigint' && r_0.x >= 0n && r_0.x <= __compactRuntime.MAX_FIELD && typeof(r_0.y) === 'bigint' && r_0.y >= 0n && r_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('ageChallenge',
                                 'argument 6',
                                 'cloaktix-egg40.compact line 175 char 1',
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
                                 'cloaktix-egg40.compact line 349 char 1',
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
    const contractKey__0 = args_0[1];
    const serial_0 = args_0[2];
    const epoch_0 = args_0[3];
    const nonce_0 = args_0[4];
    if (!(networkTag__0.buffer instanceof ArrayBuffer && networkTag__0.BYTES_PER_ELEMENT === 1 && networkTag__0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 1',
                                 'cloaktix-egg40.compact line 352 char 1',
                                 'Bytes<32>',
                                 networkTag__0)
    }
    if (!(contractKey__0.buffer instanceof ArrayBuffer && contractKey__0.BYTES_PER_ELEMENT === 1 && contractKey__0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 2',
                                 'cloaktix-egg40.compact line 352 char 1',
                                 'Bytes<32>',
                                 contractKey__0)
    }
    if (!(typeof(serial_0) === 'bigint' && serial_0 >= 0n && serial_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 3',
                                 'cloaktix-egg40.compact line 352 char 1',
                                 'Uint<0..340282366920938463463374607431768211456>',
                                 serial_0)
    }
    if (!(typeof(epoch_0) === 'bigint' && epoch_0 >= 0n && epoch_0 <= 18446744073709551615n)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 4',
                                 'cloaktix-egg40.compact line 352 char 1',
                                 'Uint<0..18446744073709551616>',
                                 epoch_0)
    }
    if (!(nonce_0.buffer instanceof ArrayBuffer && nonce_0.BYTES_PER_ELEMENT === 1 && nonce_0.length === 32)) {
      __compactRuntime.typeError('admitCommitOf',
                                 'argument 5',
                                 'cloaktix-egg40.compact line 352 char 1',
                                 'Bytes<32>',
                                 nonce_0)
    }
    return _dummyContract._admitCommitOf_0(networkTag__0,
                                           contractKey__0,
                                           serial_0,
                                           epoch_0,
                                           nonce_0);
  },
  accountId: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`accountId: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('accountId',
                                 'argument 1',
                                 'cloaktix-egg40.compact line 358 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._accountId_0(sk_0);
  },
  doorKeyIdOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`doorKeyIdOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('doorKeyIdOf',
                                 'argument 1',
                                 'cloaktix-egg40.compact line 388 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._doorKeyIdOf_0(sk_0);
  }
};
export const expectedVk = {
  'addTicketType': 'c60ab84d3fc89214f4359f83bff6b3c87db2cdc0e9133395a2a32e225b7927c3',
  'adminSet': '511019ec891c52e4a0d4df6deb0cb4ebd348d5f0258c94a4a3318e6d2152935e',
  'admit': '4805662155df1621bcd1d892dfc591041e5cb3b2d52387155d978ef5d774bbad',
  'admitByDoor': '7f16a2decde468fe308a2e539ca4894dd7c1830e613688ecaeccb3df96d4f560',
  'admitByDoor4': 'bfabe5af02c879717bd0194dac95438a248a79541c96fa5f31e9dc97dd323d0b',
  'authorizeDoorKey': 'a13f4df1398afeaea64bf5def15d7ac6b9eb43cfb29152cad214cb91f5f96871',
  'buyResale': '79ce9ec76e37ade2088c0e2ae5a18a80d0fb8fc34428e49b0d6d14ec978f5cbd',
  'buyResaleAdult': 'cf1683ef4234471769bfa0ecf41749cc6120c7f6514fa62650087ed01168a76b',
  'buyTicket': '14d5bbc857f92781a010b586c758e7eba1d23c72e6857a1120cdf990b017b641',
  'buyTicketAdult': '1e93120898bbc19368771ca0d1a347ebdf2e5ba660df627a189b845364121ede',
  'createEvent': 'd1833d264bdea89f8e9d09adff523cf8cc371905b7c551ea000ea03dc99d03de',
  'listForResale': '34f71937db0d478f008fd2e5fa0c4a3cd81bb37180aa102b73342d76c468f79d',
  'registerAdmit': '4ed7efd6f9d3f9c43a8c207c9ea89b62b0520f3c54f361a42b03a0dd45048c85',
  'revokeDoorKey': '8220db6c8336225147ed3cbc2975b538ac1c1a753d2f8cec25629d2eadcd2601',
  'setSalesOpen': '6dcf0c6a1303eda23001583dbef172a048436570e10caffc9cc254550ce54203',
};

export const circuitSignatures = {
  'maxDoorKeySeconds': {pure: true, provable: false, argumentTypes: [], resultType: {tag: 'Uint', maxval: '18446744073709551615'}},
  'rateChallenge': {pure: true, provable: false, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'JubjubPoint'}], resultType: {tag: 'Field'}},
  'ageChallenge': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'AgeClaim', elements: [{name: 'holder', type: {tag: 'Bytes', length: 32}}, {name: 'adultFrom', type: {tag: 'Uint', maxval: '18446744073709551615'}}]}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Bytes', length: 32}, {tag: 'JubjubPoint'}, {tag: 'JubjubPoint'}], resultType: {tag: 'Field'}},
  'createEvent': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'UserAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Uint', maxval: '18446744073709551615'}},
  'addTicketType': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Enum', name: 'ResaleMode', elements: ['capped', 'unlimited', 'none']}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Boolean'}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'setSalesOpen': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Boolean'}], resultType: {tag: 'Tuple', types: []}},
  'buyTicket': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'RateQuote', elements: [{name: 'atomsPerUsdCent', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'issuedAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'expiresAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'signature', type: {tag: 'Struct', name: 'AgeSignature', elements: [{name: 'r', type: {tag: 'JubjubPoint'}}, {name: 's', type: {tag: 'Field'}}]}}]}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'buyTicketAdult': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'RateQuote', elements: [{name: 'atomsPerUsdCent', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'issuedAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'expiresAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'signature', type: {tag: 'Struct', name: 'AgeSignature', elements: [{name: 'r', type: {tag: 'JubjubPoint'}}, {name: 's', type: {tag: 'Field'}}]}}]}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}},
  'registerAdmit': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'listForResale': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'UserAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Uint', maxval: '18446744073709551615'}},
  'buyResale': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'RateQuote', elements: [{name: 'atomsPerUsdCent', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'issuedAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'expiresAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'signature', type: {tag: 'Struct', name: 'AgeSignature', elements: [{name: 'r', type: {tag: 'JubjubPoint'}}, {name: 's', type: {tag: 'Field'}}]}}]}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'buyResaleAdult': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Struct', name: 'RateQuote', elements: [{name: 'atomsPerUsdCent', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'issuedAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'expiresAt', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'signature', type: {tag: 'Struct', name: 'AgeSignature', elements: [{name: 'r', type: {tag: 'JubjubPoint'}}, {name: 's', type: {tag: 'Field'}}]}}]}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'contractKeyOf': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'ContractAddress', elements: [{name: 'bytes', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Bytes', length: 32}},
  'admitCommitOf': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Bytes', length: 32}},
  'accountId': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Bytes', length: 32}},
  'admit': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}], resultType: {tag: 'Tuple', types: []}},
  'adminSet': {pure: false, provable: true, argumentTypes: [{tag: 'Boolean'}, {tag: 'Struct', name: 'Maybe', elements: [{name: 'is_some', type: {tag: 'Boolean'}}, {name: 'value', type: {tag: 'JubjubPoint'}}]}, {tag: 'Struct', name: 'Maybe', elements: [{name: 'is_some', type: {tag: 'Boolean'}}, {name: 'value', type: {tag: 'JubjubPoint'}}]}], resultType: {tag: 'Tuple', types: []}},
  'doorKeyIdOf': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Field'}},
  'authorizeDoorKey': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Field'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'revokeDoorKey': {pure: false, provable: true, argumentTypes: [{tag: 'Field'}], resultType: {tag: 'Tuple', types: []}},
  'admitByDoor': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '340282366920938463463374607431768211455'}, {tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'admitByDoor4': {pure: false, provable: true, argumentTypes: [{tag: 'Vector', length: 4, type: {tag: 'Uint', maxval: '340282366920938463463374607431768211455'}}, {tag: 'Vector', length: 4, type: {tag: 'Bytes', length: 32}}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {};

//# sourceMappingURL=index.js.map
