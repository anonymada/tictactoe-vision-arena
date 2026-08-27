const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { marked } = require("marked");

function setHTMLStructure(pageBody, title = "Documentation") {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <title>${title}</title>

      <style>
        body {
          max-width: 900px;
          margin: 40px auto;
          padding: 0 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          line-height: 1.6;
          color: #24292f;
        }

        pre {
          background: #f6f8fa;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
        }

        code {
          background: #f6f8fa;
          padding: 2px 5px;
          border-radius: 4px;
        }

        pre code {
          padding: 0;
          background: none;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }

        th,
        td {
          border: 1px solid #d0d7de;
          padding: 8px 12px;
          text-align: left;
        }

        th {
          background: #f6f8fa;
        }

        img {
          max-width: 100%;
        }

        a {
          color: #0969da;
        }
      </style>
    </head>

    <body>
      ${pageBody}
    </body>
    </html>
  `;
}


// =========================
// README
// =========================

router.get("/", (req, res) => {
  try {
    const readmePath = path.join(
      __dirname,
      "..",
      "README.md"
    );

    const markdown = fs.readFileSync(
      readmePath,
      "utf8"
    );

    const html = marked.parse(markdown);

    res.send(
      setHTMLStructure(
        html,
        "TicTacToe Vision Arena"
      )
    );

  } catch (err) {
    console.error(err);

    res.status(500).send(
      setHTMLStructure(
        "<h1>Erreur</h1><p>Impossible de charger README.md</p>",
        "Erreur"
      )
    );
  }
});


// =========================
// API DOCUMENTATION
// =========================

router.get("/api", (req, res) => {
  try {
    const apiPath = path.join(
      __dirname,
      "..",
      "docs",
      "api.md"
    );

    const markdown = fs.readFileSync(
      apiPath,
      "utf8"
    );

    const html = marked.parse(markdown);

    res.send(
      setHTMLStructure(
        html,
        "API Documentation"
      )
    );

  } catch (err) {
    console.error(err);

    res.status(500).send(
      setHTMLStructure(
        "<h1>Erreur</h1><p>Impossible de charger docs/api.md</p>",
        "Erreur"
      )
    );
  }
});


module.exports = router;