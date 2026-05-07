export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/[A-Za-z]:[\\/][^\r\n]+?(?=(?::\s|$))/g, "[path]")
    .replace(/(^|\s)(\/[^\r\n]+?)(?=(?::\s|$))/g, "$1[path]");
}
