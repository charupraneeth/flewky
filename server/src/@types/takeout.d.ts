declare module "isomorphic-unfetch" {
  import { RequestInit, Response } from "node-fetch";

  export default function fetch(
    url: string,
    init?: RequestInit
  ): Promise<Response>;
}

declare module "html-minifier" {
  export function minify(html: string, options?: any): string;
}

declare module "fs" {
  export function readFileSync(file: string): Buffer;
}

declare module "takeout.js" {
  export default class TakeoutClient {
    debug: boolean;
    token: string;
    baseUrl: string;

    constructor(debug?: boolean);

    login(
      token: string
    ): Promise<void | { message: string; authenticated: boolean }>;

    getHTMLFileContents(file: string): Promise<string>;

    getLocalTemplate(file: string): Promise<string>;

    getCloudTemplate(file: string): Promise<string>;

    send(emailTemplate: {
      to: string;
      from: string;
      subject: string;
      text?: string;
      replyTo?: string;
      cc?: string;
      html?: string;
    }): Promise<void | { id: string }>;
  }
}
