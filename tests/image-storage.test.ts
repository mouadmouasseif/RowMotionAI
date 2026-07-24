import { describe, expect, it } from "vitest";
import { StorageUploadError, validateImage } from "@/services/image-storage-service";

describe("Firebase image validation", () => {
  it("accepts JPG and PNG images", () => {
    expect(() => validateImage(new File(["jpg"], "avatar.jpg", { type: "image/jpeg" }))).not.toThrow();
    expect(() => validateImage(new File(["png"], "logo.png", { type: "image/png" }))).not.toThrow();
  });

  it("rejects PDF files with a readable error", () => {
    expect(() => validateImage(new File(["pdf"], "document.pdf", { type: "application/pdf" })))
      .toThrow("Utilisez une image JPG, PNG ou WebP.");
  });

  it("rejects images larger than 5 MB", () => {
    const largeImage = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" });
    expect(() => validateImage(largeImage)).toThrow("L’image ne doit pas dépasser 5 Mo.");
  });

  it("uses a typed upload error", () => {
    try {
      validateImage(new File(["pdf"], "document.pdf", { type: "application/pdf" }));
    } catch (error) {
      expect(error).toBeInstanceOf(StorageUploadError);
    }
  });
});
