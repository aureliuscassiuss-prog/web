#!/usr/bin/env node
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Create output directories
mkdirSync('.vercel/output/static', { recursive: true });

// Copy dist contents to .vercel/output/static
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

console.log('Copying dist to .vercel/output/static...');
copyDir('dist', '.vercel/output/static');
console.log('Build output prepared for Vercel!');
