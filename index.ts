import { execSync } from 'child_process';

const nodeVersion = execSync('node -v');
console.log(`Node.jsのバージョン: ${nodeVersion.toString().trim()}`);
