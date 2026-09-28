import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { EMPTY_SEARCH_FILTER, SearchFilter } from '../models/search-filter.model';

const SYSTEM_PROMPT = `
You convert a shopper's plain-English search into a JSON filter object.
Respond with ONLY a JSON object in this exact shape, no markdown, no commentary:
{
  "category": string | null,
  "maxPrice": number | null,
  "minPrice": number | null,
  "inStock": boolean | null,
  "keywords": string[]
}
Valid categories are: electronics, apparel, home, fitness, toys.
Use null for any field the query does not mention.
Put any descriptive terms that aren't captured by the other fields into "keywords".
`.trim();

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
}

/**
 * Calls a locally running Ollama instance through the dev-server proxy
 * (see proxy.conf.json), so the browser never talks cross-origin to
 * localhost:11434 directly.
 *
 * To swap this for the Anthropic API once you have a key, replace the
 * body/endpoint below with a call to your own backend proxy that wraps
 * https://api.anthropic.com/v1/messages — the SYSTEM_PROMPT and the
 * SearchFilter contract stay identical either way.
 */
@Injectable({ providedIn: 'root' })
export class QueryParserService {
  private readonly endpoint = '/ollama/api/chat';
  private readonly model = 'llama3.2';

  constructor(private http: HttpClient) {}

  parseQuery(query: string): Observable<SearchFilter> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      stream: false,
      format: 'json'
    };

    return this.http.post<OllamaChatResponse>(this.endpoint, body).pipe(
      map(response => {
        const parsed = JSON.parse(response.message.content);
        return { ...EMPTY_SEARCH_FILTER, ...parsed } as SearchFilter;
      })
    );
  }
}
