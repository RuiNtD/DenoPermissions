const { PermissionDenied } = Deno.errors;

function getValue(pd: Deno.PermissionDescriptor): string | undefined {
  switch (pd.name) {
    case "read":
    case "write":
    case "ffi":
      return `${pd.path || ""}`;
    case "net":
    case "import":
      return pd.host;
    case "run":
      return `${pd.command || ""}`;
    case "env":
      return pd.variable;
    case "sys":
      return pd.kind;
  }
}

/**
 * Returns the Deno argument used to grant a given permission.
 *
 * Note that this does not escape special characters, including spaces.
 */
export function getDenoArg(descriptor: Deno.PermissionDescriptor): string {
  const value = getValue(descriptor);
  return value
    ? `--allow-${descriptor.name}=${value}`
    : `--allow-${descriptor.name}`;
}

export function getDenoArgs(
  descriptors: Deno.PermissionDescriptor[],
): string[] {
  return descriptors.map((pd) => getDenoArg(pd));
}

/** Attempts to grant a set of permissions, resolving with the descriptors of
 * the permissions that are granted.
 *
 * ```ts
 *  import { grant } from "jsr:@ruintd/permissions";
 *  const perms = await grant([
 *    { name: "net" },
 *    { name: "read" },
 *  ]);
 *  if (perms.length == 2) {
 *    // do something cool that connects to the net and reads files
 *  } else {
 *    // notify user of missing permissions
 *  }
 * ```
 *
 * If one of the permissions requires a prompt, the function will attempt to
 * prompt for it.  The function resolves with all of the granted permissions.
 */
export async function grant(
  descriptors: Deno.PermissionDescriptor[],
): Promise<Deno.PermissionDescriptor[]> {
  const result: Deno.PermissionDescriptor[] = [];
  for (const descriptor of descriptors) {
    const { state } = await Deno.permissions.request(descriptor);
    if (state === "granted") result.push(descriptor);
  }

  return result;
}

/** Attempts to grant a set of permissions or rejects.
 *
 * ```ts
 *  import { grantOrThrow } from "jsr:@ruintd/permissions";
 *  await grantOrThrow([
 *    { name: "env" },
 *    { name: "net" }
 *  ]);
 * ```
 *
 * If the permission can be prompted for, the function will attempt to prompt.
 * If any of the permissions are denied, the function will reject mentioning the
 * the denied permissions.  If all permissions are granted, the function will
 * resolve.
 */
export async function grantOrThrow(descriptors: Deno.PermissionDescriptor[]) {
  const denied: Deno.PermissionDescriptor[] = [];
  for (const descriptor of descriptors) {
    const { state } = await Deno.permissions.request(descriptor);
    if (state !== "granted") denied.push(descriptor);
  }

  if (denied.length) {
    const perms = denied.map((pd) => `  ${getDenoArg(pd)}`).join("\n");
    throw new PermissionDenied(
      `The following permissions have not been granted:\n${perms}`,
    );
  }
}
