import { z } from 'zod';

// Flow Types (based on Gorgias Flows API)
export const FlowSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  actions: z.array(z.any()).optional(),
  conditions: z.array(z.any()).optional(),
  triggers: z.array(z.any()).optional(),
  created_datetime: z.string().optional(),
  updated_datetime: z.string().optional(),
});

export const FlowsListResponseSchema = z.object({
  data: z.array(FlowSchema),
  meta: z.object({
    total_count: z.number().optional(),
    next_cursor: z.string().optional(),
  }).optional(),
});

// Guidance Types (based on AI Guidances API)
export const GuidanceSchema = z.object({
  key: z.string(),
  name: z.string(),
  content: z.string(),
  batch_datetime: z.string().optional(),
  review_action: z.enum(['created', 'updated', 'deleted']).optional(),
});

export const GuidanceCreateRequestSchema = z.array(GuidanceSchema);

export const GuidanceResponseSchema = z.array(GuidanceSchema);

// Export inferred types
export type Flow = z.infer<typeof FlowSchema>;
export type FlowsListResponse = z.infer<typeof FlowsListResponseSchema>;
export type Guidance = z.infer<typeof GuidanceSchema>;
export type GuidanceCreateRequest = z.infer<typeof GuidanceCreateRequestSchema>;
export type GuidanceResponse = z.infer<typeof GuidanceResponseSchema>;

// Configuration
export interface Config {
  gorgiasSubdomain: string;
  gorgiasApiKey: string;
  gorgiasUsername: string;
  gorgiasClientId: string;
  gorgiasClientSecret: string;
  oauthRedirectUri: string;
  helpCenterId?: number;
  storeIntegrationId?: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  dryRun: boolean;
}

// OAuth Token Response
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}
