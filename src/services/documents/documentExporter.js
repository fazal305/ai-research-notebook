import { getDocumentTypeMeta } from "./documentParser.js";
import { downloadTextFile } from "../../utils/fileUtils.js";

export function exportDocument(document) {
  const meta = getDocumentTypeMeta(document.type) ?? {
    extensions: [".txt"],
    mimeType: "text/plain",
  };
  const extension = meta.extensions[0];
  downloadTextFile(
    `${document.title}${extension}`,
    document.content,
    meta.mimeType,
  );
}
