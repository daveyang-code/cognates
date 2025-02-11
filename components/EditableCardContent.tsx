import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface EditableCardContentProps {
  word: string;
  translit?: string;
  definition?: string;
  sentence?: string;
  onSave: (data: { definition?: string; sentence?: string }) => void;
}

export const EditableCardContent = ({
  word,
  translit,
  definition,
  sentence,
  onSave,
}: EditableCardContentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDefinition, setEditedDefinition] = useState(definition || "");
  const [editedSentence, setEditedSentence] = useState(sentence || "");

  const handleSave = () => {
    onSave({
      definition: editedDefinition,
      sentence: editedSentence,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Word and Transliteration */}
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {word}
        </p>
        {translit && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transliteration: {translit}
          </p>
        )}
      </div>

      {/* Editing Mode */}
      {isEditing ? (
        <div className="space-y-4">
          {/* Definition Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Definition
            </label>
            <Input
              value={editedDefinition}
              onChange={(e) => setEditedDefinition(e.target.value)}
              placeholder="Enter definition"
              className="w-full"
            />
          </div>

          {/* Sample Sentence Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Example Usage
            </label>
            <Input
              value={editedSentence}
              onChange={(e) => setEditedSentence(e.target.value)}
              placeholder="Enter sample sentence"
              className="w-full"
            />
          </div>

          {/* Save and Cancel Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* Display Mode */
        <div className="space-y-4">
          {/* Definition */}
          {definition && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Definition
              </p>
              <p className="text-gray-900 dark:text-gray-100">{definition}</p>
            </div>
          )}

          {/* Example Usage */}
          {sentence && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Example Usage
              </p>
              <p className="text-gray-900 dark:text-gray-100">{sentence}</p>
            </div>
          )}

          {/* Edit Button */}
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto"
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};
