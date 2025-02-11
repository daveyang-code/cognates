import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { query, language } = req.query as {
      query?: string;
      language?: string;
    };

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required." });
    }

    let whereCondition;

    if (language !== "undefined") {
      whereCondition = {
        word: query.toLowerCase(),
        language,
      };
    } else {
      whereCondition = {
        word: query.toLowerCase(),
      };
    }

    // Search for matching words
    const result = await prisma.cognates.findFirst({
      where: whereCondition,
      select: {
        uid: true,
        word: true,
        translit: true,
        language_rel: { select: { language: true } },
      },
    });

    if (!result) {
      return res.status(404).json({ message: "No matching words found." });
    }

    const connectedCognates = await prisma.$queryRaw`
      SELECT c.word, c.translit, l.language AS language_name
      FROM edges e
      JOIN cognates c ON c.uid = CASE
        WHEN e.word1_id = ${result.uid} THEN e.word2_id
        ELSE e.word1_id
      END
      JOIN languages l ON c.language = l.id
      WHERE e.word1_id = ${result.uid} OR e.word2_id = ${result.uid};
    `;

    return res.status(200).json({
      result: {
        word: result.word,
        translit: result.translit,
        language_name: result.language_rel.language,
      },
      connectedCognates,
    });
  } catch (error) {
    console.error("Error searching for words:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
