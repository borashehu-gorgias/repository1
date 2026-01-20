import { Flow, Guidance } from './types';
import { logger } from './logger';

/**
 * Converts a Gorgias Flow to an AI Guidance object
 */
export function flowToGuidance(flow: Flow): Guidance {
  logger.debug(`Converting flow: ${flow.name} (ID: ${flow.id})`);

  // Generate a unique key for the guidance based on the flow ID
  const key = `flow_${flow.id}`;

  // Extract flow information to create guidance content
  const content = buildGuidanceContent(flow);

  const guidance: Guidance = {
    key,
    name: flow.name,
    content,
    batch_datetime: new Date().toISOString(),
    review_action: 'created',
  };

  logger.debug(`Created guidance with key: ${key}`);

  return guidance;
}

/**
 * Builds the guidance content from a Flow
 * This extracts meaningful information from the flow structure
 */
function buildGuidanceContent(flow: Flow): string {
  const parts: string[] = [];

  // Add flow description if available
  if (flow.description) {
    parts.push(flow.description);
  }

  // Add conditions information
  if (flow.conditions && flow.conditions.length > 0) {
    parts.push('\n**Conditions:**');
    flow.conditions.forEach((condition: any, index: number) => {
      parts.push(`${index + 1}. ${formatCondition(condition)}`);
    });
  }

  // Add actions information
  if (flow.actions && flow.actions.length > 0) {
    parts.push('\n**Actions:**');
    flow.actions.forEach((action: any, index: number) => {
      parts.push(`${index + 1}. ${formatAction(action)}`);
    });
  }

  // Add triggers information
  if (flow.triggers && flow.triggers.length > 0) {
    parts.push('\n**Triggers:**');
    flow.triggers.forEach((trigger: any, index: number) => {
      parts.push(`${index + 1}. ${formatTrigger(trigger)}`);
    });
  }

  // If no content was generated, create a basic description
  if (parts.length === 0) {
    return `Guidance migrated from Flow: ${flow.name}`;
  }

  return parts.join('\n');
}

/**
 * Format condition object to readable text
 */
function formatCondition(condition: any): string {
  if (typeof condition === 'string') {
    return condition;
  }

  if (condition.type && condition.value) {
    return `${condition.type}: ${condition.value}`;
  }

  if (condition.field && condition.operator && condition.value) {
    return `${condition.field} ${condition.operator} ${condition.value}`;
  }

  return JSON.stringify(condition);
}

/**
 * Format action object to readable text
 */
function formatAction(action: any): string {
  if (typeof action === 'string') {
    return action;
  }

  if (action.type) {
    const actionType = action.type;
    const actionDetails = action.value || action.content || action.message || '';
    return actionDetails ? `${actionType}: ${actionDetails}` : actionType;
  }

  return JSON.stringify(action);
}

/**
 * Format trigger object to readable text
 */
function formatTrigger(trigger: any): string {
  if (typeof trigger === 'string') {
    return trigger;
  }

  if (trigger.type) {
    return trigger.type;
  }

  return JSON.stringify(trigger);
}

/**
 * Converts multiple flows to guidances
 */
export function convertFlowsToGuidances(flows: Flow[]): Guidance[] {
  logger.info(`Converting ${flows.length} flows to guidances...`);

  const guidances = flows.map(flow => flowToGuidance(flow));

  logger.success(`Converted ${guidances.length} flows to guidances`);

  return guidances;
}

/**
 * Validates that a guidance meets the required format
 */
export function validateGuidance(guidance: Guidance): boolean {
  if (!guidance.key || guidance.key.trim() === '') {
    logger.error('Guidance missing required field: key');
    return false;
  }

  if (!guidance.name || guidance.name.trim() === '') {
    logger.error('Guidance missing required field: name');
    return false;
  }

  if (!guidance.content || guidance.content.trim() === '') {
    logger.error('Guidance missing required field: content');
    return false;
  }

  return true;
}
