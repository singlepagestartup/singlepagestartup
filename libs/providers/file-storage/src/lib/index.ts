import { Provider as LocalProvider } from "./local";
import { Provider as VercelBlobProvider } from "./vercel-blob";
import { Provider as AWSS3Provider } from "./aws-s3";
import { IProvider } from "./interface";
import { AWS_REGION, AWS_S3_BUCKET_NAME } from "@sps/shared-utils";

export class Provider implements IProvider {
  folder: string;
  client: LocalProvider | VercelBlobProvider | AWSS3Provider;

  constructor(props: {
    type: "local" | "vercel-blob" | "aws-s3";
    folder: string;
  }) {
    this.folder = props.folder;
    if (props.type === "local") {
      const local = new LocalProvider({
        folder: props.folder,
      });
      this.client = local;

      return;
    } else if (props.type === "vercel-blob") {
      const vercelBlob = new VercelBlobProvider({
        folder: props.folder,
      });
      this.client = vercelBlob;

      return;
    } else if (props.type === "aws-s3") {
      if (!AWS_REGION) {
        throw new Error("Configuration error. AWS_REGION is not defined");
      }

      if (!AWS_S3_BUCKET_NAME) {
        throw new Error(
          "Configuration error. AWS_S3_BUCKET_NAME is not defined",
        );
      }

      const awsS3 = new AWSS3Provider({
        folder: props.folder,
        bucketName: AWS_S3_BUCKET_NAME,
        region: AWS_REGION,
      });
      this.client = awsS3;

      return;
    }

    throw new Error("Not Found error. Provider not found");
  }

  async connect(): Promise<void> {
    return await this.client.connect();
  }

  async uploadFile(props: {
    file: Buffer | Blob;
    options?: any;
  }): Promise<string> {
    return await this.client.uploadFile(props);
  }

  async getFile(props: { name: string }): Promise<Buffer | Blob | null> {
    return await this.client.getFile(props);
  }

  async deleteFile(props: { name: string }): Promise<void> {
    return await this.client.deleteFile(props);
  }
}
