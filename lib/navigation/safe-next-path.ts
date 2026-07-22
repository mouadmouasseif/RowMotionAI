export function getSafeNextPath(value:string|null,fallback="/dashboard"):string{if(!value||!value.startsWith("/")||value.startsWith("//"))return fallback;return value;}
