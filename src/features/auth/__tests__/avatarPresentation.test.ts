import {
  getAccountDisplayName,
  getAvatarPresentation,
} from "@/features/auth/avatarPresentation";

describe("getAvatarPresentation", () => {
  it("prefers photoURL when present", () => {
    expect(
      getAvatarPresentation({
        photoURL: "https://example.com/a.jpg",
        displayName: "Ana",
        email: "ana@x.com",
      })
    ).toEqual({ uri: "https://example.com/a.jpg", initial: "A" });
  });

  it("uses displayName initial when no photo", () => {
    expect(
      getAvatarPresentation({
        photoURL: null,
        displayName: "Bruno Silva",
        email: "b@x.com",
      })
    ).toEqual({ uri: null, initial: "B" });
  });

  it("falls back to email initial when no displayName", () => {
    expect(
      getAvatarPresentation({
        photoURL: null,
        displayName: null,
        email: "carla@x.com",
      })
    ).toEqual({ uri: null, initial: "C" });
  });

  it("uses ? when no name or email", () => {
    expect(
      getAvatarPresentation({
        photoURL: null,
        displayName: null,
        email: null,
      })
    ).toEqual({ uri: null, initial: "?" });
  });

  it("trims and uppercases the initial", () => {
    expect(
      getAvatarPresentation({
        photoURL: null,
        displayName: "  dia",
        email: null,
      }).initial
    ).toBe("D");
  });
});

describe("getAccountDisplayName", () => {
  it("prefers displayName", () => {
    expect(
      getAccountDisplayName({ displayName: "Ana", email: "ana@x.com" })
    ).toBe("Ana");
  });

  it("uses email local-part when no displayName", () => {
    expect(
      getAccountDisplayName({ displayName: null, email: "ana@x.com" })
    ).toBe("ana");
  });

  it("returns Conta when nothing available", () => {
    expect(getAccountDisplayName({ displayName: null, email: null })).toBe(
      "Conta"
    );
  });
});
