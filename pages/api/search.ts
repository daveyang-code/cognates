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

    // Validate the search query
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required." });
    }

    // Define the filtering condition
    const whereCondition = {
      word: query.toLowerCase(),
      ...(language && language !== "undefined" ? { language } : {}),
    };

    // Search for matching words
    const result = await prisma.cognates.findFirst({
      where: whereCondition,
      select: {
        uid: true,
        word: true,
        translit: true,
        definition: true,
        sentence: true,
        language_rel: { select: { language: true } },
      },
    });

    if (!result) {
      return res.status(404).json({ message: "No matching words found." });
    }

    // Fetch connected words efficiently using raw SQL
    const connectedCognates = await prisma.$queryRaw<
      {
        uid: bigint; // Use bigint here
        word: string;
        translit: string | null;
        definition: string | null;
        sentence: string | null;
        language_name: string;
      }[]
    >`
      SELECT
        c.uid, 
        c.word, 
        c.translit, 
        c.definition,
        c.sentence,
        l.language AS language_name
      FROM edges e
      JOIN cognates c ON c.uid = 
        CASE 
          WHEN e.word1_id = ${result.uid} THEN e.word2_id 
          ELSE e.word1_id 
        END
      JOIN languages l ON c.language = l.id
      WHERE e.word1_id = ${result.uid} OR e.word2_id = ${result.uid};
    `;

    // Convert BigInt values to strings
    const formattedResult = {
      id: String(result.uid), // Convert uid to string
      word: result.word,
      translit: result.translit,
      definition: result.definition,
      sentence: result.sentence,
      language_name: result.language_rel.language,
    };

    const formattedConnectedCognates = connectedCognates.map((cognate) => ({
      id: String(cognate.uid), // Convert uid to string
      word: cognate.word,
      translit: cognate.translit,
      definition: cognate.definition,
      sentence: cognate.sentence,
      language_name: cognate.language_name,
    }));

    // Return the response
    return res.status(200).json({
      result: formattedResult,
      connectedCognates: formattedConnectedCognates,
    });
  } catch (error) {
    console.error("Error searching for words:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
