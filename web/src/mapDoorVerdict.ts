export function alreadyUsedReason(reason: string): boolean {
  return /already (used|admitted|consumed)|ticket already consumed|pass now (consumed|used)|single-use pass/i.test(reason);
}

export type DoorTone = 'ok' | 'used' | 'invalid';

export type DoorVerdictCopy = {
  ok: boolean;
  tone: DoorTone;
  title: string;
  subtitle: string;
  detail: string;
  meta: string;
  typeName: string;
  firstAdmittedAt: string;
  firstAdmittedDoor: string;
  recordingPending: boolean;
};

/** Strip fixture / dev labels so they never appear on a door screen. */
export function cleanVerdictMeta(meta: string): string {
  return meta
    .replace(/\bfixture\b/gi, '')
    .replace(/\bdev\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[·•]+\s*$/g, '')
    .replace(/^[·•\s]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Pull a first-admission time out of an existing reason string. Returns nothing if it is not there. */
export function firstAdmissionFromReason(reason?: string): string {
  if (!reason) return '';
  const match = reason.match(/already admitted(?: locally)? at ([^(.]+)/i);
  return match?.[1]?.trim() ?? '';
}

export function doorVerdictCopy(input: {
  ok: boolean;
  reason?: string;
  typeName?: string;
  meta?: string;
  firstAdmittedAt?: string;
  firstAdmittedDoor?: string;
  recordingPending?: boolean;
}): DoorVerdictCopy {
  const typeName = input.typeName ?? '';
  const meta = cleanVerdictMeta(input.meta ?? '');
  const firstAdmittedAt = input.firstAdmittedAt ?? firstAdmissionFromReason(input.reason);
  const firstAdmittedDoor = input.firstAdmittedDoor ?? '';
  if (input.ok) {
    return {
      ok: true,
      tone: 'ok',
      title: 'Valid',
      subtitle: 'Admit 1',
      detail: typeName,
      meta: input.recordingPending ? meta : (meta || 'Confirmed on Midnight'),
      typeName,
      firstAdmittedAt: '',
      firstAdmittedDoor: '',
      recordingPending: !!input.recordingPending,
    };
  }
  if (input.reason && alreadyUsedReason(input.reason)) {
    return {
      ok: false,
      tone: 'used',
      title: 'Already used',
      subtitle: 'Do not admit',
      detail: '',
      meta,
      typeName,
      firstAdmittedAt,
      firstAdmittedDoor,
      recordingPending: false,
    };
  }
  return {
    ok: false,
    tone: 'invalid',
    title: 'Not valid',
    subtitle: 'Do not admit',
    detail: input.reason && !alreadyUsedReason(input.reason) ? input.reason : 'This ticket cannot be admitted.',
    meta,
    typeName,
    firstAdmittedAt: '',
    firstAdmittedDoor: '',
    recordingPending: false,
  };
}
