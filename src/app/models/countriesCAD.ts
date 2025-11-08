export interface CountryCAD {
  name: string;
  code: string;
  coin:number;
  banknote:number;
}

export const AVAILABLE_COUNTRIES_CAD: CountryCAD[] = [
  { name: 'Brasil', code: 'br' , coin: 999,banknote:  999},
  { name: 'Paraguai', code: 'py', coin: 999,banknote:  999 },
  { name: 'Uruguai', code: 'uy', coin: 999,banknote:  999 },
  { name: 'Chile', code: 'cl' , coin: 999,banknote:  999},
  { name: 'Bolivia', code: 'bo' , coin: 999,banknote:  999},
  { name: 'Peru', code: 'pe', coin: 999,banknote:  999 },
  { name: 'Argentina', code: 'ar', coin: 999,banknote:  999 },
  { name: 'Equador', code: 'ec', coin: 999,banknote:  999}
];