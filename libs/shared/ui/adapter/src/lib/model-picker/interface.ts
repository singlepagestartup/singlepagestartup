export interface IModelPickerOption {
  id: string;
  canonicalId?: string;
  name: string;
  description?: string;
}

export interface IModelPickerProps<TEffort extends string> {
  language: string;
  modelLabel: string;
  autoLabel: string;
  reasoningControlLabel?: string;
  showModelDescription?: boolean;
  favoriteModelIds: readonly string[];
  isLoadingModels: boolean;
  isSelectionUnavailable: boolean;
  isUpdatingFavorites: boolean;
  modelGroups: readonly {
    id: string;
    title: string;
    models: readonly IModelPickerOption[];
  }[];
  onFavoriteToggle: (canonicalId: string) => void;
  onModelChange: (modelId: string) => void;
  onReasoningChange: (effort: TEffort) => void;
  reasoningOptions: readonly {
    label: string;
    labelRu: string;
    value: TEffort;
  }[];
  selectedModelId: string;
  selectedModelLabel: string;
  selectedReasoning: TEffort;
}
