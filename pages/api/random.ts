import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let { language, language2 } = req.query;

    // Treat "undefined" as no language filter
    if (language === "undefined" || language === "") {
      language = undefined;
    }

    if (language2 === "undefined" || language2 === "") {
      language2 = undefined;
    }

    // Validate the language query parameter (if provided)
    if (
      language &&
      (typeof language !== "string" || !/^[a-z]{3}$/.test(language))
    ) {
      return res.status(400).json({ error: "Invalid language parameter" });
    }

    if (
      language2 &&
      (typeof language2 !== "string" || !/^[a-z]{3}$/.test(language2))
    ) {
      return res.status(400).json({ error: "Invalid language parameter" });
    }

    // Define the filtering condition
    const whereCondition = language ? { language } : {};

    // Count total cognates for the requested language (if any)
    const totalCognates = await prisma.cognates.count({
      where: whereCondition,
    });

    if (totalCognates === 0) {
      return res.status(404).json({ message: "No cognates found" });
    }

    // Select a random cognate within the language filter (if provided)
    const randomCognate = await prisma.cognates.findFirst({
      skip: totalCognates > 1 ? Math.floor(Math.random() * totalCognates) : 0,
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

    if (!randomCognate) {
      return res.status(404).json({ message: "No cognates found" });
    }

    // Fetch connected words using Prisma
    const connectedCognates = await prisma.cognates.findMany({
      where: {
        concept_id: randomCognate.concept_id,
        ...(language2 ? { language: language2 } : {}),
        uid: { not: randomCognate.uid },
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
    const formattedRandomCognate = {
      id: String(randomCognate.uid), // Convert uid to string
      word: randomCognate.word,
      translit: randomCognate.translit,
      definition: randomCognate.definition,
      sentence: randomCognate.sentence,
      language_name: randomCognate.language_rel.language,
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
      .sort((a, b) => {
        const wordComparison = a.word.localeCompare(b.word);
        if (wordComparison !== 0) {
          return wordComparison;
        }
        return a.language_name.localeCompare(b.language_name);
      });

    // Return the response
    return res.status(200).json({
      randomCognate: formattedRandomCognate,
      connectedCognates: formattedConnectedCognates,
    });
  } catch (error) {
    console.error("Error fetching cognates:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
