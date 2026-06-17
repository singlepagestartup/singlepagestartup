import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { KV_PROVIDER } from "@sps/shared-utils";
import { Service } from "../../../../../../../../service";

const OPEN_ROUTER_MODEL_FAVORITES_KV_PREFIX =
  "rbac:subject:openrouter-model-favorites";
const OPEN_ROUTER_MODEL_FAVORITES_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

interface IOpenRouterModelFavoritesValue {
  favoriteModelIds: string[];
}

interface IKvProvider {
  get(props: {
    prefix: string;
    key: string;
  }): Promise<string | null | undefined>;
  set(props: {
    prefix: string;
    key: string;
    value: string;
    options?: {
      ttl?: number;
    };
  }): Promise<unknown>;
}

type TKvProviderFactory = () => Promise<IKvProvider>;

async function createKvProvider(): Promise<IKvProvider> {
  const kvProviderModuleUrl = new URL(
    "libs/providers/kv/src/index.ts",
    `file://${process.cwd()}/`,
  ).href;
  const { Provider } = (await import(kvProviderModuleUrl)) as {
    Provider: new (props: { type: string }) => IKvProvider;
  };

  return new Provider({
    type: KV_PROVIDER,
  });
}

export class Handler {
  service: Service;
  private kvProviderFactory: TKvProviderFactory;
  private kvProviderPromise?: Promise<IKvProvider>;

  constructor(
    service: Service,
    kvProviderFactory: TKvProviderFactory = createKvProvider,
  ) {
    this.service = service;
    this.kvProviderFactory = kvProviderFactory;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const subjectId = this.requireParam(c, "id");
      const socialModuleProfileId = this.requireParam(
        c,
        "socialModuleProfileId",
      );
      const socialModuleChatId = this.requireParam(c, "socialModuleChatId");

      await this.assertProfileCanAccessChat({
        socialModuleProfileId,
        socialModuleChatId,
      });

      if (c.req.method === "PATCH") {
        const payload = await this.readPayload(c);
        const favoriteModelIds = this.normalizeFavoriteModelIds(
          payload.favoriteModelIds,
        );
        const value: IOpenRouterModelFavoritesValue = {
          favoriteModelIds,
        };
        const kvProvider = await this.getKvProvider();

        await kvProvider.set({
          prefix: OPEN_ROUTER_MODEL_FAVORITES_KV_PREFIX,
          key: subjectId,
          value: JSON.stringify(value),
          options: {
            ttl: OPEN_ROUTER_MODEL_FAVORITES_TTL_SECONDS,
          },
        });

        return c.json({
          data: value,
        });
      }

      return c.json({
        data: await this.readFavorites(subjectId),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async getKvProvider() {
    if (!this.kvProviderPromise) {
      this.kvProviderPromise = this.kvProviderFactory();
    }

    return this.kvProviderPromise;
  }

  private requireParam(c: Context, name: string) {
    const value = c.req.param(name);

    if (!value) {
      throw new Error(`Validation error. No ${name} provided`);
    }

    return value;
  }

  private async assertProfileCanAccessChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) {
    const relations = await this.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
    });

    if (!relations?.length) {
      throw new Error(
        "Authorization error. Requested social-module chat does not belong to profile",
      );
    }
  }

  private async readPayload(
    c: Context,
  ): Promise<IOpenRouterModelFavoritesValue> {
    try {
      const body = await c.req.json();
      const data = body?.data || body || {};

      return {
        favoriteModelIds: data.favoriteModelIds,
      };
    } catch {
      return {
        favoriteModelIds: [],
      };
    }
  }

  private async readFavorites(
    subjectId: string,
  ): Promise<IOpenRouterModelFavoritesValue> {
    const kvProvider = await this.getKvProvider();
    const rawValue = await kvProvider.get({
      prefix: OPEN_ROUTER_MODEL_FAVORITES_KV_PREFIX,
      key: subjectId,
    });

    if (!rawValue) {
      return {
        favoriteModelIds: [],
      };
    }

    try {
      const parsedValue = JSON.parse(rawValue);

      return {
        favoriteModelIds: this.normalizeFavoriteModelIds(
          parsedValue.favoriteModelIds,
        ),
      };
    } catch {
      return {
        favoriteModelIds: [],
      };
    }
  }

  private normalizeFavoriteModelIds(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .map((item) => {
            return typeof item === "string" ? item.trim() : "";
          })
          .filter((item) => {
            return item && item !== "auto" && item.length <= 200;
          }),
      ),
    ).slice(0, 50);
  }
}
