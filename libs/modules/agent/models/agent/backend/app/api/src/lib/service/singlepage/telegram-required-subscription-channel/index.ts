export interface ITelegramRequiredSubscriptionChannelInput {
  id?: string;
  name?: string;
  link?: string;
}

export interface ITelegramRequiredSubscriptionChannelConfiguration {
  id: string;
  name: string;
  link: string;
  isConfigured: boolean;
  isPartiallyConfigured: boolean;
}

export function resolveTelegramRequiredSubscriptionChannelConfiguration(
  props: ITelegramRequiredSubscriptionChannelInput,
): ITelegramRequiredSubscriptionChannelConfiguration {
  const id = props.id?.trim() ?? "";
  const name = props.name?.trim() ?? "";
  const link = props.link?.trim() ?? "";
  const configuredValues = [id, name, link].filter(Boolean).length;

  return {
    id,
    name,
    link,
    isConfigured: configuredValues === 3,
    isPartiallyConfigured: configuredValues > 0 && configuredValues < 3,
  };
}
