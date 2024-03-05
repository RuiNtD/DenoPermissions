import { getDenoArg, grant, grantOrThrow } from "./mod.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";

Deno.test({
  name: "grant basic",
  async fn() {
    const perms: Deno.PermissionDescriptor[] = [
      { name: "net" },
      { name: "env" },
    ];
    assertEquals(await grant(perms), perms);
  },
});

Deno.test({
  name: "grant logic",
  async fn() {
    assert(await grant([{ name: "net" }]));
  },
});

Deno.test({
  name: "grantOrThrow basic",
  async fn() {
    await grantOrThrow([{ name: "net" }, { name: "env" }]);
  },
});

Deno.test({
  name: "grantOrThrow invalid permissionDescriptor name",
  async fn() {
    await assertRejects(
      () => {
        // deno-lint-ignore no-explicit-any
        return grantOrThrow([{ name: "nett" } as any]);
      },
      TypeError,
      'The provided value "nett" is not a valid permission name',
    );
  },
});

Deno.test({
  name: "getDenoArg basic",
  fn() {
    assertEquals(getDenoArg({ name: "read" }), "--allow-read");
  },
});

Deno.test({
  name: "getDenoArg value",
  fn() {
    assertEquals(
      getDenoArg({ name: "read", path: "test" }),
      "--allow-read=test",
    );
  },
});
