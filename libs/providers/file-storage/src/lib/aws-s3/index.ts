import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { IProvider } from "../interface";
import * as stream from "stream";
import { promisify } from "util";
import { logger } from "@sps/backend-utils";

const pipeline = promisify(stream.pipeline);

export class Provider implements IProvider {
  folder: string;
  s3Client: S3Client;
  bucketName: string;

  constructor(props: { folder: string; bucketName: string; region: string }) {
    this.folder = props.folder;
    this.bucketName = props.bucketName;

    this.s3Client = new S3Client({
      region: props.region,
    });
  }

  async connect(): Promise<void> {
    return;
  }

  async uploadFile(props: {
    file: Buffer | Blob | File;
    options?: any;
  }): Promise<string> {
    const { file, options } = props;

    let fileData: Buffer | ArrayBuffer;
    const extension = (props.file as File).name.split(".").pop();

    if (!extension) {
      throw new Error("Validation error. Invalid file extension");
    }

    // Convert File or Blob to Buffer or ArrayBuffer based on the environment
    if (file instanceof Buffer) {
      fileData = file;
    } else if (typeof Blob !== "undefined" && file instanceof Blob) {
      // If we're in a browser and Blob exists, convert Blob to ArrayBuffer
      fileData = await file.arrayBuffer();
    } else if (typeof File !== "undefined" && file instanceof File) {
      // If File exists in this environment, convert to ArrayBuffer
      fileData = await file.arrayBuffer();
    } else {
      throw new Error("Validation error. Unsupported file type");
    }

    const fileName = options?.fileName || `${Date.now()}`;
    const key = `${this.folder}/${fileName}.${extension}`;

    // Create the command to upload the file to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileData as any,
      ACL: "public-read",
    });

    try {
      await this.s3Client.send(command);
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      logger.error("Error uploading to S3:", error);
      throw new Error("Validation error. Failed to upload file to S3");
    }
  }

  async getFile(props: { name: string }): Promise<Buffer | Blob | null> {
    const { name } = props;
    const key = `${this.folder}/${name}`;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);

      const fileStream = response.Body as stream.Readable;
      const chunks: Uint8Array[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      if (error.$metadata?.httpStatusCode === 404) {
        logger.error("File not found in S3:", name);

        return null;
      }

      logger.error("Error getting file from S3:", error);
      throw new Error(error.message, error?.["stack"]);
    }
  }

  async deleteFile(props: { name: string }): Promise<void> {
    const { name } = props;
    const key = `${this.folder}/${name}`;

    // Создаем команду для удаления файла из S3
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      logger.error("Error deleting file from S3:", error);
      throw new Error(error.message, error?.["stack"]);
    }
  }
}
