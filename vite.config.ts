import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { ConfigurationSchema } from "./src/config";
import {z} from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url))

function generateJsonSchema(): Plugin {
    let config;

    return {
        name: "generate-jsonschema",
        configResolved(c) {
            config = c;
        },
        writeBundle() {
            writeFileSync(
                resolve(config.root, config.build.outDir, "origo.schema.json"),
                JSON.stringify(z.toJSONSchema(ConfigurationSchema)),
                { flag: "w" }
            );
        },
    }
}

export default defineConfig({
    plugins: [
        generateJsonSchema()
    ],
    server: {
        port: 9966,
    },
    build: {
      lib: {
        entry: resolve(__dirname, "origo.js"),
        name: "Origo",
        fileName: "origo",
      },
      sourcemap: true,
    },
});
