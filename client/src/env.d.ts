/// <reference types="vite/client" />

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  VITE_SERVER_URL: string;
  VITE_RECAPTCHA_SITE_KEY: string;
  VITE_HCAPTCHA_SITE_KEY: string;
}
