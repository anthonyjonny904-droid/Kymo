import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import { defineConfig, Plugin } from 'vite';

function gitApiPlugin(): Plugin {
  return {
    name: 'git-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/git-status', (_req, res) => {
        try {
          const status = execSync('git status -s', { encoding: 'utf-8' });
          const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { encoding: 'utf-8' });
          const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, status, lastCommit, remote }));
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });

      server.middlewares.use('/api/github-push', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {};
            const token = (data.token || '').trim();
            const repo = (data.repo || 'anthonyjonny904-droid/Kymo').trim();

            execSync('git add -A', { encoding: 'utf-8' });
            try {
              execSync('git commit -m "Update Kymo Chat source files and GitHub Actions AAB workflow"', { encoding: 'utf-8' });
            } catch {
              // nothing new to commit
            }

            const pushUrl = token
              ? `https://${encodeURIComponent(token)}@github.com/${repo}.git`
              : `https://github.com/${repo}.git`;

            const output = execSync(`git push -u "${pushUrl}" main --force`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Successfully pushed all files to GitHub repository!', output }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              error: err.stderr || err.message || 'Push failed. Please check credentials or permissions.',
            }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gitApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
