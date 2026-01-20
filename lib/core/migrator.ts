import { GorgiasApiClient } from './api-client';
import { convertFlowsToGuidances, validateGuidance } from './converter';
import { Config } from './types';
import { logger } from './logger';

export class FlowMigrator {
  private apiClient: GorgiasApiClient;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.apiClient = new GorgiasApiClient(config);
  }

  /**
   * Execute the full migration process
   */
  async migrate(): Promise<void> {
    try {
      logger.info('Starting Flows to Guidances migration...');
      logger.info(`Subdomain: ${this.config.gorgiasSubdomain}`);
      logger.info(`Help Center ID: ${this.config.helpCenterId}`);
      logger.info(`Store Integration ID: ${this.config.storeIntegrationId}`);
      logger.info(`Dry Run: ${this.config.dryRun}`);
      logger.info('---');

      // Step 1: Fetch all flows
      const flows = await this.apiClient.getFlows();

      if (flows.length === 0) {
        logger.warn('No flows found to migrate');
        return;
      }

      logger.info(`Found ${flows.length} flows to migrate`);

      // Step 2: Convert flows to guidances
      const guidances = convertFlowsToGuidances(flows);

      // Step 3: Validate guidances
      const validGuidances = guidances.filter(guidance => {
        const isValid = validateGuidance(guidance);
        if (!isValid) {
          logger.warn(`Skipping invalid guidance: ${guidance.name || 'unnamed'}`);
        }
        return isValid;
      });

      if (validGuidances.length === 0) {
        logger.error('No valid guidances to import');
        return;
      }

      logger.info(`${validGuidances.length} valid guidances ready for import`);

      // Step 4: Check existing guidances (optional)
      try {
        const existingGuidances = await this.apiClient.getGuidances();
        if (existingGuidances.length > 0) {
          logger.warn(
            `Found ${existingGuidances.length} existing guidances. ` +
            'New guidances will be added/updated.'
          );
        }
      } catch (error) {
        logger.debug('Could not fetch existing guidances, continuing...');
      }

      // Step 5: Import guidances
      if (this.config.dryRun) {
        logger.warn('[DRY RUN] Would import the following guidances:');
        validGuidances.forEach(g => {
          logger.info(`  - ${g.name} (${g.key})`);
        });
      } else {
        await this.apiClient.createGuidances(validGuidances);
        logger.success('Migration completed successfully!');
      }

      // Summary
      logger.info('---');
      logger.info('Migration Summary:');
      logger.info(`  Total Flows: ${flows.length}`);
      logger.info(`  Valid Guidances: ${validGuidances.length}`);
      logger.info(`  Skipped: ${flows.length - validGuidances.length}`);

    } catch (error: any) {
      logger.error('Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Migrate a specific flow by ID
   */
  async migrateFlow(flowId: string | number): Promise<void> {
    try {
      logger.info(`Migrating single flow: ${flowId}`);

      const flow = await this.apiClient.getFlow(flowId);
      const guidances = convertFlowsToGuidances([flow]);

      const validGuidances = guidances.filter(validateGuidance);

      if (validGuidances.length === 0) {
        logger.error('Invalid guidance generated from flow');
        return;
      }

      if (this.config.dryRun) {
        logger.warn('[DRY RUN] Would import:', validGuidances[0]);
      } else {
        await this.apiClient.createGuidances(validGuidances);
        logger.success('Flow migrated successfully!');
      }

    } catch (error: any) {
      logger.error(`Failed to migrate flow ${flowId}:`, error.message);
      throw error;
    }
  }
}
