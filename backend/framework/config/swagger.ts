import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

// Normalize Windows backslashes to forward slashes for glob pattern matching compatibility
const toGlobPath = (p: string): string => p.replace(/\\/g, "/");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jadara API",
      version: "1.0.0",
      description: "Jadara platform backend REST API documentation",
      contact: {
        name: "Jadara API Team",
      },
    },
    servers: [
      {
        url: env.API_URL,
        description: "API server",
      },
    ],
    tags: [
      { name: "Skills", description: "Skill catalog management" },
      { name: "Skill Categories", description: "Skill categories management" },
      { name: "Auth", description: "Authentication, registration, tokens, and sessions" },
      { name: "Domains", description: "Business domains and skill associations" },
      { name: "Roles", description: "Role catalog and role-permission assignments" },
      {
        name: "Activities",
        description: "Volunteering activities: Organization creation, Admin review, required skills",
      },
      { name: "Users", description: "User profiles and account management" },
      { name: "Roles", description: "Role-based access control and permissions" },
      { name: "CV", description: "Curriculum Vitae PDF generation, status and history" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Bearer token in the format: Bearer <token>",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation completed successfully" },
            data: {
              type: "object",
              nullable: true,
              description: "Payload data returned by the operation",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          required: ["success", "message"],
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "An error occurred while processing the request" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          required: ["success", "message", "errors"],
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { type: "string" },
              },
              example: {
                name: ["Required", "Must be at least 1 character"],
                category_id: ["Expected number, received nan"],
              },
            },
          },
        },
        PaginationMeta: {
          type: "object",
          required: ["total", "page", "limit", "totalPages", "nextCursor"],
          properties: {
            total: { type: "integer", example: 42, description: "Total number of records" },
            page: { type: "integer", example: 1, description: "Current page number" },
            limit: { type: "integer", example: 10, description: "Items per page" },
            totalPages: { type: "integer", example: 5, description: "Total number of pages" },
            nextCursor: {
              type: "integer",
              nullable: true,
              example: 2,
              description: "Next page cursor or null if last page",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          required: ["success", "message", "data", "meta"],
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Records fetched successfully" },
            data: {
              type: "array",
              items: { type: "object" },
              description: "Array of items for current page",
            },
            meta: {
              $ref: "#/components/schemas/PaginationMeta",
            },
          },
        },
        SkillCategory: {
          type: "object",
          required: ["id", "name", "created_at", "updated_at"],
          properties: {
            id: { type: "integer", example: 1, description: "Unique category ID" },
            name: { type: "string", example: "Software Engineering", description: "Category name" },
            description: {
              type: "string",
              nullable: true,
              example: "Software architecture and engineering",
              description: "Category description",
            },
            created_at: { type: "string", format: "date-time", example: "2026-03-01T10:00:00.000Z" },
            updated_at: { type: "string", format: "date-time", example: "2026-03-01T10:00:00.000Z" },
          },
        },
        Skill: {
          type: "object",
          required: ["id", "name", "status", "category_id"],
          properties: {
            id: { type: "integer", example: 10, description: "Unique skill ID" },
            name: { type: "string", example: "TypeScript", description: "Skill name" },
            description: {
              type: "string",
              nullable: true,
              example: "Strongly typed programming language that builds on JavaScript",
              description: "Skill description",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
              description: "Skill active status",
            },
            category_id: {
              type: "integer",
              example: 1,
              description: "Parent category ID",
            },
            category: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Software Engineering" },
              },
            },
          },
        },
        CreateSkillCategoryInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "Software Engineering",
              description: "Unique name of the skill category",
            },
            description: {
              type: "string",
              maxLength: 500,
              example: "Software design, programming, and architecture",
              description: "Optional description of the category",
            },
          },
        },
        CreateSkillInput: {
          type: "object",
          required: ["name", "category_id"],
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "TypeScript",
              description: "Unique name of the skill",
            },
            category_id: {
              type: "integer",
              minimum: 1,
              example: 1,
              description: "ID of the parent category",
            },
            description: {
              type: "string",
              maxLength: 500,
              example: "Strongly typed programming language that builds on JavaScript",
              description: "Optional description of the skill",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              default: "active",
              example: "active",
              description: "Active status of the skill",
            },
          },
        },
        UpdateSkillInput: {
          type: "object",
          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 100,
              example: "TypeScript 5.x",
              description: "New name of the skill",
            },
            category_id: {
              type: "integer",
              minimum: 1,
              example: 1,
              description: "New parent category ID",
            },
            description: {
              type: "string",
              maxLength: 500,
              nullable: true,
              example: "Advanced TypeScript development and compiler options",
              description: "New description of the skill",
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
              description: "Updated active status",
            },
          },
        },
        Domain: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Web Development" },
            description: { type: "string", nullable: true, example: "Frontend and backend web technologies" },
          },
        },
        SubDomain: {
          type: "object",
          required: ["id", "domain_id", "name"],
          properties: {
            id: { type: "integer", example: 1 },
            domain_id: { type: "integer", example: 1 },
            name: { type: "string", example: "Backend Development" },
            description: { type: "string", nullable: true, example: "Server-side web development and APIs" },
            domain: { $ref: "#/components/schemas/Domain" },
          },
        },
        CreateSubDomainInput: {
          type: "object",
          required: ["domain_id", "name"],
          properties: {
            domain_id: { type: "integer", example: 1, description: "Parent domain ID" },
            name: { type: "string", example: "Backend Development", description: "Unique name of the sub-domain in this domain" },
            description: { type: "string", example: "Server-side development and APIs", description: "Optional description" },
          },
        },
        UpdateSubDomainInput: {
          type: "object",
          properties: {
            domain_id: { type: "integer", example: 1, description: "New parent domain ID" },
            name: { type: "string", example: "Advanced Backend Development", description: "New name of the sub-domain" },
            description: { type: "string", example: "Microservices and APIs", description: "New description" },
          },
        },
        SetReviewerDomainsInput: {
          type: "object",
          required: ["domain_id"],
          properties: {
            domain_id: { type: "integer", example: 1, description: "Assigned domain ID (single domain constraint)" },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Invalid query or path parameter",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Invalid ID parameter",
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized - Access token is missing, invalid, or expired",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Unauthorized",
              },
            },
          },
        },
        Forbidden: {
          description: "Forbidden - Insufficient permissions or account inactive",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Forbidden",
              },
            },
          },
        },
        NotFound: {
          description: "Not Found - Requested resource was not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Resource not found",
              },
            },
          },
        },
        Conflict: {
          description: "Conflict - Unique constraint or relational integrity violation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Resource already exists or is linked to other records",
              },
            },
          },
        },
        ValidationError: {
          description: "Unprocessable Entity - Schema validation failed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              example: {
                success: false,
                message: "Validation failed",
                errors: {
                  name: ["Required", "Must be at least 1 character"],
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [
    toGlobPath(path.resolve(process.cwd(), "src/modules/**/*.routes.{ts,js}")),
    toGlobPath(path.resolve(process.cwd(), "dist/src/modules/**/*.routes.js")),
  ],
};

const specs = swaggerJsdoc(options);

export default specs;

