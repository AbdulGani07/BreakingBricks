import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

async function buildSDK() {
  console.log('[SDK Builder] Starting standalone breaking-bricks.js bundle build...');

  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Find compiled Tailwind CSS from dist/assets if available
  let injectedCSS = '';
  if (fs.existsSync(distDir)) {
    const assetsDir = path.join(distDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir);
      const cssFile = files.find((f) => f.endsWith('.css'));
      if (cssFile) {
        injectedCSS = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
        console.log(`[SDK Builder] Extracted ${injectedCSS.length} bytes of compiled styles.`);
      }
    }
  }

  // Banner script to auto-inject the compiled CSS when loaded on external websites
  const cssInjectionBanner = injectedCSS
    ? `
(function() {
  if (typeof document !== 'undefined' && !document.getElementById('breaking-bricks-sdk-styles')) {
    var style = document.createElement('style');
    style.id = 'breaking-bricks-sdk-styles';
    style.textContent = ${JSON.stringify(injectedCSS)};
    document.head.appendChild(style);
  }
})();
`
    : '';

  // Build the bundle using esbuild
  const result = await esbuild.build({
    entryPoints: [path.join(rootDir, 'src/sdk/index.tsx')],
    bundle: true,
    minify: true,
    sourcemap: false,
    format: 'iife',
    globalName: 'BreakingBricksPackage',
    banner: {
      js: `/* Breaking Bricks HTML5 Game Platform SDK v1.1.0 */\n${cssInjectionBanner}`,
    },
    footer: {
      js: `
if (typeof window !== 'undefined') {
  window.BreakingBricks = BreakingBricksPackage.BreakingBricks || BreakingBricksPackage.default || BreakingBricksPackage;
}
`,
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      global: 'window',
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js',
    },
    write: false,
  });

  const bundleCode = result.outputFiles[0].text;

  // Write to public/breaking-bricks.js
  fs.writeFileSync(path.join(publicDir, 'breaking-bricks.js'), bundleCode);
  console.log(`[SDK Builder] Wrote to public/breaking-bricks.js (${bundleCode.length} bytes)`);

  // Write to dist/breaking-bricks.js if dist exists
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'breaking-bricks.js'), bundleCode);
    console.log(`[SDK Builder] Wrote to dist/breaking-bricks.js (${bundleCode.length} bytes)`);
  }

  console.log('[SDK Builder] Successfully built breaking-bricks.js!');
}

buildSDK().catch((err) => {
  console.error('[SDK Builder] Failed to build SDK:', err);
  process.exit(1);
});
