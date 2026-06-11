declare module "@npmcli/arborist" {
  interface ArboristOptions {
    path: string;
    [key: string]: unknown;
  }
  class Arborist {
    constructor(options: ArboristOptions);
    loadActual(): Promise<void>;
    querySelectorAll(query: string): Promise<Array<{ name: string; version: string }>>;
  }
  export default Arborist;
}
