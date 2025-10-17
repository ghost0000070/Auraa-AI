// Unified JSON value type compatible with Supabase Json
export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
