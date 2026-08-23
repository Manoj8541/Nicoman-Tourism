import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌴 [Nicoman Build] Building Booking Demo sub-app...');
execSync('npm --prefix booking-demo run build', { stdio: 'inherit', cwd: __dirname });

console.log('🌴 [Nicoman Build] Building Main Client app...');
execSync('npm --prefix client run build', { stdio: 'inherit', cwd: __dirname });

const bookingDist = path.join(__dirname, 'booking-demo', 'dist');
const clientBookDist = path.join(__dirname, 'client', 'dist', 'book');

console.log(`🌴 [Nicoman Build] Merging booking portal into ${clientBookDist}...`);
fs.mkdirSync(clientBookDist, { recursive: true });
fs.cpSync(bookingDist, clientBookDist, { recursive: true });

console.log('✅ [Nicoman Build] Full production build completed successfully!');
