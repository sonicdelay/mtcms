export default function Config() {
  return (
    <div className="Config bg-gray-700 border-none">
      <h3>Config</h3>
      <br />
      <textarea
        className="w-full p-1 bg-gray-800 text-white border border-gray-600 rounded"
        rows={10}
        placeholder="Enter tailwindcss names here..."
      >
      </textarea>
    </div>
  );
}
