#!/usr/bin/env node
import Pastel from 'pastel';
import { enableMapSet } from 'immer';

enableMapSet()

const app = new Pastel({
    importMeta: import.meta,
    name: '🕸️☁️ Uix CLI',
    description: 'A CLI for generating typed graph data models',
    version: '0.0.3',
});

await app.run();
// Need this to restore the cursor of the cli
// process.exit(0)