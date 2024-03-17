// functions.d.ts
export interface ChangeLitterData {
    lastChanged: Date;
}

export interface ChangeLitterResponse {
    success: boolean;
    lastChanged: Date;
}

export interface LastChangedResponse {
    lastChanged: Date;
}
