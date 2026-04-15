export type ImportedClient = {
  nume: string;
  telefon: string;
  email: string;
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

export function parseClientsCSV(file: File): Promise<ImportedClient[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const rows = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        if (rows.length < 2) {
          resolve([]);
          return;
        }

        const headers = rows[0].split(",").map(normalizeHeader);
        const indexMap = {
          nume: headers.findIndex((h) => h === "nume" || h === "name"),
          telefon: headers.findIndex((h) => h === "telefon" || h === "phone"),
          email: headers.findIndex((h) => h === "email")
        };

        if (indexMap.nume === -1 || indexMap.telefon === -1 || indexMap.email === -1) {
          reject(new Error("CSV invalid. Coloanele necesare sunt: nume/name, telefon/phone, email."));
          return;
        }

        const clients: ImportedClient[] = rows.slice(1).reduce<ImportedClient[]>((acc, row) => {
          const cols = row.split(",").map((c) => c.trim());
          const client = {
            nume: cols[indexMap.nume] ?? "",
            telefon: cols[indexMap.telefon] ?? "",
            email: cols[indexMap.email] ?? ""
          };

          if (client.nume || client.telefon || client.email) {
            acc.push(client);
          }

          return acc;
        }, []);

        resolve(clients);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Nu am putut citi fișierul CSV."));
    };

    reader.readAsText(file);
  });
}
