import { useEditStore } from "../../../lib/edit.store";

export default function DynamicForm() {
  const formFields = useEditStore((s) => s.formFields);
  const setFormFields = useEditStore((s) => s.setFormFields);

  const updateField = (index: number, value: string) => {
    setFormFields(
      formFields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, value } : field,
      ),
    );
  };

  if (formFields.length === 0) {
    return (
      <div className="admin-dynamic-form">
        <p style={{ opacity: 0.7 }}>No fields defined for this node.</p>
      </div>
    );
  }

  return (
    <div className="admin-dynamic-form">
      {formFields.map((field, index) => (
        <div key={field.name} className="admin-dynamic-form__field">
          <label className="admin-dynamic-form__label">
            <code>{field.name}</code>
          </label>
          <textarea
            aria-label={`Field ${field.name}`}
            spellCheck={false}
            value={field.value}
            onChange={(event) => updateField(index, event.target.value)}
            className="admin-dynamic-form__textarea"
          />
        </div>
      ))}
    </div>
  );
}