# Natural Language Search Demo

A minimal Angular app that proves out the "AI at runtime" pattern: a plain-English
search bar is parsed by a local LLM into a structured filter object, which then
filters an in-memory product catalog. No database, no external API key required.

## How it works

```
User types a query
  → QueryParserService sends it to a local Ollama model
  → Model returns a strict JSON SearchFilter
  → ProductFilterService applies that filter to PRODUCT_CATALOG (plain array)
  → Results render in the UI
```

The AI boundary (`QueryParserService`) and the filtering logic (`ProductFilterService`)
are deliberately separate. Only the first one talks to a model; the second is a pure
function over data you can unit test without mocking anything AI-related.

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com) installed locally

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Install and start Ollama, then pull a model**

```bash
ollama pull llama3.2
```

Ollama runs its own background service after installation. Confirm it's up:

```bash
curl http://localhost:11434
# should return "Ollama is running"
```

**3. Start the Angular dev server**

```bash
npm start
```

This runs `ng serve --proxy-config proxy.conf.json`, which proxies requests from
`/ollama/*` to `http://localhost:11434/*` so the browser never has to make a
cross-origin request directly to Ollama.

**4. Open the app**

Visit `http://localhost:4200`. Try queries like:

- "show me electronics under $50 that are in stock"
- "apparel over $100"
- "cheap fitness gear"
- "toys that are out of stock"

Expand the "Parsed filter" panel under the search bar to see exactly what JSON
the model returned for your query — useful for debugging prompt behavior.

## Swapping in the Anthropic API later

Once you have an Anthropic API key, replace the body of `QueryParserService.parseQuery()`
in `src/app/core/services/query-parser.service.ts`:

- Point `endpoint` at your own backend proxy (never call `api.anthropic.com` directly
  from the browser with an exposed key — even for local use, route it through a small
  Express/Nest endpoint or a serverless function that holds the key server-side).
- Send the same `SYSTEM_PROMPT` and user query in Anthropic's `messages` format.
- Parse `response.content` (an array of content blocks) instead of `response.message.content`.

The `SearchFilter` contract and everything downstream of it (`ProductFilterService`,
the component) stays identical — only the transport to the model changes.

## Troubleshooting

- **"Could not understand that search"** — check that `ollama serve` is running
  (`curl http://localhost:11434` should respond) and that you've pulled the model
  referenced in `query-parser.service.ts` (`llama3.2` by default).
- **Malformed JSON from the model** — smaller/quantized models occasionally drift
  from the requested schema. Try a larger model (`llama3.1:8b` or similar) if you
  see frequent parse failures.
- **CORS errors** — make sure you're running `npm start` (which applies the proxy
  config), not `ng serve` directly.
