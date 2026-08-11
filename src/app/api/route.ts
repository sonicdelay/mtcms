import { NextResponse } from "next/server";

export async function GET() {
  const html = `
  <!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.20.2/swagger-ui.min.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-themes@1.4.3/themes/dark.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.20.2/swagger-ui-bundle.min.js"></script>
  <script>
    const url = "/api/openapi.yaml";
    const ui = SwaggerUIBundle({
      url,
      dom_id: "#swagger-ui",
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
