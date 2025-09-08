import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appPhoneFormat]'
})
export class PhoneFormatDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    let value = this.el.nativeElement.value;
    value = value.replace(/\D/g, ''); 

    if (value.length <= 2) {
      this.el.nativeElement.value = `(${value}`;
    } else if (value.length <= 7) {
      this.el.nativeElement.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}`;
    } else {
      this.el.nativeElement.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    }
  }
}
