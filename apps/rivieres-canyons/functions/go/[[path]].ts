// Cloudflare Pages Function: /go/book/{offer or company}/ and /go/whatsapp/{guide}/?ref=… (logic in @orbit/core/edge).
import { handleGo, type EdgeContext } from '@orbit/core/edge';

export const onRequestGet = (ctx: EdgeContext) => handleGo(ctx);
