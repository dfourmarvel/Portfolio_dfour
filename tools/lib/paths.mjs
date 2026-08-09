import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const ROOT = resolve(here, '..', '..');
export const DATA_DIR = join(ROOT, 'data');
export const ASSETS_DIR = join(ROOT, 'assets');
