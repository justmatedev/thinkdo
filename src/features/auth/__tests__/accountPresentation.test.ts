import {
  getSignInMethodLabel,
  resolveSignInMethod,
} from "@/features/auth/accountPresentation";

describe("resolveSignInMethod", () => {
  it("prefers google when both providers exist", () => {
    expect(resolveSignInMethod(["password", "google.com"])).toBe("google");
  });

  it("returns google for google.com", () => {
    expect(resolveSignInMethod(["google.com"])).toBe("google");
  });

  it("returns password for password provider", () => {
    expect(resolveSignInMethod(["password"])).toBe("password");
  });

  it("returns null for unknown providers", () => {
    expect(resolveSignInMethod(["phone"])).toBeNull();
  });
});

describe("getSignInMethodLabel", () => {
  it("labels google sign-in", () => {
    expect(getSignInMethodLabel("google")).toBe("Entrou com Google");
  });

  it("labels email/password sign-in", () => {
    expect(getSignInMethodLabel("password")).toBe("Email e senha");
  });

  it("returns null when method is unknown", () => {
    expect(getSignInMethodLabel(null)).toBeNull();
  });
});
