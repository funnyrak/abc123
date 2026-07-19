// Plain checkboxes inside a GET <form> — submitting re-navigates with
// repeated `?name=value&name=value2` query params, so no client JS is
// needed to keep search state in sync with the URL.
export function CategoryCheckboxFilter({
  label,
  name,
  options,
  selected,
}: {
  label: string
  name: string
  options: readonly string[]
  selected: string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${
              selected.includes(option)
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 text-neutral-700'
            }`}
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={selected.includes(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}
