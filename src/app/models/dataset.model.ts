export interface Dataset {
    name: string;
    columns: string[];
    // Possibly store the data preview if you want,
    // or store metadata only and fetch the entire data from the backend as needed.
  }  