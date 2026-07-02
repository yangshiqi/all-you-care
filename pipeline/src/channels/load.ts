import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { ChannelConfigSchema, type ChannelConfig } from './types.js';
import type { Channel } from '../lib/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function channelDir(channel: Channel): string {
  return resolve(__dirname, channel);
}

export function parseChannelConfig(raw: unknown): ChannelConfig {
  return ChannelConfigSchema.parse(raw);
}

export async function loadChannel(channel: Channel): Promise<ChannelConfig> {
  const path = join(channelDir(channel), 'config.yaml');
  if (!existsSync(path)) throw new Error(`channel config not found: ${path}`);
  const raw = yaml.load(await readFile(path, 'utf8'));
  return parseChannelConfig(raw);
}
