// pipeline/src/lib/log.ts
type Level = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  [key: string]: unknown;
}

export interface Logger {
  debug(fields: LogFields, msg?: string): void;
  info(fields: LogFields, msg?: string): void;
  warn(fields: LogFields, msg?: string): void;
  error(fields: LogFields, msg?: string): void;
  child(extra: LogFields): Logger;
}

function emit(level: Level, base: LogFields, fields: LogFields, msg?: string) {
  const out = {
    ts: new Date().toISOString(),
    level,
    ...base,
    ...fields,
    ...(msg ? { msg } : {}),
  };
  const line = JSON.stringify(out);
  if (level === 'error') console.error(line);
  else console.log(line);
}

export function createLogger(base: LogFields = {}): Logger {
  return {
    debug: (f, m) => process.env.LOG_VERBOSE && emit('debug', base, f, m),
    info:  (f, m) => emit('info',  base, f, m),
    warn:  (f, m) => emit('warn',  base, f, m),
    error: (f, m) => emit('error', base, f, m),
    child: (extra) => createLogger({ ...base, ...extra }),
  };
}
