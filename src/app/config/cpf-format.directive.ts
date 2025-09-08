import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appCpfFormat]'  // Nome da diretiva para o CPF
})
export class CpfFormatDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    let value = this.el.nativeElement.value;
    value = value.replace(/\D/g, ''); // Remove caracteres não numéricos

    // Formata o CPF no padrão XXX.XXX.XXX-XX
    if (value.length <= 3) {
      this.el.nativeElement.value = value.slice(0, 3);
    } else if (value.length <= 6) {
      this.el.nativeElement.value = `${value.slice(0, 3)}.${value.slice(3, 6)}`;
    } else if (value.length <= 9) {
      this.el.nativeElement.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}`;
    } else {
      this.el.nativeElement.value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
    }
  }
}
