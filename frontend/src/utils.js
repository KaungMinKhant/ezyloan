// src/utils.js

// src/utils.js
import { urlRoot } from "./constants";

  
// Utility function to escape CSV values
export function escapeCSV(value) {
    if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

// Utility function to download data as CSV
export async function downloadCSV(data, titles, headers, filename = "data.csv") {
    const csv = [
        titles.join(","),
        ...data.map(row => headers.map(header => escapeCSV(row[header])).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Utility function to build query string based on filters
export function buildQuery(urlRoot, filters) {
    let query = `${urlRoot}?`;
    for (const key in filters) {
        if (filters[key]) query += `${key}=${filters[key]}&`;
    }
    return query.slice(0, -1);
}

// Utility function to clear filters
export function clearFilters(filters) {
    for (const filter in filters) {
        filters = "";
    }
}

export async function downloadFile(link) {
    const response = await fetch(link);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = link.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
