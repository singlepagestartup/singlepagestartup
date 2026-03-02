/**
 * BDD Suite: Providers | S3 | Local.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import * as fs from "fs";
import { Provider } from "./index";

describe("Providers | S3 | Local", () => {
  const provider = new Provider({ folder: "test/" });
  const fileName = "testfile.txt";
  const fileBuffer = Buffer.from("Hello, world!");
  const file = new File([fileBuffer], fileName);

  describe("uploadFile", () => {
    it("should upload a file and return its URL", async () => {
      const spys = [
        jest
          .spyOn(fs.promises, "writeFile")
          .mockResolvedValueOnce(undefined as any),
      ];

      const url = await provider.uploadFile({
        file,
      });

      expect(typeof url).toBe("string");
      expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
      spys.forEach((spy) => spy.mockClear());
    });
  });
});
