"use client";

import { IxFieldLabel, IxTextarea } from "@siemens/ix-react";
import type { FormField } from "./edit.store";

interface DynamicFormProps {
  fields: FormField[];
  onFieldChange: (fields: FormField[]) => void;
}

export default function DynamicForm({
  fields,
  onFieldChange,
}: DynamicFormProps) {
  const handleChange = (index: number, value: string) => {
    onFieldChange(
      fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, value } : field,
      ),
    );
  };

  return (
    <div className="admin-edit__form">
      {fields.map((field, index) => (
        <div key={`${field.name}-${index}`} className="admin-edit__field">
          <IxFieldLabel>{field.name}</IxFieldLabel>
          <IxTextarea
            value={field.value}
            style={{ width: "100%", height: "300px", minHeight: "300px" }}
            textareaHeight="300px"

            textareaWidth="100%"
            resizeBehavior="none"
            onInput={(event) =>
              handleChange(index, (event.target as HTMLTextAreaElement).value)
            }
          />
        </div>
      ))}
      {fields.length === 0 && (
        <p style={{ opacity: 0.7 }}>No editable fields.</p>
      )}
    </div>
  );
}
