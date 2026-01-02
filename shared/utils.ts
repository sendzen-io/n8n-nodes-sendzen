import { SendzenAPIErroResponse } from "./type";

export function isSendzenAPIErroResponse(
    value: unknown
  ): value is SendzenAPIErroResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof (value as any).message === 'string' &&
      'error' in value &&
      typeof (value as any).error === 'object' &&
      typeof (value as any).error?.code === 'string' &&
      typeof (value as any).error?.details === 'string'
    );
  }