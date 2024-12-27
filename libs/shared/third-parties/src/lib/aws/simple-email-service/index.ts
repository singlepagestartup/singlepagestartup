import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import * as fs from "fs";
import * as path from "path";
import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
} from "@sps/shared-utils";

export class Service {
  client: SESClient;

  constructor() {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required",
      );
    }

    this.client = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async sendEmail(props: {
    to: string;
    subject: string;
    html: string;
    from: string;
    filePaths?: string[];
  }) {
    const root = process.cwd();

    const boundary = "BOUNDARY_" + Date.now().toString();

    const attachments: string[] = [];

    if (props.filePaths?.length) {
      for (const filePath of props.filePaths) {
        const fileContent = filePath.startsWith("http")
          ? await fetch(filePath)
              .then((res) => res.arrayBuffer())
              .then((buffer) => Buffer.from(buffer))
          : fs.readFileSync(path.join(root, "public", filePath));

        const fileName = path.basename(filePath);

        attachments.push(
          [
            `--${boundary}`,
            "Content-Type: application/octet-stream",
            "Content-Transfer-Encoding: base64",
            `Content-Disposition: attachment; filename="${fileName}"`,
            "",
            fileContent.toString("base64"),
            "",
          ].join("\r\n"),
        );
      }
    }

    const rawMessage = [
      `From: ${props.from}`,
      `To: ${props.to}`,
      `Subject: ${props.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      props.html,
      "",
      ...attachments,
      `--${boundary}--`,
      "",
    ].join("\r\n");

    try {
      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawMessage),
        },
      });

      const result = await this.client.send(command);

      return result;
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
