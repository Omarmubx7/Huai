import { Box, Typography } from "@mui/material";

interface FormattedMessageProps {
  text: string;
}

export default function FormattedMessage({ text }: FormattedMessageProps) {
  // Parse and format the message text
  const formatText = (rawText: string) => {
    const lines = rawText.split("\n");
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines but add spacing
      if (line.trim() === "") {
        elements.push(<Box key={key++} sx={{ height: 8 }} />);
        continue;
      }

      // Headers with emoji or **bold**
      if (line.includes("**") || line.match(/^[📊💊⚠️🏥✅🔴⚡]/)) {
        const cleaned = line.replace(/\*\*/g, "");
        elements.push(
          <Typography
            key={key++}
            variant="body2"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              color: line.includes("⚠️") || line.includes("🔴")
                ? "#f59e0b"
                : line.includes("✅")
                ? "#22c55e"
                : "inherit",
            }}
          >
            {cleaned}
          </Typography>
        );
        continue;
      }

      // Bullet points
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        const cleaned = line.replace(/^[•\-]\s*/, "");
        elements.push(
          <Box key={key++} sx={{ display: "flex", gap: 1, mb: 0.5, pl: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 8 }}>
              •
            </Typography>
            <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
              {cleaned}
            </Typography>
          </Box>
        );
        continue;
      }

      // Regular text
      elements.push(
        <Typography key={key++} variant="body2" sx={{ mb: 0.5, lineHeight: 1.6 }}>
          {line}
        </Typography>
      );
    }

    return elements;
  };

  return <Box sx={{ direction: "rtl", textAlign: "right" }}>{formatText(text)}</Box>;
}
