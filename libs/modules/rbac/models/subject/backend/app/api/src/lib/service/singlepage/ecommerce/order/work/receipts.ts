import { createHash } from "node:crypto";
import { clearHttpResponseCache } from "@sps/shared-backend-api";
import {
  FILE_STORAGE_MAX_UPLOAD_BYTES,
  MIDDLEWARE_HTTP_CACHE,
} from "@sps/shared-utils";
import { isLegacyOrderReceipt } from "@sps/file-storage/models/file/sdk/model";
import type { Service as Subject } from "../../../index";

interface IDependencies {
  subject: Subject;
  owner: (orderId: string) => Promise<string | null>;
  grant: (
    purchase: { customerId: string; orderId: string },
    fileIds: string[],
  ) => Promise<void>;
}

export class LegacyReceipts {
  constructor(private readonly dependencies: IDependencies) {}

  private get links() {
    return this.dependencies.subject.modules.ecommerce
      .ordersToFileStorageModuleFiles;
  }

  private get files() {
    return this.dependencies.subject.modules.fileStorage;
  }

  private async inspect(fileId: string) {
    const file = await this.files.file.findById({ id: fileId });
    if (!file) {
      throw new Error("Not Found error. Legacy receipt metadata is missing");
    }
    const relations = await this.links.find({
      params: {
        filters: {
          and: [
            { column: "fileStorageModuleFileId", method: "eq", value: fileId },
          ],
        },
      },
    });
    const receipts = relations.filter(
      (relation) =>
        relation.variant === "receipt-default" &&
        (!relation.privateReceiptFileId || relation.legacyReceiptLocation),
    );
    if (!receipts.length && !isLegacyOrderReceipt(file)) {
      throw new Error(
        "Validation error. The file is not a legacy order receipt",
      );
    }
    if (relations.length > receipts.length) {
      throw new Error(
        "Conflict error. The receipt also has a non-receipt relation",
      );
    }

    const orderIds = [...new Set(receipts.map(({ orderId }) => orderId))];
    const [orderId] = orderIds;
    const customerId =
      orderIds.length === 1 ? await this.dependencies.owner(orderId) : null;
    let purchase: { orderId: string; customerId: string } | null = null;
    if (customerId) {
      const order =
        await this.dependencies.subject.modules.ecommerce.order.findById({
          id: orderId,
        });
      if (
        order?.type === "history" &&
        [
          "paid",
          "approving",
          "packaging",
          "delivering",
          "delivered",
          "completed",
          "expired",
        ].includes(order.status)
      ) {
        purchase = { orderId, customerId };
      }
    }

    const oldLocations = new Set(
      receipts.flatMap((receipt) =>
        receipt.legacyReceiptLocation ? [receipt.legacyReceiptLocation] : [],
      ),
    );
    const privateIds = [
      ...new Set(
        receipts.flatMap((receipt) =>
          receipt.privateReceiptFileId ? [receipt.privateReceiptFileId] : [],
        ),
      ),
    ];
    if (
      oldLocations.size > 1 ||
      privateIds.length > 1 ||
      !file.mimeType ||
      !file.size
    ) {
      throw new Error(
        "Conflict error. Legacy receipt metadata requires manual reconciliation",
      );
    }
    const location = oldLocations.values().next().value ?? file.file;
    const [privateFileId] = privateIds;
    const copy = privateFileId
      ? await this.files.privateFile.findById({ id: privateFileId })
      : (
          await this.files.privateFile.find({
            params: {
              filters: {
                and: [
                  { column: "legacyOriginId", method: "eq", value: fileId },
                ],
              },
              limit: 1,
            },
          })
        )[0];
    const bytes =
      copy?.bytes ??
      (await this.files.file.readBytes(
        { file: location },
        { maxBytes: FILE_STORAGE_MAX_UPLOAD_BYTES },
      ));
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (
      bytes.length !== file.size ||
      (copy && (copy.digest !== digest || copy.size !== bytes.length))
    ) {
      throw new Error(
        "Conflict error. Legacy receipt bytes differ from the verified size or checksum",
      );
    }
    return {
      file,
      receipts,
      purchase,
      copy,
      location,
      bytes,
      digest,
      mimeType: file.mimeType,
    };
  }

  async migrate(fileId: string, apply: boolean) {
    const state = await this.files.file.withFileLock(fileId, async () => {
      const state = await this.inspect(fileId);
      if (!apply) {
        return state;
      }
      const copy =
        state.copy ??
        (await this.files.privateFile.write({
          name: `receipt-${state.purchase?.orderId ?? fileId}.${state.file.extension ?? "png"}`,
          mimeType: state.mimeType,
          bytes: state.bytes,
          legacyOriginId: fileId,
        }));
      if (copy.digest !== state.digest || copy.size !== state.bytes.length) {
        throw new Error(
          "Conflict error. The protected receipt copy failed verification",
        );
      }
      for (const receipt of state.receipts) {
        if (
          receipt.privateReceiptFileId === copy.id &&
          receipt.legacyReceiptLocation === state.location
        ) {
          continue;
        }
        await this.links.update({
          id: receipt.id,
          data: {
            privateReceiptFileId: copy.id,
            legacyReceiptLocation: state.location,
          },
        });
      }
      return { ...state, copy };
    });

    if (!apply) {
      return {
        fileId,
        status: state.purchase ? "ready" : "ambiguous-owner",
        size: state.bytes.length,
        digest: state.digest,
      };
    }
    if (!state.copy) {
      throw new Error(
        "Conflict error. Verified private receipt copy is missing",
      );
    }
    await this.files.file.withdrawPublicReceipt(state.location, state.digest);
    if (MIDDLEWARE_HTTP_CACHE === "true") {
      await clearHttpResponseCache();
    }
    const copyId = state.copy.id;
    const purchase = state.purchase;
    if (purchase) {
      await this.dependencies.subject.modules.ecommerce.order.repository.withLifecycleLock(
        purchase.orderId,
        async () => {
          if (
            (await this.dependencies.owner(purchase.orderId)) !==
            purchase.customerId
          ) {
            throw new Error(
              "Conflict error. The receipt owner changed during migration",
            );
          }
          await this.dependencies.grant(purchase, [copyId]);
          for (const receipt of state.receipts) {
            if (!receipt.legacyReceiptRevokedAt) {
              await this.links.update({
                id: receipt.id,
                data: { legacyReceiptRevokedAt: new Date() },
              });
            }
          }
        },
      );
    }
    return {
      fileId,
      privateFileId: copyId,
      status: purchase ? "migrated" : "quarantined",
      size: state.bytes.length,
      digest: state.digest,
    };
  }

  async list() {
    const [linked, generated] = await Promise.all([
      this.links.find({
        params: {
          filters: {
            and: [
              { column: "variant", method: "eq", value: "receipt-default" },
            ],
          },
        },
      }),
      this.files.file.find({
        params: {
          filters: {
            and: [
              {
                column: "adminTitle",
                method: "ilike",
                value: "Ecommerce Module | Order % | Receipt",
              },
            ],
          },
        },
      }),
    ]);
    return [
      ...new Set([
        ...linked
          .filter(
            (relation) =>
              !relation.privateReceiptFileId || relation.legacyReceiptLocation,
          )
          .map((relation) => relation.fileStorageModuleFileId),
        ...generated.filter(isLegacyOrderReceipt).map((file) => file.id),
      ]),
    ];
  }
}
