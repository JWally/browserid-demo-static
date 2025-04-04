export const timeStampSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["publicKey", "signature", "href"],
      additionalProperties: false,
      properties: {
        publicKey: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 512,
        },
        publicEncryptionKey: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 512,
        },
        signature: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 512,
        },
        href: {
          type: "string",
          minLength: 1,
          maxLength: 2048,
        },
      },
    },
  },
  required: ["body"],
};

export const webSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: [
        "ciphertext",
        "cipherTextSignature",
        "iv",
        "publicEncryptionKey",
        "salt",
      ],
      additionalProperties: false,
      properties: {
        ciphertext: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 137000,
        },
        cipherTextSignature: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 512,
        },
        iv: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 12,
          maxLength: 24,
        },
        publicEncryptionKey: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 1,
          maxLength: 512,
        },
        salt: {
          type: "string",
          pattern: "^[A-Za-z0-9+/]+={0,2}$",
          minLength: 12,
          maxLength: 32,
        },
      },
    },
  },
  required: ["body"],
};

export const checkoutSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["session-id"],
      additionalProperties: false,
      properties: {
        "session-id": {
          type: "string",
          minLength: 1,
          maxLength: 256,
        },
      },
    },
  },
  required: ["body"],
};

export const trackerSchema = {
  type: "object",
  properties: {
    body: {
      type: "object",
      required: ["sessionId"],
      additionalProperties: true,
      properties: {
        sessionId: {
          type: "string",
          minLength: 1,
          maxLength: 256,
        },
      },
    },
  },
  required: ["body"],
};
