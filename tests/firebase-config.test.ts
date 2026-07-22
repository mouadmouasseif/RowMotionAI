import { describe, expect, it } from "vitest";
import { resolveStorageBucket } from "@/lib/firebase";

describe("Firebase Storage configuration", () => {
  it("keeps a bucket belonging to the configured project", () => {
    expect(resolveStorageBucket("rowmotion-ai", "rowmotion-ai.firebasestorage.app"))
      .toBe("rowmotion-ai.firebasestorage.app");
  });

  it("repairs a bucket containing a project-name typo", () => {
    expect(resolveStorageBucket("rowmotion-ai", "owmotion-ai.firebasestorage.app"))
      .toBe("rowmotion-ai.firebasestorage.app");
  });

  it("supports legacy appspot buckets", () => {
    expect(resolveStorageBucket("rowmotion-ai", "rowmotion-ai.appspot.com"))
      .toBe("rowmotion-ai.appspot.com");
  });
});
