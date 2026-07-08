import * as core from '@actions/core';

export const logInfo = (message: string) => core.info(message);
export const logWarning = (message: string) => core.warning(message);
export const logError = (message: string) => core.error(message);
