import { INBOX_SKELETON_WIDTHS } from "@/components/inbox/inboxSkeletonPresentation";

describe("INBOX_SKELETON_WIDTHS", () => {
  it("matches the five alternate widths from the content-skeleton spec", () => {
    expect(INBOX_SKELETON_WIDTHS).toEqual([
      "85%",
      "70%",
      "80%",
      "60%",
      "75%",
    ]);
  });
});
