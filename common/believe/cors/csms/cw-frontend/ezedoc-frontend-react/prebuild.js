const fs = require('fs');
const { execSync } = require('child_process');

// Delete build of old ezereactcomponent if any
const buildPath = 'ezereactcomponents/build';
if (fs.existsSync(buildPath)) {
  fs.rmdirSync(buildPath, { recursive: true });
}

// Run build of ezereactcomponent folder
execSync('cd ezereactcomponents && npm run build', { stdio: 'inherit' });
