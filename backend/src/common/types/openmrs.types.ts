export interface OpenMRSRef {
  uuid: string;
  display: string;
  links?: { rel: string; uri: string }[];
}

export interface OpenMRSListResponse<T> {
  results: T[];
  links?: { rel: string; uri: string }[];
}

export interface OpenMRSPatient {
  uuid: string;
  display: string;
  identifiers: {
    uuid: string;
    identifier: string;
    identifierType: OpenMRSRef;
    location: OpenMRSRef;
    preferred: boolean;
  }[];
  person: {
    uuid: string;
    display: string;
    gender: string;
    age: number;
    birthdate: string;
    names: {
      givenName: string;
      familyName: string;
      preferred: boolean;
    }[];
  };
}

export interface CreatePatientPayload {
  identifiers: {
    identifier: string;
    identifierType: string;
    location: string;
    preferred: boolean;
  }[];
  person: {
    gender: string;
    birthdate?: string;
    age?: number;
    names: {
      givenName: string;
      familyName: string;
      preferred?: boolean;
    }[];
  };
}

export interface OpenMRSEncounter {
  uuid: string;
  display: string;
  encounterDatetime: string;
  patient: OpenMRSRef;
  encounterType: OpenMRSRef;
  location: OpenMRSRef;
  orders: OpenMRSRef[];
}

export interface OpenMRSDrugOrder {
  uuid: string;
  display: string;
  drug: OpenMRSRef;
  dose: number;
  doseUnits: OpenMRSRef;
  frequency: OpenMRSRef;
  duration: number;
  durationUnits: OpenMRSRef;
  numRefills: number;
  dosingInstructions: string;
}
