#!/usr/bin/env node
/** Exits 0 when BROWSER_BASE_URL is an allowed preview host; otherwise prints why and exits 1. */
import { isAllowedPreviewBaseUrl } from './lib/preview-base-url.mjs';

const url = process.env.BROWSER_BASE_URL;
if (!isAllowedPreviewBaseUrl(url)) {
  console.error(`BROWSER_BASE_URL must be https://rulefiles.dev or https://<subdomain>.rulefiles.pages.dev (optional trailing slash). Got: ${JSON.stringify(url)}`);
  process.exit(1);
}
