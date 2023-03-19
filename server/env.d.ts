declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DM_REGION_ID: string;
      DM_ENDPOINT: string;
      DM_ACCESS_KEY_ID: string;
      DM_SECRET_ACCESS_KEY: string;
      DM_API_VERSION: string;
      TAKEOUT_TOKEN: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
