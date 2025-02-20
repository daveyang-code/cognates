import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let { language, language2 } = req.query as {
      language?: string;
      language2?: string;
    };

    if (language === "undefined") language = undefined;
    if (language2 === "undefined") language2 = undefined;

    // If language is undefined but language2 is provided, use language2 as language
    if (!language && language2) {
      language = language2;
      language2 = undefined;
    }

    // Validate language parameters
    if (language && !/^[a-z]{3}$/.test(language)) {
      return res.status(400).json({ error: "Invalid language parameter" });
    }
    if (language2 && !/^[a-z]{3}$/.test(language2)) {
      return res.status(400).json({ error: "Invalid language2 parameter" });
    }

    let randomCognate, connectedCognates;

    if (language && language2) {
      // Fetch concepts containing both languages
      const concepts = await prisma.cognates.findMany({
        where: { language: { in: [language, language2] } },
        select: { concept_id: true },
        distinct: ["concept_id"],
      });

      if (concepts.length === 0) {
        return res.status(404).json({ message: "No common concepts found" });
      }

      // Pick a random concept
      const randomConcept =
        concepts[Math.floor(Math.random() * concepts.length)];

      // Fetch words within that concept
      const cognates = await prisma.cognates.findMany({
        where: { concept_id: randomConcept.concept_id },
        select: {
          uid: true,
          word: true,
          translit: true,
          definition: true,
          sentence: true,
          language: true,
          language_rel: { select: { language: true } },
        },
      });

      randomCognate =
        cognates.find((c) => c.language === language) || cognates[0];
      connectedCognates = cognates.filter((c) => c.language === language2);
    } else {
      // Fetch a random cognate if language is provided or not
      const whereCondition = language ? { language } : {};
      const totalCognates = await prisma.cognates.count({
        where: whereCondition,
      });

      if (totalCognates === 0) {
        return res.status(404).json({ message: "No cognates found" });
      }

      randomCognate = await prisma.cognates.findFirst({
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

      // Fetch related cognates from the same concept
      connectedCognates = await prisma.cognates.findMany({
        where: {
          concept_id: randomCognate.concept_id,
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
    }

    // Format the response
    const formattedRandomCognate = {
      id: String(randomCognate.uid),
      word: randomCognate.word,
      translit: randomCognate.translit,
      definition: randomCognate.definition,
      sentence: randomCognate.sentence,
      language_name: randomCognate.language_rel.language,
    };

    const formattedConnectedCognates = connectedCognates
      .map((cognate) => ({
        id: String(cognate.uid),
        word: cognate.word,
        translit: cognate.translit,
        definition: cognate.definition,
        sentence: cognate.sentence,
        language_name: cognate.language_rel.language,
      }))
      .sort((a, b) => {
        const wordComparison = a.word.localeCompare(b.word);
        return wordComparison !== 0
          ? wordComparison
          : a.language_name.localeCompare(b.language_name);
      });

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
