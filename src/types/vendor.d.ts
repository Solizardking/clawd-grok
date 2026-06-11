/**
 * Type augmentation for OpenTUI JSX runtime and missing module declarations.
 *
 * OpenTUI's JSX factory handles `key` at runtime. React 19 types dropped
 * `key` from React.Attributes, which breaks OpenTUI's JSX.IntrinsicAttributes
 * that extends it. We re-add `key` via module augmentation so JSX elements
 * accept the `key` prop at the type level.
 *
 * Also adds a declaration for @npmcli/arborist which ships without types.
 */

declare module "@npmcli/arborist" {
  import { EventEmitter } from "events";

  export interface ArboristOptions {
    path?: string;
    registry?: string;
    cache?: string;
    [key: string]: unknown;
  }

  export interface Node {
    name: string;
    version: string;
    path: string;
    edgesOut: Map<string, Edge>;
    edgesIn: Map<string, Edge>;
  }

  export interface Edge {
    type: string;
    name: string;
    spec: string;
    to: Node | null;
  }

  export default class Arborist extends EventEmitter {
    constructor(options?: ArboristOptions);
    loadActual(options?: ArboristOptions): Promise<Node>;
    querySelectorAll(query: string): Node[];
  }
}

// OpenTUI JSX.IntrinsicAttributes extends React.Attributes.
// React 19 removed `key` from Attributes. We re-add it.
import "react";

declare module "react" {
  interface Attributes {
    key?: string | number | bigint | null | undefined;
  }
}
