import { getAuthErrorMessage, getPasswordResetErrorMessage } from "@/features/auth/authErrors";

describe("getAuthErrorMessage", () => {
  it("maps invalid credential family to a single message", () => {
    for (const code of [
      "auth/invalid-credential",
      "auth/wrong-password",
      "auth/user-not-found",
    ]) {
      expect(getAuthErrorMessage({ code })).toBe("Email ou senha incorretos.");
    }
  });

  it("maps email-already-in-use", () => {
    expect(getAuthErrorMessage({ code: "auth/email-already-in-use" })).toBe(
      "Já existe uma conta com este email."
    );
  });

  it("maps weak-password", () => {
    expect(getAuthErrorMessage({ code: "auth/weak-password" })).toBe(
      "Use uma senha com pelo menos 6 caracteres."
    );
  });

  it("maps invalid-email", () => {
    expect(getAuthErrorMessage({ code: "auth/invalid-email" })).toBe(
      "Digite um email válido."
    );
  });

  it("maps too-many-requests", () => {
    expect(getAuthErrorMessage({ code: "auth/too-many-requests" })).toBe(
      "Muitas tentativas. Tente mais tarde."
    );
  });

  it("maps network-request-failed", () => {
    expect(getAuthErrorMessage({ code: "auth/network-request-failed" })).toBe(
      "Sem conexão. Verifique a internet."
    );
  });

  it("falls back for unknown or malformed errors", () => {
    expect(getAuthErrorMessage({ code: "auth/internal-error" })).toBe(
      "Não foi possível concluir. Tente de novo."
    );
    expect(getAuthErrorMessage(new Error("boom"))).toBe(
      "Não foi possível concluir. Tente de novo."
    );
    expect(getAuthErrorMessage(null)).toBe(
      "Não foi possível concluir. Tente de novo."
    );
  });
});

describe("getPasswordResetErrorMessage", () => {
  it("maps invalid-email", () => {
    expect(getPasswordResetErrorMessage({ code: "auth/invalid-email" })).toBe(
      "Digite um email válido."
    );
  });

  it("maps too-many-requests", () => {
    expect(getPasswordResetErrorMessage({ code: "auth/too-many-requests" })).toBe(
      "Muitas tentativas. Tente mais tarde."
    );
  });

  it("maps network-request-failed", () => {
    expect(
      getPasswordResetErrorMessage({ code: "auth/network-request-failed" })
    ).toBe("Sem conexão. Verifique a internet.");
  });

  it("does not reveal account existence for user-not-found or invalid-credential", () => {
    for (const code of ["auth/user-not-found", "auth/invalid-credential"]) {
      expect(getPasswordResetErrorMessage({ code })).toBe(
        "Não foi possível concluir. Tente de novo."
      );
      expect(getPasswordResetErrorMessage({ code })).not.toBe(
        "Email ou senha incorretos."
      );
    }
  });

  it("falls back for unknown or malformed errors", () => {
    expect(getPasswordResetErrorMessage({ code: "auth/internal-error" })).toBe(
      "Não foi possível concluir. Tente de novo."
    );
    expect(getPasswordResetErrorMessage(new Error("boom"))).toBe(
      "Não foi possível concluir. Tente de novo."
    );
    expect(getPasswordResetErrorMessage(null)).toBe(
      "Não foi possível concluir. Tente de novo."
    );
  });
});
