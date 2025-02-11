import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const languages = await prisma.languages.findMany({
      select: { id: true, language: true },
      orderBy: { language: "asc" },
    });
    return res.status(200).json(languages);
  } catch (error) {
    console.error("Failed to fetch languages:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
