export const SECURITY_KEY_NAME = "oak-demo-api-keys";

export const TMX_TABLE_INDEXES = [];

export const TMX_TABLE_COLUMNS = [
  { name: "data.session-id", type: "string" },
  { name: "headers.origin", type: "string" },

  { name: "ipAddress", type: "string" },
  { name: "DATE_INFO.unix_timestamp", type: "int" },

  { name: "headers.host", type: "string" },
  { name: "headers.x-forwarded-for", type: "string" },
  { name: "headers.user-agent", type: "string" },

  // Date info
  { name: "DATE_INFO.year", type: "int" },
  { name: "DATE_INFO.month", type: "int" },
  { name: "DATE_INFO.day", type: "int" },
  { name: "DATE_INFO.hour", type: "int" },

  // TMX data
  { name: "TMX_DATA.os", type: "string" },
  { name: "TMX_DATA.browser", type: "string" },
  { name: "TMX_DATA.device_id", type: "string" },
  { name: "TMX_DATA.fuzzy_device_id", type: "string" },
  { name: "TMX_DATA.true_ip", type: "string" },

  // "raw_data" => must be in the JSON as "raw_data" or it will be NULL
  { name: "RAW_DATA", type: "string" },
];

export const OAK_TABLE_COLUMNS = [
  { name: "data.session-id", type: "string" },
  { name: "headers.origin", type: "string" },

  { name: "ipAddress", type: "string" },
  { name: "DATE_INFO.unix_timestamp", type: "int" },

  { name: "headers.host", type: "string" },
  { name: "headers.x-forwarded-for", type: "string" },
  { name: "headers.user-agent", type: "string" },

  // Date info
  { name: "DATE_INFO.year", type: "int" },
  { name: "DATE_INFO.month", type: "int" },
  { name: "DATE_INFO.day", type: "int" },
  { name: "DATE_INFO.hour", type: "int" },

  // "raw_data" => must be in the JSON as "raw_data" or it will be NULL
  { name: "RAW_DATA", type: "string" },
];
