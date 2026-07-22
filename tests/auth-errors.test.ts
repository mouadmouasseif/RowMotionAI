import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, getFirebaseErrorCode } from "@/lib/auth-errors";

describe("Firebase authentication errors", () => {
  it("explains invalid credentials", () => {
    const error = new FirebaseError("auth/invalid-credential", "Invalid credentials");
    expect(getAuthErrorMessage(error)).toBe("Adresse e-mail ou mot de passe incorrect.");
  });

  it("explains an unauthorized deployment domain", () => {
    const error = new FirebaseError("auth/unauthorized-domain", "Unauthorized domain");
    expect(getAuthErrorMessage(error)).toContain("domaine");
  });

  it("keeps an unknown Firebase code as a diagnostic reference", () => {
    const error = new FirebaseError("auth/example-unknown", "Unknown");
    expect(getAuthErrorMessage(error)).toContain("auth/example-unknown");
    expect(getFirebaseErrorCode(error)).toBe("auth/example-unknown");
  });
});
