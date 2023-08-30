import { calculateEndOfMonth, calculateInvoiceNumber } from "./Code";

describe("calculateEndOfMonth", () => {
  test("calculateEndOfMonth(new Date(31, 7, 1961))", () => {
    const now = new Date(1961, 7, 12); // months are 0 indexed
    const eom = calculateEndOfMonth(now);

    expect(eom).toStrictEqual(new Date(1961, 7, 31));
  });
});

describe("calculateInvoiceNumber", () => {
  test("calculateInvoiceNumber(new Date(31, 7, 1961))", () => {
    const now = new Date(1961, 7, 12); // months are 0 indexed
    const inv = calculateInvoiceNumber(now);

    expect(inv).toStrictEqual("1961-008");
  });
});
