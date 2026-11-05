import {
  validatePasswordReset,
  validateSignIn,
  validateSignUp,
} from "@/features/auth/emailAuthValidation";

describe("validateSignIn", () => {
  it("passes with a valid email and non-empty password", () => {
    expect(validateSignIn({ email: "a@b.com", password: "secret" })).toEqual({});
  });
  it("flags missing/invalid email and empty password", () => {
    expect(validateSignIn({ email: "nope", password: "" })).toEqual({
      email: "Digite um email válido.",
      password: "Digite sua senha.",
    });
  });
});

describe("validateSignUp", () => {
  const ok = {
    name: "Ana",
    email: "ana@x.com",
    password: "secret",
    confirm: "secret",
  };
  it("passes with all fields valid", () => {
    expect(validateSignUp(ok)).toEqual({});
  });
  it("flags empty name (after trim)", () => {
    expect(validateSignUp({ ...ok, name: "   " }).name).toBe("Digite seu nome.");
  });
  it("flags invalid email", () => {
    expect(validateSignUp({ ...ok, email: "bad" }).email).toBe(
      "Digite um email válido."
    );
  });
  it("flags password shorter than 6", () => {
    expect(
      validateSignUp({ ...ok, password: "123", confirm: "123" }).password
    ).toBe("Use uma senha com pelo menos 6 caracteres.");
  });
  it("flags mismatched confirmation", () => {
    expect(validateSignUp({ ...ok, confirm: "other" }).confirm).toBe(
      "As senhas não coincidem."
    );
  });
});

describe("validatePasswordReset", () => {
  it("passes with a valid email", () => {
    expect(validatePasswordReset({ email: "a@b.com" })).toEqual({});
  });
  it("flags invalid email", () => {
    expect(validatePasswordReset({ email: "" })).toEqual({
      email: "Digite um email válido.",
    });
  });
});
