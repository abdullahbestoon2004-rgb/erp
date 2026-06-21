/**
 * Invoice lifecycle tests
 *
 * Covers (per spec):
 *  1. Draft excluded from customer outstanding balance
 *  2. Send posts correctly (balance increases, journal entry created)
 *  3. Gap-free numbering — deleting drafts never leaves a gap in INV- sequence
 *  4. Void reverses the outstanding balance (and creates reversal JE)
 *  5. Partial payment → partially_paid, correct balance_due
 *  6. Full payment → paid, excluded from outstanding balance
 *  7. Non-draft invoice cannot be hard-deleted
 *  8. Concurrent sends (simulated) produce unique sequential numbers
 *
 * localStorage is provided by jsdom (configured in vitest.config.ts).
 * It is cleared before each test via test-setup.ts.
 */

import { describe, it, expect } from "vitest";
import {
  invoiceStorage,
  journalEntryStorage,
  invoicePaymentStorage,
  sendInvoice,
  markInvoiceAsSent,
  voidInvoice,
  deleteDraftInvoice,
  recordInvoicePayment,
  getCustomerReceivables,
} from "./storage";
import type { Invoice } from "@/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeDraft(overrides: Partial<Omit<Invoice, "id" | "createdAt" | "updatedAt">> = {}): Invoice {
  return invoiceStorage.add({
    invoiceNumber: `DRAFT-${Date.now()}-${Math.random()}`,
    customerId: "cust-1",
    customerName: "Test Corp",
    date: Date.now(),
    dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    lineItems: [
      { id: "li-1", itemName: "Widget", description: "", quantity: 2, unitPrice: 100, taxRate: 10, amount: 200 },
    ],
    subtotal: 200,
    taxAmount: 20,
    total: 220,
    balance_due: 220,
    posted: false,
    sent_at: null,
    status: "draft",
    ...overrides,
  });
}

function freshSent(): Invoice {
  const draft = makeDraft();
  const sent = sendInvoice(draft.id, false)!;
  // re-read from storage so all fields are fresh
  return invoiceStorage.getAll().find(i => i.id === sent.id)!;
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("1 · Draft is excluded from customer outstanding balance", () => {
  it("creating a draft does not add to receivables", () => {
    makeDraft();
    expect(getCustomerReceivables("cust-1")).toBe(0);
  });

  it("multiple drafts all excluded", () => {
    makeDraft(); makeDraft(); makeDraft();
    expect(getCustomerReceivables("cust-1")).toBe(0);
  });
});

describe("2 · Send posts correctly", () => {
  it("balance increases by invoice total on send", () => {
    freshSent();
    expect(getCustomerReceivables("cust-1")).toBe(220);
  });

  it("invoice status becomes sent", () => {
    const sent = freshSent();
    expect(sent.status).toBe("sent");
  });

  it("posted flag is true after send", () => {
    const sent = freshSent();
    expect(sent.posted).toBe(true);
  });

  it("balance_due equals total on first send", () => {
    const sent = freshSent();
    expect(sent.balance_due).toBe(sent.total);
  });

  it("a journal entry is created and linked to the invoice", () => {
    const sent = freshSent();
    expect(sent.journalEntryId).toBeDefined();

    const je = journalEntryStorage.getAll().find(j => j.id === sent.journalEntryId);
    expect(je).toBeDefined();
    expect(je!.sourceType).toBe("invoice");
    expect(je!.sourceId).toBe(sent.id);
    // DR AR
    const arLine = je!.lines.find(l => l.accountName === "Accounts Receivable");
    expect(arLine?.debit).toBe(220);
    expect(arLine?.credit).toBe(0);
    // CR Revenue
    const revLine = je!.lines.find(l => l.accountName === "Sales");
    expect(revLine?.credit).toBe(200);
    // CR Tax Payable
    const taxLine = je!.lines.find(l => l.accountName === "Tax Payable");
    expect(taxLine?.credit).toBe(20);
  });

  it("sending an already-sent invoice is a no-op (idempotent guard)", () => {
    const sent = freshSent();
    const again = sendInvoice(sent.id, true);
    // Should return the invoice unchanged, not double-post
    expect(again?.status).toBe("sent");
    expect(getCustomerReceivables("cust-1")).toBe(220); // not 440
  });

  it("markInvoiceAsSent is equivalent to send (no email flag)", () => {
    const draft = makeDraft();
    const sent = markInvoiceAsSent(draft.id)!;
    expect(sent.status).toBe("sent");
    expect(sent.sent_at).toBeNull();
  });

  it("send with byEmail=true records sent_at timestamp", () => {
    const draft = makeDraft();
    const before = Date.now();
    const sent = sendInvoice(draft.id, true)!;
    const after = Date.now();
    expect(sent.sent_at).toBeGreaterThanOrEqual(before);
    expect(sent.sent_at).toBeLessThanOrEqual(after);
  });
});

describe("3 · Gap-free invoice numbering", () => {
  it("draft gets DRAFT- provisional number, not INV-", () => {
    const draft = makeDraft();
    expect(draft.invoiceNumber).toMatch(/^DRAFT-/);
  });

  it("sent invoice gets a real INV- number", () => {
    const sent = freshSent();
    expect(sent.invoiceNumber).toMatch(/^INV-/);
    expect(sent.invoiceNumber).not.toMatch(/^DRAFT-/);
  });

  it("first posted invoice is INV-00001", () => {
    const sent = freshSent();
    expect(sent.invoiceNumber).toBe("INV-00001");
  });

  it("deleting drafts never leaves a gap — first real invoice is always INV-00001", () => {
    const d1 = makeDraft();
    const d2 = makeDraft();
    const d3 = makeDraft();
    deleteDraftInvoice(d1.id);
    deleteDraftInvoice(d2.id);
    deleteDraftInvoice(d3.id);

    const d4 = makeDraft();
    const sent = sendInvoice(d4.id, false)!;
    expect(sent.invoiceNumber).toBe("INV-00001");
  });

  it("sequential sends produce INV-00001, INV-00002, INV-00003", () => {
    const numbers = [makeDraft(), makeDraft(), makeDraft()]
      .map(d => sendInvoice(d.id, false)!.invoiceNumber);
    expect(numbers).toEqual(["INV-00001", "INV-00002", "INV-00003"]);
  });

  it("draft interspersed with sends does not break the sequence", () => {
    const d1 = makeDraft();
    const unsentDraft = makeDraft(); // will NOT be sent
    const d3 = makeDraft();
    const s1 = sendInvoice(d1.id, false)!;
    const s3 = sendInvoice(d3.id, false)!;
    // unsentDraft stays as draft — shouldn't affect sequence
    expect(s1.invoiceNumber).toBe("INV-00001");
    expect(s3.invoiceNumber).toBe("INV-00002");
    void unsentDraft; // silence unused warning
  });
});

describe("4 · Void reverses the outstanding balance", () => {
  it("void removes invoice from receivables", () => {
    const sent = freshSent();
    expect(getCustomerReceivables("cust-1")).toBe(220);
    voidInvoice(sent.id);
    expect(getCustomerReceivables("cust-1")).toBe(0);
  });

  it("void sets status to void", () => {
    const sent = freshSent();
    voidInvoice(sent.id);
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.status).toBe("void");
  });

  it("void sets balance_due to 0", () => {
    const sent = freshSent();
    voidInvoice(sent.id);
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.balance_due).toBe(0);
  });

  it("void creates a reversing journal entry", () => {
    const sent = freshSent();
    voidInvoice(sent.id);
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;

    expect(updated.voidJournalEntryId).toBeDefined();
    const voidJe = journalEntryStorage.getAll().find(j => j.id === updated.voidJournalEntryId);
    expect(voidJe).toBeDefined();
    expect(voidJe!.sourceType).toBe("invoice_void");
    // CR AR (reversal of original DR)
    const arLine = voidJe!.lines.find(l => l.accountName === "Accounts Receivable");
    expect(arLine?.credit).toBe(220);
    // DR Revenue (reversal of original CR)
    const revLine = voidJe!.lines.find(l => l.accountName === "Sales");
    expect(revLine?.debit).toBe(200);
  });

  it("voiding a draft is a no-op", () => {
    const draft = makeDraft();
    const result = voidInvoice(draft.id);
    const unchanged = invoiceStorage.getAll().find(i => i.id === draft.id)!;
    expect(unchanged.status).toBe("draft");
    void result;
  });

  it("voiding an already-voided invoice is a no-op", () => {
    const sent = freshSent();
    voidInvoice(sent.id);
    voidInvoice(sent.id); // second call
    expect(getCustomerReceivables("cust-1")).toBe(0);
    const journalCount = journalEntryStorage.getAll().filter(j => j.sourceId === sent.id).length;
    expect(journalCount).toBe(2); // original post + one void, not three
  });
});

describe("5 · Partial payment", () => {
  it("partial payment reduces balance_due", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 100, "cash");
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.balance_due).toBe(120);
  });

  it("partial payment sets status to partially_paid", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 100, "cash");
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.status).toBe("partially_paid");
  });

  it("partial payment is reflected in customer receivables", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 100, "cash");
    expect(getCustomerReceivables("cust-1")).toBe(120);
  });

  it("payment record is stored", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 100, "bank_transfer", "ref-xyz");
    const payments = invoicePaymentStorage.getByInvoice(sent.id);
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(100);
    expect(payments[0].method).toBe("bank_transfer");
    expect(payments[0].note).toBe("ref-xyz");
  });
});

describe("6 · Full payment", () => {
  it("full payment sets status to paid", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 220, "cash");
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.status).toBe("paid");
  });

  it("paid invoice is excluded from customer receivables", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 220, "cash");
    expect(getCustomerReceivables("cust-1")).toBe(0);
  });

  it("overpayment is capped at balance_due", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 9999, "cash");
    const updated = invoiceStorage.getAll().find(i => i.id === sent.id)!;
    expect(updated.balance_due).toBe(0);
    expect(updated.status).toBe("paid");
  });
});

describe("7 · Deletion guard", () => {
  it("deleting a draft succeeds and returns true", () => {
    const draft = makeDraft();
    expect(deleteDraftInvoice(draft.id)).toBe(true);
    expect(invoiceStorage.getAll().find(i => i.id === draft.id)).toBeUndefined();
  });

  it("deleting a sent invoice returns false and keeps the record", () => {
    const sent = freshSent();
    expect(deleteDraftInvoice(sent.id)).toBe(false);
    expect(invoiceStorage.getAll().find(i => i.id === sent.id)).toBeDefined();
  });

  it("deleting a voided invoice returns false", () => {
    const sent = freshSent();
    voidInvoice(sent.id);
    expect(deleteDraftInvoice(sent.id)).toBe(false);
  });

  it("deleting a paid invoice returns false", () => {
    const sent = freshSent();
    recordInvoicePayment(sent.id, 220, "cash");
    expect(deleteDraftInvoice(sent.id)).toBe(false);
  });
});

describe("8 · Concurrent sends (simulated — localStorage is sync/single-threaded)", () => {
  it("two sends in sequence produce unique numbers", () => {
    const d1 = makeDraft();
    const d2 = makeDraft();
    const s1 = sendInvoice(d1.id, false)!;
    const s2 = sendInvoice(d2.id, false)!;
    expect(s1.invoiceNumber).not.toBe(s2.invoiceNumber);
  });

  it("ten sequential sends produce numbers INV-00001 … INV-00010 with no gaps", () => {
    const drafts = Array.from({ length: 10 }, () => makeDraft());
    const numbers = drafts.map(d => sendInvoice(d.id, false)!.invoiceNumber);
    const expected = Array.from({ length: 10 }, (_, i) =>
      `INV-${String(i + 1).padStart(5, "0")}`
    );
    expect(numbers).toEqual(expected);
  });
});
