export interface IAddressSuggestionsInput {
  offerId: string;
  query: string;
  language: string;
}

export interface IAddressSuggestionsResult {
  suggestions: string[];
  attribution?: { label: string; url: string }[];
}
