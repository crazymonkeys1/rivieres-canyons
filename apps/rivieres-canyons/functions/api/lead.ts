// Cloudflare Pages Function: POST /api/lead (logic in @orbit/core/edge).
import { handleLead, type EdgeContext } from '@orbit/core/edge';

export const onRequestPost = (ctx: EdgeContext) => handleLead(ctx);
