import { describe, it, expect } from "vitest";
import { updateCompanySchema } from "../../src/modules/companies/companies.validator.js";

describe("Company Profile Validator — Unit Tests", () => {
  describe("updateCompanySchema", () => {
    it("accepts a valid company name", () => {
      const result = updateCompanySchema.safeParse({
        name: "Acme Innovations Ltd",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Acme Innovations Ltd");
      }
    });

    it("trims surrounding whitespace from the company name", () => {
      const result = updateCompanySchema.safeParse({
        name: "   Trimmed Tech Corp   ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Trimmed Tech Corp");
      }
    });

    it("accepts a single character name", () => {
      const result = updateCompanySchema.safeParse({
        name: "A",
      });

      expect(result.success).toBe(true);
    });

    it("accepts a name with exactly 255 characters", () => {
      const name255 = "A".repeat(255);
      const result = updateCompanySchema.safeParse({
        name: name255,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name.length).toBe(255);
      }
    });

    it("rejects an empty string", () => {
      const result = updateCompanySchema.safeParse({
        name: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it("rejects a whitespace-only string", () => {
      const result = updateCompanySchema.safeParse({
        name: "     ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it("rejects a name exceeding 255 characters", () => {
      const name256 = "A".repeat(256);
      const result = updateCompanySchema.safeParse({
        name: name256,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it("rejects when name field is missing", () => {
      const result = updateCompanySchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.name).toBeDefined();
      }
    });

    it("rejects non-string types for name", () => {
      expect(updateCompanySchema.safeParse({ name: 12345 }).success).toBe(false);
      expect(updateCompanySchema.safeParse({ name: null }).success).toBe(false);
      expect(updateCompanySchema.safeParse({ name: true }).success).toBe(false);
      expect(updateCompanySchema.safeParse({ name: ["Acme"] }).success).toBe(false);
      expect(updateCompanySchema.safeParse({ name: { title: "Acme" } }).success).toBe(false);
    });

    it("strictly rejects immutable field 'id'", () => {
      const result = updateCompanySchema.safeParse({
        name: "Acme Corp",
        id: 999,
      });

      expect(result.success).toBe(false);
    });

    it("strictly rejects immutable field 'user_id'", () => {
      const result = updateCompanySchema.safeParse({
        name: "Acme Corp",
        user_id: 12,
      });

      expect(result.success).toBe(false);
    });

    it("strictly rejects immutable field 'is_removed'", () => {
      const result = updateCompanySchema.safeParse({
        name: "Acme Corp",
        is_removed: false,
      });

      expect(result.success).toBe(false);
    });

    it("strictly rejects extended profile fields not present in applied schema", () => {
      expect(
        updateCompanySchema.safeParse({
          name: "Acme Corp",
          email: "contact@acme.com",
        }).success,
      ).toBe(false);

      expect(
        updateCompanySchema.safeParse({
          name: "Acme Corp",
          website: "https://acme.com",
        }).success,
      ).toBe(false);

      expect(
        updateCompanySchema.safeParse({
          name: "Acme Corp",
          description: "Leading tech provider",
        }).success,
      ).toBe(false);

      expect(
        updateCompanySchema.safeParse({
          name: "Acme Corp",
          phone: "+213555123456",
        }).success,
      ).toBe(false);

      expect(
        updateCompanySchema.safeParse({
          name: "Acme Corp",
          location: "Algiers",
        }).success,
      ).toBe(false);
    });
  });
});
