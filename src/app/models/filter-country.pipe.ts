import { Pipe, PipeTransform } from '@angular/core';
import { CountryData } from '../mapa-mundi/mapa-mundi.component';

@Pipe({
  name: 'filterCountry'
})
export class FilterCountryPipe implements PipeTransform {
  transform(countries: CountryData[], searchTerm: string): CountryData[] {
    if (!searchTerm) return countries;
    return countries.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
