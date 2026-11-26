export function protectedFileContentPath(subjectId: string, fileId: string) {
  return `/api/rbac/subjects/${subjectId}/file-storage-module/files/${fileId}/content`;
}
