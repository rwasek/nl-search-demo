# Natural Language Product Search (Angular + Ollama)

A small Angular app that shows how to use a language model at runtime to turn a
plain-English search into results. No database and no API key: a local model
(via Ollama) runs on your machine and the catalog is an in-memory array.

## How it works

```
User types: "workout gear under $80"
  Stage 1: model extracts price/stock constraints  -> { maxPrice: 80 }
           plain code applies them                 -> 15 candidates
  Stage 2: model gives a verdict for EVERY candidate
           (short reason, then fits: true/false)   -> running shoes, yoga mat,
                                                      resistance bands, water bottle
```

Design decisions worth knowing:

- **Numbers are filtered in code, not by the model.** Early versions let the model
  decide whether a $45 item was "under $40", and it got it wrong. The model now only
  extracts the constraint; plain code does the comparison.
- **The model judges meaning, not keywords.** "Something to listen to music with"
  matches earbuds even though those words aren't in the product text.
- **One verdict per candidate.** Asking a small model to pick a subset from a list
  let it silently skip items. Requiring a verdict for every candidate fixed that.
- **Category is not pre-filtered.** "Workout gear" can mean equipment, apparel, or
  both, so a rigid category enum excluded correct answers.

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com/download), installed and running

## Setup

```bash
npm install
ollama pull qwen2.5:7b
npm start
```

Open http://localhost:4200.

`npm start` runs `ng serve` with `proxy.conf.json`, which forwards `/ollama/*` to
`http://localhost:11434`. Use `npm start`, not `ng serve` directly, or the proxy
won't load.

## Try these

- "workout gear under $80"
- "something to listen to music with"
- "show me earbuds under $40"
- "electronics above $70"

The two panels under the search bar show what each stage returned, which is
useful for debugging prompts.

## Known limitation

A 7B local model misses some inferences. "Gear for a cold morning workout" should
surface the winter jacket, but this model doesn't reliably make the
cold-weather-to-jacket connection. Larger hosted models are likely to handle this
better; that comparison hasn't been tested here.

## Using a hosted model instead

All model calls live in `src/app/core/services/query-parser.service.ts`. To use a
hosted API, replace the request in `parseHardConstraints` and `findSemanticMatches`
with a call to your own backend endpoint that forwards to the provider. Don't call
a provider directly from the browser with an API key. The prompts and response
shapes stay the same. This swap is untested.

## Troubleshooting

- **404 on `/ollama/api/chat`:** you're not running `npm start`, or the proxy key in
  `proxy.conf.json` isn't `"/ollama"`.
- **"Could not understand that search":** check that Ollama is running
  (`curl http://localhost:11434`) and that `ollama list` shows `qwen2.5:7b`.
- **Odd or inconsistent results:** small models are imperfect. Check the Stage 1 and
  Stage 2 panels to see which step went wrong.