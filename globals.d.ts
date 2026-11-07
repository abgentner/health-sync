// Names the app gets from outside its own files, for the type check (tsc -p jsconfig.json). Not loaded by the app.
declare const APP_VERSION: string;          // inline in index.html
declare const SCRIPT_LATEST: string;
declare function versionLess(a: string, b: string): boolean;
declare const Papa: any;                    // PapaParse (vendor/)
declare const JSZip: any;
declare const Chart: any;
declare const pdfjsLib: any;
declare const google: any;                  // Google sign-in
interface Window { HEALTH_SYNC_CONFIG?: { clientId?: string }; Chart?: any; google?: any; pdfjsLib?: any; TEST_RESULTS?: any }
