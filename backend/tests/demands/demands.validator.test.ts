import { describe, it, expect } from "vitest";
import {
  submitDemandSchema,
  reviewDemandSchema,
} from "../../src/modules/demands/demands.validator.js";

describe("Demand Validators — Zero-Database Unit Tests", () => {
  const baseValidDemand = {
    role: "Company" as const,
    email: "test@company.dz",
    password: "Password123!",
    first_name: "Yacine",
    last_name: "Brahimi",
    phone: "+213555123456",
    gender: "Male" as const,
  };

  describe("submitDemandSchema — Company details", () => {
    it("accepts a valid company object with name", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: "Algeria Cloud Solutions" },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toEqual({ name: "Algeria Cloud Solutions" });
      }
    });

    it("parses and validates company details sent as a JSON string (multipart form-data convention)", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: JSON.stringify({ name: "Parsed From Multipart" }),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toEqual({ name: "Parsed From Multipart" });
      }
    });

    it("trims whitespace from company name", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: "   Trimmed Tech SARL   " },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company?.name).toBe("Trimmed Tech SARL");
      }
    });

    it("allows company to be omitted (optional contract)", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBeUndefined();
      }
    });

    it("accepts company name at exact boundary of 255 characters", () => {
      const maxName = "A".repeat(255);
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: maxName },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company?.name).toBe(maxName);
      }
    });

    it("rejects company name longer than 255 characters", () => {
      const tooLong = "A".repeat(256);
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: tooLong },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company).toBeDefined();
      }
    });

    it("rejects empty company name", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: "" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company).toBeDefined();
      }
    });

    it("rejects whitespace-only company name", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { name: "     " },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company).toBeDefined();
      }
    });

    it("rejects company object missing the name field", () => {
      const result = submitDemandSchema.safeParse({
        ...baseValidDemand,
        company: { other_field: "value" },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company).toBeDefined();
      }
    });
  });

  describe("reviewDemandSchema — company_name input", () => {
    it("accepts valid optional company_name with note", () => {
      const result = reviewDemandSchema.safeParse({
        note: "Verified documentation",
        company_name: "Admin Approved Corp",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe("Admin Approved Corp");
        expect(result.data.note).toBe("Verified documentation");
      }
    });

    it("allows company_name to be omitted", () => {
      const result = reviewDemandSchema.safeParse({
        note: "Verified documentation",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBeUndefined();
      }
    });

    it("trims whitespace from company_name", () => {
      const result = reviewDemandSchema.safeParse({
        company_name: "   Leading And Trailing Spaces   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe("Leading And Trailing Spaces");
      }
    });

    it("accepts company_name at exact boundary of 255 characters", () => {
      const maxName = "C".repeat(255);
      const result = reviewDemandSchema.safeParse({
        company_name: maxName,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company_name).toBe(maxName);
      }
    });

    it("rejects company_name longer than 255 characters", () => {
      const tooLong = "C".repeat(256);
      const result = reviewDemandSchema.safeParse({
        company_name: tooLong,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_name).toBeDefined();
      }
    });

    it("rejects empty string company_name", () => {
      const result = reviewDemandSchema.safeParse({
        company_name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_name).toBeDefined();
      }
    });

    it("rejects whitespace-only company_name", () => {
      const result = reviewDemandSchema.safeParse({
        company_name: "     ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.company_name).toBeDefined();
      }
    });
  });
});
