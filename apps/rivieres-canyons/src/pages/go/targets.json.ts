// Where each /go/ link leads, read by the edge functions (functions/go/[[path]].ts). Not linked, not indexed (/go/ is
// disallowed in robots.txt). Booking URLs and WhatsApp numbers are public by nature: the redirect reveals them anyway.
import type { APIRoute } from 'astro';
import { goTargets } from '../../content/conversion';

export const GET: APIRoute = () => new Response(JSON.stringify(goTargets()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
