import { asSchema } from "@ai-sdk/provider-utils";
import type { ToolSet } from "ai";
import type { BatchFunctionTool } from "./batch";

interface JsonSchemaConvertible {
  toJSONSchema: (params?: { target?: "draft-7" }) => unknown;
}

function hasJsonSchemaConverter(schema: unknown): schema is JsonSchemaConvertible {
  return (
    typeof schema === "object" &&
    schema !== null &&
    "toJSONSchema" in schema &&
    typeof (schema as JsonSchemaConvertible).toJSONSchema === "function"
  );
}

async function inputSchemaToJsonSchema(schema: unknown): Promise<unknown> {
  if (hasJsonSchemaConverter(schema)) {
    return schema.toJSONSchema({ target: "draft-7" });
  }

  return await asSchema(schema as never).jsonSchema;
}

export async function toolSetToBatchTools(tools: ToolSet): Promise<BatchFunctionTool[]> {
  const entries = Object.entries(tools);
  if (entries.length === 0) {
    return [];
  }

  const batchTools: BatchFunctionTool[] = [];
  for (const [name, tool] of entries) {
    if (tool.type === "provider") {
      throw new Error(`Batch mode does not support provider-defined tool "${name}".`);
    }

    batchTools.push({
      type: "function",
      function: {
        name,
        description: tool.description,
        parameters: await inputSchemaToJsonSchema(tool.inputSchema),
        ...(tool.strict != null ? { strict: tool.strict } : {}),
      },
    });
  }

  return batchTools;
}
