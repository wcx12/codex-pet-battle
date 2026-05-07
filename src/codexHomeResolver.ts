import { stat } from "node:fs/promises";
import path from "node:path";
import { CODEX_HOME_ENV_VAR } from "./constants.js";
import { UserFacingError } from "./errors.js";

export interface ResolveCodexHomeOptions {
  cliCodexHome?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
}

export function resolveCodexHomePath(options: ResolveCodexHomeOptions = {}): string {
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const rawPath = options.cliCodexHome?.trim() || env[CODEX_HOME_ENV_VAR]?.trim() || defaultCodexHome(env, platform);

  if (!rawPath) {
    throw new UserFacingError(
      `Cannot resolve Codex home. Pass --codex-home or set ${CODEX_HOME_ENV_VAR}.`
    );
  }

  return path.resolve(rawPath);
}

export async function resolveCodexHome(options: ResolveCodexHomeOptions = {}): Promise<string> {
  const codexHome = resolveCodexHomePath(options);

  try {
    const codexHomeStat = await stat(codexHome);
    if (!codexHomeStat.isDirectory()) {
      throw new UserFacingError(`Codex home is not a directory: ${codexHome}`);
    }
  } catch (error) {
    if (error instanceof UserFacingError) {
      throw error;
    }

    const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    if (code === "ENOENT") {
      throw new UserFacingError(`Codex home does not exist: ${codexHome}`);
    }

    throw new UserFacingError(`Cannot access Codex home: ${codexHome}`);
  }

  return codexHome;
}

function defaultCodexHome(env: NodeJS.ProcessEnv, platform: NodeJS.Platform): string | undefined {
  if (platform === "win32") {
    return env.USERPROFILE ? path.join(env.USERPROFILE, ".codex") : undefined;
  }

  return env.HOME ? path.join(env.HOME, ".codex") : undefined;
}
