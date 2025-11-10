export interface CountryCAD {
  name: string;
  code: string;
  coin:number;
  banknote:number;
}

export const AVAILABLE_COUNTRIES_CAD: CountryCAD[] = [
  { name: 'Brasil', code: 'br' , coin: 655,banknote:  453},
  { name: 'Paraguai', code: 'py', coin: 325,banknote:  199 },
  { name: 'Uruguai', code: 'uy', coin: 264,banknote:  155 },
  { name: 'Chile', code: 'cl' , coin: 318,banknote:  139},
  { name: 'Bolivia', code: 'bo' , coin: 314,banknote:  126},
  { name: 'Peru', code: 'pe', coin: 499,banknote:  149 },
  { name: 'Argentina', code: 'ar', coin: 383,banknote:  306 },
  { name: 'Equador', code: 'ec', coin: 0,banknote:  0}
];