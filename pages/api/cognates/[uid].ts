import { NextApiRequest, NextApiResponse } from "next";

import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { uid } = req.query;

  if (req.method === "PATCH") {
    try {
      const { definition, sentence } = req.body;

      // Ensure uid is correctly parsed as BigInt
      const parsedUid = BigInt(uid as string);

      // Check if the cognate exists
      const cognate = await prisma.cognates.findUnique({
        where: { uid: parsedUid },
      });

      if (!cognate) {
        return res.status(404).json({ error: "Cognate not found" });
      }

      // Update the cognate
      const updatedCognate = await prisma.cognates.update({
        where: { uid: parsedUid },
        data: { definition, sentence },
      });

      return res.status(200).json({
        id: String(updatedCognate.uid), // Convert BigInt to string
        definition: updatedCognate.definition,
        sentence: updatedCognate.sentence,
      });
    } catch (error) {
      console.error("Failed to update cognate:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
