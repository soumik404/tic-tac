const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  
  "accountAssociation": {
    "header": "eyJmaWQiOjkzMjEwNywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc4MUY0Q0E2ZTlhMjcyODU5YWY1QzMxRDAzNmU3NjY1MDlmRTA1NzkifQ",
    "payload": "eyJkb21haW4iOiJ0aWMtdGFjLXBlYXJsLnZlcmNlbC5hcHAifQ",
    "signature": "MHg1NTU3NTBlYjcxOGNmMTI1ODFiOGFiOTk2YTIxOTgwN2EyMGVkN2ZhYTRiNWIzN2NkMTE4ODVlODA3M2JjYjZiNmJlNWE5OGFiNDg3MDMzYTJmZDkzNjAwMjU5ZGY4Y2FhY2E5NmE0NDM3MDExMDExNDMyYmE0YzUwODliMWViNTFj"
  },
  "baseBuilder": {
    "allowedAddresses": [
      "0xc775185C61448F85B2530cc96Ff1297C45AfbF48"
    ]
  },
  miniapp: {
    version: "1",
    name: "Tic-Tac-Toe", 
    subtitle: "Classic web3 game", 
    description: "Play TicTacToe built with love by GainChainn.",    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["tic-tac-toe", "web3", "crypto", "base", "game"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "tic-tac-toe",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
    "noindex": true
  }
  
} as const;

