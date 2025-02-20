import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { query, language, language2 } = req.query as {
      query?: string;
      language?: string;
      language2?: string;
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
    let result = await prisma.cognates.findFirst({
      where: whereCondition,
      select: {
        uid: true,
        word: true,
        translit: true,
        definition: true,
        sentence: true,
        language_rel: { select: { language: true } },
        concept_id: true,
      },
    });

    // If no exact match is found, try to find words like the query
    if (!result) {
      result = await prisma.cognates.findFirst({
        where: {
          word: {
            contains: query.toLowerCase(),
          },
          ...(language && language !== "undefined" ? { language } : {}),
        },
        select: {
          uid: true,
          word: true,
          translit: true,
          definition: true,
          sentence: true,
          language_rel: { select: { language: true } },
          concept_id: true,
        },
      });

      if (!result) {
        return res.status(404).json({ message: "No matching words found." });
      }
    }

    // Fetch connected words using Prisma
    const connectedCognates = await prisma.cognates.findMany({
      where: {
        concept_id: result.concept_id,
        uid: { not: result.uid },
        ...(language2 && language2 !== "undefined"
          ? { language: language2 }
          : {}),
      },
      select: {
        uid: true,
        word: true,
        translit: true,
        definition: true,
        sentence: true,
        language_rel: { select: { language: true } },
      },
    });

    // Convert BigInt values to strings
    const formattedResult = {
      id: String(result.uid), // Convert uid to string
      word: result.word,
      translit: result.translit,
      definition: result.definition,
      sentence: result.sentence,
      language_name: result.language_rel.language,
    };

    const formattedConnectedCognates = connectedCognates
      .map((cognate) => ({
      id: String(cognate.uid), // Convert uid to string
      word: cognate.word,
      translit: cognate.translit,
      definition: cognate.definition,
      sentence: cognate.sentence,
      language_name: cognate.language_rel.language,
      }))
      .sort((a, b) => a.language_name.localeCompare(b.language_name));

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
