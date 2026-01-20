#!/usr/bin/env node
import { loadConfig } from './config';
import { logger } from './logger';
import { FlowMigrator } from './migrator';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    // Set log level
    logger.setLevel(config.logLevel);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const flowId = args[0]; // Optional: specific flow ID to migrate

    // Create migrator instance
    const migrator = new FlowMigrator(config);

    // Run migration
    if (flowId) {
      logger.info(`Migrating specific flow: ${flowId}`);
      await migrator.migrateFlow(flowId);
    } else {
      logger.info('Migrating all flows');
      await migrator.migrate();
    }

    process.exit(0);
  } catch (error: any) {
    logger.error('Fatal error:', error.message);
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();
