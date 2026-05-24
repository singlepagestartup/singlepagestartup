"use client";

import { cn } from "@sps/shared-frontend-client-utils";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@sps/shared-ui-shadcn";
import {
  generate,
  index as indexContent,
  models as modelsAction,
  search,
} from "@sps/knowledge/sdk/client";
import {
  DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
  KnowledgeGenerationModelSlug,
  KnowledgeModelOption,
} from "@sps/knowledge/sdk/model";
import { Database, FileSearch, Loader2, Search, Sparkles } from "lucide-react";
import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";

type SourceReference = {
  id: string;
  text: string;
  sourceTitle: string | null;
  sourceOriginalPath: string | null;
  similarity: number;
};

type GenerationMetadata = {
  generationModelSlug: string;
  generationProvider: string;
  generationModel: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export function ClientComponent() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<SourceReference[]>([]);
  const [indexResult, setIndexResult] = useState<string>("");
  const [error, setError] = useState("");
  const [generationModelSlug, setGenerationModelSlug] =
    useState<KnowledgeGenerationModelSlug>(
      DEFAULT_KNOWLEDGE_GENERATION_MODEL_SLUG,
    );
  const [generationModels, setGenerationModels] = useState<
    KnowledgeModelOption[]
  >([]);
  const [generationMetadata, setGenerationMetadata] =
    useState<GenerationMetadata | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "search" | "generate" | "index" | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModels() {
      try {
        const result = await modelsAction.action({ task: "chat" });
        const loadedModels = result?.data || [];

        if (!isMounted) {
          return;
        }

        setGenerationModels(loadedModels);

        if (
          loadedModels.length &&
          !loadedModels.some((model) => model.id === generationModelSlug)
        ) {
          setGenerationModelSlug(loadedModels[0].id);
        }
      } catch (error: any) {
        if (isMounted) {
          setError(error.message);
        }
      }
    }

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  async function runSearch() {
    setPendingAction("search");
    setError("");

    try {
      const result = await search.action({ query, topK: 6 });
      setSources(result?.data || []);
      setAnswer("");
      setGenerationMetadata(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  async function runGenerate() {
    setPendingAction("generate");
    setError("");

    try {
      const result = await generate.action({
        query,
        topK: 6,
        generationModelSlug,
      });
      const data = result?.data;

      setAnswer(data?.answer || "");
      setSources(data?.sources || []);
      setGenerationMetadata(
        data
          ? {
              generationModelSlug: data.generationModelSlug,
              generationProvider: data.generationProvider,
              generationModel: data.generationModel,
              usage: data.usage,
            }
          : null,
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  async function runSampleIndex() {
    setPendingAction("index");
    setError("");

    try {
      const result = await indexContent.action({ limit: 5 });
      const data = result?.data;
      setIndexResult(
        data
          ? `${data.indexed} indexed, ${data.skipped} skipped, ${data.sources.length} scanned`
          : "",
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;
  const selectedGenerationModel =
    generationModels.find((model) => model.id === generationModelSlug) || null;

  return (
    <div className="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
      <section className="flex min-w-0 flex-col gap-4 rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">Knowledge</h1>
            <p className="truncate text-sm text-muted-foreground">
              Content RAG
            </p>
          </div>
          <Database className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>

        <Textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-40 resize-none rounded-md"
          placeholder="Запрос по базе знаний и контенту"
        />

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Generation model
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {selectedGenerationModel?.local
                ? "local"
                : selectedGenerationModel?.provider || "gateway"}
            </span>
          </div>
          <Select
            value={generationModelSlug}
            onValueChange={(value) => {
              setGenerationModelSlug(value as KnowledgeGenerationModelSlug);
              setGenerationMetadata(null);
            }}
          >
            <SelectTrigger className="rounded-md">
              <SelectValue placeholder="Loading models" />
            </SelectTrigger>
            <SelectContent>
              {generationModels.map((option) => {
                return (
                  <SelectItem key={option.id} value={option.id}>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate">{option.label}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {option.id}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy || !query.trim()}
            onClick={runSearch}
            className="justify-start rounded-md"
          >
            {pendingAction === "search" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Search
          </Button>
          <Button
            type="button"
            disabled={isBusy || !query.trim()}
            onClick={runGenerate}
            className="justify-start rounded-md"
          >
            {pendingAction === "generate" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={runSampleIndex}
            className="justify-start rounded-md"
          >
            {pendingAction === "index" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSearch className="mr-2 h-4 w-4" />
            )}
            Index 5
          </Button>
        </div>

        {indexResult ? (
          <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
            {indexResult}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid min-w-0 grid-rows-[minmax(180px,auto)_1fr] gap-4">
        <div className="min-w-0 rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">Answer</h2>
              {generationMetadata ? (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{generationMetadata.generationModelSlug}</span>
                  {generationMetadata.usage?.totalTokens ? (
                    <span>{generationMetadata.usage.totalTokens} tokens</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div
            className={cn(
              "max-h-[38vh] min-h-32 overflow-auto rounded-md bg-background p-3 text-sm leading-6",
              answer
                ? "prose prose-slate max-w-none prose-headings:mt-5 prose-headings:mb-2 prose-headings:text-slate-950 prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:my-3 prose-p:leading-7 prose-strong:font-semibold prose-strong:text-slate-950 prose-ul:my-3 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-3 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1 prose-li:leading-7 prose-blockquote:my-3 prose-blockquote:border-l-2 prose-blockquote:border-slate-300 prose-blockquote:pl-3 prose-blockquote:text-slate-600 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:rounded-md prose-pre:bg-slate-950 prose-pre:p-3 prose-pre:text-slate-50 prose-a:text-slate-950 prose-a:underline"
                : "text-muted-foreground",
            )}
          >
            {answer ? (
              <Markdown options={{ disableParsingRawHTML: true }}>
                {answer}
              </Markdown>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="truncate text-base font-semibold">Sources</h2>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
          <div className="grid max-h-[42vh] gap-2 overflow-auto">
            {sources.length ? (
              sources.map((source) => (
                <div
                  key={source.id}
                  className="min-w-0 rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {source.sourceTitle || "Untitled"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {source.sourceOriginalPath || "unknown"}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs">
                      {source.similarity.toFixed(3)}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {source.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md bg-background p-3 text-sm text-muted-foreground">
                —
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
