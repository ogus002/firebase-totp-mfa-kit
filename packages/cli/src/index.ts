import { Command } from 'commander';
import pc from 'picocolors';
import { runAdd } from './commands/add.js';
import { runEnable } from './commands/enable.js';
import { runDoctor } from './commands/doctor.js';
import { runVerify } from './commands/verify.js';

const program = new Command();

program
  .name('firebase-totp-mfa')
  .description('Add Firebase TOTP MFA in 30 seconds. shadcn-style CLI.')
  .version('0.0.0');

program
  .command('add [framework]')
  .description('Add TOTP MFA source files to your project (next | next-pages | vite | cra | expo)')
  .option('--area <path>', 'Path area to protect with MFA', '/account')
  .option('--issuer <name>', 'Issuer label shown in Authenticator app', 'YourApp')
  .option('--firebase-export <path>', 'Explicit Firebase auth export path')
  .option('--include-recovery', 'Include recovery codes UI', true)
  .option('--no-include-recovery', 'Skip recovery codes UI')
  .option('--server <framework>', 'Server-side MFA verify snippet', 'none')
  .option('--dry-run', 'Print diff, do not write files', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .action(async (framework: string | undefined, opts: Record<string, unknown>) => {
    const code = await runAdd(framework, {
      area: String(opts['area'] ?? '/account'),
      issuer: String(opts['issuer'] ?? 'YourApp'),
      firebaseExport: opts['firebaseExport'] as string | undefined,
      includeRecovery: opts['includeRecovery'] !== false,
      server: (opts['server'] as AddServer) ?? 'none',
      dryRun: opts['dryRun'] === true,
      yes: opts['yes'] === true,
      cwd: process.cwd(),
    });
    process.exit(code);
  });

program
  .command('enable')
  .description('Enable Identity Platform TOTP MFA on your GCP project (5-step safe)')
  .requiredOption('--project <id>', 'GCP project ID')
  .option('--adjacent-intervals <n>', 'TOTP code window (0-10)', '1')
  .option('--dry-run', 'Print diff, do not PATCH', false)
  .option('-y, --yes', 'Skip confirmation prompts', false)
  .action(async (opts: Record<string, unknown>) => {
    const n = Number(opts['adjacentIntervals'] ?? 1);
    if (Number.isNaN(n) || n < 0 || n > 10) {
      console.error(pc.red('--adjacent-intervals must be an integer 0-10'));
      process.exit(2);
    }
    const code = await runEnable({
      project: String(opts['project']),
      adjacentIntervals: n,
      dryRun: opts['dryRun'] === true,
      yes: opts['yes'] === true,
    });
    process.exit(code);
  });

program
  .command('update')
  .description('Check if local registry source files diverged from the kit (diff only in alpha)')
  .option('--dry-run', 'Print diff, do not modify files', true)
  .action(async (opts) => {
    const { runUpdate } = await import('./commands/update.js');
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

    const result = await runUpdate({
      projectRoot: process.cwd(),
      dryRun: opts.dryRun !== false,
      registryVersion: pkgJson.version,
    });
    process.exit(result.exitCode);
  });

program
  .command('doctor')
  .description('Diagnose your environment')
  .action(async () => {
    const code = await runDoctor({ cwd: process.cwd() });
    process.exit(code);
  });

program
  .command('verify')
  .description('Print manual verification scenarios')
  .action(async () => {
    const code = await runVerify();
    process.exit(code);
  });

program.showHelpAfterError();

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(pc.red('CLI error:'), err);
  process.exit(1);
});

type AddServer = 'express' | 'cloud-functions' | 'cloud-run' | 'next-route-handler' | 'none';
