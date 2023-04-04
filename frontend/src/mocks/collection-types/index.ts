import {
  IBackendCurrency,
  IBackendForm,
  IBackendModal,
  IBackendReview,
  IBackendSlider,
  IBackendTier,
} from "types/collection-types";
import {
  spsLiteBackendCurrency,
  spsLiteBackendForm,
  spsLiteBackendModal,
  spsLiteBackendReview,
  spsLiteBackendSliderFadeWithPreviews,
  spsLiteBackendTier,
} from "./sps-lite";

export const backendSliderFadeWithPreviews = {
  ...spsLiteBackendSliderFadeWithPreviews,
} as IBackendSlider;

export const backendCurrency = {
  ...spsLiteBackendCurrency,
} as IBackendCurrency;

export const backendTier = {
  ...spsLiteBackendTier,
} as IBackendTier;

export const backendForm = {
  ...spsLiteBackendForm,
} as IBackendForm;

export const backendReview = {
  ...spsLiteBackendReview,
} as IBackendReview;

export const backendModal = {
  ...spsLiteBackendModal,
} as IBackendModal;
