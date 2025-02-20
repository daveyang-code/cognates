"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EditableCardContent } from "@/components/EditableCardContent";
import { Input } from "@/components/ui/input";
import axios from "axios";

export default function Home() {
  const [language, setLanguage] = useState<{
    id: string;
    language: string;
  } | null>(null);
  const [language2, setLanguage2] = useState<{
    id: string;
    language: string;
  } | null>(null);
  const [concept, setConcept] = useState<{
    id: string;
    word: string;
    language_name: string;
    translit: string;
    definition?: string;
    sentence?: string;
  } | null>(null);
  const [cognates, setCognates] = useState<
    {
      id: string;
      word: string;
      language_name: string;
      translit: string;
      definition?: string;
      sentence?: string;
    }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [languages, setLanguages] = useState<
    { id: string; language: string }[]
  >([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await axios.get("/api/languages");
        if (Array.isArray(res.data)) {
          setLanguages(res.data);
        } else {
          console.error("API did not return an array:", res.data);
          setLanguages([]);
        }
      } catch (error) {
        console.error("Failed to fetch languages", error);
        setLanguages([]);
      }
    };

    fetchLanguages();
  }, []);

  const fetchRandomWord = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `/api/random?language=${language?.id}&language2=${language2?.id}`
      );
      const data = response.data;
      setConcept(data.randomCognate);
      setCognates(data.connectedCognates);
    } catch {
      setError("Failed to fetch a random word.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setError("Please enter a word to search.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `/api/search?query=${searchQuery}&language=${language?.id}&language2=${language2?.id}`
      );
      const data = response.data;
      setConcept(data.result);
      setCognates(data.connectedCognates);
    } catch {
      setError("No matching word found.");
      setConcept(null);
      setCognates([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-black">COGLang</h1>
      <div className="flex gap-4">
        <Select
          value={language?.id ?? ""}
          onValueChange={(id) =>
            setLanguage(languages.find((lang) => lang.id === id) || null)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Primary Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={language2?.id ?? ""}
          onValueChange={(id) =>
            setLanguage2(languages.find((lang) => lang.id === id) || null)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Target Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.language}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search for a word..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          Search
        </Button>
      </div>

      <div className="flex justify-center">
        <Button onClick={() => fetchRandomWord()} disabled={isLoading}>
          Random Word
        </Button>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {concept && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <span>{concept.language_name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableCardContent
              word={concept.word}
              translit={concept.translit}
              definition={concept.definition}
              sentence={concept.sentence}
              onSave={async ({ definition, sentence }) => {
                try {
                  await axios.patch(`/api/cognates/${concept.id}`, {
                    definition,
                    sentence,
                  });
                  setConcept((prev) =>
                    prev
                      ? {
                          ...prev,
                          definition,
                          sentence,
                        }
                      : null
                  );
                } catch (error) {
                  console.error("Failed to save", error);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {cognates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cognates</CardTitle>
            <CardDescription>
              Words in other languages that share a similar meaning and origin.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cognates.map((cognate, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <span>{cognate.language_name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableCardContent
                    word={cognate.word}
                    translit={cognate.translit}
                    definition={cognate.definition}
                    sentence={cognate.sentence}
                    onSave={async ({ definition, sentence }) => {
                      try {
                        await axios.patch(`/api/cognates/${cognate.id}`, {
                          definition,
                          sentence,
                        });
                        setCognates((prevCognates) =>
                          prevCognates.map((c) =>
                            c.id === cognate.id
                              ? { ...c, definition, sentence }
                              : c
                          )
                        );
                      } catch (error) {
                        console.error("Failed to save", error);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
