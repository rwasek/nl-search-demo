import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { Product } from '../models/product.model';
import { EMPTY_HARD_CONSTRAINTS, HardConstraints } from '../models/hard-constraints.model';

const CONSTRAINTS_SYSTEM_PROMPT = `
You extract ONLY price and stock constraints from a shopper's plain-English
request. Do not infer category — that is handled separately.

Respond with ONLY a JSON object in this exact shape, no markdown, no commentary:
{
  "maxPrice": number | null,
  "minPrice": number | null,
  "inStock": boolean | null
}

Only set a field when the shopper explicitly states that constraint. Never
guess a number that wasn't stated. Use null for anything not mentioned.

Price direction matters — map it exactly like this:
- "above $30", "over $30", "more than $30", "at least $30" → minPrice: 30
- "under $30", "below $30", "less than $30", "at most $30", "cheaper than $30" → maxPrice: 30
`.trim();

const SEMANTIC_MATCH_SYSTEM_PROMPT = `
You are given a shopper's request and a list of candidate products that have
already passed every explicit price and stock constraint. Do not re-check
price or stock.

For EVERY candidate, decide whether it genuinely satisfies the request, based
on what the product actually is and does, not just literal word overlap. For
example, "something to listen to music with" matches earbuds, and "workout
gear" matches both fitness equipment and athletic apparel like running shoes.

Respond with ONLY a JSON object in this exact shape, with exactly one entry
per candidate, in the same order as the input:
{
  "results": [
    { "id": string, "reason": string, "fits": boolean }
  ]
}

Keep each reason under 10 words and write it before deciding fits. When in
doubt, set fits to true.
`.trim();

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
}

interface CandidateVerdict {
  id: string;
  reason: string;
  fits: boolean;
}

interface SemanticMatchResponse {
  results: CandidateVerdict[];
}

/**
 * Calls a locally running Ollama instance through the dev-server proxy
 * (see proxy.conf.json), so the browser never talks cross-origin to
 * localhost:11434 directly.
 *
 * Two stages:
 * 1. parseHardConstraints extracts price and stock only. Those are applied
 *    in plain code (ProductFilterService.applyHardConstraints), so a
 *    constraint like "under $40" can never be silently violated.
 * 2. findSemanticMatches asks the model for a verdict on EVERY candidate,
 *    with a short reason written before the decision. Asking a small model
 *    to pick a subset from a list lets it skip items without considering
 *    them; requiring one verdict per candidate fixes that.
 *
 * Category is deliberately not pre-filtered: it is a fuzzy judgment (is
 * "workout gear" fitness equipment, athletic apparel, or both?) that a rigid
 * enum answers wrong as often as right.
 *
 * To swap this for the Anthropic API once you have a key, replace the
 * body/endpoint in each method with a call to your own backend proxy that
 * wraps https://api.anthropic.com/v1/messages — the prompts and response
 * contracts stay identical either way.
 */
@Injectable({ providedIn: 'root' })
export class QueryParserService {
  private readonly endpoint = '/ollama/api/chat';
  private readonly model = 'qwen2.5:7b';

  constructor(private http: HttpClient) {}

  parseHardConstraints(query: string): Observable<HardConstraints> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: CONSTRAINTS_SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      stream: false,
      format: 'json',
      options: { temperature: 0 }
    };

    return this.http.post<OllamaChatResponse>(this.endpoint, body).pipe(
      map(response => {
        const parsed = JSON.parse(response.message.content);
        return { ...EMPTY_HARD_CONSTRAINTS, ...parsed } as HardConstraints;
      })
    );
  }

  findSemanticMatches(query: string, candidates: Product[]): Observable<string[]> {
    if (candidates.length === 0) {
      return of([]);
    }

    const candidatesForPrompt = candidates.map(({ id, name, description, category }) => (
      { id, name, description, category }
    ));

    const userMessage = `
Shopper request: "${query}"

Candidate products:
${JSON.stringify(candidatesForPrompt)}
`.trim();

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: SEMANTIC_MATCH_SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      format: 'json',
      options: { temperature: 0 }
    };

    return this.http.post<OllamaChatResponse>(this.endpoint, body).pipe(
      map(response => {
        const parsed = JSON.parse(response.message.content) as Partial<SemanticMatchResponse>;
        const verdicts = Array.isArray(parsed.results) ? parsed.results : [];
        return verdicts
          .filter(verdict => verdict.fits === true)
          .map(verdict => verdict.id);
      })
    );
  }
}