import { Request, Response } from "express";
import { ValidationError } from "../../utils/errors";
import { saveCloudImage } from "../../services/imageService";

export async function uploadArticleInlineImage(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError("Missing image file");
  }

  const saved = await saveCloudImage(req.file, "wfw/articles/inline");
  res.status(201).json({ success: true, url: saved.url });
}

